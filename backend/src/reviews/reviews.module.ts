import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditEngineModule } from '../engines/credit/credit-engine.module';

@Module({
  imports: [PrismaModule, CreditEngineModule],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
