import { CACHE_BACKEND } from "../../../config/env";

export type CacheBackendType = "memory" | "redis";

export const CacheConfig = {
  defaultBackend: (CACHE_BACKEND === "redis" ? "redis" : "memory") as CacheBackendType,
  ttlMs: 30_000,
};
