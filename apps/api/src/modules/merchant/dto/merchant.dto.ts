import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsEmail } from 'class-validator';
import { MerchantStatus } from '@pet/shared/enums';

export class ApplyMerchantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  businessLicense: string;

  @IsString()
  @IsNotEmpty()
  businessLicenseImage: string;

  @IsString()
  @IsNotEmpty()
  legalPersonName: string;

  @IsString()
  @IsNotEmpty()
  legalPersonIdCard: string;

  @IsString()
  @IsNotEmpty()
  legalPersonIdCardImage: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsString()
  @IsOptional()
  brandName?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class ApproveMerchantDto {
  @IsString()
  @IsNotEmpty()
  merchantId: string;

  @IsEnum(MerchantStatus)
  status: MerchantStatus;

  @IsString()
  @IsOptional()
  rejectReason?: string;
}

export class MerchantQueryDto {
  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}
