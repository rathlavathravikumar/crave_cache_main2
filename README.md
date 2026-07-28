# CraveCache 🍔🚀 - AI-Powered Food Ordering Platform

CraveCache is a production-grade, next-generation MERN Stack and AI-powered food ordering and delivery platform featuring real-time tracking, Stripe payments, Cloudinary media management, AI culinary recommendations, and role-based portals for Customers, Restaurant Owners, and Super Admins.

---

## 📂 Repository Structure

The project is structured with complete separation between frontend and backend for seamless, isolated production deployments:

```tree
separateCraveCache/
│
├── frontend/                  # React 18, TypeScript, Redux Toolkit, Tailwind CSS SPA (Deploy on Vercel)
│   ├── src/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
│
├── backend/                   # Node.js, Express, MongoDB Atlas, Stripe, Cloudinary, Socket.IO API (Deploy on Render)
│   ├── server.ts
│   ├── render.yaml
│   ├── package.json
│   └── .env.example
│
└── README.md                  # Comprehensive deployment & architecture guide
```

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Deploying the Backend on Render

1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Web Service** and select your repository.
4. Set the Root Directory to `backend`.
5. Configure deployment settings:
   * **Runtime**: Node
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
6. Add the following Environment Variables in the Render dashboard:
   * `NODE_ENV` = `production`
   * `PORT` = `3000`
   * `MONGODB_URI` = `mongodb+srv://...` (Your MongoDB Atlas connection string)
   * `JWT_SECRET` = `your_secure_jwt_secret`
   * `STRIPE_SECRET_KEY` = `sk_test_...`
   * `STRIPE_WEBHOOK_SECRET` = `whsec_...` (Add after setting up Stripe Webhook)
   * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   * `GEMINI_API_KEY` = `your_gemini_api_key`
   * `FRONTEND_URL` = `https://your-frontend.vercel.app`
7. Click **Create Web Service**. Once deployed, copy your Render backend URL (e.g., `https://cravecache-backend.onrender.com`).

---

### Step 2: Deploying the Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project** and import your GitHub repository.
3. Set the Root Directory to `frontend`.
4. Vercel automatically detects Vite settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Add the following Environment Variables in Vercel:
   * `VITE_API_URL` = `https://cravecache-backend.onrender.com` (Your live Render backend URL)
   * `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
6. Click **Deploy**. Your frontend is now live!

---

### Step 3: Configuring Stripe Webhook (Optional/Production)

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/) -> **Developers** -> **Webhooks**.
2. Add an endpoint URL: `https://cravecache-backend.onrender.com/api/v1/payments/webhook`.
3. Select events (e.g., `payment_intent.succeeded`).
4. Copy the **Signing Secret** (`whsec_...`) and update your Render backend environment variable `STRIPE_WEBHOOK_SECRET`.

---

## 🩺 Health Check & Monitoring
* **Backend Health Check**: `GET /api/health`
* **Real-Time WebSockets**: Powered by Socket.IO for live order tracking and kitchen updates.
* **Notifications**: Integrated `react-toastify` system for instant user feedback across all portals.
