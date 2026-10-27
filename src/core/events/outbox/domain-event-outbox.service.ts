import { randomUUID } from "crypto";
import { BullMQService } from "../../bullmq/bullmq.service";
import { buildBullMQJobId } from "../../bullmq/bullmq-job-id";
import { createLogger } from "../../logger";
import { DOMAIN_EVENT_OUTBOX_MAX_ATTEMPTS } from "../../../config/env";
import { prisma } from "../../../config/db";
import { DomainEventBus } from "../domain-event.bus";
import { sanitizeDomainEvent } from "../domain-event-sanitizer";
import { DOMAIN_JOB_PROCESS_OUTBOX, DomainEvent, DomainOutboxJobPayload } from "../domain-event.types";
import { DOMAIN_JOB_QUEUE_TYPE, DOMAIN_JOB_TENANT_ID } from "../domain-job.queue";

const log = createLogger("domain-event-outbox");

function outboxJobId(outboxId: string): string {
  return buildBullMQJobId("outbox", outboxId);
}

export class DomainEventOutboxService {
  static async enqueue(event: DomainEvent): Promise<string> {
    const sanitized = sanitizeDomainEvent(event);
    const outboxId = randomUUID();
    await prisma.domainEventOutbox.create({
      data: {
        outboxId,
        type: sanitized.type,
        event: sanitized as object,
        status: "pending",
        attempts: 0,
      },
    });
    await BullMQService.addJob<DomainOutboxJobPayload>(
      DOMAIN_JOB_QUEUE_TYPE,
      DOMAIN_JOB_TENANT_ID,
      DOMAIN_JOB_PROCESS_OUTBOX,
      { jobName: DOMAIN_JOB_PROCESS_OUTBOX, outboxId },
      {
        jobId: outboxJobId(outboxId),
        attempts: DOMAIN_EVENT_OUTBOX_MAX_ATTEMPTS,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    return outboxId;
  }

  static async processOutboxEntry(outboxId: string): Promise<void> {
    const record = await prisma.domainEventOutbox.findUnique({ where: { outboxId } });
    if (!record || record.status === "completed") return;

    const attempts = record.attempts + 1;
    await prisma.domainEventOutbox.update({
      where: { outboxId },
      data: { status: "processing", attempts },
    });

    try {
      const stored = record.event as unknown as DomainEvent;
      await DomainEventBus.publish({
        ...stored,
        occurredAt: stored.occurredAt ? new Date(stored.occurredAt) : new Date(),
      });
      await prisma.domainEventOutbox.update({
        where: { outboxId },
        data: { status: "completed", processedAt: new Date(), lastError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.domainEventOutbox.update({
        where: { outboxId },
        data: {
          status: attempts >= DOMAIN_EVENT_OUTBOX_MAX_ATTEMPTS ? "failed" : "pending",
          lastError: message,
        },
      });
      log.error("Domain event outbox processing failed", { outboxId, type: record.type, attempts, error: message });
      throw error;
    }
  }

  static async recoverPending(limit = 100): Promise<number> {
    const pending = await prisma.domainEventOutbox.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    let recovered = 0;
    for (const entry of pending) {
      await BullMQService.addJob<DomainOutboxJobPayload>(
        DOMAIN_JOB_QUEUE_TYPE,
        DOMAIN_JOB_TENANT_ID,
        DOMAIN_JOB_PROCESS_OUTBOX,
        { jobName: DOMAIN_JOB_PROCESS_OUTBOX, outboxId: entry.outboxId },
        {
          jobId: outboxJobId(entry.outboxId),
          attempts: DOMAIN_EVENT_OUTBOX_MAX_ATTEMPTS,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      recovered += 1;
    }
    if (recovered > 0) log.info("Recovered pending domain event outbox entries", { recovered });
    return recovered;
  }
}
