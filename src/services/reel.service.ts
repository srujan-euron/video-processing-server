import { ReelRepository } from "../repositories/reel.repository";
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import { Job } from "bullmq";
import ffmpegStatic from "ffmpeg-static";
import stream from "stream";
import config from "../config";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import logger from "../utils/logger";
import { ReelProcessingStatus } from "../db/enums";
import { videoProcessingQueue } from "../utils/queues/videoProcessing";


class ReelService {
  private s3Client: S3Client;
  private processingVideos: Map<string, {
    status: ReelProcessingStatus,
    error?: string,
    startTime: number
  }> = new Map();

  constructor(private readonly _ReelRepository: ReelRepository) {
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


  async processVideo(fileBuffer: Buffer): Promise<string> {
    const videoId = uuidv4();
    logger.info(`Initializing video processing for videoId: ${videoId}`);

    this.processingVideos.set(videoId, { status: ReelProcessingStatus.PROCESSING, startTime: Date.now() });

    await videoProcessingQueue.add("processVideo", { fileBuffer: Array.from(fileBuffer), videoId }, {
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
  }

  async processVideoInBackground(fileBufferArray: number[], videoId: string): Promise<void> {
    const fileBuffer = Buffer.from(fileBufferArray);
    const outputDir = path.join(__dirname, "..", "temp", videoId);

    try {
      await this.transcodeAndUploadVideo(fileBuffer, outputDir, videoId);

      await this.updateVideoProcessingStatus(videoId, ReelProcessingStatus.PROCESSED);
      this.processingVideos.set(videoId, { status: ReelProcessingStatus.PROCESSED, startTime: this.processingVideos.get(videoId)!.startTime });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error in processVideoInBackground for videoId ${videoId}:`, errorMessage);
      await this.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
      this.processingVideos.set(videoId, { status: ReelProcessingStatus.FAILED, error: errorMessage, startTime: this.processingVideos.get(videoId)!.startTime });

      await this.deletePartiallyUploadedFiles(videoId);

      throw new Error(`Video processing failed: ${errorMessage}`);
    } finally {
      await this.cleanupTempFiles(outputDir, videoId);
    }
  }

  private async transcodeAndUploadVideo(fileBuffer: Buffer, outputDir: string, videoId: string): Promise<void> {
    logger.info(`Creating output directory for videoId: ${videoId}`);
    await fs.mkdir(outputDir, { recursive: true });

    logger.info(`Starting video transcoding for videoId: ${videoId}`);
    await this.transcodeVideo(fileBuffer, outputDir);

    logger.info(`Starting R2 upload for videoId: ${videoId}`);
    await this.uploadToR2(outputDir, videoId);
  }

  private async transcodeVideo(fileBuffer: Buffer, outputDir: string): Promise<void> {
    const resolutions = [
      { name: "1080p", width: 1920, height: 1080 },
      { name: "720p", width: 1280, height: 720 },
      { name: "360p", width: 640, height: 360 },
    ];

    const masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";
    const transcodingProcesses = resolutions.map(({ name, width, height }) => {
      return new Promise<string>((resolve, reject) => {
        const inputStream = stream.Readable.from(fileBuffer);

        logger.info(`Starting transcoding for ${name} resolution`);

        ffmpeg(inputStream)
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

  private async cleanupTempFiles(outputDir: string, videoId: string): Promise<void> {
    logger.info(`Starting cleanup process for videoId: ${videoId}`);
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await fs.rm(outputDir, { recursive: true, force: true });
        logger.info(`Successfully cleaned up temporary files for videoId: ${videoId}`);
        return;
      } catch (error) {
        retries++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Cleanup attempt ${retries} failed for videoId: ${videoId}. Error: ${errorMessage}`);

        if (retries < maxRetries) {
          // Wait for a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    logger.error(`Failed to clean up temporary files after ${maxRetries} attempts for videoId: ${videoId}`);
  }

  async checkVideoProcessingStatus(videoId: string): Promise<{ statusCode: number; processed: boolean; message: string }> {
    logger.info(`Checking processing status for videoId: ${videoId}`);

    const processingInfo = this.processingVideos.get(videoId);
    if (processingInfo) {
      if (processingInfo.status === ReelProcessingStatus.PROCESSING) {
        const elapsedTime = (Date.now() - processingInfo.startTime) / 1000 / 60; // in minutes
        if (elapsedTime > 20) { // 20 minutes timeout
          // If processing time exceeds 20 minutes, consider it as an error
          await this.deletePartiallyUploadedFiles(videoId);
          await this.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
          this.processingVideos.set(videoId, { ...processingInfo, status: ReelProcessingStatus.FAILED, error: "Processing timed out" });
          return {
            statusCode: 500,
            processed: false,
            message: "Video processing timed out and was terminated."
          };
        }
        return {
          statusCode: 202,
          processed: false,
          message: `Video is still processing. Elapsed time: ${elapsedTime.toFixed(2)} minutes.`
        };
      } else if (processingInfo.status === ReelProcessingStatus.FAILED) {
        return {
          statusCode: 500,
          processed: false,
          message: `Video processing failed. Error: ${processingInfo.error}`
        };
      }
    }

    const listParams = {
      Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
      Prefix: `videos/${videoId}/`,
    };
    const { Contents } = await this.s3Client.send(new ListObjectsCommand(listParams));

    const expectedFiles = [
      `videos/${videoId}/1080p_stream.m3u8`,
      `videos/${videoId}/720p_stream.m3u8`,
      `videos/${videoId}/360p_stream.m3u8`,
    ];

    const existingFiles = Contents?.map(item => item.Key) || [];

    const isProcessed = expectedFiles.every(file => existingFiles.includes(file));

    logger.info(`Video processing status for videoId ${videoId}: ${isProcessed ? "Completed" : "In Progress"}`);

    if (!isProcessed) {
      return { statusCode: 202, processed: false, message: "Video is still processing. Please check back later." };
    }

    return { statusCode: 200, processed: true, message: "Video processing is complete." };
  }

  checkIfVideoIsProcessed = this.checkVideoProcessingStatus;

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