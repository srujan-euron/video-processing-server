import { db } from "../db/connection";
import { ReelProcessingStatus } from "../db/enums";
import { videoProcessingQueue } from "./queues/video-processing.queue";
import logger from "./logger";

export async function markJobAsCompleted(videoId: string) {
  await db
    .updateTable("Reel")
    .set({ processingStatus: ReelProcessingStatus.PROCESSED, updatedAt: new Date() })
    .where("videoId", "=", videoId)
    .execute();
}

export async function markJobAsFailed(videoId: string) {
  await db
    .updateTable("Reel")
    .set({ processingStatus: ReelProcessingStatus.FAILED, updatedAt: new Date() })
    .where("videoId", "=", videoId)
    .execute();
}

export async function recoverFailedJobs() {
  const failedJobs = await db
    .selectFrom("Reel")
    .select(["id", "videoId"])
    .where("processingStatus", "=", ReelProcessingStatus.FAILED)
    .execute();

  for (const job of failedJobs) {
    await videoProcessingQueue.add("processVideo", { videoId: job.videoId }, {
      jobId: job.videoId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
    logger.info(`Requeued failed job for video ${job.videoId}`);
  }
}

export async function detectStuckJobs() {
  const stuckJobs = await db
    .selectFrom("Reel")
    .select(["id", "videoId"])
    .where("processingStatus", "=", ReelProcessingStatus.PROCESSING)
    .where("updatedAt", "<", new Date(Date.now() - 2 * 60 * 60 * 1000)) // Stuck for more than 2 hours
    .execute();

  for (const job of stuckJobs) {
    await markJobAsFailed(job.videoId);
    await videoProcessingQueue.add("processVideo", { videoId: job.videoId }, {
      jobId: job.videoId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
    logger.info(`Requeued stuck job for video ${job.videoId}`);
  }
}

export function initializeJobManagement() {
  // Run recovery mechanism every hour
  setInterval(recoverFailedJobs, 60 * 60 * 1000);

  // Run stuck job detection every 30 minutes
  setInterval(detectStuckJobs, 30 * 60 * 1000);
}