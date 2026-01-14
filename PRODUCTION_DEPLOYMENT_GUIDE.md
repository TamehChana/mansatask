# Phase 8: Production Deployment Guide

Complete guide for deploying the Payment Link Platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Production Deployment](#docker-production-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Cloud Deployment Options](#cloud-deployment-options)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Node.js** (version 20+) - for local development/testing
- **Git** - for version control

### Required Accounts & Services
- **PostgreSQL Database** (managed service or self-hosted)
- **Redis** (managed service or self-hosted)
- **AWS S3** (for file storage)
- **Mansa Transfers API** credentials
- **Email Service** (Gmail SMTP or other)
- **Domain Name** (for production URLs)
- **SSL Certificate** (Let's Encrypt or commercial)

### Production Requirements
- Minimum 2GB RAM
- Minimum 2 CPU cores
- 20GB+ disk space
- Network connectivity

---

## Environment Setup

### 1. Create Production Environment File

```powershell
# Copy the example file
Copy-Item .env.production.example .env.production

# Edit with your production values
notepad .env.production
```

### 2. Generate Secure Secrets

```powershell
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate JWT refresh secret
openssl rand -base64 32

# Generate webhook secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24
```

### 3. Configure Environment Variables

Edit `.env.production` and fill in:

#### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Strong secret (32+ characters)
- `JWT_REFRESH_SECRET` - Strong secret (32+ characters)
- `WEBHOOK_SECRET` - Strong secret (32+ characters)
- `MANSA_API_KEY` - Mansa Transfers API key
- `MANSA_API_SECRET` - Mansa Transfers API secret
- `EMAIL_USER` - Email address for sending emails
- `EMAIL_PASS` - Email app-specific password
- `FRONTEND_URL` - Production frontend URL (e.g., https://yourdomain.com)
- `NEXT_PUBLIC_API_URL` - Production API URL (e.g., https://api.yourdomain.com/api)

#### Optional Variables
- `AWS_ACCESS_KEY_ID` - AWS S3 access key (required for S3 storage)
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `AWS_S3_REGION` - S3 region (default: us-east-1)

### 4. Security Checklist

- [ ] All secrets are strong (32+ characters)
- [ ] Different secrets for each environment
- [ ] `.env.production` is in `.gitignore`
- [ ] Database passwords are strong
- [ ] Redis password is set
- [ ] SSL/TLS certificates are configured
- [ ] CORS is configured for production domain only

---

## Docker Production Deployment

### Quick Start

```powershell
# 1. Build production images
.\deploy-production.ps1 -Build

# 2. Start services
.\deploy-production.ps1 -Start

# 3. Check health
.\deploy-production.ps1 -Health
```

### Detailed Steps

#### Step 1: Build Production Images

```powershell
.\deploy-production.ps1 -Build
```

This will:
- Build optimized production Docker images
- Use multi-stage builds for smaller images
- Install only production dependencies
- Create non-root users for security

#### Step 2: Start Services

```powershell
.\deploy-production.ps1 -Start
```

This will:
- Start PostgreSQL database
- Start Redis cache
- Start backend API
- Start frontend application
- Wait for health checks

#### Step 3: Verify Deployment

```powershell
# Check service health
.\deploy-production.ps1 -Health

# View logs
.\deploy-production.ps1 -Logs

# Check status
.\deploy-production.ps1 -Status
```

### Manual Docker Compose Commands

```powershell
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down

# Restart services
docker compose -f docker-compose.prod.yml restart

# View status
docker compose -f docker-compose.prod.yml ps
```

---

## Manual Deployment

### Backend Deployment

#### Option 1: Direct Node.js Deployment

```powershell
cd backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run migrations
npx prisma migrate deploy

# Start production server
npm run start:prod
```

#### Option 2: PM2 Process Manager

```powershell
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name payment-link-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Frontend Deployment

#### Option 1: Next.js Standalone

```powershell
cd frontend

# Build application
npm run build

# Start production server
npm start
```

#### Option 2: Static Export (if applicable)

```powershell
cd frontend

# Build static export
npm run build
npm run export

# Serve static files with nginx or similar
```

---

## Cloud Deployment Options

### Option 1: AWS (EC2 + RDS + ElastiCache)

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: Allow ports 22, 80, 443, 3000, 3001

2. **Setup RDS PostgreSQL**
   - Create RDS PostgreSQL instance
   - Configure security groups
   - Update `DATABASE_URL` in `.env.production`

3. **Setup ElastiCache Redis**
   - Create ElastiCache Redis cluster
   - Configure security groups
   - Update `REDIS_URL` in `.env.production`

4. **Deploy Application**
   ```bash
   # SSH into EC2
   ssh ubuntu@your-ec2-ip

   # Clone repository
   git clone https://github.com/yourusername/payment-link-platform.git
   cd payment-link-platform

   # Setup environment
   cp .env.production.example .env.production
   # Edit .env.production

   # Deploy with Docker
   docker compose -f docker-compose.prod.yml up -d
   ```

5. **Setup Nginx Reverse Proxy**
   ```nginx
   # /etc/nginx/sites-available/payment-link
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 2: DigitalOcean App Platform

1. **Connect Repository**
   - Connect GitHub repository
   - Select branch (main/master)

2. **Configure Backend Service**
   - Runtime: Node.js
   - Build command: `cd backend && npm ci && npm run build`
   - Run command: `cd backend && npm run start:prod`
   - Environment variables: Add all from `.env.production`

3. **Configure Frontend Service**
   - Runtime: Node.js
   - Build command: `cd frontend && npm ci && npm run build`
   - Run command: `cd frontend && npm start`
   - Environment variables: `NEXT_PUBLIC_API_URL`

4. **Add Managed Databases**
   - PostgreSQL database
   - Redis database

5. **Deploy**
   - Click "Deploy" button
   - Monitor deployment logs

### Option 3: Render

1. **Backend Service**
   - New → Web Service
   - Connect repository
   - Build command: `cd backend && npm ci && npm run build`
   - Start command: `cd backend && npm run start:prod`
   - Add environment variables

2. **Frontend Service**
   - New → Web Service
   - Connect repository
   - Build command: `cd frontend && npm ci && npm run build`
   - Start command: `cd frontend && npm start`
   - Add environment variables

3. **PostgreSQL Database**
   - New → PostgreSQL
   - Copy connection string to `DATABASE_URL`

4. **Redis Instance**
   - New → Redis
   - Copy connection string to `REDIS_URL`

### Option 4: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
1. Connect GitHub repository
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Environment variables: `NEXT_PUBLIC_API_URL`

#### Backend on Railway
1. Connect GitHub repository
2. Set root directory: `backend`
3. Build command: `npm ci && npm run build`
4. Start command: `npm run start:prod`
5. Add PostgreSQL and Redis services
6. Add environment variables

---

## Post-Deployment Checklist

### Immediate Checks

- [ ] All services are running
- [ ] Health check endpoint returns `200 OK`
- [ ] Frontend loads correctly
- [ ] API endpoints are accessible
- [ ] Database connection is working
- [ ] Redis connection is working
- [ ] SSL/TLS certificates are valid
- [ ] CORS is configured correctly

### Functional Tests

- [ ] User registration works
- [ ] User login works
- [ ] Product creation works
- [ ] Payment link creation works
- [ ] Payment initiation works
- [ ] Webhook processing works
- [ ] Email sending works
- [ ] File uploads work (S3 or local)

### Security Checks

- [ ] Rate limiting is enabled
- [ ] Security headers are set (Helmet)
- [ ] JWT tokens are working
- [ ] Password hashing is working
- [ ] Webhook signature verification is enabled
- [ ] Environment variables are secure
- [ ] No sensitive data in logs

### Performance Checks

- [ ] Response times are acceptable (<500ms)
- [ ] Database queries are optimized
- [ ] Redis caching is working
- [ ] Static assets are served efficiently
- [ ] Image optimization is working

### Monitoring Setup

- [ ] Health check monitoring is configured
- [ ] Log aggregation is set up
- [ ] Error tracking is configured
- [ ] Performance monitoring is active
- [ ] Alerting is configured

---

## Monitoring & Maintenance

### Health Monitoring

```powershell
# Check health endpoint
curl https://api.yourdomain.com/api/health

# Expected response:
{
  "status": "ok",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "storage": { "status": "healthy" }
  }
}
```

### Log Monitoring

```powershell
# View backend logs
docker compose -f docker-compose.prod.yml logs -f backend

# View frontend logs
docker compose -f docker-compose.prod.yml logs -f frontend

# View all logs
docker compose -f docker-compose.prod.yml logs -f
```

### Database Maintenance

```powershell
# Run migrations
cd backend
npx prisma migrate deploy

# Backup database
docker exec payment-link-postgres-prod pg_dump -U postgres payment_link_db > backup.sql

# Restore database
docker exec -i payment-link-postgres-prod psql -U postgres payment_link_db < backup.sql
```

### Updates & Upgrades

```powershell
# Update services
.\deploy-production.ps1 -Update

# Or manually:
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Services Won't Start

1. **Check Docker is running**
   ```powershell
   docker info
   ```

2. **Check environment file**
   ```powershell
   # Ensure .env.production exists and is valid
   Test-Path .env.production
   ```

3. **Check logs**
   ```powershell
   docker compose -f docker-compose.prod.yml logs
   ```

### Database Connection Issues

1. **Check database is running**
   ```powershell
   docker compose -f docker-compose.prod.yml ps postgres
   ```

2. **Verify connection string**
   ```powershell
   # Check DATABASE_URL in .env.production
   # Format: postgresql://user:password@host:port/database
   ```

3. **Test connection**
   ```powershell
   docker exec payment-link-postgres-prod psql -U postgres -c "SELECT 1"
   ```

### Redis Connection Issues

1. **Check Redis is running**
   ```powershell
   docker compose -f docker-compose.prod.yml ps redis
   ```

2. **Test connection**
   ```powershell
   docker exec payment-link-redis-prod redis-cli ping
   ```

### Frontend Not Loading

1. **Check frontend is running**
   ```powershell
   docker compose -f docker-compose.prod.yml ps frontend
   ```

2. **Check API URL**
   ```powershell
   # Verify NEXT_PUBLIC_API_URL in .env.production
   ```

3. **Check browser console** for errors

### Performance Issues

1. **Check resource usage**
   ```powershell
   docker stats
   ```

2. **Check logs for slow queries**
   ```powershell
   docker compose -f docker-compose.prod.yml logs backend | Select-String "Slow"
   ```

3. **Monitor database**
   ```powershell
   docker exec payment-link-postgres-prod psql -U postgres -c "SELECT * FROM pg_stat_activity"
   ```

---

## Security Best Practices

1. **Use Strong Secrets**
   - Generate secrets with `openssl rand -base64 32`
   - Use different secrets for each environment
   - Rotate secrets regularly

2. **Enable HTTPS**
   - Use Let's Encrypt or commercial SSL
   - Force HTTPS redirects
   - Use HSTS headers

3. **Firewall Configuration**
   - Only expose necessary ports
   - Use security groups/firewall rules
   - Restrict database access

4. **Regular Updates**
   - Keep dependencies updated
   - Apply security patches promptly
   - Monitor for vulnerabilities

5. **Backup Strategy**
   - Regular database backups
   - Test backup restoration
   - Store backups securely

---

## Support & Resources

- **Documentation**: See `README.md` and other guides
- **Health Check**: `/api/health` endpoint
- **Logs**: `backend/logs/` directory
- **Monitoring**: Use health check and logs

---

**Phase 8 Status**: ✅ **COMPLETE**

Production deployment infrastructure is ready!


