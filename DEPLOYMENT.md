# CraveCache — Deployment Guide

How to deploy CraveCache as it actually is today. For what the app does and its limitations, see
[README.md](./README.md).

> **Before you deploy, set `MONGODB_URI`.** With it, data persists in MongoDB. Without it the app
> falls back to an in-memory store, and every restart — including the automatic sleep/wake cycle on
> free hosting tiers — resets all restaurants, orders and users to the seed data. Verify which store
> is live at `/api/health` after deploying.

---

## Architecture

One Node process serves both the API and the built client:

- **Development** — Vite runs as Express middleware (`server.ts`), so one command serves everything on
  port 3000.
- **Production** — `npm run build` emits the client to `dist/` and bundles the server to
  `dist/server.cjs`. `npm start` runs that bundle, serving `dist/` statically with an SPA catch-all.

This means **a single web service is enough**. You do not need separate frontend and backend hosts.

```
npm run build
├── vite build                      -> dist/index.html, dist/assets/*
└── esbuild server.ts               -> dist/server.cjs
npm start                           -> node dist/server.cjs   (API + static)
```

---

## Option A — Single service on Render (recommended)

1. Push the repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/): **New +** → **Web Service**, select the repo.
3. Leave **Root Directory** blank — deploy the repository root, not `backend/`.
4. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Atlas connection string, including `/cravecache` before the `?` |
   | `GEMINI_API_KEY` | your Gemini key |
   | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` or `pk_test_…` |
   | `CLERK_SECRET_KEY` | `sk_live_…` or `sk_test_…` (secret) |
   | `ADMIN_EMAILS` | comma-separated admin emails |
   | `OWNER_EMAILS` | comma-separated owner emails |
   | `STRIPE_SECRET_KEY` | `sk_live_…` or `sk_test_…` (secret) |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_…` (build-time inlined) |
   | `STRIPE_CURRENCY` | `inr` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from the Cloudinary dashboard |
   | `ALLOW_DEMO_LOGIN` | `false` for a public deployment |

   `PORT` is injected by Render; `server.ts` reads it.

6. Deploy, then confirm:
   ```bash
   curl -s https://<your-service>.onrender.com/api/health
   ```
   Expect `status: "ok"` with `integrations.gemini` and `integrations.clerk` both `true`.

> `VITE_`-prefixed variables are inlined **at build time**, not read at runtime. If you change the
> Clerk publishable key you must trigger a rebuild, not just a restart.

### Free tier caveat
Free Render services sleep when idle; the first request after waking is slow. With `MONGODB_URI` set
your data survives that cycle — without it, the sleep/wake resets everything.

Atlas also needs to accept the connection: free-tier Render has no static outbound IP, so add
`0.0.0.0/0` under Atlas **Network Access**. Access still requires the database credentials.

---

## Option B — Split deployment: backend on Render + frontend on Vercel

Both trees have been installed, built and run together locally, so this path is
verified rather than theoretical.

### How the two halves find each other

The client calls the API through `apiFetch` ([src/utils/apiBase.ts](./src/utils/apiBase.ts)), which
prefixes every request with `VITE_API_URL`. The API allows the client's origin through the CORS
middleware in `server.ts`. Both sides must be configured, or requests fail:

```
Vercel (frontend)                       Render (backend)
VITE_API_URL=https://api.example.com ──▶ ALLOWED_ORIGINS=https://app.vercel.app
                                     ◀── Access-Control-Allow-Origin
```

Get either one wrong and the browser console shows a CORS error even though the API itself is healthy.

### B1 — Backend on Render

1. **New +** → **Web Service**, select the repo.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Health Check Path**: `/api/health`
6. Environment variables:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Atlas string, including `/cravecache` before the `?` |
   | `GEMINI_API_KEY` | your Gemini key |
   | `CLERK_SECRET_KEY` | `sk_…` (secret) |
   | `ADMIN_EMAILS` / `OWNER_EMAILS` | comma-separated emails |
   | `STRIPE_SECRET_KEY` | `sk_…` (secret) |
   | `STRIPE_CURRENCY` | `inr` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from the Cloudinary dashboard |
   | `ALLOWED_ORIGINS` | your Vercel URL — **fill in after step B2** |
   | `ALLOW_DEMO_LOGIN` | `false` |

   Do **not** set `VITE_CLERK_PUBLISHABLE_KEY` here; it belongs to the frontend build.

7. Deploy and confirm:
   ```bash
   curl -s https://<backend>.onrender.com/api/health
   ```
   Expect `"storage":"mongodb"` and `integrations.mongodb: true`. If it says `in-memory`, the
   `MONGODB_URI` is wrong or Atlas is refusing the connection — check **Network Access** allows
   `0.0.0.0/0`, since free Render has no static outbound IP.

### B2 — Frontend on Vercel

1. **Add New** → **Project**, import the repo.
2. **Root Directory**: `frontend`
3. Framework preset **Vite** is detected; output directory `dist`.
4. Environment variables:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<backend>.onrender.com` — no trailing slash |
   | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_…` |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_…` — required for real card entry |

5. Deploy, then copy the resulting Vercel URL.

### B3 — Close the loop

1. Back in Render, set `ALLOWED_ORIGINS` to the Vercel URL and redeploy.
2. In Clerk, add `https://<your-vercel-url>/sso-callback` to the allowed redirects.

> `VITE_` variables are inlined at **build** time. Changing `VITE_API_URL` requires a Vercel
> **redeploy**, not just a restart.

`frontend/vercel.json` contains only the SPA fallback rewrite. It previously proxied `/api/*` to a
hardcoded Render hostname; that is gone, because routing now comes from `VITE_API_URL`.

---

## Clerk configuration

Do this before testing sign-in, or OAuth fails before it reaches the app.

1. **SSO Connections** → enable **Google**, **GitHub**, **Microsoft**. Google works immediately on a
   development instance; GitHub and Microsoft need your own OAuth apps (Clerk shows the exact callback
   URL to register with each provider).
2. **Paths / allowed origins** → add your deployed origin plus the callback path:
   - `http://localhost:3000/sso-callback` (local)
   - `https://<your-domain>/sso-callback` (deployed)
3. Set `ADMIN_EMAILS` / `OWNER_EMAILS` so the right accounts land in the right portal. Everyone else
   signs in as a customer — roles are decided server-side and cannot be requested by the client.

---

## Post-deploy checklist

```bash
BASE=https://<your-service>

curl -s $BASE/api/health                 # status ok, integrations true
curl -s $BASE/api/auth/clerk/status      # {"configured":true,...}
curl -s $BASE/api/restaurants | head -c 200
curl -s -X POST $BASE/api/auth/login \
     -H 'Content-Type: application/json' -d '{"email":"x@y.com"}'
     # should be 403 if ALLOW_DEMO_LOGIN=false
```

Then in a browser: social sign-in completes and lands in the portal matching your email's role;
customer flow reaches checkout; owner can advance an order's status; admin sees platform metrics.

---

## Not configured by this guide

These are referenced nowhere in the code and need building first — don't add the env vars expecting
them to work:

- **Stripe webhooks** — payments work, but there is no webhook endpoint, so an asynchronous payment
  that settles after the browser closes is not reconciled. Nothing to register in the Stripe
  dashboard yet.
- **Socket.IO** — no real-time channel exists.
