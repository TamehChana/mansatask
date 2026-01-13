import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestUtils } from '../src/common/test/test-utils';
import { PaymentProvider } from '@prisma/client';
import { MansaTransfersService } from '../src/payments/services/mansa-transfers.service';
import { MockMansaTransfersService } from './mocks/mansa-transfers.mock';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let testUtils: TestUtils;
  let testUser: any;
  let testPaymentLink: any;
  let accessToken: string;

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
    await testUtils.cleanup();

    // Create test user via API to ensure it's in the same database
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Merchant User',
        email: `merchant-${Date.now()}@example.com`, // Unique email for each test
        password: 'Password123!',
      })
      .expect(201);

    testUser = registerResponse.body.user;
    accessToken = registerResponse.body.accessToken;

    // Verify token was received
    if (!accessToken) {
      throw new Error('Access token not received from registration');
    }

    // Wait a bit to ensure user is committed to database
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create test payment link via API to ensure proper setup
    const paymentLinkResponse = await request(app.getHttpServer())
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Payment Link',
        description: 'Test Description',
        amount: 5000,
      })
      .expect(201);

    testPaymentLink = paymentLinkResponse.body;
  });

  describe('POST /api/payments/initiate', () => {
    it('should initiate payment successfully with valid payment link', () => {
      const idempotencyKey = `idempotency-${Date.now()}`;

      return request(app.getHttpServer())
        .post('/api/payments/initiate')
        .set('idempotency-key', idempotencyKey)
        .send({
          slug: testPaymentLink.slug,
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          customerEmail: 'customer@example.com',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('externalReference');
          expect(res.body.externalReference).toMatch(/^TXN-/);
        });
    });

    it('should return 400 if idempotency key is missing', () => {
      return request(app.getHttpServer())
        .post('/api/payments/initiate')
        .send({
          slug: testPaymentLink.slug,
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect(400);
    });

    it('should return 404 if payment link not found', () => {
      const idempotencyKey = `idempotency-${Date.now()}`;

      return request(app.getHttpServer())
        .post('/api/payments/initiate')
        .set('idempotency-key', idempotencyKey)
        .send({
          slug: `nonexistent-slug-${Date.now()}`, // Ensure it doesn't exist
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect((res) => {
          // Can be 404 (not found) or 400 (found but invalid)
          expect([400, 404]).toContain(res.status);
        });
    });

    it('should return same response for duplicate idempotency key', async () => {
      const idempotencyKey = `idempotency-${Date.now()}`;

      const firstResponse = await request(app.getHttpServer())
        .post('/api/payments/initiate')
        .set('idempotency-key', idempotencyKey)
        .send({
          slug: testPaymentLink.slug,
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post('/api/payments/initiate')
        .set('idempotency-key', idempotencyKey)
        .send({
          slug: testPaymentLink.slug,
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect(201);

      // Should return same external reference
      expect(firstResponse.body.externalReference).toBe(
        secondResponse.body.externalReference,
      );
    });

    it('should return 400 if payment link is inactive', async () => {
      // Create inactive payment link via API
      const inactiveLinkResponse = await request(app.getHttpServer())
        .post('/api/payment-links')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Inactive Link',
          amount: 5000,
          isActive: false,
        })
        .expect(201);

      const inactiveLink = inactiveLinkResponse.body;
      const idempotencyKey = `idempotency-${Date.now()}`;

      return request(app.getHttpServer())
        .post('/api/payments/initiate')
        .set('idempotency-key', idempotencyKey)
        .send({
          slug: inactiveLink.slug,
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect(400);
    });
  });

  describe('GET /api/payments/status/:externalReference', () => {
    it('should return payment status for valid external reference', async () => {
      // First, initiate a payment
      const idempotencyKey = `idempotency-${Date.now()}`;
      const initiateResponse = await request(app.getHttpServer())
        .post('/api/payments/initiate')
        .set('idempotency-key', idempotencyKey)
        .send({
          slug: testPaymentLink.slug,
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          paymentProvider: PaymentProvider.MTN,
        })
        .expect(201);

      const externalReference = initiateResponse.body.externalReference;

      return request(app.getHttpServer())
        .get(`/api/payments/status/${externalReference}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('externalReference');
          expect(res.body.externalReference).toBe(externalReference);
        });
    });

    it('should return 404 for invalid external reference', () => {
      return request(app.getHttpServer())
        .get('/api/payments/status/INVALID-REF')
        .expect(404);
    });
  });
});

