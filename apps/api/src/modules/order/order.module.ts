import { Module, forwardRef } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderItemController } from './order-item.controller';
import { OrderService } from './order.service';
import { OrderItemService } from './order-item.service';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [forwardRef(() => ProductModule)],
  controllers: [
    OrderController,
    OrderItemController,
  ],
  providers: [
    OrderService,
    OrderItemService,
  ],
  exports: [
    OrderService,
    OrderItemService,
  ],
})
export class OrderModule {}
