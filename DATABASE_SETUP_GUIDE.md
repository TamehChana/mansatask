# Database Setup Guide - Step by Step

## ✅ Step-by-Step Instructions

Follow these steps **IN ORDER** to set up the database:

---

## STEP 1: Start PostgreSQL and Redis (Docker Compose)

### Check if Docker is installed:
Open PowerShell and run:
```powershell
docker --version
```

**If Docker is NOT installed:**
- Download and install Docker Desktop: https://www.docker.com/products/docker-desktop
- Restart your computer after installation
- Open Docker Desktop and wait for it to start

**If Docker IS installed:**
Proceed to the next step.

### Start PostgreSQL and Redis:

1. Open PowerShell or Command Prompt
2. Navigate to project root:
   ```powershell
   cd E:\MANSATASK
   ```

3. Start PostgreSQL and Redis:
   ```powershell
   docker-compose up -d postgres redis
   ```

4. Wait about 10-15 seconds for services to start

5. Verify services are running:
   ```powershell
   docker-compose ps
   ```

   **You should see:**
   - `mansatask-postgres` - Status: Up (healthy)
   - `mansatask-redis` - Status: Up (healthy)

---

## STEP 2: Create .env File

1. Navigate to backend folder:
   ```powershell
   cd backend
   ```

2. Copy `.env.example` to `.env`:

   **In PowerShell:**
   ```powershell
   Copy-Item .env.example .env
   ```

   **OR manually:**
   - Open `backend/.env.example` in a text editor
   - Copy all contents
   - Create a new file called `.env` in the `backend` folder
   - Paste the contents

3. Open `backend/.env` in a text editor

4. **IMPORTANT:** Update the `DATABASE_URL` line to:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mansatask_db?schema=public
   ```

   (This should already be correct, but verify it matches exactly)

5. **For now, leave other values as-is** (we'll update them later)

---

## STEP 3: Run Prisma Migrations

1. Make sure you're in the backend folder:
   ```powershell
   cd E:\MANSATASK\backend
   ```

2. Run the migration:
   ```powershell
   npx prisma migrate dev --name init
   ```

   **This will:**
   - Create migration files
   - Apply migrations to the database
   - Generate Prisma Client

   **You should see:**
   ```
   ✔ Generated Prisma Client
   ✔ Applied migration `20240101000000_init`
   ```

3. If prompted "Create a new migration?" - type `Yes` or just press Enter

---

## STEP 4: Verify Database is Working

### Option A: Using Prisma Studio (Visual - Recommended)

1. In backend folder:
   ```powershell
   cd E:\MANSATASK\backend
   npx prisma studio
   ```

2. This opens Prisma Studio in your browser at `http://localhost:5555`

3. **You should see all tables:**
   - ✅ users
   - ✅ products
   - ✅ payment_links
   - ✅ transactions
   - ✅ receipts

4. Close Prisma Studio when done (Ctrl+C in terminal)

### Option B: Using Backend Health Endpoint

1. Start the backend server:
   ```powershell
   cd E:\MANSATASK\backend
   npm run start:dev
   ```

2. Wait for server to start (you'll see "Application is running on: http://localhost:3000/api")

3. Open your browser and visit: `http://localhost:3000/api/health`

4. **You should see:**
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "database": "connected"
   }
   ```

5. Stop the server (Ctrl+C in terminal)

### Option C: Using Docker Command

```powershell
docker-compose exec postgres psql -U postgres -d mansatask_db -c "\dt"
```

This lists all tables in the database.

---

## ✅ Verification Checklist

- [ ] Docker Desktop is running
- [ ] PostgreSQL container is running (docker-compose ps shows "Up")
- [ ] `.env` file exists in `backend/` folder
- [ ] `DATABASE_URL` in `.env` points to `postgresql://postgres:postgres@localhost:5432/mansatask_db`
- [ ] Migration ran successfully (`npx prisma migrate dev --name init`)
- [ ] Can see all tables in Prisma Studio OR health endpoint shows "database": "connected"

---

## 🚨 Troubleshooting

### Docker not found:
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Restart your computer
- Open Docker Desktop and wait for it to start

### Port 5432 already in use:
- Another PostgreSQL instance might be running
- Stop it or change port in `docker-compose.yml`

### Migration fails - "Can't reach database server":
- Wait 10-15 seconds after starting Docker Compose
- Check Docker logs: `docker-compose logs postgres`
- Verify DATABASE_URL is correct in `.env`

### Migration fails - "Database does not exist":
- The database should auto-create, but if not:
  ```powershell
  docker-compose exec postgres psql -U postgres -c "CREATE DATABASE mansatask_db;"
  ```
  Then run migration again

---

## ✅ When Everything Works

Once you can:
- ✅ See all tables in Prisma Studio OR
- ✅ Health endpoint shows "database": "connected"

**You're ready for Phase 1: Authentication System!** 🎉

---

## Quick Command Summary

```powershell
# 1. Start PostgreSQL and Redis
cd E:\MANSATASK
docker-compose up -d postgres redis

# 2. Create .env file
cd backend
Copy-Item .env.example .env
# Then edit .env and verify DATABASE_URL

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Verify (choose one):
npx prisma studio              # Visual (recommended)
# OR
npm run start:dev              # Then visit http://localhost:3000/api/health
```

---

**Follow these steps and let me know when you're done!**


