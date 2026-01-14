# Testing Guide

This document describes the testing strategy and how to run tests for the Payment Link Platform.

## Test Structure

### Unit Tests (`*.spec.ts`)
- Located in the same directory as the source files
- Test individual services, controllers, and utilities in isolation
- Mock all external dependencies
- Fast execution

**Example**: `src/auth/auth.service.spec.ts`

### E2E Tests (`*.e2e-spec.ts`)
- Located in the `test/` directory
- Test complete API endpoints and flows
- Use real database (test database)
- Test authentication, authorization, and business logic

**Example**: `test/auth.e2e-spec.ts`, `test/payments.e2e-spec.ts`

## Running Tests

### Run All Tests
```bash
cd backend
npm run test:all
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Specific Test File
```bash
npm test -- auth.service.spec.ts
```

## Test Coverage

### Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### View Coverage Report
After running `npm run test:cov`, open `coverage/index.html` in your browser.

## Test Database Setup

E2E tests use a test database. Make sure you have:

1. **Test Database URL** in `.env`:
   ```env
   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mansatask_test_db?schema=public
   ```

2. **Or use the same database** (tests will clean up after themselves):
   ```env
   TEST_DATABASE_URL=${DATABASE_URL}
   ```

## Test Utilities

### TestUtils (`src/common/test/test-utils.ts`)
Helper class for creating test data:
- `createTestUser()` - Create test users
- `createTestProduct()` - Create test products
- `createTestPaymentLink()` - Create test payment links
- `createTestTransaction()` - Create test transactions
- `cleanup()` - Clean up test data

### Mocks (`src/common/test/mocks.ts`)
Mock factories for external services:
- `createMockMansaTransfersService()` - Mock payment API
- `createMockEmailService()` - Mock email service
- `createMockReceiptsService()` - Mock receipt service
- `createMockIdempotencyService()` - Mock idempotency service

## Critical Test Scenarios

### Authentication Flow
- ✅ User registration
- ✅ User login
- ✅ Token refresh
- ✅ Password reset
- ✅ Invalid credentials handling

### Payment Flow
- ✅ Payment initiation with idempotency
- ✅ Payment link validation (active, expired, max uses)
- ✅ Payment status checking
- ✅ Duplicate payment prevention
- ✅ Phone number normalization

### Authorization
- ✅ User can only access their own data
- ✅ Protected routes require authentication
- ✅ IDOR prevention

## Writing New Tests

### Unit Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/endpoint')
      .expect(200);
  });
});
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Always clean up test data after tests
3. **Mock External Services**: Never call real APIs in tests
4. **Test Edge Cases**: Test error scenarios, boundary conditions
5. **Descriptive Names**: Use clear, descriptive test names
6. **Arrange-Act-Assert**: Follow AAA pattern in tests

## Troubleshooting

### Tests Failing with Database Errors
- Ensure test database exists
- Check `TEST_DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`

### Tests Hanging
- Check for unclosed database connections
- Ensure `afterAll` hooks are properly closing connections

### Coverage Not Meeting Thresholds
- Add more test cases for uncovered code paths
- Focus on critical business logic first

## Continuous Integration

Tests should run automatically in CI/CD pipeline:
- On every pull request
- Before merging to main
- Coverage reports should be generated



