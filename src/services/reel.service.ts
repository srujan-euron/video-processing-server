import { ReelRepository } from "../repositories/reel.repository";
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import stream from "stream";
import fs from "fs-extra";
import lockfile from "proper-lockfile";
import config from "../config";
import logger from "../utils/logger";
import { ReelProcessingStatus } from "../db/enums";
import { videoProcessingQueue } from "../utils/queues/videoProcessing";

class ReelService {
  private s3Client: S3Client;
  private readonly uploadDir: string;
  private processingVideos: Map<string, {
    status: ReelProcessingStatus,
    error?: string,
    startTime: number
  }> = new Map();

  constructor(private readonly _ReelRepository: ReelRepository) {
    this.uploadDir = path.join(process.cwd(), "uploads");
    fs.ensureDirSync(this.uploadDir);

    this.s3Client = new S3Client({
      endpoint: config.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: config.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      region: "auto",
    });
    if (ffmpegStatic === null) {
      throw new Error("FFmpeg not found. Make sure ffmpeg-static is properly installed.");
    }

    ffmpeg.setFfmpegPath(ffmpegStatic);
  }

  async getVideoMetadata(filePath: any) {
    return new Promise((resolve, reject) => {
      // Use fluent-ffmpeg to probe the video file
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.error(`Error retrieving metadata for file ${filePath}:`, err);
          return reject(new Error(`Unable to retrieve metadata for file: ${filePath}`));
        }

        // Extract start time, duration, and other useful properties
        const format = metadata?.format || {};
        const startTime = format.start_time || 0; // Default to 0 if start_time is missing
        const duration = format.duration || 0;

        logger.info(`Video metadata for file ${filePath}:`, metadata);

        // Return the metadata that is useful for your processing
        resolve({
          startTime,
          duration,
          formatName: format.format_name || "unknown",
          size: format.size || 0,
          bitrate: format.bit_rate || 0,
        });
      });
    });
  }

  private getTempDir(): string {
    return "/var/www/video-processing-server/dist/temp";
  }

  private async logFileOperation(operation: string, filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      logger.info(`${operation} - File: ${filePath}, Size: ${stats.size} bytes, Permissions: ${stats.mode.toString(8)}`);

      const dirPath = path.dirname(filePath);
      const dirStats = await fs.stat(dirPath);
      logger.info(`${operation} - Directory: ${dirPath}, Permissions: ${dirStats.mode.toString(8)}`);

      const files = await fs.readdir(dirPath);
      logger.info(`${operation} - Directory contents: ${files.join(", ")}`);
    } catch (error) {
      logger.error(`${operation} - Error accessing file or directory: ${filePath}`, error);
    }
  }

  async processVideo(fileBuffer: Buffer): Promise<string> {
    const videoId = uuidv4();
    logger.info(`Initializing video processing for videoId: ${videoId}`);

    const filePath = path.join(this.uploadDir, `${videoId}.mp4`);

    try {
      await fs.writeFile(filePath, fileBuffer);
      logger.info(`File written successfully: ${filePath}`);

      await videoProcessingQueue.add("processVideo", { filePath, videoId }, {
        jobId: videoId,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      return videoId;
    } catch (error) {
      logger.error(`Error in processVideo for videoId ${videoId}:`, error);
      await this.cleanupTempFiles(filePath, videoId);
      throw error;
    }
  }

  async processVideoInBackground(filePath: string, videoId: string): Promise<void> {
    logger.info(`Starting background processing for videoId: ${videoId}`);

    let release;
    try {
      release = await lockfile.lock(filePath, {
        retries: {
          retries: 5,
          factor: 3,
          minTimeout: 1 * 1000,
          maxTimeout: 60 * 1000,
          randomize: true,
        }
      });

      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      await this.transcodeAndUploadVideo(filePath, videoId);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.PROCESSED);
    } catch (error) {
      logger.error(`Error in processVideoInBackground for videoId ${videoId}:`, error);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
      throw error;
    } finally {
      if (release) {
        try {
          await release();
        } catch (releaseError) {
          logger.warn(`Failed to release lock for ${filePath}:`, releaseError);
        }
      }
      await this.cleanupTempFiles(filePath, videoId);
    }
  }

  private async transcodeAndUploadVideo(filePath: string, videoId: string): Promise<void> {
    const outputDir = path.join(this.uploadDir, videoId);
    await fs.ensureDir(outputDir);

    try {
      logger.info(`Starting video transcoding for videoId: ${videoId}`);
      await this.transcodeVideo(filePath, outputDir);

      logger.info(`Starting R2 upload for videoId: ${videoId}`);
      await this.uploadToR2(outputDir, videoId);
    } catch (error) {
      logger.error(`Error in transcodeAndUploadVideo for videoId ${videoId}:`, error);
      throw error;
    } finally {
      // Clean up the output directory
      await this.cleanupTempFiles(filePath, videoId);
    }
  }

  private async transcodeVideo(filePath: string, outputDir: string): Promise<void> {
    const resolutions = [
      { name: "1080p", width: 1920, height: 1080 },
      { name: "720p", width: 1280, height: 720 },
      { name: "360p", width: 640, height: 360 },
    ];

    const masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";
    const transcodingProcesses = resolutions.map(({ name, width, height }) => {
      return new Promise<string>((resolve, reject) => {
        logger.info(`Starting transcoding for ${name} resolution`);

        ffmpeg(filePath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size(`${width}x${height}`)
          .outputOptions([
            "-hls_time 6",
            "-hls_playlist_type vod",
            "-hls_flags independent_segments",
            "-hls_segment_type mpegts",
            `-hls_segment_filename ${outputDir}/${name}_%03d.ts`,
          ])
          .output(`${outputDir}/${name}.m3u8`)
          .on("end", () => {
            logger.info(`Transcoding completed for ${name} resolution`);
            resolve(`#EXT-X-STREAM-INF:BANDWIDTH=${width * height * 2.5},RESOLUTION=${width}x${height}\n${name}.m3u8\n`);
          })
          .on("error", (err) => {
            logger.error(`Transcoding ${name} failed: ${err.message}`);
            reject(new Error(`Transcoding ${name} failed: ${err.message}`));
          })
          .on("progress", (progress) => {
            if (progress && progress.percent) {
              logger.info(`Transcoding progress for ${name}: ${progress.percent.toFixed(2)}% done`);
            }
          })
          .run();
      });
    });

    try {
      const playlistEntries = await Promise.all(transcodingProcesses);
      const masterPlaylistContent = masterPlaylist + playlistEntries.join("");
      await fs.writeFile(path.join(outputDir, "master.m3u8"), masterPlaylistContent);
      logger.info("Master playlist created successfully");
    } catch (error) {
      logger.error("Error creating master playlist:", error);
      throw error;
    }
  }

  private async uploadToR2(outputDir: string, videoId: string): Promise<void> {
    const files = await fs.readdir(outputDir);

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const fileContent = await fs.readFile(filePath);

      const uploadParams = {
        Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
        Key: `videos/${videoId}/${file}`,
        Body: fileContent,
        ContentType: file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T",
      };

      logger.info(`Uploading file ${file} to R2 for videoId: ${videoId}`);
      await this.s3Client.send(new PutObjectCommand(uploadParams));
    }
  }

  private async deletePartiallyUploadedFiles(videoId: string): Promise<void> {
    logger.info(`Deleting partially uploaded files for videoId: ${videoId}`);

    const listParams = {
      Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
      Prefix: `videos/${videoId}/`,
    };

    try {
      const { Contents } = await this.s3Client.send(new ListObjectsCommand(listParams));

      if (Contents && Contents.length > 0) {
        const deleteParams = {
          Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
          Delete: {
            Objects: Contents.map(({ Key }) => ({ Key: Key! })),
            Quiet: false,
          },
        };

        await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
        logger.info(`Successfully deleted partially uploaded files for videoId: ${videoId}`);
      } else {
        logger.info(`No files found to delete for videoId: ${videoId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error deleting partially uploaded files for videoId ${videoId}:`, errorMessage);
    }
  }

  private async cleanupTempFiles(filePath: string, videoId: string): Promise<void> {
    logger.info(`Starting cleanup process for videoId: ${videoId}`);
    const outputDir = path.join(this.uploadDir, videoId);

    try {
      // Delete the input file
      await fs.unlink(filePath);
      logger.info(`Deleted input file: ${filePath}`);

      // Delete the output directory
      await fs.rm(outputDir, { recursive: true, force: true });
      logger.info(`Deleted output directory: ${outputDir}`);
    } catch (error) {
      logger.warn(`Failed to clean up temporary files for videoId: ${videoId}. Error: ${error}`);
    }
  }

  async checkVideoProcessingStatus(videoId: string): Promise<{ statusCode: number; processed: boolean; message: string }> {
    logger.info(`Checking processing status for videoId: ${videoId}`);

    const listParams = {
      Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
      Prefix: `videos/${videoId}/`,
    };
    const { Contents } = await this.s3Client.send(new ListObjectsCommand(listParams));

    const expectedFiles = [
      `videos/${videoId}/1080p.m3u8`,
      `videos/${videoId}/720p.m3u8`,
      `videos/${videoId}/360p.m3u8`,
    ];

    const existingFiles = Contents?.map(item => item.Key) || [];

    const isProcessed = expectedFiles.every(file => existingFiles.includes(file));

    logger.info(`Video processing status for videoId ${videoId}: ${isProcessed ? "Completed" : "In Progress"}`);

    if (!isProcessed) {
      return { statusCode: 202, processed: false, message: "Video is still processing. Please check back later." };
    }

    return { statusCode: 200, processed: true, message: "Video processing is complete." };
  }

  private async updateVideoProcessingStatus(videoId: string, status: ReelProcessingStatus) {
    logger.info(`Updating video processing status for videoId ${videoId}: ${status}`);
    return this._ReelRepository.updateVideoProcessingStatus(videoId, status);
  }

  async getProcessingLogs(): Promise<{ [videoId: string]: { status: ReelProcessingStatus, elapsedTime: string, error?: string } }> {
    const logs: { [videoId: string]: { status: ReelProcessingStatus, elapsedTime: string, error?: string } } = {};

    for (const [videoId, info] of this.processingVideos.entries()) {
      const elapsedTime = ((Date.now() - info.startTime) / 1000 / 60).toFixed(2); // in minutes
      logs[videoId] = {
        status: info.status,
        elapsedTime: `${elapsedTime} minutes`,
        ...(info.error && { error: info.error }),
      };
    }

    return logs;
  }
}

export default new ReelService(new ReelRepository());
