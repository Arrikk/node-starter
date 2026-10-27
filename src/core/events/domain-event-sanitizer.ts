import { DomainEvent } from "./domain-event.types";

const SENSITIVE_KEYS = new Set(["password", "token", "secret", "authorization", "verificationcode"]);

export function sanitizeDomainEventPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeDomainEventPayload(value as Record<string, unknown>);
      continue;
    }
    result[key] = value;
  }
  return result;
}

export function sanitizeDomainEvent(event: DomainEvent): DomainEvent {
  return {
    ...event,
    payload: sanitizeDomainEventPayload(event.payload),
  };
}
