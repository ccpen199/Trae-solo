import { Module } from '@nestjs/common';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { ConsultationGateway } from './consultation.gateway';
import { DoctorModule } from '../doctor/doctor.module';

@Module({
  imports: [DoctorModule],
  controllers: [ConsultationController],
  providers: [ConsultationService, ConsultationGateway],
  exports: [ConsultationService, ConsultationGateway],
})
export class ConsultationModule {}
