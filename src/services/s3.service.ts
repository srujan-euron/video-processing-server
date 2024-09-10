import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import config from "../config";
import logger from "../utils/logger";
import { PassThrough } from "stream";


class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadBuffer(buffer: Buffer, key: string): Promise<void> {
    const uploadParams = {
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      logger.info(`Successfully uploaded file to S3: ${key}`);
    } catch (error) {
      logger.error(`Error uploading file to S3: ${key}`, error);
      throw error;
    }
  }

  async getFileStream(key: string): Promise<Readable> {
    const getParams = {
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    try {
      const { Body } = await this.s3Client.send(new GetObjectCommand(getParams));

      if (Body instanceof Readable) {
        logger.info(`Successfully retrieved file stream from S3: ${key}`);

        // Create a PassThrough stream
        const passThrough = new PassThrough();

        // Pipe the S3 stream through the PassThrough stream
        Body.pipe(passThrough);

        return passThrough;
      } else {
        throw new Error("Retrieved object is not a readable stream");
      }
    } catch (error) {
      logger.error(`Error getting file stream from S3: ${key}`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    const deleteParams = {
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
      logger.info(`Successfully deleted file from S3: ${key}`);
    } catch (error) {
      logger.error(`Error deleting file from S3: ${key}`, error);
      throw error;
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const getParams = {
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    try {
      const { Body } = await this.s3Client.send(new GetObjectCommand(getParams));
      if (Body instanceof Readable) {
        return await this.streamToBuffer(Body);
      } else {
        throw new Error("Retrieved object is not a readable stream");
      }
    } catch (error) {
      logger.error(`Error getting file buffer from S3: ${key}`, error);
      throw error;
    }
  }

  // Helper function to convert stream to buffer
  async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

export default S3Service;