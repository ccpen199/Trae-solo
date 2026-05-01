import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Content, Category } from '../contents/entities/content.entity';
import { ContentVersion } from '../contents/entities/content-version.entity';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Content, ContentVersion])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeedersModule {}
