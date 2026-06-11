import { IsString, IsOptional, IsEnum, IsUrl, IsEmail, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { UserGender } from '@pet/shared/enums';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsEnum(UserGender)
  @IsOptional()
  gender?: UserGender;

  @Type(() => Date)
  @IsOptional()
  birthday?: Date;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateAddressDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  province: string;

  @IsString()
  city: string;

  @IsString()
  district: string;

  @IsString()
  detail: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  detail?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsOptional()
  isDefault?: boolean;
}
