# 🚀 Deployment Guide - Render CI/CD Pipeline

## Overview
This guide will help you deploy the Sui Discovery Platform to Render with automatic CI/CD.

---

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Turso Database**: Your existing Turso database (or migrate to Render PostgreSQL)
4. **Stripe Account**: For payment processing (optional for demo)

---

## 🔧 Step 1: Environment Variables Setup

You'll need these environment variables in Render:

### Required Variables:
```bash
# Database (Turso)
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-turso-token

# Authentication
BETTER_AUTH_SECRET=auto-generated-by-render
BETTER_AUTH_URL=https://your-app.onrender.com

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com

# Stripe (Optional for demo)
STRIPE_TEST_KEY=sk_test_...
STRIPE_LIVE_KEY=sk_live_...
```

---

## 🚀 Step 2: Deploy to Render (Two Methods)

### Method A: Using render.yaml (Recommended)

1. **Push code to GitHub** with the `render.yaml` file
2. **Go to Render Dashboard** → "New" → "Blueprint"
3. **Connect your GitHub repository**
4. **Render will auto-detect** `render.yaml` and set up services
5. **Add environment variables** in the Render dashboard
6. **Click "Apply"** to deploy

### Method B: Manual Setup

1. **Go to Render Dashboard** → "New" → "Web Service"
2. **Connect GitHub repository**
3. **Configure:**
   - **Name**: sui-discovery-platform
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Build Command**: `bun install && bun run build`
   - **Start Command**: `bun run start`
   - **Plan**: Starter ($7/month) or Free
4. **Add environment variables** (see Step 1)
5. **Click "Create Web Service"**

---

## 🔄 Step 3: GitHub Actions CI/CD

### Setup Deploy Hook:

1. **In Render Dashboard**:
   - Go to your web service
   - Settings → Deploy Hooks
   - Copy the deploy hook URL

2. **In GitHub Repository**:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: (paste your Render deploy hook URL)
   - Click "Add secret"

### How It Works:
- Push to `main` branch → GitHub Actions runs tests → Triggers Render deployment
- Pull requests → Run tests only (no deployment)

---

## 🗄️ Step 4: Database Migration

Your database is already set up with Turso. On first deployment:

1. **Render will connect** to your Turso database using `DATABASE_URL`
2. **Tables already exist** from local development
3. **Seed data** (optional): Run seeder manually if needed

### If migrating to Render PostgreSQL:

```bash
# Create PostgreSQL database on Render
# Get the DATABASE_URL from Render
# Update .env with new DATABASE_URL
# Run migrations:
bun run db:push
bun run db:seed
```

---

## 📊 Step 5: Verify Deployment

After deployment completes:

1. **Visit your app**: `https://your-app.onrender.com`
2. **Check health**: App should load homepage
3. **Test authentication**: Register and login
4. **Check database**: View services, create entries
5. **Monitor logs**: Render Dashboard → Logs tab

---

## 🔍 Monitoring & Debugging

### View Logs:
- **Render Dashboard** → Your Service → Logs
- Filter by: Build logs, Deploy logs, Runtime logs

### Common Issues:

**Build Fails:**
- Check build command: `bun install && bun run build`
- Verify all dependencies in `package.json`
- Check for TypeScript errors locally first

**Database Connection Fails:**
- Verify `DATABASE_URL` and `DATABASE_AUTH_TOKEN`
- Check Turso dashboard for database status
- Ensure IP whitelist includes Render IPs (Turso allows all by default)

**Auth Not Working:**
- Set `BETTER_AUTH_URL` to your Render URL
- Regenerate `BETTER_AUTH_SECRET` in Render
- Clear browser cache and cookies

**Environment Variables Missing:**
- Go to Render Dashboard → Settings → Environment
- Add missing variables
- Redeploy (manual or trigger deploy hook)

---

## 🔄 Update Workflow

### To Deploy Changes:

1. **Make changes locally**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **GitHub Actions automatically**:
   - Runs tests
   - Triggers Render deployment
   - Deploys new version
4. **Monitor deployment** in Render dashboard

### Rollback:
- Render Dashboard → Your Service → Events
- Click "Rollback" on previous successful deployment

---

## 🌐 Custom Domain (Optional)

1. **Render Dashboard** → Your Service → Settings → Custom Domain
2. **Add your domain**: `sui-discovery.com`
3. **Update DNS records** (Render provides instructions)
4. **Update environment variables**:
   - `BETTER_AUTH_URL=https://sui-discovery.com`
   - `NEXT_PUBLIC_APP_URL=https://sui-discovery.com`

---

## 📈 Scaling

### Upgrade Plans:
- **Free**: 750 hours/month, sleeps after inactivity
- **Starter ($7/month)**: Always-on, faster builds
- **Standard ($25/month)**: More resources, better performance
- **Pro ($85/month)**: High traffic, priority support

### Auto-Scaling:
- Render handles scaling automatically
- Monitor in Dashboard → Metrics

---

## 🎯 Production Checklist

Before going live:

- [ ] Custom domain configured
- [ ] SSL certificate active (auto by Render)
- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] Seed data loaded (if needed)
- [ ] Test all user flows (register, login, browse, purchase)
- [ ] Stripe webhooks configured
- [ ] Error monitoring set up (Sentry, LogRocket, etc.)
- [ ] Backup strategy for database
- [ ] Load testing completed
- [ ] Documentation updated

---

## 🆘 Support Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GitHub Issues**: Your repository issues tab
- **Turso Docs**: https://docs.turso.tech

---

## 🏆 Quick Deploy Commands

```bash
# Push to deploy
git push origin main

# Manual deploy trigger (if deploy hook is set)
curl -X POST $RENDER_DEPLOY_HOOK_URL

# Check deployment status
# Visit: https://dashboard.render.com
```

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ App loads at Render URL
2. ✅ Database connection works
3. ✅ User registration/login works
4. ✅ Service discovery works
5. ✅ Provider dashboard accessible
6. ✅ Admin dashboard accessible
7. ✅ All APIs respond correctly
8. ✅ No console errors
9. ✅ CI/CD pipeline runs on push
10. ✅ Automatic deployments work

---

## 🎉 You're Ready!

Your Sui Discovery Platform is now deployed with:
- ✅ Automatic CI/CD pipeline
- ✅ GitHub Actions integration
- ✅ Render hosting
- ✅ Database connectivity
- ✅ Authentication working
- ✅ All features live

**Good luck with your 4pm presentation! 🚀**
