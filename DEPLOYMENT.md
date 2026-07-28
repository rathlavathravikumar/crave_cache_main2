# CraveCache 🍔🚀 - Production Deployment & Architecture Guide

This comprehensive guide outlines the end-to-end production architecture, deployment workflows, environment configuration, and verification protocols for **CraveCache**, a next-generation MERN Stack and AI-powered food ordering and delivery platform.

---

## 📂 Repository Structure & Deployment Optimizations

The repository is structured for seamless multi-platform deployment:
- **Frontend SPA (Vercel)**: Configured via `vercel.json` for static asset output in `dist/` with API rewrites.
- **Backend API Server (Render)**: Configured via `render.yaml` and `package.json` build/start scripts for Node.js / Express execution.

```tree
├── server.ts                  # Express production API server
├── vercel.json                # Vercel deployment & rewrite configuration
├── render.yaml                # Render web service blueprint configuration
├── package.json               # Dependencies & build scripts
├── src/                       # React 18 TypeScript frontend
│   ├── App.tsx                # Root component with ToastContainer & Router
│   ├── components/            # Reusable UI components & Modals
│   ├── pages/                 # Full application views & role portals
│   ├── store/                 # Redux Toolkit store & slices
│   └── utils/                 # Centralized React-Toastify service
└── .env.example               # Production environment variable reference
```

---

## 🚀 Step-1: Deploying Backend on Render

1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Web Service** and connect your GitHub repository (or use `render.yaml` Blueprint).
4. Configure service settings:
   * **Name**: `cravecache-backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. Add Environment Variables in Render Dashboard:
   * `NODE_ENV` = `production`
   * `PORT` = `3000`
   * `MONGODB_URI` = `your_mongodb_atlas_connection_string`
   * `JWT_SECRET` = `your_secure_jwt_secret`
   * `STRIPE_SECRET_KEY` = `sk_test_...`
   * `STRIPE_WEBHOOK_SECRET` = `whsec_...` (add after webhook is configured)
   * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   * `GEMINI_API_KEY` = `your_gemini_api_key`
6. Deploy and copy your Render Backend URL (e.g. `https://cravecache-backend.onrender.com`).

---

## 🚀 Step-2: Deploying Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project** and import your GitHub repository.
3. Vercel will automatically detect Vite (`vercel.json` is pre-configured):
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add Environment Variables in Vercel Project Settings:
   * `VITE_API_URL` = `https://cravecache-backend.onrender.com` (Your live Render backend URL)
   * `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
5. Click **Deploy**. Vercel will build and host your production-ready client application.

---

## 💳 Step-3: Configuring Stripe Webhook
Once both frontend and backend are deployed:
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/) -> **Developers** -> **Webhooks**.
2. Add an endpoint URL: `https://cravecache-backend.onrender.com/api/v1/payments/webhook` (or your backend payment webhook route).
3. Select events (e.g., `payment_intent.succeeded`).
4. Copy the **Signing Secret** (`whsec_...`) and update your Render backend environment variables with `STRIPE_WEBHOOK_SECRET`.

---

## 🩺 Health Check & Monitoring
* **Backend Health Check**: `GET /api/health`
* **Notifications**: Centralized `react-toastify` toast notifications provide instantaneous feedback on all network requests, authentications, payments, and CRUD actions.
