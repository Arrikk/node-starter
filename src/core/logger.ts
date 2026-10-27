import { LogLevel } from "../enums/index.enums";

export interface Logger {
  error(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  ok(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export interface LoggerContext {
  organizationId?: string | null;
  companyId?: string | null;
  userId?: string | null;
  requestId?: string | null;
}

export function createLogger(service: string, _context: LoggerContext = {}): Logger {
  const write = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    const line = `[${level}] [${service}] ${message}`;
    if (level === LogLevel.ERROR) {
      console.error(line, data ?? "");
      return;
    }
    if (level === LogLevel.WARN) {
      console.warn(line, data ?? "");
      return;
    }
    if (level === LogLevel.DEBUG) {
      console.debug(line, data ?? "");
      return;
    }
    console.log(line, data ?? "");
  };

  return {
    error: (message, data) => write(LogLevel.ERROR, message, data),
    warn: (message, data) => write(LogLevel.WARN, message, data),
    info: (message, data) => write(LogLevel.INFO, message, data),
    ok: (message, data) => write(LogLevel.OK, message, data),
    debug: (message, data) => write(LogLevel.DEBUG, message, data),
  };
}
