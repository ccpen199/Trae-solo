import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { StoreType } from '../entities/store.entity';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: '门店编码不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '门店名称不能为空' })
  name: string;

  @IsEnum(StoreType)
  @IsOptional()
  type?: StoreType;

  @IsUUID()
  @IsOptional()
  managerId?: string;

  @IsBoolean()
  @IsOptional()
  isFillingStation?: boolean;

  @IsBoolean()
  @IsOptional()
  isBarcodeStore?: boolean;

  @IsBoolean()
  @IsOptional()
  isGasStation?: boolean;

  @IsBoolean()
  @IsOptional()
  isMaintenanceDepartment?: boolean;

  @IsUUID()
  @IsNotEmpty({ message: '所属组织不能为空' })
  organizationId: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
