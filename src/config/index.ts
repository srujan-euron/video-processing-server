/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from "dotenv";
dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV!,
  PORT: process.env.PORT!,

  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: process.env.REDIS_PORT!,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",


  CLOUDWATCH_LOG_GROUP_NAME: process.env.CLOUDWATCH_LOG_GROUP_NAME!,
  CLOUDWATCH_LOGS_ID: process.env.CLOUDWATCH_LOGS_ID!,
  CLOUDWATCH_LOGS_SECRET: process.env.CLOUDWATCH_LOGS_SECRET!,
  CLOUDWATCH_LOGS_REGION: process.env.CLOUDWATCH_LOGS_REGION!,

  SERVER_NAME: `${process.env.SERVER_NAME}-${process.env.NODE_ENV}`,

  PG_DATABASE_HOST: process.env.PG_DATABASE_HOST!,
  PG_DATABASE: process.env.PG_DATABASE!,
  PG_DATABASE_PORT: process.env.PG_DATABASE_PORT!,
  PG_DATABASE_USER: process.env.PG_DATABASE_USER!,
  PG_DATABASE_PASSWORD: process.env.PG_DATABASE_PASSWORD!,

  CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
  CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT!,
  CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,

  AWS_REGION: process.env.AWS_REGION || "ap-south-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || "",
};

export default config;