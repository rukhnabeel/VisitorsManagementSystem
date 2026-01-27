# Deploy Backend to Vercel - Quick Guide

## Steps:

### 1. Go to Vercel Dashboard
Visit [vercel.com/dashboard](https://vercel.com/dashboard)

### 2. Create New Project
- Click **"Add New..."** → **"Project"**
- Import `rukhnabeel/VisitorsManagementSystem`

### 3. Configure Project
- **Project Name**: `tripvenza-visitor-backend`
- **Framework Preset**: Other
- **Root Directory**: `backend` ← **IMPORTANT: Click "Edit" and set this**
- **Build Command**: Leave empty
- **Output Directory**: Leave empty
- **Install Command**: `npm install`

### 4. Add Environment Variables
Click **"Environment Variables"** and add:

```
MONGO_URI
mongodb+srv://Vercel-Admin-visitor:JVTlwAsfwA0Ip6ee@visitor.se2ztcz.mongodb.net/?retryWrites=true&w=majority

EMAIL_USER
visitorspprt@gmail.com

EMAIL_PASS
miac diog ltfh pgar

PORT
5000
```

### 5. Deploy
Click **"Deploy"** and wait 2-3 minutes

### 6. Get Backend URL
Copy your backend URL (e.g., `https://tripvenza-visitor-backend.vercel.app`)

### 7. Update Frontend Project
- Go to your **frontend** Vercel project
- Settings → Environment Variables
- Add: `VITE_API_URL` = `https://tripvenza-visitor-backend.vercel.app`
- Redeploy frontend

Done! ✅
