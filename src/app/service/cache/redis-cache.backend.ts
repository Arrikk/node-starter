import RedisClient from "../../../core/redis/redis.config";
import { ICacheBackend } from "./cache.interface";

export class RedisCacheBackend implements ICacheBackend {
  private redis = new RedisClient().redisInstance;

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlMs) {
      await this.redis.set(key, serialized, "PX", ttlMs);
      return;
    }
    await this.redis.set(key, serialized);
  }

  async delete(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (!keys.length) return 0;
    return this.redis.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }
}
