import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ECertController } from './e-cert.controller';

import { CertCatalog } from './entities/cert-catalog.entity';
import { CertRecord } from './entities/cert-record.entity';
import { CertField } from './entities/cert-field.entity';
import { CertAccessLog } from './entities/cert-access-log.entity';
import { CertAuthorization } from './entities/cert-authorization.entity';
import { CertVerifyLog } from './entities/cert-verify-log.entity';
import { User } from '../auth/entities/user.entity';

import { CertCatalogService } from './services/cert-catalog.service';
import { CertRepositoryService } from './services/cert-repository.service';
import { CertVerifyService } from './services/cert-verify.service';
import { CertAccessControlService } from './services/cert-access-control.service';
import { DeptGatewayService } from './services/dept-gateway.service';

import { Sm4Util } from '../../common/utils/sm4.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CertCatalog,
      CertRecord,
      CertField,
      CertAccessLog,
      CertAuthorization,
      CertVerifyLog,
      User,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessTokenSecret') || 'ecert-jwt-secret-change-in-production-2024',
        signOptions: {
          expiresIn: '365d',
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ECertController],
  providers: [
    CertCatalogService,
    CertRepositoryService,
    CertVerifyService,
    CertAccessControlService,
    DeptGatewayService,
    Sm4Util,
  ],
  exports: [
    TypeOrmModule,
    CertCatalogService,
    CertRepositoryService,
    CertVerifyService,
    CertAccessControlService,
    DeptGatewayService,
  ],
})
export class ECertModule {}
