# E2E Test Setup Guide

## Prerequisites

Before running E2E tests, ensure:

1. **PostgreSQL is running** (via docker-compose or locally)
2. **Redis is running** (optional, but recommended)
3. **Test database exists** and migrations are applied

## Quick Setup

### Option 1: Using Docker Compose (Recommended)

1. **Start PostgreSQL and Redis:**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Create the test database** (if it doesn't exist):
   ```bash
   docker exec -it payment-link-postgres psql -U postgres -c "CREATE DATABASE payment_link_db;"
   ```

3. **Set up test database schema:**
   ```bash
   cd backend
   node scripts/setup-test-db.js
   ```

4. **Run E2E tests:**
   ```bash
   npm run test:e2e
   ```

### Option 2: Manual Setup

1. **Set DATABASE_URL in your environment:**
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/payment_link_db?schema=public"
   ```

2. **Create the database** (if it doesn't exist):
   ```bash
   createdb -h localhost -p 5433 -U postgres payment_link_db
   ```

3. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **Run E2E tests:**
   ```bash
   npm run test:e2e
   ```

## Test Database Configuration

The test setup (`test/setup.ts`) uses the following default database URL:
```
postgresql://postgres:postgres@localhost:5433/payment_link_db?schema=public
```

This matches the docker-compose PostgreSQL configuration:
- Host: `localhost`
- Port: `5433` (mapped from container port 5432)
- User: `postgres`
- Password: `postgres`
- Database: `payment_link_db`

You can override this by setting `TEST_DATABASE_URL` or `DATABASE_URL` environment variables.

## Troubleshooting

### Database doesn't exist error

If you see `Database payment_link_db does not exist`:

1. Make sure PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Create the database:
   ```bash
   docker exec -it payment-link-postgres psql -U postgres -c "CREATE DATABASE payment_link_db;"
   ```

3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### Connection refused errors

If you see connection errors:

1. Check PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Verify the port is correct (5433 for docker-compose, 5432 for local)

3. Check DATABASE_URL matches your setup

### Tests fail with database errors

- Ensure migrations are up to date: `npx prisma migrate deploy`
- Check database connection: `npx prisma studio` (should open without errors)
- Verify test database is separate from development database (recommended)

## Test Structure

- `app.e2e-spec.ts` - Basic app health check
- `auth.e2e-spec.ts` - Authentication flow tests
- `payments.e2e-spec.ts` - Payment initiation and status tests
- `payment-flow.e2e-spec.ts` - Complete end-to-end payment flow

## Notes

- Tests use `TestUtils` for database cleanup between tests
- Each test suite cleans up its data in `beforeEach` or `afterEach`
- Tests require a real database connection (not mocked)
- Email service errors are expected in test mode (using test credentials)



