# 📦 Railway Deployment Files

## railway.json (Optional - for custom configuration)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r backend/requirements.txt"
  },
  "deploy": {
    "startCommand": "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Procfile (Alternative for Railway/Heroku)
```
web: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## runtime.txt (Specify Python version)
```
python-3.12.0
```

---

## 📝 Quick Railway Setup

1. **Install Railway CLI (Optional):**
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

2. **Or use Railway Dashboard:**
- Visit https://railway.app
- "New Project" → "Deploy from GitHub repo"
- Select repo → Auto-detects Python
- Add environment variables from DEPLOYMENT_GUIDE.md
- Deploy!

3. **Environment Variables Required:**
```
DATABASE_URL=your_mongodb_url
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
SECRET_KEY=your_jwt_secret
AI_SERVICE_URL=https://kalash-ai.railway.app
FRONTEND_URL=https://prepgen.vercel.app
GOOGLE_REDIRECT_URI=https://your-app.railway.app/auth/google/callback
```

4. **Get Your Railway URL:**
- Settings → Networking → Generate Domain
- Copy: `https://your-app-name.up.railway.app`
- Update in Vercel frontend (script.js)
- Update in Google OAuth console

---

## 🚨 Important Notes

### Port Configuration
Railway automatically provides `$PORT` environment variable. The uvicorn command in `startCommand` uses this.

### Working Directory
All commands start from repo root. Use `cd backend` in commands.

### Build Time
First deployment takes 2-3 minutes. Subsequent deploys are faster.

### Free Tier Limits
- $5/month credit (about 500 hours runtime)
- 1GB RAM
- 1GB disk
- Shared CPU

### Auto-Deploy
Once connected to GitHub, every push to `main` branch triggers automatic redeployment.

---

## 🔍 Troubleshooting

**Issue: Build fails**
- Check Railway logs
- Verify `requirements.txt` is in `backend/` folder
- Ensure Python 3.12 is specified

**Issue: App crashes after deploy**
- Check environment variables are set
- Verify MongoDB connection string is correct
- Check logs for startup errors

**Issue: Health check fails**
- Ensure `/health` endpoint exists and returns 200
- Check port is correctly bound to `$PORT`

**Issue: CORS errors**
- Add your Vercel domain to `allow_origins` in `main.py`
- Redeploy after making changes
