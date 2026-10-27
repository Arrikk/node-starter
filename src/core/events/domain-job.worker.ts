import { createWorker } from "../bullmq/bullmq.config";
import { createLogger } from "../logger";
import {
  DOMAIN_JOB_PROCESS_OUTBOX,
  DOMAIN_JOB_SEND_EMAIL,
  DomainEmailJobPayload,
  DomainOutboxJobPayload,
  DomainQueueJobPayload,
} from "./domain-event.types";
import { DOMAIN_JOB_QUEUE_TYPE, DOMAIN_JOB_TENANT_ID } from "./domain-job.queue";
import { sendDomainEventEmail } from "./handlers/send-domain-event-email.handler";
import { DomainEventOutboxService } from "./outbox/domain-event-outbox.service";

const log = createLogger("domain-job-worker");
let workerStarted = false;

function isOutboxJob(data: DomainQueueJobPayload): data is DomainOutboxJobPayload {
  return data.jobName === DOMAIN_JOB_PROCESS_OUTBOX;
}

function isEmailJob(data: DomainQueueJobPayload): data is DomainEmailJobPayload {
  return data.jobName === DOMAIN_JOB_SEND_EMAIL;
}

async function processDomainJob(job: DomainQueueJobPayload): Promise<void> {
  if (isOutboxJob(job)) {
    await DomainEventOutboxService.processOutboxEntry(job.outboxId);
    return;
  }
  if (isEmailJob(job)) {
    await sendDomainEventEmail(job);
    return;
  }
  log.warn("Unknown domain job", { jobName: job.jobName });
}

export function startDomainJobWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  createWorker<DomainQueueJobPayload>(
    DOMAIN_JOB_QUEUE_TYPE,
    DOMAIN_JOB_TENANT_ID,
    async (job) => {
      try {
        await processDomainJob(job.data);
        log.info("Domain job processed", { jobId: job.id, jobName: job.data.jobName });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.error("Domain job failed", { jobId: job.id, jobName: job.data.jobName, error: message });
        throw error;
      }
    },
    { concurrency: 5 },
  );
}
