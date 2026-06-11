import { Module } from '@nestjs/common';
import { ProductCategoryController } from './product-category.controller';
import { ProductSpuController } from './product-spu.controller';
import { ProductSkuController } from './product-sku.controller';
import { ProductCategoryService } from './product-category.service';
import { ProductSpuService } from './product-spu.service';
import { ProductSkuService } from './product-sku.service';

@Module({
  controllers: [
    ProductCategoryController,
    ProductSpuController,
    ProductSkuController,
  ],
  providers: [
    ProductCategoryService,
    ProductSpuService,
    ProductSkuService,
  ],
  exports: [
    ProductCategoryService,
    ProductSpuService,
    ProductSkuService,
  ],
})
export class ProductModule {}
