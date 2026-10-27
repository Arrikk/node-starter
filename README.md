# Feature-slice starter

Express + TypeScript API starter extracted from the Bluupay architecture: feature slices, JWT sessions, company scope, one response envelope, and side effects through an outbox.

Copy this folder when you start a new API. It does not include POS, banking, inventory, or payroll. Those stay in the product that owns them. `src/app/notes/` is the module to duplicate.

## Stack

Express 4, TypeScript, Prisma (PostgreSQL or MySQL), Redis, BullMQ, JWT sessions.

## Start

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```

`GET /` returns the app name. `GET /ready` checks the database.

Set `DATABASE_PROVIDER` to `postgresql` or `mysql`. The URL selects the dialect when the provider is empty. Both Prisma schemas live in `prisma/postgresql` and `prisma/mysql` and must stay in sync.

`EMAIL_PROVIDER=console` prints mail. Switch to `nodeMailer` and fill the SMTP variables to send real mail. `STORAGE_TYPE` is `local`, `s3`, or `cloudinary`. `CACHE_BACKEND` is `memory` or `redis`.

## Layout

```
src/
  app.ts                 mounts /v1/<module>
  entry.ts               database, listeners, http, shutdown
  config/                env, Prisma client, SMTP
  core/                  errors, response envelope, events, BullMQ, Redis
  middlewares/           auth, company, permissions, upload, rate limit
  utils/                 password, jwt, pagination, codes
  app/service/           email, storage, and cache factories
  app/identity/          register, login, verify, password reset, avatar
  app/company/           list, current, create, switch
  app/notes/             example feature slice — copy this
```

## Response envelope

Every endpoint returns:

```json
{ "message": "Notes", "status": true, "statusCode": 200, "data": {} }
```

Failures use `status: false` and an `error` field. Throw `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, or `ConflictError` from `src/core/errors.ts`.

## Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/v1/identity/register` | public |
| POST | `/v1/identity/login` | public |
| POST | `/v1/identity/verify-email` | public |
| POST | `/v1/identity/password/forgot` | public |
| POST | `/v1/identity/password/reset` | public |
| POST | `/v1/identity/logout` | bearer |
| GET | `/v1/identity/me` | bearer |
| POST | `/v1/identity/me/avatar` | bearer, multipart field `file` |
| GET | `/v1/company` | bearer + verified email |
| GET | `/v1/company/current` | bearer + verified email + company |
| POST | `/v1/company` | bearer + verified email |
| POST | `/v1/company/switch` | bearer + verified email |
| GET/POST | `/v1/notes` | bearer + verified email + company |

Register creates the user, a company, and an owner membership (`permissions: ["*"]`). In `development`, the JSON body includes `verificationCode` or `resetCode` so you can finish the flow without reading the console mail. Company routes and notes stay blocked until `POST /v1/identity/verify-email`.

Send `Authorization: Bearer <accessToken>`.

## Add a module

1. Copy `src/app/notes/` to `src/app/<module>/`.
2. Add the table to both Prisma schemas. Scope tenant rows with `companyId`.
3. Keep the file suffixes: `routes`, `controller`, `mapper`, `service`, `repository`, `validator`, `interface`.
4. Mount the router in `src/app.ts` inside the `v1` group.
5. Put `authenticate`, `requireEmailVerified`, and `requireCompany` on the router.
6. Call `publishDomainEvent` after a successful write when another system should react. Register a listener in `src/core/events/register-domain-event-listeners.ts`. Email event types are listed in `send-domain-event-email.handler.ts`. The handler loads secrets such as reset codes from the database. Do not put passwords or codes in the event payload.
7. Run `npm run prisma:migrate`.

The same rules are in `.cursor/skills/feature-slice/SKILL.md` so Cursor applies them in the new project.

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Watch mode with `.env` |
| `npm run build` | Compile to `build/` |
| `npm start` | Run the compiled server |
| `npm run prisma:generate` | Generate both Prisma clients |
| `npm run prisma:migrate` | Migrate the provider selected in `.env` |
