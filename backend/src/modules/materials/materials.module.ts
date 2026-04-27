import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { MaterialInventory } from './entities/material-inventory.entity';
import { MaterialReceipt } from './entities/material-receipt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, MaterialInventory, MaterialReceipt]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class MaterialsModule {}
