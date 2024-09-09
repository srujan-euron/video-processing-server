import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs-extra";
import path from "path";
import config from "../config";
import logger from "../utils/logger";

class S3UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: config.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: config.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      region: "auto",
    });
  }

  async uploadToR2(outputDir: string, videoId: string): Promise<void> {
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

  async checkProcessedFiles(videoId: string): Promise<boolean> {
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

    return expectedFiles.every(file => existingFiles.includes(file));
  }

  async deletePartiallyUploadedFiles(videoId: string): Promise<void> {
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
}

export default S3UploadService;