import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  username: string;
  isSuperAdmin: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'cms_system_jwt_secret_key_2024_very_secure';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isDeleted: false, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });
    
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    
    return user;
  }
}
