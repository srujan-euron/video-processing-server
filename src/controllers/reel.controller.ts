import { NextFunction, Request, Response } from "express";
import ReelService from "../services/reel.service";


export const processVideo = async (req: Request, _res: Response, next: NextFunction) => {
  const videoFile = req.file as Express.Multer.File;

  const videoId = await ReelService.processVideo(videoFile?.buffer);

  next(videoId);

};

export const checkTranscodeStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videoId = req.params.id;

    const { statusCode, processed, message } = await ReelService.checkVideoProcessingStatus(videoId);

    res.status(statusCode).json({
      processed,
      message,
    });
  } catch (error) {
    next(error);
  }

};