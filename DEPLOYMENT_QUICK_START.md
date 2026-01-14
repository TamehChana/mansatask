# Quick Start: Deploy to GitHub, Vercel & Render

Quick reference guide for deploying the Payment Link Platform.

## 🚀 Quick Deployment Steps

### 1. GitHub Setup (5 minutes)

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/payment-link-platform.git
git branch -M main
git push -u origin main
```

**Or use the helper script:**
```powershell
.\deploy-to-production.ps1 -Check
.\deploy-to-production.ps1 -Prepare
.\deploy-to-production.ps1 -GitHub
```

---

### 2. Vercel Deployment (Frontend) - 10 minutes

1. **Go to**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Click**: "Add New Project"
4. **Import** your repository
5. **Configure**:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `.next` (default)
6. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
7. **Click**: "Deploy"
8. **Wait** for deployment (2-3 minutes)
9. **Copy** your Vercel URL: `https://your-project.vercel.app`

---

### 3. Render Deployment (Backend) - 15 minutes

#### Step 1: Create Database

1. **Go to**: https://render.com
2. **Click**: "New +" → "PostgreSQL"
3. **Configure**:
   - Name: `payment-link-db`
   - Database: `payment_link_db`
   - Region: Choose closest
4. **Click**: "Create Database"
5. **Copy** the connection string (Internal Database URL)

#### Step 2: Create Redis

1. **Click**: "New +" → "Redis"
2. **Configure**:
   - Name: `payment-link-redis`
   - Region: Same as database
3. **Click**: "Create Redis"
4. **Copy** the connection string (Internal Redis URL)

#### Step 3: Create Web Service

1. **Click**: "New +" → "Web Service"
2. **Connect** your GitHub repository
3. **Configure**:
   - Name: `payment-link-backend`
   - Environment: `Node`
   - Region: Same as database
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

#### Step 4: Environment Variables

Add these in Render dashboard:

**Required:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<from PostgreSQL service>
REDIS_URL=<from Redis service>
JWT_SECRET=<generate: openssl rand -base64 32>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<generate: openssl rand -base64 32>
JWT_REFRESH_EXPIRATION=7d
MANSA_API_BASE_URL=https://api-stage.mansatransfers.com
MANSA_API_KEY=<your-key>
MANSA_API_SECRET=<your-secret>
FRONTEND_URL=<your-vercel-url>
WEBHOOK_SECRET=<generate: openssl rand -base64 32>
```

**Optional:**
```
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET_NAME=<your-bucket>
AWS_S3_REGION=us-east-1
EMAIL_USER=<your-email>
EMAIL_PASS=<your-password>
```

#### Step 5: Deploy

1. **Click**: "Create Web Service"
2. **Wait** for deployment (5-10 minutes)
3. **Copy** your Render URL: `https://your-backend.onrender.com`

#### Step 6: Run Migrations

1. **Go to** your backend service
2. **Click**: "Shell"
3. **Run**:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

---

### 4. Update Environment Variables

**After Vercel deployment:**
- Update `FRONTEND_URL` in Render backend service

**After Render deployment:**
- Update `NEXT_PUBLIC_API_URL` in Vercel frontend service

---

### 5. Verify Deployment

**Frontend:**
```bash
curl https://your-project.vercel.app
```

**Backend:**
```bash
curl https://your-backend.onrender.com/api/health
```

---

## 📋 Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Backend URL

### Backend (Render)
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `REDIS_URL` - Redis connection
- [ ] `JWT_SECRET` - Strong secret (32+ chars)
- [ ] `JWT_REFRESH_SECRET` - Strong secret (32+ chars)
- [ ] `WEBHOOK_SECRET` - Strong secret (32+ chars)
- [ ] `MANSA_API_KEY` - Payment provider key
- [ ] `MANSA_API_SECRET` - Payment provider secret
- [ ] `FRONTEND_URL` - Vercel frontend URL
- [ ] `AWS_ACCESS_KEY_ID` - (Optional) S3 access
- [ ] `AWS_SECRET_ACCESS_KEY` - (Optional) S3 secret
- [ ] `EMAIL_USER` - (Optional) Email for notifications
- [ ] `EMAIL_PASS` - (Optional) Email password

---

## 🔧 Generate Secrets

```bash
# JWT Secret
openssl rand -base64 32

# JWT Refresh Secret
openssl rand -base64 32

# Webhook Secret
openssl rand -base64 32
```

---

## 🐛 Troubleshooting

### Frontend Build Fails
- Check Vercel build logs
- Verify `NEXT_PUBLIC_API_URL` is set
- Check for TypeScript errors

### Backend Build Fails
- Check Render build logs
- Verify all environment variables
- Check for missing dependencies

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is running
- Run migrations via Render Shell

### CORS Errors
- Update `FRONTEND_URL` in backend
- Restart backend service
- Verify URLs match exactly

---

## 📚 Full Documentation

For detailed instructions, see:
- **GITHUB_VERCEL_RENDER_DEPLOYMENT.md** - Complete deployment guide
- **PRODUCTION_DEPLOYMENT_GUIDE.md** - General deployment guide

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Backend health check returns 200
- [ ] Can register new user
- [ ] Can login
- [ ] Can create product
- [ ] Can create payment link
- [ ] Can initiate payment
- [ ] Webhooks are working
- [ ] Emails are sending (if configured)
- [ ] S3 uploads working (if configured)

---

**Ready to deploy?** Follow the steps above! 🚀


