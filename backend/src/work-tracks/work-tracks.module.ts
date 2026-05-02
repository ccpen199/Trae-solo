import { Module } from '@nestjs/common';
import { WorkTracksService } from './work-tracks.service';
import { WorkTracksController } from './work-tracks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackVerifyEngineModule } from '../engines/track-verify/track-verify-engine.module';

@Module({
  imports: [PrismaModule, TrackVerifyEngineModule],
  controllers: [WorkTracksController],
  providers: [WorkTracksService],
  exports: [WorkTracksService],
})
export class WorkTracksModule {}
