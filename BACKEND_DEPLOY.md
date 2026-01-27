# Backend Deployment Guide - Render

## Quick Deploy to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `rukhnabeel/VisitorsManagementSystem`
3. Configure:
   - **Name**: `tripvenza-visitor-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

### Step 3: Add Environment Variables
Click **"Environment"** and add:

```
MONGO_URI=mongodb+srv://Vercel-Admin-visitor:JVTlwAsfwA0Ip6ee@visitor.se2ztcz.mongodb.net/?retryWrites=true&w=majority
EMAIL_USER=visitorspprt@gmail.com
EMAIL_PASS=miac diog ltfh pgar
PORT=5000
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Copy your backend URL (e.g., `https://tripvenza-visitor-backend.onrender.com`)

### Step 5: Update Frontend
1. Go to your Vercel project settings
2. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tripvenza-visitor-backend.onrender.com` (your Render URL)
3. Redeploy frontend

---

## Alternative: Railway

### Quick Deploy
1. Go to [railway.app](https://railway.app)
2. **"New Project"** → **"Deploy from GitHub"**
3. Select repository
4. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `node server.js`
5. Add same environment variables
6. Deploy and copy URL

---

## After Deployment

Your backend will be accessible at:
- Render: `https://your-service.onrender.com`
- Railway: `https://your-service.railway.app`

Update Vercel with this URL in `VITE_API_URL` environment variable.
