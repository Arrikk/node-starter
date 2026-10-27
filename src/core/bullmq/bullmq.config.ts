import { Queue, QueueOptions, Worker, WorkerOptions, Job, ConnectionOptions } from "bullmq";
import { QUEUE_PREFIX, REDIS_URL } from "../../config/env";

function parseRedisUrl(url: string): ConnectionOptions {
  if (!url) {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null };
  }
  try {
    if (url.startsWith("redis://") || url.startsWith("rediss://")) {
      const urlObj = new URL(url);
      return {
        host: urlObj.hostname,
        port: parseInt(urlObj.port) || 6379,
        username: urlObj.username || undefined,
        password: urlObj.password || undefined,
        db: urlObj.pathname ? parseInt(urlObj.pathname.slice(1)) || 0 : 0,
        maxRetriesPerRequest: null,
        ...(url.startsWith("rediss://") ? { tls: {} } : {}),
      };
    }
  } catch (error) {
    console.error("Error parsing Redis URL for BullMQ:", error);
  }
  return { host: "localhost", port: 6379, maxRetriesPerRequest: null };
}

function getRedisConnection(): ConnectionOptions {
  return parseRedisUrl(REDIS_URL);
}

export function getQueueName(queueType: string, tenantId: string): string {
  return `${QUEUE_PREFIX}-${queueType}-${tenantId}`;
}

export function createQueue<T = unknown>(queueType: string, tenantId: string, options?: Partial<QueueOptions>): Queue<T> {
  const defaultOptions: QueueOptions = {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { age: 24 * 3600, count: 1000 },
      removeOnFail: { age: 7 * 24 * 3600 },
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
  };
  return new Queue<T>(getQueueName(queueType, tenantId), { ...defaultOptions, ...options });
}

export function createWorker<T = unknown>(
  queueType: string,
  tenantId: string,
  processor: (job: Job<T>) => Promise<unknown>,
  options?: Partial<WorkerOptions>,
): Worker<T> {
  const defaultOptions: WorkerOptions = {
    connection: getRedisConnection(),
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  };
  return new Worker<T>(getQueueName(queueType, tenantId), processor, { ...defaultOptions, ...options });
}

const queueCache = new Map<string, Queue>();

export function getQueue<T = unknown>(queueType: string, tenantId: string, options?: Partial<QueueOptions>): Queue<T> {
  const cacheKey = `${queueType}:${tenantId}`;
  const cached = queueCache.get(cacheKey);
  if (cached) return cached as Queue<T>;
  const queue = createQueue<T>(queueType, tenantId, options);
  queueCache.set(cacheKey, queue);
  return queue;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all(Array.from(queueCache.values()).map((queue) => queue.close()));
  queueCache.clear();
}
