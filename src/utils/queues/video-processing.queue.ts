import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import config from "../../config";
import ReelService from "../../services/reel.service";
import logger from "../logger";
import cluster from "cluster";
import { markJobAsCompleted, markJobAsFailed } from "../jobManagement";


const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const videoProcessingQueue = new Queue("videoProcessing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const processJob = async (job: Job) => {
  const { videoId, s3Key } = job.data;

  if (!videoId || !s3Key) {
    throw new Error(`Invalid job data. videoId: ${videoId}, s3Key: ${s3Key}`);
  }

  try {
    await ReelService.processVideoInBackground(videoId, s3Key);
    return { success: true, videoId };
  } catch (error) {
    logger.error(`Error processing video ${videoId}:`, error);
    throw error;
  }
};

export const initializeVideoProcessingWorker = (numWorkers = 4) => {
  if (cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running`);

    // Fork multiple workers
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      logger.info(`Worker ${worker.process.pid} died`);
      // Replace the dead worker
      cluster.fork();
    });
  } else {
    const worker = new Worker("videoProcessing", processJob, {
      connection,
      concurrency: 4,
    });

    worker.on("completed", async (job) => {
      logger.info(`Worker ${process.pid}: Job ${job.id} has completed for video ${job.data.videoId}`);
      await markJobAsCompleted(job.data.videoId);
    });

    worker.on("failed", async (job, err) => {
      logger.error(`Worker ${process.pid}: Job ${job?.id} has failed for video ${job?.data.videoId}:`, err);
      await markJobAsFailed(job?.data.videoId);
    });

    logger.info(`Worker ${process.pid} started`);
  }
};