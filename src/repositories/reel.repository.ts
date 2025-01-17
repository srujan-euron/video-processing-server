import { db } from "../db/connection";
import { ReelProcessingStatus } from "../db/enums";
import logger from "../utils/logger";

export class ReelRepository {
  private _db = db;

  async getReelByVideoId(videoId: string) {
    return this._db
      .selectFrom("Reel")
      .selectAll()
      .where("videoId", "=", videoId)
      .executeTakeFirst();
  }

  async updateVideoProcessingStatus(
    videoId: string,
    processingStatus: ReelProcessingStatus
  ): Promise<void> {
    logger.info(`Updating processing status for videoId ${videoId} to ${processingStatus}`);
    const result = await this._db
      .updateTable("Reel")
      .set({
        processingStatus,
        updatedAt: new Date()
      })
      .where("videoId", "=", videoId)
      .execute();

    if (result.length === 0) {
      throw new Error(`No reel found with videoId: ${videoId}`);
    }
  }
}