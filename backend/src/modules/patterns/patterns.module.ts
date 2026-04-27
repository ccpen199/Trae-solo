import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pattern } from './entities/pattern.entity';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pattern]),
    EnginesModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class PatternsModule {}
