import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { DoctorStatus } from '@pet/shared';
import type { EducationRecord } from '@pet/shared';

export class CreateDoctorDto {
  @IsString()
  userId: string;

  @IsString()
  realName: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  title: string;

  @IsString()
  department: string;

  @IsString()
  hospital: string;

  @IsInt()
  @Min(0)
  yearsOfExperience: number;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsArray()
  education: EducationRecord[];

  @IsArray()
  @IsString({ each: true })
  certificates: string[];

  @IsString()
  licenseNumber: string;

  @IsString()
  licenseImage: string;

  @IsString()
  introduction: string;

  @IsNumber()
  @Min(0)
  consultationFee: number;
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  realName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  hospital?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsArray()
  education?: EducationRecord[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificates?: string[];

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  licenseImage?: string;

  @IsOptional()
  @IsString()
  introduction?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsEnum(DoctorStatus)
  status?: DoctorStatus;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}

export class DoctorQueryDto {
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
  keyword?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  hospital?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsEnum(DoctorStatus)
  status?: DoctorStatus;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minRating?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class AuditDoctorDto {
  @IsEnum(['APPROVED', 'REJECTED', 'SUSPENDED'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  auditorId?: string;
}

export class UpdateOnlineStatusDto {
  @IsBoolean()
  isOnline: boolean;
}
