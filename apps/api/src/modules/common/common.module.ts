import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UtilService } from './util.service';
import { PasswordHelper, JwtHelper, RedisCacheHelper } from '../../common/helpers';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UtilService, PasswordHelper, JwtHelper, RedisCacheHelper],
  exports: [UtilService, PasswordHelper, JwtHelper, RedisCacheHelper, JwtModule],
})
export class CommonModule {}
