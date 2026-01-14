# Phase 10: GitHub, Vercel & Render Deployment Guide

Complete guide for deploying the Payment Link Platform to GitHub, Vercel (frontend), and Render (backend).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
4. [Render Deployment (Backend)](#render-deployment-backend)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- **GitHub Account** - For version control
- **Vercel Account** - For frontend deployment (free tier available)
- **Render Account** - For backend deployment (free tier available)
- **AWS Account** - For S3 storage (if using S3)
- **Mansa Transfers API** - Payment provider credentials

### Required Information
- Domain name (optional, but recommended)
- SSL certificates (handled by Vercel/Render)
- All environment variables ready

---

## GitHub Setup

### Step 1: Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Payment Link Platform"

# Add remote repository
git remote add origin https://github.com/yourusername/payment-link-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Create .gitignore

Ensure `.gitignore` is in place (already created) to exclude:
- `node_modules/`
- `.env` files
- `dist/`, `build/`, `.next/`
- `logs/`
- `uploads/`

### Step 3: Repository Structure

Your repository should have:
```
payment-link-platform/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

### Step 4: Create GitHub Repository

1. Go to GitHub.com
2. Click "New repository"
3. Name: `payment-link-platform`
4. Description: "Production-grade fintech platform for payment links"
5. Visibility: Private (recommended) or Public
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"

### Step 5: Push Code

```bash
# Add remote (if not done)
git remote add origin https://github.com/yourusername/payment-link-platform.git

# Push to GitHub
git push -u origin main
```

---

## Vercel Deployment (Frontend)

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Select the repository: `payment-link-platform`

### Step 2: Configure Project

**Project Settings:**
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (or `cd frontend && npm run build`)
- **Output Directory**: `.next` (default for Next.js)
- **Install Command**: `npm install`

**Environment Variables:**
Add the following:
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NODE_ENV=production
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel will provide a URL: `https://your-project.vercel.app`

### Step 4: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will handle SSL automatically

### Step 5: Update Environment Variables

After deployment, update backend `FRONTEND_URL` to match your Vercel URL:
```
FRONTEND_URL=https://your-project.vercel.app
```

---

## Render Deployment (Backend)

### Step 1: Create PostgreSQL Database

1. Go to [render.com](https://render.com)
2. Sign up/Login
3. Click "New +" → "PostgreSQL"
4. Configure:
   - **Name**: `payment-link-db`
   - **Database**: `payment_link_db`
   - **User**: `payment_link_user`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15
5. Click "Create Database"
6. **Save the connection string** - you'll need it!

### Step 2: Create Redis Instance

1. Click "New +" → "Redis"
2. Configure:
   - **Name**: `payment-link-redis`
   - **Region**: Same as database
   - **Redis Version**: 7
3. Click "Create Redis"
4. **Save the connection string**

### Step 3: Create Web Service (Backend)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select: `payment-link-platform`

**Service Settings:**
- **Name**: `payment-link-backend`
- **Environment**: `Node`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

### Step 4: Configure Environment Variables

Add all required environment variables in Render dashboard:

#### Required Variables
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<from PostgreSQL service>
REDIS_URL=<from Redis service>
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_EXPIRATION=7d
MANSA_API_BASE_URL=https://api-stage.mansatransfers.com
MANSA_API_KEY=<your-mansa-api-key>
MANSA_API_SECRET=<your-mansa-api-secret>
FRONTEND_URL=https://your-project.vercel.app
WEBHOOK_SECRET=<generate with: openssl rand -base64 32>
```

#### Optional Variables
```
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_S3_BUCKET_NAME=<your-bucket-name>
AWS_S3_REGION=us-east-1
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASS=<your-app-password>
EMAIL_FROM=<your-email@gmail.com>
```

### Step 5: Run Database Migrations

After first deployment, run migrations:

**Option 1: Via Render Shell**
1. Go to your backend service
2. Click "Shell"
3. Run:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

**Option 2: Via Local Machine**
```bash
# Set DATABASE_URL to Render database
export DATABASE_URL="<render-database-url>"

# Run migrations
cd backend
npx prisma migrate deploy
```

### Step 6: Deploy

1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the service
3. Wait for deployment to complete
4. Your backend will be available at: `https://your-backend.onrender.com`

### Step 7: Custom Domain (Optional)

1. Go to Settings → Custom Domains
2. Add your domain: `api.yourdomain.com`
3. Follow DNS configuration instructions
4. Render will handle SSL automatically

---

## Database Setup

### Step 1: Run Migrations

After deploying to Render, run Prisma migrations:

```bash
# Via Render Shell
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Step 2: Verify Database Connection

Check backend logs in Render to ensure database connection is successful.

### Step 3: Seed Database (Optional)

If you have seed data:
```bash
# Via Render Shell
cd backend
npx prisma db seed
```

---

## Environment Variables Summary

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NODE_ENV=production
```

### Backend (Render)
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<render-postgres-url>
REDIS_URL=<render-redis-url>
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
WEBHOOK_SECRET=<strong-secret>
MANSA_API_KEY=<your-key>
MANSA_API_SECRET=<your-secret>
FRONTEND_URL=https://your-project.vercel.app
AWS_ACCESS_KEY_ID=<optional>
AWS_SECRET_ACCESS_KEY=<optional>
EMAIL_USER=<optional>
EMAIL_PASS=<optional>
```

---

## Post-Deployment

### Step 1: Verify Deployment

**Frontend (Vercel):**
```bash
curl https://your-project.vercel.app
```

**Backend (Render):**
```bash
curl https://your-backend.onrender.com/api/health
```

### Step 2: Test Endpoints

1. **Health Check**: `GET /api/health`
2. **Register**: `POST /api/auth/register`
3. **Login**: `POST /api/auth/login`
4. **Create Product**: `POST /api/products`
5. **Create Payment Link**: `POST /api/payment-links`

### Step 3: Update CORS

Ensure backend `FRONTEND_URL` matches your Vercel URL:
```
FRONTEND_URL=https://your-project.vercel.app
```

### Step 4: Test Payment Flow

1. Create a payment link
2. Visit the public payment page
3. Initiate a payment
4. Verify webhook processing

---

## Troubleshooting

### Frontend Issues

**Build Fails:**
- Check build logs in Vercel
- Verify `NEXT_PUBLIC_API_URL` is set
- Check for TypeScript errors

**API Connection Issues:**
- Verify `NEXT_PUBLIC_API_URL` points to Render backend
- Check CORS configuration in backend
- Verify backend is running

### Backend Issues

**Deployment Fails:**
- Check build logs in Render
- Verify all environment variables are set
- Check for missing dependencies

**Database Connection Issues:**
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify network connectivity

**Migrations Fail:**
- Run migrations via Render Shell
- Check database permissions
- Verify Prisma schema is correct

### Common Issues

**CORS Errors:**
- Update `FRONTEND_URL` in backend environment variables
- Restart backend service

**Rate Limiting:**
- Check Redis connection
- Verify `REDIS_URL` is correct

**Payment Issues:**
- Verify Mansa Transfers API credentials
- Check webhook URL configuration
- Verify `WEBHOOK_SECRET` is set

---

## Continuous Deployment

### Automatic Deployments

Both Vercel and Render support automatic deployments:

- **Vercel**: Automatically deploys on push to `main` branch
- **Render**: Automatically deploys on push to `main` branch (if enabled)

### Manual Deployments

- **Vercel**: Go to Deployments → Redeploy
- **Render**: Go to Manual Deploy → Deploy latest commit

---

## Cost Estimation

### Free Tier (Suitable for Development/Testing)

**Vercel:**
- Free tier: 100GB bandwidth/month
- Hobby plan: Free

**Render:**
- Free tier: 750 hours/month
- PostgreSQL: Free (with limitations)
- Redis: Free (with limitations)
- Web Service: Free (spins down after 15 min inactivity)

### Paid Plans (Production)

**Vercel Pro:**
- $20/month
- Unlimited bandwidth
- Better performance

**Render:**
- PostgreSQL: $7/month (starter)
- Redis: $7/month (starter)
- Web Service: $7/month (starter)
- Total: ~$21/month

---

## Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] Strong secrets generated (32+ characters)
- [ ] HTTPS enabled (automatic with Vercel/Render)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Database credentials are secure
- [ ] Webhook secret is set

---

## Next Steps

1. **Monitor Deployments**: Check Vercel and Render dashboards
2. **Set Up Alerts**: Configure alerts for deployment failures
3. **Monitor Performance**: Use health check endpoint
4. **Set Up Logging**: Check logs in Vercel and Render
5. **Backup Database**: Set up regular database backups

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **GitHub Docs**: https://docs.github.com
- **Project README**: See `README.md`

---

**Phase 10 Status**: ✅ **READY FOR DEPLOYMENT**

Follow this guide step-by-step to deploy your Payment Link Platform to production!


