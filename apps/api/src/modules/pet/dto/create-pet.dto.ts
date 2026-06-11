import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsBoolean, IsArray, IsNumber, IsDateString } from 'class-validator';
import { PetType, PetGender } from '@pet/shared/enums';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PetType)
  @IsNotEmpty()
  type: PetType;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(PetGender)
  @IsOptional()
  gender?: PetGender;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdatePetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(PetType)
  @IsOptional()
  type?: PetType;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(PetGender)
  @IsOptional()
  gender?: PetGender;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CreateVaccineRecordDto {
  @IsString()
  @IsNotEmpty()
  vaccineName: string;

  @IsDateString()
  @IsNotEmpty()
  vaccineDate: string;

  @IsDateString()
  @IsOptional()
  nextVaccineDate?: string;

  @IsString()
  @IsOptional()
  hospitalName?: string;

  @IsUrl()
  @IsOptional()
  certificateImage?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateVaccineRecordDto {
  @IsString()
  @IsOptional()
  vaccineName?: string;

  @IsDateString()
  @IsOptional()
  vaccineDate?: string;

  @IsDateString()
  @IsOptional()
  nextVaccineDate?: string;

  @IsString()
  @IsOptional()
  hospitalName?: string;

  @IsUrl()
  @IsOptional()
  certificateImage?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateHealthRecordDto {
  @IsString()
  @IsNotEmpty()
  recordType: 'examination' | 'surgery' | 'medication' | 'other';

  @IsDateString()
  @IsNotEmpty()
  recordDate: string;

  @IsString()
  @IsOptional()
  hospitalName?: string;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  prescription?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateHealthRecordDto {
  @IsString()
  @IsOptional()
  recordType?: 'examination' | 'surgery' | 'medication' | 'other';

  @IsDateString()
  @IsOptional()
  recordDate?: string;

  @IsString()
  @IsOptional()
  hospitalName?: string;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  prescription?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
