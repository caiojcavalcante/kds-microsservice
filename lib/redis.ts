import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl)
  : new Redis({
      host: process.env.REDIS_HOST || "redis",
      port: Number(process.env.REDIS_PORT) || 6379,
    });

export default redis;
