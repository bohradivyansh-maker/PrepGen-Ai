# 🚀 PrepGen Deployment Guide

## 📋 Deployment Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Vercel         │ ◄────► │  Railway         │ ◄────► │  Kalash's AI    │
│  (Frontend)     │  HTTPS  │  (Backend)       │  HTTPS  │  (ngrok/cloud)  │
│  prepgen.vercel │         │  backend.railway │         │                 │
│  .app           │         │  .app            │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  MongoDB Atlas   │
                            │  (Cloud DB)      │
                            └──────────────────┘
```

---

## 🎯 Deployment Plan

### **Step 1: Prepare GitHub Repository**
1. Create new GitHub repo (public or private)
2. Push code (secrets are already protected by .gitignore)
3. Share repo link with Kalash for AI service integration

### **Step 2: Deploy Backend on Railway**
- One-click deploy from GitHub
- Add environment variables
- Get Railway URL (e.g., `https://prepgen-backend.up.railway.app`)

### **Step 3: Deploy Frontend on Vercel**
- Connect GitHub repo
- Update API URL in script.js
- Get Vercel URL (e.g., `https://prepgen.vercel.app`)

### **Step 4: Configure Kalash's AI Service**
- Kalash deploys his AI service to Railway/Render
- Share his production URL
- Update `AI_SERVICE_URL` in Railway environment variables

---

## 🔧 Part 1: Railway Backend Deployment

### **1.1 - Create Railway Account**
1. Go to https://railway.app
2. Sign up with GitHub
3. Get $5 free credit (no credit card needed initially)

### **1.2 - Deploy from GitHub**
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your `Capstone-copilot` repository
3. Railway auto-detects Python and FastAPI
4. Click **"Deploy"**

### **1.3 - Configure Environment Variables**
In Railway dashboard, go to **Variables** tab and add:

```env
DATABASE_URL=your_mongodb_atlas_connection_string

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET=your_google_client_secret

SECRET_KEY=your_super_secret_jwt_key_change_this_in_production

AI_SERVICE_URL=https://your-ai-service-url.ngrok-free.dev
# ⚠️ WILL UPDATE THIS AFTER KALASH DEPLOYS HIS SERVICE

FRONTEND_URL=https://prepgen.vercel.app
# ⚠️ WILL UPDATE THIS AFTER VERCEL DEPLOYMENT

GOOGLE_REDIRECT_URI=https://your-railway-app.up.railway.app/auth/google/callback
# ⚠️ REPLACE 'your-railway-app' WITH YOUR ACTUAL RAILWAY DOMAIN
```

### **1.4 - Configure Start Command**
Railway should auto-detect, but if needed:
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Working Directory:** `backend`

### **1.5 - Generate Domain**
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy your Railway URL (e.g., `https://capstone-production-abc123.up.railway.app`)
4. Test: `https://your-url.railway.app/health` should return `{"status": "healthy"}`

---

## 🌐 Part 2: Vercel Frontend Deployment

### **2.1 - Create Vercel Account**
1. Go to https://vercel.com
2. Sign up with GitHub (free forever for hobby projects)

### **2.2 - Import Project**
1. Click **"Add New"** → **"Project"**
2. Import your GitHub `Capstone-copilot` repo
3. Configure:
   - **Framework Preset:** Other (static site)
   - **Root Directory:** `.` (leave empty or root)
   - **Build Command:** Leave empty (no build needed)
   - **Output Directory:** `.` (serve root directly)

### **2.3 - Deploy**
1. Click **"Deploy"**
2. Wait 30-60 seconds
3. Get your Vercel URL: `https://prepgen.vercel.app` (or custom domain)

### **2.4 - Update script.js with Railway URL**
Before deploying, update `script.js` line ~50-70:

**Find this:**
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

**Replace with:**
```javascript
const API_BASE_URL = 'https://your-railway-app.up.railway.app';
// Replace with your actual Railway backend URL
```

**Commit and push** - Vercel auto-redeploys on every push!

---

## 🔄 Part 3: Update Google OAuth Redirect URIs

### **3.1 - Go to Google Cloud Console**
1. https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID

### **3.2 - Add Production URLs**
Add these to **Authorized Redirect URIs:**
```
https://your-railway-app.up.railway.app/auth/google/callback
```

Add these to **Authorized JavaScript origins:**
```
https://your-railway-app.up.railway.app
https://prepgen.vercel.app
```

**Save changes**

---

## 🤖 Part 4: Kalash's AI Service Deployment

### **Option A: Kalash Deploys to Railway**
1. Kalash creates Railway project from his AI repo
2. Deploys FastAPI service
3. Gets URL: `https://kalash-ai-service.up.railway.app`
4. **You update** `AI_SERVICE_URL` in Railway environment variables
5. Railway auto-restarts backend

### **Option B: Kalash Uses ngrok (Not Recommended for Production)**
- ngrok URLs expire and change frequently
- Would need to update `AI_SERVICE_URL` every time ngrok restarts
- **Better to deploy to Railway/Render for 24/7 availability**

### **Recommended Setup for Kalash:**
```bash
# Kalash's AI Service on Railway
1. Push AI service code to GitHub
2. Deploy to Railway (same steps as backend)
3. Add environment variables (OpenAI API keys, etc.)
4. Share Railway URL with you
```

---

## 📝 Part 5: Final Configuration Checklist

### **Backend (Railway)**
- ✅ Environment variables added
- ✅ `FRONTEND_URL` points to Vercel
- ✅ `GOOGLE_REDIRECT_URI` points to Railway
- ✅ `AI_SERVICE_URL` points to Kalash's service
- ✅ Health endpoint works: `/health`
- ✅ API docs accessible: `/docs`

### **Frontend (Vercel)**
- ✅ `script.js` has Railway API_BASE_URL
- ✅ Google OAuth redirect works
- ✅ Can upload files
- ✅ Can generate summaries

### **Google OAuth**
- ✅ Railway URL in authorized redirect URIs
- ✅ Vercel URL in authorized origins

### **AI Service (Kalash)**
- ✅ Deployed to Railway/Render
- ✅ Endpoints `/upload`, `/summarize`, `/quiz`, `/ask` working
- ✅ URL shared with you

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| **Vercel** (Frontend) | ✅ Free forever | $20/month (optional) |
| **Railway** (Backend) | ✅ $5 credit/month | $5-10/month after credit |
| **MongoDB Atlas** | ✅ Free 512MB | $9/month (M2 cluster) |
| **Kalash's AI** | ✅ Railway $5 credit | $5-10/month |
| **Total** | **~$0-5/month** | **$15-30/month** |

---

## 🚨 Important Notes

### **1. Upload Directory Persistence**
Railway's filesystem is ephemeral (resets on redeployment).

**Solution Options:**
- **A) Use Railway Volumes** (persistent storage, $0.25/GB/month)
- **B) Use AWS S3** (store files in cloud storage)
- **C) MongoDB GridFS** (store files in database)

**For now:** Files persist during runtime, but will be lost on redeployment. Consider implementing cloud storage for production.

### **2. Rate Limiting**
Your current rate limits (5/min for AI calls) work per-instance. With Railway, you get one instance by default.

### **3. CORS Configuration**
Already handled in `main.py` - allows all origins. For production, update to:
```python
origins = [
    "https://prepgen.vercel.app",
    "https://your-railway-app.up.railway.app",
]
```

---

## 🔄 Deployment Workflow (After Initial Setup)

### **Every Code Change:**
1. **Make changes locally**
2. **Test locally:** `.\start.ps1`
3. **Commit:** `git add . && git commit -m "your changes"`
4. **Push:** `git push origin main`
5. **Auto-deploy:**
   - Vercel redeploys frontend automatically
   - Railway redeploys backend automatically

### **No manual deployment needed after initial setup!**

---

## 🐛 Troubleshooting

### **Issue: "CORS error" on Vercel**
**Fix:** Add Vercel domain to `origins` list in `main.py`

### **Issue: "502 Bad Gateway" on Railway**
**Fix:** Check Railway logs, ensure `uvicorn` starts successfully

### **Issue: "Google OAuth redirect mismatch"**
**Fix:** Update Google Cloud Console with Railway URL

### **Issue: "AI service unavailable"**
**Fix:** Check Kalash's AI service is deployed and `AI_SERVICE_URL` is correct

---

## 📞 Coordination with Kalash

Send Kalash this message:

```
Hey Kalash! 👋

I'm deploying PrepGen to production. Here's what I need:

1. Deploy your AI service to Railway/Render (free tier)
2. Share your production URL with me
3. Make sure these endpoints work:
   - POST /upload
   - POST /summarize
   - POST /quiz
   - POST /ask

My production URLs:
- Frontend: https://prepgen.vercel.app
- Backend: https://[your-railway-url].railway.app

Can you deploy yours and share the URL? Thanks!
```

---

## 🎉 Success Checklist

- ✅ Code pushed to GitHub
- ✅ Backend deployed on Railway
- ✅ Frontend deployed on Vercel
- ✅ Google OAuth working
- ✅ Can upload documents
- ✅ AI summaries working
- ✅ Quizzes generating
- ✅ Chat working
- ✅ Available 24/7 from any device

---

## 🔐 Security Reminder

**Already Protected:**
- ✅ `.env` in `.gitignore` (secrets not pushed)
- ✅ Railway environment variables encrypted
- ✅ JWT tokens secure
- ✅ MongoDB credentials not in code

**Never commit:**
- `.env` files
- API keys
- OAuth secrets
- Database passwords

---

## 📚 Additional Resources

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **FastAPI on Railway:** https://docs.railway.app/guides/fastapi
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas

---

*Last Updated: December 12, 2025*  
*PrepGen Deployment Guide v1.0*
