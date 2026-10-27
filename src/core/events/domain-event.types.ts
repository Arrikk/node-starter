export type DomainEventType = string;

export interface DomainEvent {
  type: DomainEventType;
  occurredAt: Date;
  organizationId: string;
  actorId: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  payload: Record<string, unknown>;
}

export type DomainEventListener = (event: DomainEvent) => void | Promise<void>;

export interface DomainJobPayload {
  jobName: string;
  organizationId: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  eventType: DomainEventType;
  payload: Record<string, unknown>;
}

export const DOMAIN_JOB_PROCESS_OUTBOX = "process_domain_event_outbox";
export const DOMAIN_JOB_SEND_EMAIL = "send_domain_event_email";

export interface DomainOutboxJobPayload {
  jobName: typeof DOMAIN_JOB_PROCESS_OUTBOX;
  outboxId: string;
}

export interface DomainEmailJobPayload {
  jobName: typeof DOMAIN_JOB_SEND_EMAIL;
  eventType: DomainEventType;
  organizationId: string;
  entityId?: string;
  entityType?: string;
  payload: Record<string, unknown>;
}

export type DomainQueueJobPayload = DomainJobPayload | DomainOutboxJobPayload | DomainEmailJobPayload;
