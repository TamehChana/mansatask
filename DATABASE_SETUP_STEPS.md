# Database Setup - Step-by-Step Guide

## 🎯 Goal
Set up PostgreSQL database and run Prisma migrations to create all tables.

---

## Step 1: Start PostgreSQL and Redis (Docker Compose)

### Option A: Start only PostgreSQL and Redis (Recommended for now)

```bash
# From project root (E:\MANSATASK)
docker-compose up -d postgres redis
```

### Option B: Check if Docker is running

First, make sure Docker Desktop is running on your machine.

Then run:
```bash
cd E:\MANSATASK
docker-compose up -d postgres redis
```

### Verify services are running:
```bash
docker-compose ps
```

You should see:
- `mansatask-postgres` (Status: Up, Healthy)
- `mansatask-redis` (Status: Up, Healthy)

**Wait about 10-15 seconds for PostgreSQL to be fully ready.**

---

## Step 2: Create .env File

### Copy the example file:

```bash
cd backend
copy .env.example .env
```

(Or manually copy `.env.example` to `.env` in the `backend` folder)

### Edit the .env file

Open `backend/.env` and update the `DATABASE_URL` to match Docker Compose:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mansatask_db?schema=public
```

**Important:** Keep the other values as-is for now (they're placeholders - we'll update them as we build).

---

## Step 3: Run Prisma Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
1. Create the migration files
2. Apply migrations to the database
3. Generate Prisma Client

**You should see:**
- Migration created successfully
- Database migrated successfully
- Prisma Client generated

---

## Step 4: Verify Database is Working

### Option A: Check via Prisma Studio (Visual)

```bash
cd backend
npx prisma studio
```

This opens Prisma Studio in your browser at `http://localhost:5555`

You should see all tables:
- users
- products
- payment_links
- transactions
- receipts

### Option B: Check via Backend Health Endpoint

1. Start the backend (if not already running):
   ```bash
   cd backend
   npm run start:dev
   ```

2. Visit: `http://localhost:3000/api/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

### Option C: Check via Docker

```bash
docker-compose exec postgres psql -U postgres -d mansatask_db -c "\dt"
```

This lists all tables in the database.

---

## Step 5: If Everything Works ✅

You're ready to proceed to **Phase 1: Authentication System**!

---

## Troubleshooting

### If Docker Compose fails:
- Make sure Docker Desktop is running
- Check ports 5432 and 6379 are not already in use

### If migration fails:
- Make sure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in .env matches Docker settings
- Try: `npx prisma db push` as alternative (for development only)

### If connection fails:
- Wait a bit longer for PostgreSQL to be fully ready (10-15 seconds)
- Check Docker logs: `docker-compose logs postgres`
- Verify DATABASE_URL is correct

---

## Quick Commands Summary

```bash
# 1. Start PostgreSQL and Redis
cd E:\MANSATASK
docker-compose up -d postgres redis

# 2. Create .env file (copy from .env.example)
cd backend
copy .env.example .env
# Then edit .env and update DATABASE_URL

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Verify (optional)
npx prisma studio  # Opens Prisma Studio
# OR
npm run start:dev  # Start backend and check /api/health
```

---

**Ready to start? Follow these steps and let me know when you're done!**


