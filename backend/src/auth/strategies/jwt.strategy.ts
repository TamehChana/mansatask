import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('config.jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    // Custom extractor: prefer Authorization header but also support HttpOnly cookies
    const jwtFromRequest = ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req: Request): string | null => {
        // Allow reading access token from cookies for more secure auth setups
        // (cookies will only be present if cookie-based auth is enabled at the edge)
        const anyReq = req as any;
        const tokenFromCookie =
          anyReq?.cookies?.accessToken ||
          anyReq?.signedCookies?.accessToken ||
          null;
        return tokenFromCookie || null;
      },
    ]);

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
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

