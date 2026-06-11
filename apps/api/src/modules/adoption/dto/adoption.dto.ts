import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsBoolean, IsArray, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { PetType, PetGender, AdoptionStatus } from '@pet/shared/enums';

export class CreateAdoptionPostDto {
  @IsEnum(PetType)
  petType: PetType;

  @IsString()
  @IsNotEmpty()
  petName: string;

  @IsOptional()
  @Type(() => Number)
  petAge?: number;

  @IsEnum(PetGender)
  @IsOptional()
  petGender?: PetGender;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsBoolean()
  @IsOptional()
  vaccinated?: boolean;

  @IsBoolean()
  @IsOptional()
  neutered?: boolean;

  @IsString()
  @IsNotEmpty()
  healthCondition: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  adoptionType: string;

  @IsOptional()
  @Type(() => Number)
  adoptionFee?: number;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  @IsNotEmpty()
  contactInfo: string;
}

export class ApplyAdoptionDto {
  @IsString()
  @IsNotEmpty()
  adoptionPostId: string;

  @IsString()
  @IsNotEmpty()
  experience: string;

  @IsString()
  @IsNotEmpty()
  livingCondition: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  familyMembers: number;

  @IsBoolean()
  hasOtherPets: boolean;

  @IsString()
  @IsOptional()
  otherPetsInfo?: string;

  @Type(() => Number)
  monthlyBudget: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  contactInfo: string;
}

export class ReviewAdoptionDto {
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  reviewReason?: string;
}

export class AdoptionQueryDto {
  @IsOptional()
  @IsEnum(PetType)
  petType?: PetType;

  @IsOptional()
  @IsEnum(AdoptionStatus)
  status?: AdoptionStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

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
