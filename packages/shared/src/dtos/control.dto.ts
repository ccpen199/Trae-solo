import { IsString, IsObject, IsNumber, IsOptional, IsEnum, IsArray, IsNotEmpty, ValidateNested, IsBoolean } from 'class-validator';
import { SharePermission } from '../enums/device.enum';

export class ControlDeviceDto {
  @IsString()
  @IsNotEmpty()
  command: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  timeoutMs?: number;
}

export class BatchControlDto {
  @IsArray()
  @ValidateNested({ each: true })
  commands: {
    deviceId: string;
    command: string;
    params?: Record<string, any>;
    delayMs?: number;
  }[];
}

export class ScheduleControlDto {
  @IsString()
  deviceId: string;

  @IsObject()
  commands: Record<string, any>;

  @IsString()
  triggerType: 'once' | 'daily' | 'weekly' | 'cron';

  @IsOptional()
  triggerAt?: Date;

  @IsString()
  @IsOptional()
  cronExpression?: string;

  @IsArray()
  @IsOptional()
  weekdays?: number[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ShareDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  shareeIdOrEmail: string;

  @IsEnum(SharePermission)
  permission: SharePermission;

  @IsOptional()
  expiredAt?: Date;
}

export class UpdateSharePermissionDto {
  @IsEnum(SharePermission)
  permission: SharePermission;

  @IsOptional()
  expiredAt?: Date;
}
