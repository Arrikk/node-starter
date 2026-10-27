import { DomainEventOutboxService } from "./outbox/domain-event-outbox.service";
import { DomainEvent, DomainEventType } from "./domain-event.types";

export function publishDomainEvent(input: Omit<DomainEvent, "occurredAt"> & { occurredAt?: Date }): void {
  const event: DomainEvent = {
    ...input,
    occurredAt: input.occurredAt ?? new Date(),
  };
  void DomainEventOutboxService.enqueue(event).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[DomainEventOutbox] enqueue failed", { type: event.type, error: message });
  });
}

export function domainEvent(
  type: DomainEventType,
  params: {
    organizationId: string;
    actorId: string;
    entityType?: string;
    entityId?: string;
    correlationId?: string;
    payload?: Record<string, unknown>;
  },
): DomainEvent {
  return {
    type,
    occurredAt: new Date(),
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: params.entityType,
    entityId: params.entityId,
    correlationId: params.correlationId,
    payload: params.payload ?? {},
  };
}
