import Redis from "ioredis";
import { configDotenv } from "dotenv";

configDotenv(); // Load environment variables from .env file

export const redis = new Redis(process.env.UPSTASH_REDIS_URL); // Node.js-specific usage
