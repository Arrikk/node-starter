import Redis from "ioredis";
import { REDIS_URL } from "../../config/env";

export default class RedisClient {
  private redis: Redis;
  private connection: Redis;

  constructor(redisOptions: Record<string, unknown> = { maxRetriesPerRequest: 3 }) {
    const redisConfig = this.parseRedisUrl(REDIS_URL);
    this.redis = new Redis({ ...redisConfig, ...redisOptions });
    this.connection = new Redis({ ...redisConfig, ...redisOptions });
    this.setupEventHandlers(this.redis, "Storage");
  }

  private parseRedisUrl(url: string) {
    try {
      if (!url) return { host: "localhost", port: 6379 };
      if (url.startsWith("redis://") || url.startsWith("rediss://")) {
        const urlObj = new URL(url);
        return {
          host: urlObj.hostname,
          port: parseInt(urlObj.port) || 6379,
          username: urlObj.username || undefined,
          password: urlObj.password || undefined,
          db: urlObj.pathname ? parseInt(urlObj.pathname.slice(1)) || 0 : 0,
          ...(url.startsWith("rediss://") ? { tls: {} } : {}),
        };
      }
      return { host: "localhost", port: 6379 };
    } catch (error) {
      console.error("Error parsing Redis URL:", error);
      return { host: "localhost", port: 6379 };
    }
  }

  private setupEventHandlers(redisClient: Redis, clientName: string) {
    redisClient.on("ready", () => console.log(`Redis ready for ${clientName}`));
    redisClient.on("error", (error) => console.error(`Redis error ${clientName}:`, error));
  }

  get redisInstance() {
    return this.redis;
  }

  get connectionInstance() {
    return this.connection;
  }

  async closeConnections(): Promise<void> {
    await this.redis.quit();
    await this.connection.quit();
  }
}
