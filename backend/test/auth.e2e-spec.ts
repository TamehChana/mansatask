import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestUtils } from '../src/common/test/test-utils';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let testUtils: TestUtils;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should return 409 if user already exists', async () => {
      // Create user first
      await testUtils.createTestUser({
        email: 'existing@example.com',
        password: 'Password123!',
      });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'Password123!',
        })
        .expect(409);
    });

    it('should return 400 if email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should return 400 if password is too short', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await testUtils.createTestUser({
        email: 'login@example.com',
        password: 'Password123!',
      });
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200) // Login returns 200
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe('login@example.com');
        });
    });

    it('should return 401 with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });

    it('should return 401 with invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and get refresh token
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200) // Refresh returns 200
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
        });
    });

    it('should return 401 with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });
});

