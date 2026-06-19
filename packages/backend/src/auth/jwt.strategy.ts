import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        communities: true,
        houses: {
          include: {
            house: {
              include: {
                unit: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return user;
  }
}
