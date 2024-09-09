import path from "path";
import fs from "fs-extra";
import logger from "../utils/logger";
import S3UploadService from "./r2-upload.service";
import FFmpegService from "./ffmpeg.service";

class VideoProcessingService {
  constructor(
    private readonly s3UploadService: S3UploadService,
    private readonly ffmpegService: FFmpegService
  ) { }

  async transcodeAndUploadVideo(filePath: string, videoId: string): Promise<void> {
    const outputDir = path.join(process.cwd(), "uploads", videoId);
    await fs.ensureDir(outputDir);

    try {
      logger.info(`Starting video transcoding for videoId: ${videoId}`);
      await this.ffmpegService.transcodeVideo(filePath, outputDir);

      logger.info(`Starting R2 upload for videoId: ${videoId}`);
      await this.s3UploadService.uploadToR2(outputDir, videoId);
    } catch (error) {
      logger.error(`Error in transcodeAndUploadVideo for videoId ${videoId}:`, error);
      throw error;
    }
  }
}

export default VideoProcessingService;