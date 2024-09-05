import { Router } from "express";
import { health, helloWorld } from "../controllers/health.controller";
import reelRouter from "./reel.route";
import { asyncHandler } from "../utils/asynchandler";

const v1Router = Router();


v1Router.get("/", asyncHandler(helloWorld));
v1Router.get("/health", asyncHandler(health));
v1Router.use("/reels", reelRouter);

export default v1Router;