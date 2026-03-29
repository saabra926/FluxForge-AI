# Environment variables and integrations

This document is for **project owners** deploying UI→Code Pro.

## Core AI

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required. Your OpenAI API key for generation, refinement, and SEO text helpers. |

## Database

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Connection string for MongoDB (saves generations for **signed-in** users only; guests are not stored). |

## Auth (NextAuth)

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_SECRET` | Random secret for signing session cookies (e.g. `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Public site URL, e.g. `https://your-domain.com` (or `http://localhost:3000` in dev). |

### Email + password

Configure SMTP for password reset emails:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

### Google — “Continue with Google”

1. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials (Web application).
2. Add authorized redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google`
3. Set in `.env.local`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Restart the dev server after changes.

### GitHub — “Continue with GitHub”

1. GitHub → Settings → Developer settings → OAuth Apps → New.
2. Authorization callback URL: `{NEXTAUTH_URL}/api/auth/callback/github`
3. Set:

```bash
GITHUB_ID=...
GITHUB_SECRET=...
```

### GitHub token for Push (Connect tab)

OAuth sign-in can link GitHub for API access. For **push to repository**, users connect in the app’s GitHub modal:

1. Sign in with a provider that has GitHub linked (or connect GitHub on the Account page).
2. Open **GitHub** from the top bar → use the **Connect / token** flow as implemented in the modal to authorize repo access.

(Exact UI labels match **GitHub** and **Deploy** in the app; token storage is server-side per user after linking.)

## PageSpeed / SEO tools

| Variable | Purpose |
|----------|---------|
| `GOOGLE_PAGESPEED_API_KEY` | [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started) key for the **SEO** tab (Lighthouse metrics). Without it, SEO features that call the API may be limited or show configuration hints in-app. |

Create a key in Google Cloud → APIs & Services → Credentials → Create credentials → API key, and enable the PageSpeed Insights API for the project.

## Web push (optional)

Configure VAPID keys as documented in your deployment notes (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, etc.) if you use push notifications on the Account page.

## One-click deployment (Vercel / Netlify)

1. Generate code while **signed in** (guests cannot download ZIP or use deploy integration).
2. Open **Deploy** in the top bar (GitHub sync modal) and follow the **Deploy** tab: connect the repo, then link to Vercel or Netlify as prompted.
3. Ensure environment variables from this doc are set in the hosting dashboard for **production** (`NEXTAUTH_URL`, OAuth callbacks, `OPENAI_API_KEY`, etc.).

## Connecting backend and frontend

When you choose **Full Stack** or **Vite + React + Node.js**, the generator emits separate `frontend/` and `backend/` trees (or Next.js full-stack patterns). After download:

1. Run `npm install` in each package root if multiple `package.json` files exist.
2. Copy `.env.example` to `.env` / `.env.local` and fill API URLs so the frontend points to your API origin (e.g. `NEXT_PUBLIC_API_URL=http://localhost:4000`).
3. Start backend first, then frontend, and verify CORS matches your frontend origin.

---

For product behavior (guest vs signed-in, libraries, SEO), see the in-app **User guide** at `/guide`.
