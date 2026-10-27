import { Job, JobsOptions, RepeatOptions } from "bullmq";
import { getQueue } from "./bullmq.config";

export type JobStatus = "waiting" | "active" | "completed" | "failed" | "delayed" | "paused";

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export class BullMQService {
  static async addJob<T = unknown>(
    queueType: string,
    tenantId: string,
    name: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = getQueue<T>(queueType, tenantId);
    return queue.add(name as never, data as never, options) as Promise<Job<T>>;
  }

  static async addRepeatableJob<T = unknown>(
    queueType: string,
    tenantId: string,
    name: string,
    data: T,
    repeat: RepeatOptions,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = getQueue<T>(queueType, tenantId);
    return queue.add(name as never, data as never, { ...options, repeat }) as Promise<Job<T>>;
  }

  static async getJob<T = unknown>(queueType: string, tenantId: string, jobId: string): Promise<Job<T> | null> {
    const job = await getQueue<T>(queueType, tenantId).getJob(jobId);
    return job || null;
  }

  static async removeJob(queueType: string, tenantId: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueType, tenantId, jobId);
    if (job) await job.remove();
  }

  static async retryJob(queueType: string, tenantId: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueType, tenantId, jobId);
    if (job) await job.retry();
  }

  static async getQueueStats(queueType: string, tenantId: string): Promise<QueueStats> {
    const queue = getQueue(queueType, tenantId);
    const [waiting, active, completed, failed, delayed, pausedJobs] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getJobs(["paused"]),
    ]);
    return { waiting, active, completed, failed, delayed, paused: pausedJobs.length };
  }

  static async pauseQueue(queueType: string, tenantId: string): Promise<void> {
    await getQueue(queueType, tenantId).pause();
  }

  static async resumeQueue(queueType: string, tenantId: string): Promise<void> {
    await getQueue(queueType, tenantId).resume();
  }
}
