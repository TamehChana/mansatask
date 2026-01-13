import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestUtils } from '../src/common/test/test-utils';
import { PaymentProvider, TransactionStatus } from '@prisma/client';
import { MansaTransfersService } from '../src/payments/services/mansa-transfers.service';
import { MockMansaTransfersService } from './mocks/mansa-transfers.mock';

/**
 * Complete Payment Flow E2E Test
 * 
 * This test simulates the complete payment flow:
 * 1. User registers/logs in
 * 2. User creates a product
 * 3. User creates a payment link
 * 4. Customer visits payment link (public)
 * 5. Customer initiates payment
 * 6. Customer checks payment status
 * 7. Merchant views transaction
 */
describe('Complete Payment Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let testUtils: TestUtils;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MansaTransfersService)
      .useClass(MockMansaTransfersService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    
    // Apply global validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    testUtils = new TestUtils();
  });

  afterAll(async () => {
    if (testUtils) {
      await testUtils.cleanup();
      await testUtils.close();
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (testUtils) {
      await testUtils.cleanup();
    }
  });

  it('should complete full payment flow from registration to transaction', async () => {
    // Step 1: Register merchant
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Merchant User',
        email: `merchant-${Date.now()}@example.com`, // Unique email for each test run
        password: 'Password123!',
      })
      .expect(201);

    const merchantAccessToken = registerResponse.body.accessToken;
    const merchantId = registerResponse.body.user.id;

    // Verify token was received
    if (!merchantAccessToken) {
      throw new Error('Access token not received from registration');
    }

    // Step 2: Create a product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${merchantAccessToken}`)
      .send({
        name: 'Test Product',
        description: 'Test Product Description',
        price: 10000,
      })
      .expect(201);

    const productId = productResponse.body.id;

    // Step 3: Create a payment link
    const paymentLinkResponse = await request(app.getHttpServer())
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${merchantAccessToken}`)
      .send({
        productId,
        title: 'Test Payment Link',
        description: 'Test Description',
        amount: 10000,
      })
      .expect(201);

    const paymentLinkSlug = paymentLinkResponse.body.slug;
    expect(paymentLinkSlug).toBeDefined();

    // Step 4: Customer visits payment link (public endpoint)
    const publicLinkResponse = await request(app.getHttpServer())
      .get(`/api/payment-links/public/${paymentLinkSlug}`)
      .expect(200);

    expect(publicLinkResponse.body.title).toBe('Test Payment Link');
    expect(Number(publicLinkResponse.body.amount)).toBe(10000);

    // Step 5: Customer initiates payment
    const idempotencyKey = `idempotency-${Date.now()}`;
    const initiateResponse = await request(app.getHttpServer())
      .post('/api/payments/initiate')
      .set('idempotency-key', idempotencyKey)
      .send({
        slug: paymentLinkSlug,
        customerName: 'John Doe',
        customerPhone: '+237612345678',
        customerEmail: 'customer@example.com',
        paymentProvider: PaymentProvider.MTN,
      })
      .expect(201);

    const externalReference = initiateResponse.body.externalReference;
    expect(externalReference).toMatch(/^TXN-/);

    // Step 6: Customer checks payment status
    const statusResponse = await request(app.getHttpServer())
      .get(`/api/payments/status/${externalReference}`)
      .expect(200);

    expect(statusResponse.body.status).toBeDefined();
    expect(statusResponse.body.externalReference).toBe(externalReference);

    // Step 7: Merchant views their transactions
    const transactionsResponse = await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${merchantAccessToken}`)
      .expect(200);

    expect(transactionsResponse.body.data).toBeInstanceOf(Array);
    const transaction = transactionsResponse.body.data.find(
      (t: any) => t.externalReference === externalReference,
    );
    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(10000);
    expect(transaction.customerName).toBe('John Doe');

    // Step 8: Verify idempotency - same idempotency key should return same response
    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/payments/initiate')
      .set('idempotency-key', idempotencyKey)
      .send({
        slug: paymentLinkSlug,
        customerName: 'John Doe',
        customerPhone: '+237612345678',
        paymentProvider: PaymentProvider.MTN,
      })
      .expect(201);

    // Should return the same external reference
    expect(duplicateResponse.body.externalReference).toBe(externalReference);
  });

  it('should prevent payment on expired payment link', async () => {
    // Register merchant
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Merchant',
        email: `merchant-${Date.now()}@example.com`,
        password: 'Password123!',
      })
      .expect(201);

    const merchantAccessToken = registerResponse.body.accessToken;

    // Verify token was received
    if (!merchantAccessToken) {
      throw new Error('Access token not received from registration');
    }

    // Create expired payment link
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    const paymentLinkResponse = await request(app.getHttpServer())
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${merchantAccessToken}`)
      .send({
        title: 'Expired Link',
        amount: 5000,
        expiresAt: expiredDate.toISOString(),
      })
      .expect(201);

    const paymentLinkSlug = paymentLinkResponse.body.slug;

    // Try to initiate payment on expired link
    const idempotencyKey = `idempotency-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/api/payments/initiate')
      .set('idempotency-key', idempotencyKey)
      .send({
        slug: paymentLinkSlug,
        customerName: 'Test Customer',
        customerPhone: '+237612345678',
        paymentProvider: PaymentProvider.MTN,
      })
      .expect(400);
  });

  it('should prevent payment on inactive payment link', async () => {
    // Register merchant
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Merchant',
        email: `merchant-${Date.now()}@example.com`,
        password: 'Password123!',
      })
      .expect(201);

    const merchantAccessToken = registerResponse.body.accessToken;

    // Verify token was received
    if (!merchantAccessToken) {
      throw new Error('Access token not received from registration');
    }

    // Create inactive payment link
    const paymentLinkResponse = await request(app.getHttpServer())
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${merchantAccessToken}`)
      .send({
        title: 'Inactive Link',
        amount: 5000,
        isActive: false,
      })
      .expect(201);

    const paymentLinkSlug = paymentLinkResponse.body.slug;

    // Try to initiate payment on inactive link
    const idempotencyKey = `idempotency-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/api/payments/initiate')
      .set('idempotency-key', idempotencyKey)
      .send({
        slug: paymentLinkSlug,
        customerName: 'Test Customer',
        customerPhone: '+237612345678',
        paymentProvider: PaymentProvider.MTN,
      })
      .expect(400);
  });
});

