import { Module } from '@nestjs/common';
import { WorkTracksService } from './work-tracks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WorkTracksService],
  exports: [WorkTracksService],
})
export class WorkTracksModule {}
