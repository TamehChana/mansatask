import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Res } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all auth endpoints
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   * Rate limit: 5 requests per minute (production), 20 per minute (development)
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter limit for registration
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account with email and password' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error or user already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);

    // Optionally set HttpOnly cookies for tokens (keeps JSON response unchanged)
    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  /**
   * Login user
   * POST /auth/login
   * Rate limit: 5 requests per minute (production), 20 per minute (development)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter limit for login
  @ApiOperation({ summary: 'Login user', description: 'Authenticate user and receive access and refresh tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * Rate limit: 10 requests per minute
   */
  @Post('refresh')
  @UseGuards(JwtRefreshGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refreshToken(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(user.id, user.email);

    if (result.accessToken) {
      // Only access token is rotated here; refresh token stays the same by design
      this.setAuthCookies(res, result.accessToken);
    }

    return result;
  }

  /**
   * Forgot password - Generate reset token and send email
   * POST /auth/forgot-password
   * Rate limit: 3 requests per minute (prevent abuse)
   */
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Very strict to prevent email spam
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Reset password - Validate token and update password
   * POST /auth/reset-password
   * Rate limit: 5 requests per minute
   */
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  /**
   * Helper to set secure auth cookies in a central place.
   * This is backwards compatible with the existing JSON-based token handling.
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken?: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : ('lax' as 'lax'),
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : ('lax' as 'lax'),
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
  }
}


