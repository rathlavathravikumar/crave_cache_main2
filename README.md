# CraveCache 🍔

An AI-assisted food ordering platform with three role-separated portals — Customer, Restaurant Owner
and Super Admin — built with React 19, TypeScript, Redux Toolkit and Express.

The AI is real: meal recommendations and the food assistant call Google Gemini server-side with the
live menu as context. Authentication is real: Google / GitHub / Microsoft sign-in through Clerk, with
roles resolved server-side.

> **Project status — read this first.** This is a fully working prototype, not a deployed commercial
> product. Storage is real MongoDB, payments are real Stripe, and images are stored on Cloudinary —
> each falls back gracefully when its keys are absent, so a keyless clone still runs. See
> [Current limitations](#-current-limitations) for exactly what is and isn't wired up. Nothing in this
> README describes a feature that isn't in the code.

---

## ✨ What it does

### Customer portal
- Browse restaurants with cuisine filters, search, ratings and delivery estimates
- **AI food assistant** — describe a craving in natural language ("spicy dinner under ₹500") and get a
  real Gemini-generated suggestion, priced from the actual menu, with coupons applied
- Dish customisation (sizes, toppings, special instructions), cart, coupon validation and checkout
- **Two payment methods** — online card (default) and cash on delivery. Card orders are rejected unless the server verifies the payment with Stripe; cash orders are created as `Pending` and collected on delivery. In demo mode (`PAYMENT_MODE=simulate`) online checkout completes instantly with no Stripe account required
- Order history with a step-by-step status tracker and review submission
- Saved favourites for restaurants and dishes

### Restaurant owner portal
- Live incoming order queue with accept / reject
- Menu management: add, edit, delete dishes and toggle availability
- Advance kitchen status: `Placed → Confirmed → Preparing → Out for Delivery → Delivered`
- Per-restaurant analytics and notifications

### Super admin dashboard
- Platform metrics: revenue, order volume, restaurant and user counts
- User management with role assignment and account blocking
- Restaurant and menu CRUD, plus coupon management

---

## 🧱 Tech stack

| Layer | What's actually used |
| --- | --- |
| Frontend | React 19, TypeScript, Redux Toolkit, Tailwind CSS v4, lucide-react, `motion` |
| Backend | Node.js, Express 4, TypeScript executed via `tsx` |
| AI | `@google/genai` (Gemini) — called server-side only, key never reaches the browser |
| Auth | `@clerk/clerk-react` + `@clerk/backend` — OAuth via Google, GitHub, Microsoft |
| Data | **MongoDB via Mongoose** when `MONGODB_URI` is set, otherwise an in-memory fallback. Seeded from `src/data/initialData.ts` |
| Payments | **Stripe** — PaymentIntents server-side, card entry via Stripe Elements so card data never reaches this app |
| Media | **Cloudinary** — uploads via `POST /api/uploads/image`, downscaled in the browser first |
| Build | Vite 6 (client), esbuild (server bundle) |

One Express process serves both the API and the client: Vite runs as middleware in development, and
static `dist/` output is served in production. There is no separate frontend server to run.

The client reaches the API through `apiFetch` (`src/utils/apiBase.ts`), so the same code works either
same-origin or against a separately hosted API via `VITE_API_URL`. The server sends CORS headers for
the origins listed in `ALLOWED_ORIGINS`.

---

## 🚀 Getting started

### Prerequisites
Node.js 20+ and npm.

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy the template and fill in what you need:
```bash
cp .env.example .env
```

| Variable | Required? | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | For persistence | MongoDB connection string. Without it the app runs on an in-memory store and **all data resets on restart**. |
| `GEMINI_API_KEY` | For AI features | Server-side Gemini calls. Without it the AI endpoints fall back to non-AI ranking. |
| `VITE_CLERK_PUBLISHABLE_KEY` | For social login | Clerk frontend key ([Dashboard → API Keys](https://dashboard.clerk.com/)). Must use the `VITE_` prefix or Vite won't expose it. |
| `CLERK_SECRET_KEY` | For social login | Clerk backend key. **Secret — never commit.** Without it social sign-in completes at Clerk then fails at the exchange step. |
| `ADMIN_EMAILS` | Optional | Comma-separated emails granted the `admin` role. |
| `OWNER_EMAILS` | Optional | Comma-separated emails granted the `owner` role. |
| `ALLOW_DEMO_LOGIN` | Optional | Set `false` to disable passwordless demo login. Defaults to enabled. |
| `PAYMENT_MODE` | Optional | `auto` (default) uses Stripe when keys exist, else the demo processor. `simulate` forces the demo processor even with keys — **no Stripe account needed**. `stripe` requires real Stripe. |
| `STRIPE_SECRET_KEY` | For real payments | Server-side Stripe key. Without it card checkout uses the demo processor. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For real payments | Client-side Stripe key. Build-time inlined. |
| `STRIPE_CURRENCY` | Optional | Defaults to `inr`. Must be enabled on your Stripe account. |
| `CLOUDINARY_CLOUD_NAME` | For hosted images | From the Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | For hosted images | From the Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | For hosted images | Secret. Without all three, uploads stay inline base64. |
| `VITE_API_URL` | Split mode only | Origin of the API when the client is hosted separately. Empty means same-origin. Inlined at build time. |
| `ALLOWED_ORIGINS` | Split mode only | Comma-separated browser origins the API accepts (CORS). Unset allows any origin — local dev only. |

The app runs **without any keys at all** — social sign-in renders a setup hint and demo login still
works, so a fresh clone is never a blank screen.

### 3. Run
```bash
npm run dev          # http://localhost:3000 — API + client in one process
```

Other scripts:
```bash
npm run build        # vite build + esbuild server bundle -> dist/
npm start            # run the production bundle
npm run lint         # tsc --noEmit  (NOTE: covers src/ only, not server.ts)
npm run clean        # remove dist/
```

To typecheck the server as well:
```bash
npx tsc --noEmit --module esnext --target es2022 --moduleResolution bundler \
        --skipLibCheck --types node server.ts
```

---

## 🔐 Authentication & roles

Two sign-in paths exist side by side.

**1. Social sign-in (Clerk)** — Google, GitHub or Microsoft. The browser completes OAuth, then posts
its Clerk session token to `POST /api/auth/clerk`. The server verifies the token, looks the account up
through Clerk's Backend API, and resolves the role.

**Roles are server-authoritative.** The email is read from the verified Clerk account, never from the
request body, and is matched against `ADMIN_EMAILS` / `OWNER_EMAILS`; anyone else becomes a
`customer`. A client cannot ask for a role and be given it.

To enable providers: Clerk Dashboard → **SSO Connections** → enable Google / GitHub / Microsoft, and
allow `http://localhost:3000/sso-callback` as a redirect. Google works instantly on a development
instance; GitHub and Microsoft require your own OAuth apps.

**2. Demo login** — passwordless, for local development and demos. Pre-seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Customer | `alex@example.com` | anything |
| Owner | `owner@pizzamaestro.com` | anything |
| Admin | `admin@cravecache.com` | anything |

Disable it in production with `ALLOW_DEMO_LOGIN=false`.

---

## 📂 Project structure

```
.
├── server.ts                  # Express API + Vite middleware (the app you run)
├── db/
│   ├── index.ts               # Repository layer: Mongo driver + memory driver
│   ├── models.ts              # Mongoose schemas for the 6 collections
│   └── seedOrders.ts          # Demo order shared by both drivers
├── src/
│   ├── App.tsx                # Shell, role-based view routing
│   ├── main.tsx               # Root, Clerk provider, /sso-callback route
│   ├── auth/                  # Clerk provider, session bridge, social buttons
│   ├── payments/              # Stripe Elements card form
│   ├── components/
│   │   ├── ui/                # Design system: Button, Modal, confirm, Field,
│   │   │                      #   Card, Badge, Skeleton, EmptyState
│   │   └── ...                # Header, CartDrawer, FoodCard, modals
│   ├── pages/                 # AuthPage, Home, RestaurantDetails, Checkout,
│   │                          #   Orders, Wishlist, Profile, Owner, Admin
│   ├── store/slices/          # Redux Toolkit: auth, cart, food, restaurants,
│   │                          #   orders, wishlist, admin, ai
│   ├── utils/                 # api.ts (fetch + ApiError), toast.ts (store)
│   ├── data/initialData.ts    # Seed data — the "database"
│   └── index.css              # Design tokens (@theme) + keyframes
├── .env.example
└── DEPLOYMENT.md
```

`frontend/` and `backend/` hold a split-deployment variant of the same code, for hosting the client
and API as two services (e.g. Vercel + Render). Both have been installed, built and run together
successfully. The root tree remains what `npm run dev` uses; keep the three in sync when editing.

```bash
# Run them as two services locally
cd backend  && npm install && npm run dev   # API on :5000
cd frontend && npm install && npm run dev   # client on :3000, VITE_API_URL=http://localhost:5000
```

### Design system
UI primitives live in `src/components/ui/`. Colour, radius and elevation come from tokens declared with
Tailwind v4's `@theme` in `src/index.css` — use `brand-*`, `ink-*`, `surface-*`, `rounded-card`,
`shadow-overlay` rather than raw hex values.

Notifications are a custom store (`src/utils/toast.ts` + `ToastHost.tsx`): top-right below the header
on desktop, bottom on mobile, duplicate-collapsing, hover-pausing, max three at a time.
`react-toastify` was removed. Confirmations use the promise-based `confirm()` helper, not
`window.confirm`.

---

## 🔌 API reference

67 route registrations; several have aliases (e.g. `/api/foods`, `/api/food-items` and
`/api/admin/foods` share a handler). Grouped essentials:

**Health** · `GET /api/health` → `{ status, storage: "mongodb" | "in-memory", integrations: { gemini, clerk, mongodb } }`

**Auth** · `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me` ·
`PUT /api/auth/profile/:id` · `PUT /api/auth/addresses` · `POST /api/auth/clerk` ·
`GET /api/auth/clerk/status`

**Catalogue** · `GET /api/restaurants` · `GET /api/restaurants/:id` · `GET /api/foods` ·
`GET /api/coupons` · `POST /api/coupons/validate`

**Orders** · `POST /api/orders` · `GET /api/orders` · `GET /api/orders/:id` ·
`PUT /api/orders/:id/status` · `PUT /api/orders/:id/cancel` · `POST /api/reviews`

**AI** · `POST /api/ai/assistant` (body `{ prompt }`) · `POST /api/recommendations`

**Payments** · `POST /api/payments/create-intent` · `POST /api/payments/confirm` (re-verifies with Stripe) · `GET /api/payments/config`

**Uploads** · `POST /api/uploads/image` (data URI → Cloudinary URL) · `GET /api/uploads/config`

**Owner** · `GET /api/owner/my-restaurant` · `GET|POST /api/owner/foods` ·
`PUT|DELETE /api/owner/foods/:id` · `GET /api/owner/orders` ·
`PUT /api/owner/orders/:id/status` · `GET /api/owner/analytics` · `GET /api/owner/notifications`

**Admin** · `GET /api/admin/analytics` · `GET|POST /api/admin/users` ·
`PUT /api/admin/users/:id` · `PUT /api/admin/users/:id/role` ·
`PUT /api/admin/users/:id/toggle-block` · `DELETE /api/admin/users/:id` ·
plus restaurant, food and coupon CRUD

---

## ⚠️ Current limitations

Stated plainly so nobody is surprised:

| Area | Reality |
| --- | --- |
| **Persistence** | Real MongoDB when `MONGODB_URI` is set. Without it, an in-memory fallback is used and **all data resets when the server restarts**. Check which is live at `/api/health`. |
| **Payments** | Online card (default) or cash on delivery. `PAYMENT_MODE` selects the online processor — the built-in demo processor needs no Stripe account. Real Stripe when keys are set and mode allows it — the server creates PaymentIntents and **re-verifies status and amount with Stripe** before an order is written, so a client claiming success is not enough. Without keys it falls back to simulation. There is no webhook endpoint yet, so an async payment that settles after the browser closes is not reconciled. |
| **Real-time** | None. No WebSockets or Socket.IO. Order status changes appear on the next page load or refresh, not live. |
| **Media uploads** | Cloudinary when configured; images are downscaled client-side then uploaded through the API. Without keys the data URI is echoed back and not persisted. Deleting a record does not yet delete its Cloudinary asset. |
| **Passwords** | Not verified. Demo login accepts any password by design; Clerk handles real credentials. |
| **Authorisation** | API routes are not individually guarded. Role separation is enforced in the UI, and roles are server-assigned, but the endpoints themselves trust their inputs. |

Natural next steps: add Socket.IO for live tracking, add a Stripe webhook to reconcile
asynchronous payments, delete Cloudinary assets when their records are removed, and add auth
middleware to the API routes.

---

## ✅ Verifying a change

```bash
npm run lint                                   # typecheck src/
npm run build                                  # full production build
curl -s localhost:3000/api/health              # server + integration status
curl -s localhost:3000/api/auth/clerk/status   # is Clerk configured?
curl -s localhost:3000/api/restaurants | head  # seed data present?
```

Then click the flow that matters: sign in → browse → customise → cart → checkout → track, and the
owner/admin portals via the seeded accounts above.
