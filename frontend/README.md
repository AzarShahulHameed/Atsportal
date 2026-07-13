# TalentOS — Frontend

One Next.js 14 app, two surfaces, split by auth:
- `/` and `/jobs/[id]` — public, no login. Point your website careers page
  and the LinkedIn/Naukri "external apply" URL here.
- `/login`, `/admin/*` — reviewer/admin only, gated by `middleware.ts`
  checking for the access-token cookie.

## Setup
```
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm run dev
```

## Auth model
- Access token (15min): stored in a readable cookie so middleware can gate
  `/admin/*` at the edge.
- Refresh token (7 days): stored in localStorage, only ever sent to
  `/auth/refresh`. `lib/auth.ts` → `ensureFreshToken()` is called at the top
  of every admin data-fetch — it transparently refreshes if the access token
  is missing/expired before the actual request goes out.
- First admin login: `admin@catapult.com` / `ChangeMe123!` (from the backend
  seed script — change it via the Users API once you're in).

## What's NOT built yet
- Reviewer/user management UI (backend `/users` endpoints exist, no admin
  screen calls them yet — create reviewers via curl/Postman for now).
- Password reset flow (backend doesn't have this endpoint yet either).
- Toast notifications — errors render inline only, no global toast system.
- No tests.
