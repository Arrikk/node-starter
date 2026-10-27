import { createLogger } from "../../logger";
import { DomainEvent } from "../domain-event.types";
import { DomainEventBus } from "../domain-event.bus";

const log = createLogger("audit");
const REDACT_KEYS = new Set(["password", "token", "secret", "authorization", "verificationcode"]);

function redactPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      result[key] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactPayload(value as Record<string, unknown>);
      continue;
    }
    result[key] = value;
  }
  return result;
}

export function registerAuditLogListener(): void {
  DomainEventBus.registerListener("*", (event: DomainEvent) => {
    log.info(event.type.replace(/\./g, " ").replace(/_/g, " "), {
      type: event.type,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      companyId: event.organizationId,
      userId: event.actorId,
      requestId: event.correlationId ?? null,
      payload: redactPayload(event.payload),
    });
  });
}
