import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtRefreshPayload {
  sub: string; // user id
  email: string;
  type: 'refresh';
}

// Custom extractor for refresh token from request body
const extractRefreshTokenFromBody = (req: Request): string | null => {
  return req.body?.refreshToken || null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('config.jwt.refreshSecret');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is required');
    }
    super({
      jwtFromRequest: extractRefreshTokenFromBody,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtRefreshPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    return user;
  }
}

