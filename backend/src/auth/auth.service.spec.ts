import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockConfigService } from '../common/test/mocks';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should lowercase email before checking and creating', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'Password123!',
        'hashedPassword',
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const mockUser = {
        id: userId,
        email,
        name: 'Test User',
        role: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(userId, email);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('new-access-token');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(userId, email)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email,
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(email);

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      });
    });

    it('should return success message even if user does not exist (security)', async () => {
      const email = 'nonexistent@example.com';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword(email);

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(token, newPassword);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('successfully');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          password: 'newHashedPassword',
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      });
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const token = 'invalid-token';
      const newPassword = 'NewPassword123!';

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const token = 'expired-token';
      const newPassword = 'NewPassword123!';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordResetToken: 'hashed-token',
        passwordResetExpires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      // findFirst will return null because expiration check fails
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});


