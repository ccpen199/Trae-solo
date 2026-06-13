import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'iot_platform_jwt_super_secret_key_2024_change_me',
    });
  }

  async validate(payload: any) {
    if (payload.type === 'vendor') {
      return {
        type: 'vendor',
        vendorId: payload.sub,
        vendorName: payload.vendorName,
      };
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('用户不存在或已被删除');

    return {
      type: 'user',
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      homeId: payload.homeId,
    };
  }
}
