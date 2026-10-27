import { getDomainEventContext } from "./domain-event.context";
import { createLogger } from "../logger";
import { DomainEvent, DomainEventListener, DomainEventType } from "./domain-event.types";

const log = createLogger("domain-event-bus");

const wildcardListeners: DomainEventListener[] = [];
const typedListeners = new Map<DomainEventType, DomainEventListener[]>();

function mergeContext(event: DomainEvent): DomainEvent {
  const context = getDomainEventContext();
  if (!context) return event;
  return {
    ...event,
    organizationId: event.organizationId || context.organizationId || "",
    actorId: event.actorId || context.userId || "",
    correlationId: event.correlationId || context.requestId,
  };
}

async function runListener(listener: DomainEventListener, event: DomainEvent): Promise<void> {
  try {
    await listener(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("Domain event listener failed", { type: event.type, error: message });
  }
}

export class DomainEventBus {
  static registerListener(eventType: DomainEventType | "*", handler: DomainEventListener): void {
    if (eventType === "*") {
      wildcardListeners.push(handler);
      return;
    }
    const existing = typedListeners.get(eventType) ?? [];
    existing.push(handler);
    typedListeners.set(eventType, existing);
  }

  static async publish(event: DomainEvent): Promise<void> {
    const enriched = mergeContext({
      ...event,
      occurredAt: event.occurredAt ?? new Date(),
    });
    const listeners = [...wildcardListeners, ...(typedListeners.get(enriched.type) ?? [])];
    for (const listener of listeners) {
      await runListener(listener, enriched);
    }
  }
}
