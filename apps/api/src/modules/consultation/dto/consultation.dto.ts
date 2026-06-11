import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationStatus, PaymentStatus } from '@pet/shared';

export class CreateConsultationDto {
  @IsString()
  userId: string;

  @IsString()
  doctorId: string;

  @IsOptional()
  @IsString()
  petId?: string;

  @IsEnum(['text', 'voice', 'video'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsNumber()
  @Min(0)
  fee: number;
}

export class UpdateConsultationDto {
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}

export class ConsultationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(['text', 'voice', 'video'])
  type?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class RateConsultationDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  reviewContent?: string;
}

export class SendMessageDto {
  @IsString()
  consultationId: string;

  @IsString()
  senderId: string;

  @IsEnum(['user', 'doctor'])
  senderRole: string;

  @IsEnum(['text', 'image', 'voice', 'video', 'file'])
  type: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class CreateConsultationRecordDto {
  @IsString()
  consultationId: string;

  @IsString()
  doctorId: string;

  @IsString()
  diagnosis: string;

  @IsOptional()
  @IsString()
  prescription?: string;

  @IsOptional()
  @IsString()
  suggestions?: string;

  @IsOptional()
  @Type(() => Date)
  followUpDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class AcceptConsultationDto {
  @IsString()
  doctorId: string;
}

export class CancelConsultationDto {
  @IsOptional()
  @IsString()
  cancelReason?: string;
}
