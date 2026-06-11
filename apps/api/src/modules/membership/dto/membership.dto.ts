import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipCardType, PaymentMethod } from '@pet/shared/enums';

export class PurchaseCardDto {
  @IsEnum(MembershipCardType)
  cardType: MembershipCardType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class GrowthPointsQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10;
}

export class MembershipInfoQueryDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
