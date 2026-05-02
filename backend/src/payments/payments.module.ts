import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Member } from '../members/entities/member.entity';
import { OrderLog } from '../orders/entities/order-log.entity';
import { PaymentSettlementEngine } from './engines/payment-settlement.engine';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, Member, OrderLog]),
    WebSocketModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentSettlementEngine],
  exports: [PaymentsService, PaymentSettlementEngine],
})
export class PaymentsModule {}
