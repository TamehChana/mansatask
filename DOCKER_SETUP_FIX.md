# Docker Setup - Fix for docker-compose command

## Issue: `docker-compose` command not found

**This is because newer Docker Desktop versions use `docker compose` (without hyphen) instead of `docker-compose`.**

---

## Solution: Use `docker compose` (without hyphen)

### Try This Command Instead:

```powershell
docker compose up -d postgres redis
```

Instead of:
```powershell
docker-compose up -d postgres redis  # ❌ Old syntax (may not work)
```

---

## Step-by-Step (Corrected):

### STEP 1: Check if Docker is Installed

```powershell
docker --version
```

**If Docker is NOT installed:**
- Download Docker Desktop: https://www.docker.com/products/docker-desktop
- Install it
- Restart your computer
- Open Docker Desktop and wait for it to start

**If Docker IS installed but command not found:**
- Make sure Docker Desktop is running
- Try: `docker compose version` (without hyphen)

### STEP 2: Start PostgreSQL and Redis

```powershell
cd E:\MANSATASK
docker compose up -d postgres redis
```

(Note: Use `docker compose` NOT `docker-compose`)

### STEP 3: Verify Services

```powershell
docker compose ps
```

You should see:
- `mansatask-postgres` - Status: Up (healthy)
- `mansatask-redis` - Status: Up (healthy)

---

## Alternative: If Docker is Not Installed

If Docker is not installed, you have two options:

### Option A: Install Docker Desktop (Recommended for Development)
- Download: https://www.docker.com/products/docker-desktop
- Install and restart
- Then follow steps above

### Option B: Use Local PostgreSQL (Advanced)
- Install PostgreSQL locally
- Create database manually
- Update DATABASE_URL in .env
- Then run migrations

---

## Summary of Correct Commands:

```powershell
# Check Docker
docker --version
docker compose version

# Start services
cd E:\MANSATASK
docker compose up -d postgres redis

# Check status
docker compose ps

# Stop services (when needed)
docker compose down
```

---

**Try the `docker compose` command (without hyphen) and let me know if it works!**


