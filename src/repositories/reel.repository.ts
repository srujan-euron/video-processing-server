import { UpdateReelStatus } from "../types/reel.type";
import { db } from "../db/connection";
import { CrudRepository, TableName } from "./crud.repository";
import logger from "../utils/logger";
import { ReelProcessingStatus } from "../db/enums";


export class ReelRepository {
  private _db = db;
  private crudRepository: CrudRepository<Reel>;

  constructor() {
    this.crudRepository = new CrudRepository<Reel>(TableName.Reel, "userId", "id");
  }

  async getAReel(id: string) {
    return this.crudRepository.get(id);
  }

  async createReel(data: Omit<Reel, "id">) {
    return this.crudRepository.create(data);
  }

  async updateReel(data: Partial<Reel>) {
    return this.crudRepository.update(data);
  }

  async updateReelStatus(params: UpdateReelStatus) {
    const { id, publishStatus } = params;

    return this.crudRepository.update({ id, publishStatus });

  }

  async updateVideoProcessingStatus(
    videoId: string,
    processingStatus: ReelProcessingStatus
  ): Promise<void> {
    try {
      await db
        .updateTable("Reel")
        .set({
          processingStatus,
          updatedAt: new Date()
        })
        .where("videoId", "=", videoId)
        .execute();

      logger.info(`Updated processing status for videoId ${videoId} to ${processingStatus}`);
    } catch (error) {
      logger.error(`Error updating processing status for videoId ${videoId}:`, error);
      throw error;
    }
  }

  async getReelById(reelId: string): Promise<Reel | undefined> {
    try {
      const reel = await db
        .selectFrom("Reel")
        .selectAll()
        .where("id", "=", reelId)
        .executeTakeFirst();

      return reel;
    } catch (error) {
      logger.error(`Error fetching reel with id ${reelId}:`, error);
      throw error;
    }
  }

  async getReelByVideoId(videoId: string): Promise<Reel | undefined> {
    try {
      const reel = await db
        .selectFrom("Reel")
        .selectAll()
        .where("videoId", "=", videoId)
        .executeTakeFirst();

      return reel;
    } catch (error) {
      logger.error(`Error fetching reel with videoId ${videoId}:`, error);
      throw error;
    }
  }
}

interface Reel {
  id: string;
  publishStatus: string;
}
