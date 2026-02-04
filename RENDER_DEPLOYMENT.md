# 🚀 Render Deployment Guide - Sui Discovery Platform

## 📋 Prerequisites

1. **GitHub Account** with your repository
2. **Render Account** (free tier available at https://render.com)
3. **Turso Database** already configured (check `.env`)

---

## 🎯 Quick Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: ready for production deployment"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure with these settings:

#### Basic Settings:
- **Name**: `sui-discovery-platform` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  bun install && bun run build
  ```
- **Start Command**:
  ```bash
  bun run start
  ```

#### Advanced Settings:
- **Auto-Deploy**: `Yes` (deploys on every push to main)
- **Plan**: `Free` (or upgrade for better performance)

### Step 3: Add Environment Variables

In Render dashboard, go to **Environment** tab and add these variables:

```env
# Database (from your .env file)
TURSO_DATABASE_URL=<your_turso_url>
TURSO_AUTH_TOKEN=<your_turso_token>

# Auth (from your .env file)
BETTER_AUTH_SECRET=<your_secret>
BETTER_AUTH_URL=https://your-app.onrender.com

# Node Environment
NODE_ENV=production
SKIP_ENV_VALIDATION=true

# Optional: If using external services
# Add any other API keys here
```

**⚠️ IMPORTANT**: Update `BETTER_AUTH_URL` with your actual Render URL after first deployment.

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for initial deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://sui-discovery-platform.onrender.com`

---

## 🔄 CI/CD Pipeline Setup (Automated Deployments)

### Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

#### Get Render API Key:
1. Go to Render Dashboard → Account Settings
2. Click **API Keys**
3. Create new key, copy it

#### Get Render Service ID:
1. Go to your deployed service on Render
2. Copy the Service ID from the URL: `https://dashboard.render.com/web/srv-XXXXX`
3. The `srv-XXXXX` part is your Service ID

#### Add to GitHub:
- **Name**: `RENDER_API_KEY`
  - **Value**: Your Render API key

- **Name**: `RENDER_SERVICE_ID`
  - **Value**: Your Render service ID (srv-xxxxx)

### Verify CI/CD Works

Push a change to trigger deployment:

```bash
git add .
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

Check:
1. **GitHub Actions** tab - should show workflow running
2. **Render Dashboard** - should show new deployment starting

---

## 🎨 Post-Deployment Checklist

### 1. Update Auth URL
After first deployment, update in Render:
```env
BETTER_AUTH_URL=https://your-actual-app-url.onrender.com
```

### 2. Test Core Functionality
- ✅ Homepage loads
- ✅ Registration works
- ✅ Login works
- ✅ Services list displays
- ✅ Service details page loads
- ✅ Dashboard accessible after login

### 3. Database Migration
Ensure database is seeded:
```bash
# If needed, run migrations manually
bun run db:push
bun run db:seed
```

### 4. Monitor Performance
- Check Render dashboard for metrics
- Monitor response times
- Watch for errors in logs

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs** in Render dashboard:
- Common issue: Missing environment variables
- Solution: Add all required env vars in Render settings

### Database Connection Errors

```bash
# Verify Turso credentials
echo $TURSO_DATABASE_URL
echo $TURSO_AUTH_TOKEN
```

### Auth Issues

**Error**: "Callback URL mismatch"
- Update `BETTER_AUTH_URL` to match your Render URL
- Restart service after updating

### Free Tier Limitations

Render free tier:
- ⏸️ **Spins down after 15 minutes** of inactivity
- ⏱️ **Cold start**: First request takes ~30 seconds
- 💾 **750 hours/month** free compute time

**Solution for competition**: Upgrade to paid tier ($7/month) for:
- ✅ Always-on service
- ⚡ No cold starts
- 🚀 Better performance

---

## 🏆 Competition-Ready Optimizations

### 1. Performance
```env
# Add to Render environment
NODE_OPTIONS=--max-old-space-size=4096
```

### 2. Caching
Render automatically caches:
- ✅ Static assets
- ✅ Next.js build output
- ✅ Node modules

### 3. Custom Domain (Optional)
1. Go to **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records as instructed

### 4. SSL/HTTPS
- ✅ Automatically enabled by Render
- ✅ Free SSL certificate
- ✅ Auto-renewal

---

## 📊 Monitoring & Analytics

### Render Dashboard Shows:
- 📈 **CPU/Memory usage**
- 🌐 **Request metrics**
- 🚨 **Error logs**
- ⏱️ **Response times**

### Access Logs:
```bash
# In Render dashboard, go to "Logs" tab
# Real-time streaming logs
# Filter by level: INFO, WARN, ERROR
```

---

## 🎯 Competition Demo URL

After deployment, your live demo will be at:
```
https://sui-discovery-platform.onrender.com
```

**Share this URL for judging!**

### Test Accounts for Judges:

Create demo accounts after deployment:

**Developer Account:**
- Email: `demo-dev@example.com`
- Password: `DemoPass123!`
- Role: Developer

**Provider Account:**
- Email: `demo-provider@example.com`
- Password: `DemoPass123!`
- Role: Service Provider

**Admin Account:**
- Email: `demo-admin@example.com`
- Password: `AdminPass123!`
- Role: Admin

---

## 🚀 Final Checklist Before Judging

- [ ] App deployed and accessible
- [ ] Database seeded with demo data
- [ ] All pages load without errors
- [ ] Registration/Login working
- [ ] Service discovery functional
- [ ] Demo accounts created
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Performance optimized
- [ ] Error monitoring active

---

## 🎉 You're Ready to Win!

Your Sui Discovery Platform is now:
- ✅ **Production-ready**
- ✅ **Auto-deploying on every push**
- ✅ **Fully functional end-to-end**
- ✅ **Competition-ready**

**Good luck with your 4pm presentation!** 🏆🚀

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Render Community**: https://community.render.com/

---

**Need help?** Check Render logs first:
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Look for error messages
