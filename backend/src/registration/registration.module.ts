import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EngineModule } from '../engines/engine.module';

@Module({
  imports: [PrismaModule, EngineModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
