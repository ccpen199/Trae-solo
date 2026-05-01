import { IsArray, IsOptional, IsEnum, IsDate, IsUUID, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DistributionChannel } from '../../common/enums';

export class CreateDistributionDto {
  @IsUUID()
  contentId: string;

  @IsArray()
  @IsEnum(DistributionChannel, { each: true })
  channels: DistributionChannel[];

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  scheduledAt?: Date;
}

export class ScheduleDistributionDto {
  @IsUUID()
  contentId: string;

  @IsArray()
  @IsEnum(DistributionChannel, { each: true })
  channels: DistributionChannel[];

  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;
}

export class RetryDistributionDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
