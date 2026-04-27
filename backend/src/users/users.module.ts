import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditEngineModule } from '../engines/credit/credit-engine.module';

@Module({
  imports: [PrismaModule, CreditEngineModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
