import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
      );
      expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('forgotPassword', () => {
    it('should successfully send password reset email', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const mockResponse = {
        message: 'Password reset email sent',
      };

      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(mockAuthService.forgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'reset-token',
        password: 'newpassword123',
      };

      const mockResponse = {
        message: 'Password reset successfully',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.password,
      );
      expect(mockAuthService.resetPassword).toHaveBeenCalledTimes(1);
    });
  });
});

