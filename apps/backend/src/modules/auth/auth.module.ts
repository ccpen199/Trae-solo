import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { VendorAuthStrategy } from './vendor-auth.strategy';
import { VendorAuthGuard, JwtAuthGuard, PermissionGuard } from './guards';
import { UserEntity } from '../../database/entities/user.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, VendorEntity, DeviceShareEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'iot_platform_jwt_super_secret_key_2024_change_me',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, VendorAuthStrategy, JwtAuthGuard, VendorAuthGuard, PermissionGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, VendorAuthGuard, PermissionGuard, JwtModule],
})
export class AuthModule {}
