import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bom } from './entities/bom.entity';
import { BomItem } from './entities/bom-item.entity';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bom, BomItem]),
    EnginesModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class BomsModule {}
