# Vibe-Step Health Tracker

A gamified gamified step and activity tracking dashboard.

## 🚀 Setup & Vercel Deployment Guide

Since you requested to configure this for real usage via Vercel, please follow these instructions carefully.

### 1. Database Configuration (Vercel Postgres)
Currently, the app relies on **Vercel Postgres** to store daily health data.
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and select this project.
2. Navigate to the **Storage** tab.
3. Click **Create Database**, select **Postgres**, and accept the terms.
4. Once created, Vercel will automatically add the `POSTGRES_URL` to your project's Environment Variables.
5. *Important*: After your database is provisioned, you'll need to initialize the tables. Go to your Vercel project's **Deployments** tab, find your latest deployment, and trigger a redeployment, or run the local setup script if you connect your local CLI. You can visit the `/api/weeks` endpoint in a browser to see if it responds without 500 errors.
   - Alternatively, you can run `npm run setup-db` locally after pulling the `.env` via `npx vercel env pull .env.local`.

### 2. Environment Variables
You need to add a secure webhook secret so your Android Health Connect app can securely post data.
1. In your Vercel Project, go to **Settings** > **Environment Variables**.
2. Add a new variable:
   - **Key:** `WEBHOOK_SECRET`
   - **Value:** *(Create a random secure string, e.g., `my_super_secret_health_key_123`)*
3. **Save** the variable and redeploy your app to apply the newly added variables.

### 3. Android Health Connect Setup
Your Android app needs to know where to send the health data intervals.
1. Open your HC Webhook app settings.
2. Set the **Webhook URL** to your Vercel domain + `/api/webhook`
   - Example: `https://vibe-step-health-tracker.vercel.app/api/webhook`
3. Set the **Auth/Secret Header** or Payload parameter to match your `WEBHOOK_SECRET` value. The Next.js API expects this secret in the `x-webhook-secret` header.

## 🛠 Features
- **Debt Engine:** Uses a FIFO algorithm to calculate step debts if you miss goals, allowing you to pay them off on subsequent days.
- **Dynamic Weekly View:** A sliding layout built with Framer Motion.
- **Automated Webhooks:** Receives daily updates from the Health Connect Android app.
