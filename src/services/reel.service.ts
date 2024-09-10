import { ReelRepository } from "../repositories/reel.repository";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { ReelProcessingStatus } from "../db/enums";
import { videoProcessingQueue } from "../utils/queues/video-processing.queue";
import VideoProcessingService from "./video-processing.service";
import S3Service from "./s3.service";
import CloudflareR2Service from "./r2-upload.service";
import FFmpegService from "./ffmpeg.service";

class ReelService {
  constructor(
    private readonly _ReelRepository: ReelRepository,
    private readonly videoProcessingService: VideoProcessingService,
    private readonly s3Service: S3Service,
    private readonly cloudflareR2Service: CloudflareR2Service,
    private readonly ffmpegService: FFmpegService
  ) { }

  // In ReelService.ts
  async processVideo(fileBuffer: Buffer): Promise<string> {
    const videoId = uuidv4();
    logger.info(`Initializing video processing for videoId: ${videoId}`);

    try {
      // Upload the original video to S3
      const s3Key = `original-videos/${videoId}.mp4`;
      await this.s3Service.uploadBuffer(fileBuffer, s3Key);
      logger.info(`Original video uploaded to S3 for videoId: ${videoId}`);

      await videoProcessingQueue.add("processVideo", { videoId, s3Key }, {
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

  async processVideoInBackground(videoId: string, s3Key: string): Promise<void> {
    logger.info(`Starting background processing for videoId: ${videoId}`);

    try {
      if (!videoId || !s3Key) {
        throw new Error(`Invalid videoId or s3Key. videoId: ${videoId}, s3Key: ${s3Key}`);
      }

      await this.videoProcessingService.transcodeAndUploadVideo(videoId, s3Key);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.PROCESSED);
    } catch (error) {
      logger.error(`Error in processVideoInBackground for videoId ${videoId}:`, error);
      await this._ReelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
      throw error;
    }
  }

  async checkVideoProcessingStatus(videoId: string): Promise<{ statusCode: number; processed: boolean; message: string }> {
    logger.info(`Checking processing status for videoId: ${videoId}`);

    const isProcessed = await this.cloudflareR2Service.checkProcessedFiles(videoId);

    logger.info(`Video processing status for videoId ${videoId}: ${isProcessed ? "Completed" : "In Progress"}`);

    if (!isProcessed) {
      return { statusCode: 202, processed: false, message: "Video is still processing. Please check back later." };
    }

    return { statusCode: 200, processed: true, message: "Video processing is complete." };
  }
}

export default new ReelService(
  new ReelRepository(),
  new VideoProcessingService(new S3Service(), new CloudflareR2Service(), new FFmpegService("/tmp"), new ReelRepository(), "/tmp"),
  new S3Service(),
  new CloudflareR2Service(),
  new FFmpegService("/tmp")
);