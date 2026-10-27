import { registerAuditLogListener } from "./listeners/audit-log.listener";
import { registerEmailListener } from "./listeners/email.listener";
import { startDomainJobWorker } from "./domain-job.worker";
import { DomainEventOutboxService } from "./outbox/domain-event-outbox.service";

export function registerDomainEventListeners(): void {
  registerAuditLogListener();
  registerEmailListener();
  startDomainJobWorker();
  void DomainEventOutboxService.recoverPending().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[DomainEventOutbox] recovery failed", { error: message });
  });
}
