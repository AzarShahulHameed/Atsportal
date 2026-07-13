# TalentOS — Backend

## Setup
```
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, Cloudinary keys
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts  # creates the initial admin account — see prisma/seed.ts for the login, and change the password immediately after first login
npm run start:dev
```

## Endpoints (base: /api/v1)

Public:
- `GET  /jobs` — active job postings (point your website + LinkedIn/Naukri "external apply" URL here)
- `GET  /jobs/:id`
- `POST /applications` — multipart/form-data: jobId, candidateName, email, phone, source, coverLetterText, resume (file), coverLetter (file, optional)

Auth:
- `POST /auth/login` — { email, password } -> { accessToken, user }

Admin/Reviewer (Bearer token required):
- `GET   /applications?status=&jobId=&page=&pageSize=`
- `GET   /applications/:id`
- `PATCH /applications/:id/status` — { status, note? }, enforces the state machine in applications.service.ts

Admin only:
- `GET   /jobs/admin/all`
- `POST  /jobs`
- `PATCH /jobs/:id`
- `PATCH /jobs/:id/close`
- `GET   /settings` (public) / `PATCH /settings` (admin) — company name, sender email
- `POST  /settings/logo` (admin) — multipart, field name `logo`, 2MB limit

## Migration needed
This update added a `Settings` model (company branding). Run:
```
npx prisma migrate dev --name add_settings
```

## Email notifications
Every status change (including the initial SUBMITTED on application creation)
emits `application.status.changed`. `EmailModule`'s `ApplicationStatusListener`
picks it up, renders the matching template from
`src/email/templates/status-templates.ts`, and sends via Resend.

- Requires `RESEND_API_KEY` — verify your sending domain in Resend first (unverified domains get rate-limited hard).
- `EMAIL_FROM` must be on a domain you verified in Resend.
- Email failures are logged but never throw — a status update always succeeds even if the email bounces. Check `StatusEvent.emailSent` per row for what actually went out.
- Want SendGrid instead? Only `email.service.ts` needs to change.

## What's NOT built yet (next steps)
- Frontend — public apply form + admin review dashboard.
- Refresh tokens / password reset flow for reviewers.
- Rate limiting is a blunt 30 req/min/IP global default — tune per-route if needed.
- No retry/dead-letter queue for failed emails — if Resend is down, that notification is just lost (logged, but lost). Fine for MVP, add BullMQ later if this matters.
