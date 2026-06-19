import { Module } from '@nestjs/common';
import { CommunityController, UserHouseController } from './community.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityController, UserHouseController],
})
export class CommunityModule {}
