import { IsString, IsEnum, IsOptional, IsNotEmpty, IsArray, ValidateNested, IsObject, IsNumber } from 'class-validator';
import { DeviceCategory, DeviceConnectivity, DeviceCapability } from '../enums/device.enum';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  vendorDeviceId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DeviceCategory)
  category: DeviceCategory;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsArray()
  @IsEnum(DeviceConnectivity, { each: true })
  connectivity: DeviceConnectivity[];

  @IsString()
  firmwareVersion: string;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  capabilities?: DeviceCapability[];

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;
}

export class UpdateDeviceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;
}

export class DeviceQueryDto {
  @IsEnum(DeviceCategory)
  @IsOptional()
  category?: DeviceCategory;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  pageSize?: number = 20;

  @IsString()
  @IsOptional()
  keyword?: string;
}

export class DeviceDiscoveryDto {
  @IsArray()
  @IsEnum(DeviceConnectivity, { each: true })
  protocols: DeviceConnectivity[];

  @IsNumber()
  @IsOptional()
  timeoutMs?: number;
}
