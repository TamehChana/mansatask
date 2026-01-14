# Database Setup Instructions

## When to Create the Database

**Answer: NOW, before Phase 1 (Authentication)**

The database should be created and migrations run **before** starting Phase 1 because:
1. Authentication features require the User table
2. All features need database access
3. It's best practice to validate the schema early
4. Ensures the foundation is solid before building features

## Steps to Create Database

### Option 1: Using Docker Compose (Recommended for Development)

1. **Start PostgreSQL and Redis:**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Wait for services to be healthy** (check with `docker-compose ps`)

3. **Set up environment variables:**
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL` to match Docker Compose:
     ```
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mansatask_db?schema=public
     ```

4. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client (if needed):**
   ```bash
   npx prisma generate
   ```

6. **Verify database:**
   ```bash
   npx prisma studio  # Opens Prisma Studio to view database
   ```

### Option 2: Using Local PostgreSQL

1. **Install PostgreSQL locally** (if not installed)

2. **Create database:**
   ```bash
   createdb mansatask_db
   ```

3. **Set up environment variables:**
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL`:
     ```
     DATABASE_URL=postgresql://your_user:your_password@localhost:5432/mansatask_db?schema=public
     ```

4. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## After Database Setup

Once the database is created and migrations are run:
- ✅ Database schema is ready
- ✅ Prisma Client is generated
- ✅ All tables exist (users, products, payment_links, transactions, receipts)
- ✅ Ready to build Phase 1: Authentication System

## Verification

To verify everything is working:

1. **Check database connection:**
   ```bash
   cd backend
   npm run start:dev
   # Visit http://localhost:3000/api/health
   # Should show: { status: 'ok', database: 'connected' }
   ```

2. **Check Prisma Studio:**
   ```bash
   npx prisma studio
   # Opens at http://localhost:5555
   # You should see all tables
   ```

## Next Steps After Database Setup

1. ✅ Database created
2. ✅ Migrations applied
3. ✅ Prisma Client generated
4. → **Proceed to Phase 1: Authentication System**


