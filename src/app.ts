import express, { NextFunction, Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
//@ts-ignore
import xss from "xss-clean";
import { notFound } from "./controllers/health.controller";
import { globalHandler } from "./middlewares/error-handler.middleware";
import rootRouter from "./routes/index.route";
import { asyncHandler } from "./utils/asynchandler";
import logger from "./utils/logger";
import { getLocalIP } from "./utils/system.util";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { videoProcessingQueue } from "./utils/queues/videoProcessing";

const app = express();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(videoProcessingQueue)], // Add your queue here
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.set("trust proxy", true);
app.set("view engine", "ejs");
app.set("views", "src/views");


app.use(express.json());

app.use(xss());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));
app.use(mongoSanitize());

app.use("/api", rootRouter);

app.use("*", asyncHandler(notFound));

app.use((
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  data: any, req: Request, res: Response, next: NextFunction
) => {
  globalHandler(data, req, res, next);
});

logger.info(`Local IP - ${getLocalIP()}`);

export default app;
