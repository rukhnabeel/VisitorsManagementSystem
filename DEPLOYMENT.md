# Deployment Instructions

## Vercel Deployment (Frontend)

### Step 1: Deploy to Vercel
1. Push this repository to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the `vercel.json` configuration

### Step 2: Configure Environment Variables
In your Vercel project settings, add the following environment variable:
- **Key**: `VITE_API_URL`
- **Value**: Your backend API URL (e.g., `https://your-backend.onrender.com`)

### Step 3: Deploy
Click "Deploy" and Vercel will build and deploy your frontend.

---

## Backend Deployment (Render/Railway)

### Option 1: Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail App Password
   - `PORT`: 5000

### Option 2: Railway
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `node server.js`
5. Add Environment Variables (same as Render)

---

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for production
5. Get your connection string and add it to backend environment variables

---

## Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate a new app password for "Mail"
5. Use this password in the `EMAIL_PASS` environment variable

---

## Testing the Deployment

1. Once both frontend and backend are deployed, update the `VITE_API_URL` in Vercel to point to your backend URL
2. Redeploy the frontend on Vercel
3. Visit your Vercel URL and test the visitor registration form
4. Check the admin dashboard with credentials:
   - Username: `admin`
   - Password: `tripvenza2026`

---

## Local Development

### Backend
```bash
cd backend
npm install
# Create .env file with your credentials
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will automatically connect to `http://localhost:5000` for local development.
