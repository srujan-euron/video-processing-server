import { ReelRepository } from "../repositories/reel.repository";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger";
import { ReelProcessingStatus } from "../db/enums";
import { videoProcessingQueue } from "../utils/queues/videoProcessing";
import VideoProcessingService from "./video-processing.service";
import S3UploadService from "./r2-upload.service";
import FFmpegService from "./ffmpeg.service";

class ReelService {
  private readonly uploadDir: string;
  private processingVideos: Map<string, {
    status: ReelProcessingStatus,
    error?: string,
    startTime: number
  }> = new Map();

  constructor(
    private readonly _ReelRepository: ReelRepository,
    private readonly videoProcessingService: VideoProcessingService,
    private readonly s3UploadService: S3UploadService,
    private readonly ffmpegService: FFmpegService
  ) {
    this.uploadDir = path.join(process.cwd(), "uploads");
    fs.ensureDirSync(this.uploadDir);
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

    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      await this.videoProcessingService.transcodeAndUploadVideo(filePath, videoId);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.PROCESSED);
    } catch (error) {
      logger.error(`Error in processVideoInBackground for videoId ${videoId}:`, error);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
      throw error;
    } finally {
      await this.cleanupTempFiles(filePath, videoId);
    }
  }

  async checkVideoProcessingStatus(videoId: string): Promise<{ statusCode: number; processed: boolean; message: string }> {
    logger.info(`Checking processing status for videoId: ${videoId}`);

    const isProcessed = await this.s3UploadService.checkProcessedFiles(videoId);

    logger.info(`Video processing status for videoId ${videoId}: ${isProcessed ? "Completed" : "In Progress"}`);

    if (!isProcessed) {
      return { statusCode: 202, processed: false, message: "Video is still processing. Please check back later." };
    }

    return { statusCode: 200, processed: true, message: "Video processing is complete." };
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

  private async cleanupTempFiles(filePath: string, videoId: string): Promise<void> {
    logger.info(`Starting cleanup process for videoId: ${videoId}`);
    const outputDir = path.join(this.uploadDir, videoId);

    try {
      await fs.unlink(filePath);
      logger.info(`Deleted input file: ${filePath}`);

      await fs.rm(outputDir, { recursive: true, force: true });
      logger.info(`Deleted output directory: ${outputDir}`);
    } catch (error) {
      logger.warn(`Failed to clean up temporary files for videoId: ${videoId}. Error: ${error}`);
    }
  }
}

export default new ReelService(new ReelRepository(), new VideoProcessingService(new S3UploadService(), new FFmpegService()), new S3UploadService(), new FFmpegService());