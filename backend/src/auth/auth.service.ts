import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`[AuthService] Login failed: User not found for email: ${email.toLowerCase()}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[AuthService] Login failed: Invalid password for email: ${email.toLowerCase()}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log(`[AuthService] Login successful for user: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: string, email: string) {
    // Verify user still exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      accessToken,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string, email: string) {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId, email);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate access token (short-lived)
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const secret = this.configService.get<string>('config.jwt.secret');
    const expiration = this.configService.get<string>(
      'config.jwt.expiration',
    ) || '15m';

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiration as any,
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  private generateRefreshToken(userId: string, email: string): string {
    const payload: JwtRefreshPayload = {
      sub: userId,
      email: email,
      type: 'refresh',
    };

    const secret = this.configService.get<string>(
      'config.jwt.refreshSecret',
    );
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is required');
    }
    const expiration = this.configService.get<string>(
      'config.jwt.refreshExpiration',
    ) || '7d';

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiration as any,
    });
  }

  /**
   * Forgot password - Generate reset token and send email
   * TODO: Implement email sending in Phase 8 (Email Notifications)
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      // Return success even if user doesn't exist (prevent email enumeration)
      return {
        message:
          'If a user with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration (1 hour)
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    // Save reset token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Generate reset link
    const frontendUrl = this.configService.get<string>('config.frontendUrl') || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail({
        email: user.email,
        resetLink,
      });
    } catch (emailError) {
      // Log error but don't fail the request (security: don't reveal if email failed)
      // Error is logged by EmailService, we just continue
      // In development, still return the token for testing if email fails
      if (process.env.NODE_ENV === 'development') {
        return {
          message:
            'If a user with that email exists, a password reset link has been sent.',
          resetToken: resetToken, // Only in development if email fails
        };
      }
    }

    return {
      message:
        'If a user with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password - Validate token and update password
   */
  async resetPassword(token: string, newPassword: string) {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordResetAt: new Date(),
      },
    });

    return {
      message: 'Password has been reset successfully',
    };
  }
}

