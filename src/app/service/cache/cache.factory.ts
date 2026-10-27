import { CacheBackendType, CacheConfig } from "./cache.config";
import { ICacheBackend } from "./cache.interface";
import { MemoryCacheBackend } from "./memory-cache.backend";
import { RedisCacheBackend } from "./redis-cache.backend";

export class CacheBackendFactory {
  private static backends = new Map<CacheBackendType, ICacheBackend>();

  static get(type: CacheBackendType = CacheConfig.defaultBackend): ICacheBackend {
    const existing = this.backends.get(type);
    if (existing) return existing;
    const created = type === "redis" ? new RedisCacheBackend() : new MemoryCacheBackend();
    this.backends.set(type, created);
    return created;
  }
}
