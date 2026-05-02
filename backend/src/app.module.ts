import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DepartmentModule } from './department/department.module';
import { DoctorModule } from './doctor/doctor.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SlotModule } from './slot/slot.module';
import { AppointmentModule } from './appointment/appointment.module';
import { RegistrationModule } from './registration/registration.module';
import { PaymentModule } from './payment/payment.module';
import { QueueModule } from './queue/queue.module';
import { CheckInModule } from './check-in/check-in.module';
import { ConsultationModule } from './consultation/consultation.module';
import { RefundModule } from './refund/refund.module';
import { AuditModule } from './audit/audit.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationModule } from './notification/notification.module';
import { WorkflowModule } from './workflow/workflow.module';
import { EngineModule } from './engines/engine.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    DepartmentModule,
    DoctorModule,
    ScheduleModule,
    SlotModule,
    AppointmentModule,
    RegistrationModule,
    PaymentModule,
    QueueModule,
    CheckInModule,
    ConsultationModule,
    RefundModule,
    AuditModule,
    StatisticsModule,
    NotificationModule,
    WorkflowModule,
    EngineModule,
    WebSocketModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
