import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { NxGovAuthService } from './services/nx-gov-auth.service';
import { WechatAuthService } from './services/wechat-auth.service';
import { AlipayAuthService } from './services/alipay-auth.service';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { ThirdPartyAccount } from './entities/third-party-account.entity';

import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { RefreshJwtStrategy } from '../../common/strategies/refresh-jwt.strategy';
import { Sm4Util } from '../../common/utils/sm4.util';

export const IORedisKey = 'IORedis';

const redisProvider: Provider = {
  provide: IORedisKey,
  useFactory: (configService: ConfigService) => {
    const redisConfig = configService.get('redis');
    return new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
    });
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      UserRole,
      RolePermission,
      ThirdPartyAccount,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AuthController],
  providers: [
    redisProvider,
    AuthService,
    TokenService,
    NxGovAuthService,
    WechatAuthService,
    AlipayAuthService,
    JwtStrategy,
    RefreshJwtStrategy,
    Sm4Util,
  ],
  exports: [
    redisProvider,
    AuthService,
    TokenService,
    TypeOrmModule,
  ],
})
export class AuthModule {}
