import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export interface DomainEventContext {
  requestId: string;
  organizationId?: string | null;
  userId?: string | null;
}

const storage = new AsyncLocalStorage<DomainEventContext>();

export function getDomainEventContext(): DomainEventContext | undefined {
  return storage.getStore();
}

export function runWithDomainEventContext<T>(context: DomainEventContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function domainEventContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  const organizationId = user?.companyId != null ? String(user.companyId) : null;
  const userId = user?.id != null ? String(user.id) : null;
  const incomingRequestId = req.headers["x-request-id"];
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim()
      ? incomingRequestId.trim()
      : randomUUID();

  runWithDomainEventContext({ requestId, organizationId, userId }, () => next());
}
