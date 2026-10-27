---
name: feature-slice
description: >-
  Apply the feature-slice Express + TypeScript API starter: routes, controller,
  mapper, service, repository, JWT sessions, company scope, ResponseMessage,
  BullMQ outbox, and provider factories. Use when adding a module or endpoint
  in a project copied from feature-slice-starter.
---

# Feature-slice starter

Stack: **Express 4 · TypeScript · PostgreSQL or MySQL (Prisma) · Redis · BullMQ · sessions**

Copy this folder to start a new API. Domain modules such as POS, banking, and payroll are not part of the starter. `src/app/notes/` is the module to copy.

## Hard rules

1. Never add code comments.
2. Match a sibling feature under `src/app/<module>/` before inventing a new shape.
3. Thin controllers. Business rules live in services. Persistence lives in repositories.
4. Side effects (email, notifications, exports) go through `publishDomainEvent` → outbox → BullMQ.
5. Money and stock writes use a database transaction.
6. Protected routes use `authenticate`, then `requireEmailVerified` and `requireCompany` when the data belongs to a company.
7. Mount `/v1/<module>` only.
8. Use the `ResponseMessage` envelope. Do not add another response shape.
9. Add a provider by extending the factory (`email`, `storage`, `cache`). Do not call a vendor SDK from a controller.

## Feature layering

```
*.routes.ts
  → authenticate / company scope / validators
  → *.controller.ts
  → *.mapper.ts
  → *.service.ts
  → *.repository.ts
  → PostgreSQL or MySQL (Prisma)
```

| Kind | Convention |
|------|------------|
| Folder | `kebab-case` |
| Files | `{feature}.{routes\|controller\|service\|repository\|mapper\|validator\|interface}.ts` |
| API | `/v1/<module>/...` |

Wire the router in `src/app.ts` under the `v1` group.

## Add a feature

```
- [ ] 1. Copy src/app/notes to src/app/<module>
- [ ] 2. Add the table to both prisma/postgresql/schema.prisma and prisma/mysql/schema.prisma
- [ ] 3. repository → service → mapper → validator → controller → routes
- [ ] 4. Mount /v1/<module> in src/app.ts
- [ ] 5. Auth + company scope
- [ ] 6. Throw typed errors from src/core/errors.ts
- [ ] 7. publishDomainEvent for email and other side effects
- [ ] 8. Writes that must succeed together go inside prisma.$transaction
```

## Keep

`src/config/`, `src/core/`, `src/middlewares/`, `src/utils/`, `src/app/service/`, `src/entry.ts`, `src/app.ts`.

Replace `src/app/notes/` when the example is no longer useful. Keep `src/app/identity/` and `src/app/company/` unless the new product has a different tenant model.
