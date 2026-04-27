import { Module } from '@nestjs/common';
import { MachineriesService } from './machineries.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MachineriesService],
  exports: [MachineriesService],
})
export class MachineriesModule {}
