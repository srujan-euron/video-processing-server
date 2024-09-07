import { ReelRepository } from "../repositories/reel.repository";
import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import stream from "stream";
import config from "../config";
import logger from "../utils/logger";
import { ReelProcessingStatus } from "../db/enums";
import { videoProcessingQueue } from "../utils/queues/videoProcessing";

class ReelService {
  private s3Client: S3Client;
  private readonly baseUrl: string;

  constructor(private readonly _ReelRepository: ReelRepository) {
    this.s3Client = new S3Client({
      endpoint: config.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: config.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      region: "auto",
    });
    this.baseUrl = "https://pub-959f4a7e023d4d95bbf4c28daa135b78.r2.dev";

    if (ffmpegStatic === null) {
      throw new Error("FFmpeg not found. Make sure ffmpeg-static is properly installed.");
    }

    ffmpeg.setFfmpegPath(ffmpegStatic);
  }

  async processVideo(fileBuffer: Buffer): Promise<string> {
    const videoId = uuidv4();
    logger.info(`Initializing video processing for videoId: ${videoId}`);

    const s3Key = `videos/${videoId}/original.mp4`;

    try {
      await this.uploadToS3(fileBuffer, s3Key);
      logger.info(`File uploaded successfully to S3: ${s3Key}`);

      await videoProcessingQueue.add("processVideo", { s3Key, videoId }, {
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
      throw error;
    }
  }

  async processVideoInBackground(s3Key: string, videoId: string): Promise<void> {
    logger.info(`Starting background processing for videoId: ${videoId}, s3Key: ${s3Key}`);

    try {
      if (!s3Key) {
        throw new Error(`Invalid S3 key for videoId: ${videoId}`);
      }

      const fullUrl = `${this.baseUrl}/${s3Key}`;
      logger.info(`Generated full URL for videoId: ${videoId}: ${fullUrl}`);

      await this.transcodeAndUploadVideo(fullUrl, videoId);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.PROCESSED);
    } catch (error) {
      logger.error(`Error in processVideoInBackground for videoId ${videoId}:`, error);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
      throw error;
    }
  }

  private async transcodeAndUploadVideo(fullUrl: string, videoId: string): Promise<void> {
    logger.info(`Starting video transcoding for videoId: ${videoId}`);
    await this.transcodeVideo(fullUrl, videoId);
  }

  private async transcodeVideo(fullUrl: string, videoId: string): Promise<void> {
    const resolutions = [
      { name: "1080p", width: 1920, height: 1080 },
      { name: "720p", width: 1280, height: 720 },
      { name: "360p", width: 640, height: 360 },
    ];

    const masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";

    const transcodingProcesses = resolutions.map(({ name, width, height }) => {
      return new Promise<string>((resolve, reject) => {
        logger.info(`Starting transcoding for ${name} resolution, videoId: ${videoId}`);

        const pass = new stream.PassThrough();

        ffmpeg(fullUrl)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size(`${width}x${height}`)
          .outputOptions([
            "-hls_time 6",
            "-hls_playlist_type vod",
            "-hls_flags independent_segments",
            "-hls_segment_type mpegts",
            "-f hls",
          ])
          .output(pass)
          .on("end", () => {
            logger.info(`Transcoding completed for ${name} resolution, videoId: ${videoId}`);
            resolve(`#EXT-X-STREAM-INF:BANDWIDTH=${width * height * 2.5},RESOLUTION=${width}x${height}\n${name}.m3u8\n`);
          })
          .on("error", (err) => {
            logger.error(`Transcoding ${name} failed for videoId ${videoId}: ${err.message}`);
            reject(new Error(`Transcoding ${name} failed: ${err.message}`));
          })
          .on("progress", (progress) => {
            if (progress && progress.percent) {
              logger.info(`Transcoding progress for ${name}, videoId ${videoId}: ${progress.percent.toFixed(2)}% done`);
            }
          })
          .run();

        this.uploadStreamToS3(pass, `videos/${videoId}/${name}.m3u8`);
      });
    });

    try {
      const playlistEntries = await Promise.all(transcodingProcesses);
      const masterPlaylistContent = masterPlaylist + playlistEntries.join("");
      await this.uploadToS3(Buffer.from(masterPlaylistContent), `videos/${videoId}/master.m3u8`);
      logger.info(`Master playlist created and uploaded successfully for videoId: ${videoId}`);
    } catch (error) {
      logger.error(`Error creating and uploading master playlist for videoId ${videoId}:`, error);
      throw error;
    }
  }

  private async uploadToS3(fileBuffer: Buffer, key: string): Promise<void> {
    logger.info(`Uploading file to S3: ${key}`);
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: key.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T",
      },
    });

    try {
      await upload.done();
      logger.info(`File uploaded successfully to S3: ${key}`);
    } catch (error) {
      logger.error(`Error uploading file to S3: ${key}`, error);
      throw error;
    }
  }

  private async uploadStreamToS3(readableStream: stream.Readable, key: string): Promise<void> {
    logger.info(`Uploading stream to S3: ${key}`);
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: readableStream,
        ContentType: key.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T",
      },
    });

    try {
      await upload.done();
      logger.info(`Stream uploaded successfully to S3: ${key}`);
    } catch (error) {
      logger.error(`Error uploading stream to S3: ${key}`, error);
      throw error;
    }
  }

  async checkVideoProcessingStatus(videoId: string): Promise<{ statusCode: number; processed: boolean; message: string }> {
    logger.info(`Checking processing status for videoId: ${videoId}`);

    const listParams = {
      Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
      Prefix: `videos/${videoId}/`,
    };

    try {
      const { Contents } = await this.s3Client.send(new ListObjectsCommand(listParams));

      const expectedFiles = [
        `videos/${videoId}/master.m3u8`,
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
    } catch (error) {
      logger.error(`Error checking video processing status for videoId ${videoId}:`, error);
      throw error;
    }
  }
}

export default new ReelService(new ReelRepository());