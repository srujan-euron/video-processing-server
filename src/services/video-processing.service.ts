import fs from "fs";
import path from "path";
import { promisify } from "util";
import logger from "../utils/logger";
import S3Service from "./s3.service";
import CloudflareR2Service from "./r2-upload.service";
import FFmpegService from "./ffmpeg.service";
import { ReelRepository } from "../repositories/reel.repository";
import { ReelProcessingStatus } from "../db/enums";

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);
const readdirAsync = promisify(fs.readdir);

class VideoProcessingService {
  static transcodeAndUploadVideo(videoId: any, s3Key: any) {
    throw new Error("Method not implemented.");
  }
  private readonly localStoragePath: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly cloudflareR2Service: CloudflareR2Service,
    private readonly ffmpegService: FFmpegService,
    private readonly reelRepository: ReelRepository,
    localStoragePath: string
  ) {
    this.localStoragePath = localStoragePath;
  }

  async transcodeAndUploadVideo(videoId: string, s3Key: string): Promise<void> {
    if (!videoId || !s3Key) {
      throw new Error(`Invalid videoId or s3Key. videoId: ${videoId}, s3Key: ${s3Key}`);
    }

    const localFilePath = path.join(this.localStoragePath, `${videoId}.mp4`);
    const transcodedDir = path.join(this.localStoragePath, videoId);

    try {
      logger.info(`Starting video processing for videoId: ${videoId}`);

      // Download video from S3
      const videoBuffer = await this.s3Service.getFileBuffer(s3Key);
      await writeFileAsync(localFilePath, videoBuffer);
      logger.info(`Video downloaded to ${localFilePath}`);

      // Transcode the video
      await this.ffmpegService.transcodeVideo(localFilePath, videoId);
      logger.info(`Transcoding completed for videoId: ${videoId}`);

      // Check if master.m3u8 exists before uploading
      const masterPlaylistPath = path.join(transcodedDir, "master.m3u8");
      if (!fs.existsSync(masterPlaylistPath)) {
        throw new Error(`master.m3u8 not found for videoId: ${videoId}`);
      }

      // Log the contents of the transcoded directory
      const files = await readdirAsync(transcodedDir);
      logger.info(`Files in transcoded directory for videoId ${videoId}:`, files);

      // Upload transcoded files to R2
      await this.cloudflareR2Service.uploadTranscodedVideos(videoId, transcodedDir);
      logger.info(`R2 upload completed for videoId: ${videoId}`);

      // Check if all files were uploaded successfully
      const allFilesUploaded = await this.cloudflareR2Service.checkProcessedFiles(videoId);
      if (!allFilesUploaded) {
        throw new Error(`Not all required files were uploaded for videoId: ${videoId}`);
      }

      // Update processing status to PROCESSED
      await this.reelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.PROCESSED);
      logger.info(`Updated processing status to PROCESSED for videoId: ${videoId}`);


    } catch (error) {
      logger.error(`Error in transcodeAndUploadVideo for videoId ${videoId}:`, error);

      await this.reelRepository.updateVideoProcessingStatus(videoId, ReelProcessingStatus.FAILED);
      logger.info(`Updated processing status to FAILED for videoId: ${videoId}`);
      throw error;
    } finally {
      // Clean up local files
      try {
        if (fs.existsSync(localFilePath)) {
          await unlinkAsync(localFilePath);
        }
        if (fs.existsSync(transcodedDir)) {
          await this.removeDirectory(transcodedDir);
        }
        logger.info(`Deleted local files for videoId: ${videoId}`);
      } catch (error) {
        logger.warn(`Failed to delete local files for videoId ${videoId}:`, error);
      }
    }
  }

  private async removeDirectory(dir: string): Promise<void> {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory()) {
        await this.removeDirectory(filePath);
      } else {
        await fs.promises.unlink(filePath);
      }
    }
    await rmdirAsync(dir);
  }
}

export default VideoProcessingService;