import { db } from "../db/connection";
import { ReelProcessingStatus } from "../db/enums";

export class ReelRepository {
  private _db = db;

  async updateVideoProcessingStatus(
    videoId: string,
    processingStatus: ReelProcessingStatus
  ): Promise<void> {

    await this._db
      .updateTable("Reel")
      .set({
        processingStatus,
        updatedAt: new Date()
      })
      .where("videoId", "=", videoId)
      .execute();
  }
}

