import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import config from "../../config";
import ReelService from "../../services/reel.service";
import logger from "../../utils/logger";
import cluster from "cluster";
import os from "os";

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
  const { filePath, videoId } = job.data;

  try {
    await ReelService.processVideoInBackground(filePath, videoId);
    return { success: true, videoId };
  } catch (error) {
    logger.error(`Error processing video ${videoId}:`, error);
    throw error;
  }
};

export const initializeVideoProcessingWorker = () => {
  const numCPUs = os.cpus().length;

  if (cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      logger.info(`Worker ${worker.process.pid} died`);
      // Replace the dead worker
      cluster.fork();
    });
  } else {
    // Workers can share any TCP connection
    const worker = new Worker("videoProcessing", processJob, {
      connection,
      concurrency: 2, // Process up to 2 jobs per worker
      limiter: {
        max: 2,
        duration: 1000
      }
    });

    worker.on("completed", (job) => {
      logger.info(`Worker ${process.pid}: Job ${job.id} has completed for video ${job.data.videoId}`);
    });

    worker.on("failed", (job, err) => {
      logger.error(`Worker ${process.pid}: Job ${job?.id} has failed for video ${job?.data.videoId}:`, err);
    });

    logger.info(`Worker ${process.pid} started`);
  }
};