import { S3Client, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";
import config from "../config";

class CloudflareR2Service {
  private r2Client: S3Client;

  constructor() {
    this.r2Client = new S3Client({
      endpoint: config.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: config.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      region: "auto",
    });
  }

  async uploadTranscodedVideos(videoId: string, transcodedDir: string): Promise<void> {
    const files = await fs.promises.readdir(transcodedDir);

    for (const file of files) {
      await this.uploadFile(videoId, transcodedDir, file);
    }
  }

  private async uploadFile(videoId: string, dir: string, filename: string): Promise<void> {
    const filePath = path.join(dir, filename);
    const fileContent = await fs.promises.readFile(filePath);

    const key = `videos/${videoId}/${filename}`;

    const uploadParams = {
      Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: filename.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T",
    };

    try {
      await this.r2Client.send(new PutObjectCommand(uploadParams));
      logger.info(`Uploaded ${filename} to R2`);
    } catch (error) {
      logger.error(`Error uploading ${filename} to R2:`, error);
      throw error;
    }
  }

  async checkProcessedFiles(videoId: string): Promise<boolean> {
    const listParams = {
      Bucket: config.CLOUDFLARE_R2_BUCKET_NAME,
      Prefix: `videos/${videoId}/`,
    };

    try {
      const { Contents } = await this.r2Client.send(new ListObjectsCommand(listParams));

      if (!Contents) {
        logger.warn(`No files found for videoId: ${videoId}`);
        return false;
      }

      const requiredFiles = [
        "master.m3u8",
        "1080p.m3u8",
        "720p.m3u8",
        "360p.m3u8",
      ];

      const uploadedFiles = Contents.map(item => item.Key?.split("/").pop());

      const allFilesUploaded = requiredFiles.every(file => uploadedFiles.includes(file));

      if (allFilesUploaded) {
        logger.info(`All required files have been uploaded for videoId: ${videoId}`);
      } else {
        logger.warn(`Some required files are missing for videoId: ${videoId}`);
      }

      return allFilesUploaded;
    } catch (error) {
      logger.error(`Error checking processed files for videoId: ${videoId}`, error);
      throw error;
    }
  }
}

export default CloudflareR2Service;