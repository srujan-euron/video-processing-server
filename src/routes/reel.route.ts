import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import upload from "../utils/reel-multer-config";
import { processVideo, checkTranscodeStatus } from "../controllers/reel.controller";

const reelRouter = Router();

reelRouter
  .get("/transcode-status/:id", asyncHandler(checkTranscodeStatus))
  .post("/process", upload.single("file"), asyncHandler(processVideo));

export default reelRouter;