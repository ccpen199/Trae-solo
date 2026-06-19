import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommunityModule } from './community/community.module';
import { AccessModule } from './access/access.module';
import { TicketModule } from './ticket/ticket.module';
import { ServiceModule } from './service/service.module';
import { KpiModule } from './kpi/kpi.module';
import { MonitorModule } from './monitor/monitor.module';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CommunityModule,
    AccessModule,
    TicketModule,
    ServiceModule,
    KpiModule,
    MonitorModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
