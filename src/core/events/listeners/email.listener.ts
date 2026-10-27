import { BullMQService } from "../../bullmq/bullmq.service";
import { buildBullMQJobId } from "../../bullmq/bullmq-job-id";
import { DOMAIN_EVENT_EMAIL_MAX_ATTEMPTS } from "../../../config/env";
import { sanitizeDomainEventPayload } from "../domain-event-sanitizer";
import { DOMAIN_JOB_SEND_EMAIL, DomainEmailJobPayload, DomainEvent } from "../domain-event.types";
import { DomainEventBus } from "../domain-event.bus";
import { DOMAIN_JOB_QUEUE_TYPE, DOMAIN_JOB_TENANT_ID } from "../domain-job.queue";
import { isEmailEventType } from "../handlers/send-domain-event-email.handler";

function emailJobId(event: DomainEvent): string {
  return buildBullMQJobId("email", event.type, event.organizationId, event.entityId ?? "none");
}

async function enqueueDomainEventEmail(event: DomainEvent): Promise<void> {
  if (!isEmailEventType(event.type)) return;
  const payload: DomainEmailJobPayload = {
    jobName: DOMAIN_JOB_SEND_EMAIL,
    eventType: event.type,
    organizationId: event.organizationId,
    entityId: event.entityId,
    entityType: event.entityType,
    payload: sanitizeDomainEventPayload(event.payload),
  };
  await BullMQService.addJob<DomainEmailJobPayload>(
    DOMAIN_JOB_QUEUE_TYPE,
    DOMAIN_JOB_TENANT_ID,
    DOMAIN_JOB_SEND_EMAIL,
    payload,
    {
      jobId: emailJobId(event),
      attempts: DOMAIN_EVENT_EMAIL_MAX_ATTEMPTS,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export function registerEmailListener(): void {
  DomainEventBus.registerListener("*", async (event) => {
    await enqueueDomainEventEmail(event);
  });
}
