import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StylesModule } from './modules/styles/styles.module';
import { PatternsModule } from './modules/patterns/patterns.module';
import { BomsModule } from './modules/boms/boms.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { ProductionModule } from './modules/production/production.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EnginesModule } from './modules/engines/engines.module';
import { SeedModule } from './modules/seed/seed.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'garment_erp.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    UsersModule,
    StylesModule,
    PatternsModule,
    BomsModule,
    MaterialsModule,
    PurchasesModule,
    ProductionModule,
    NotificationsModule,
    CommunicationsModule,
    ReportsModule,
    EnginesModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
