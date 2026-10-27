export function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value);
}

export function asNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function asPositiveInt(value: unknown): number | undefined {
  const parsed = asNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed) || parsed < 1) return undefined;
  return parsed;
}

export function asDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function asEnumValue<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const normalized = asString(value);
  if (!normalized) return undefined;
  return allowed.includes(normalized as T) ? (normalized as T) : undefined;
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
