# ⚠️ Docker is Not Installed

**Docker is required to run PostgreSQL and Redis for this project.**

---

## 🚀 Solution: Install Docker Desktop

### STEP 1: Download Docker Desktop

1. Go to: **https://www.docker.com/products/docker-desktop**
2. Click **"Download for Windows"**
3. Download the installer (Docker Desktop Installer.exe)

### STEP 2: Install Docker Desktop

1. Run the installer (`Docker Desktop Installer.exe`)
2. Follow the installation wizard:
   - ✅ Enable "Use WSL 2 instead of Hyper-V" (if available)
   - ✅ Accept license agreement
   - ✅ Click "Install"
3. **Restart your computer** when prompted (IMPORTANT!)

### STEP 3: Start Docker Desktop

1. After restart, open **Docker Desktop** from Start Menu
2. Wait for Docker Desktop to start (you'll see a whale icon in system tray)
3. Wait until it says "Docker Desktop is running" (may take 1-2 minutes)

### STEP 4: Verify Installation

Open PowerShell and run:

```powershell
docker --version
```

**You should see:**
```
Docker version 24.0.x, build xxxxx
```

### STEP 5: Now Try Docker Compose

Newer Docker Desktop versions use `docker compose` (without hyphen):

```powershell
cd E:\MANSATASK
docker compose version
```

**You should see:**
```
Docker Compose version v2.x.x
```

### STEP 6: Start PostgreSQL and Redis

```powershell
cd E:\MANSATASK
docker compose up -d postgres redis
```

---

## ✅ After Docker is Installed

Once Docker is running, follow the original database setup steps:

1. ✅ Start PostgreSQL and Redis: `docker compose up -d postgres redis`
2. ✅ Create `.env` file in `backend/` folder
3. ✅ Run migrations: `npx prisma migrate dev --name init`
4. ✅ Verify: `npx prisma studio` or check health endpoint

---

## 🆘 Alternative: Skip Docker (Not Recommended)

If you cannot install Docker right now, you can:

1. Install PostgreSQL locally from: https://www.postgresql.org/download/windows/
2. Install Redis locally from: https://github.com/microsoftarchive/redis/releases
3. Update `DATABASE_URL` in `.env` to point to local PostgreSQL
4. Update `REDIS_URL` in `.env` to point to local Redis

**But Docker is much easier and recommended for development!**

---

## 📋 Summary

**You need to:**
1. ⬇️ Download Docker Desktop
2. 🔄 Install and restart computer
3. ▶️ Start Docker Desktop
4. ✅ Verify: `docker --version`
5. 🚀 Then continue with database setup

**Let me know once Docker Desktop is installed and running!**


