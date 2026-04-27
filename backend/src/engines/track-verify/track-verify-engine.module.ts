import { Module } from '@nestjs/common';
import { TrackVerifyEngineService } from './track-verify-engine.service';

@Module({
  providers: [TrackVerifyEngineService],
  exports: [TrackVerifyEngineService],
})
export class TrackVerifyEngineModule {}
