// cleanup-script.ts
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

const LOCAL_STORAGE_PATH = "/path/to/local/storage";
const MAX_AGE_DAYS = 1;

async function cleanupOldVideos() {
  const now = new Date();
  const files = await fs.promises.readdir(LOCAL_STORAGE_PATH);

  for (const file of files) {
    const filePath = path.join(LOCAL_STORAGE_PATH, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      const ageDays = (now.getTime() - stats.mtime.getTime()) / (1000 * 3600 * 24);

      if (ageDays > MAX_AGE_DAYS) {
        try {
          await fs.promises.rm(filePath, { recursive: true, force: true });
          logger.info(`Deleted old directory: ${filePath}`);
        } catch (error) {
          logger.error(`Error deleting directory ${filePath}:`, error);
        }
      }
    }
  }
}

cleanupOldVideos().catch(error => {
  logger.error("Error in cleanup script:", error);
  process.exit(1);
});