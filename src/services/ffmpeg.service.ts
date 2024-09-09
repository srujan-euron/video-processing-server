import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger";

class FFmpegService {
  constructor() {
    if (ffmpegStatic === null) {
      throw new Error("FFmpeg not found. Make sure ffmpeg-static is properly installed.");
    }
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }

  async getVideoMetadata(filePath: string) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.error(`Error retrieving metadata for file ${filePath}:`, err);
          return reject(new Error(`Unable to retrieve metadata for file: ${filePath}`));
        }

        const format = metadata?.format || {};
        const startTime = format.start_time || 0;
        const duration = format.duration || 0;

        logger.info(`Video metadata for file ${filePath}:`, metadata);

        resolve({
          startTime,
          duration,
          formatName: format.format_name || "unknown",
          size: format.size || 0,
          bitrate: format.bit_rate || 0,
        });
      });
    });
  }

  async transcodeVideo(filePath: string, outputDir: string): Promise<void> {
    const resolutions = [
      { name: "1080p", width: 1920, height: 1080 },
      { name: "720p", width: 1280, height: 720 },
      { name: "360p", width: 640, height: 360 },
    ];

    const masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";
    const transcodingProcesses = resolutions.map(({ name, width, height }) => {
      return new Promise<string>((resolve, reject) => {
        logger.info(`Starting transcoding for ${name} resolution`);

        ffmpeg(filePath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size(`${width}x${height}`)
          .outputOptions([
            "-hls_time 6",
            "-hls_playlist_type vod",
            "-hls_flags independent_segments",
            "-hls_segment_type mpegts",
            `-hls_segment_filename ${outputDir}/${name}_%03d.ts`,
          ])
          .output(`${outputDir}/${name}.m3u8`)
          .on("end", () => {
            logger.info(`Transcoding completed for ${name} resolution`);
            resolve(`#EXT-X-STREAM-INF:BANDWIDTH=${width * height * 2.5},RESOLUTION=${width}x${height}\n${name}.m3u8\n`);
          })
          .on("error", (err) => {
            logger.error(`Transcoding ${name} failed: ${err.message}`);
            reject(new Error(`Transcoding ${name} failed: ${err.message}`));
          })
          .on("progress", (progress) => {
            if (progress && progress.percent) {
              logger.info(`Transcoding progress for ${name}: ${progress.percent.toFixed(2)}% done`);
            }
          })
          .run();
      });
    });

    try {
      const playlistEntries = await Promise.all(transcodingProcesses);
      const masterPlaylistContent = masterPlaylist + playlistEntries.join("");
      await fs.writeFile(path.join(outputDir, "master.m3u8"), masterPlaylistContent);
      logger.info("Master playlist created successfully");
    } catch (error) {
      logger.error("Error creating master playlist:", error);
      throw error;
    }
  }
}

export default FFmpegService;