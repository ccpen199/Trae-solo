import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@pet/shared/enums';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}

export class PaymentCallbackDto {
  @IsString()
  @IsNotEmpty()
  paymentNo: string;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  extra?: string;
}

export class RefundDto {
  @IsString()
  @IsNotEmpty()
  paymentNo: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  refundAmount: number;

  @IsString()
  @IsNotEmpty()
  refundReason: string;
}

export class PaymentQueryDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}
