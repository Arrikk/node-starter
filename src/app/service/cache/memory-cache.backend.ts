import { ICacheBackend } from "./cache.interface";

interface Entry {
  value: unknown;
  expiresAt: number;
}

export class MemoryCacheBackend implements ICacheBackend {
  private cache = new Map<string, Entry>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlMs = 86_400_000): Promise<void> {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }

  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count += 1;
      }
    }
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }
}
