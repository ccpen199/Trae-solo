import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AgeRange,
  Gender,
  MaritalStatus,
  EducationLevel,
  OccupationType,
  IncomeRange,
  HealthStatus,
  HousingStatus,
  SocialSecurityStatus,
} from '../entities/user-profile.entity';

export class UpdateProfileDto {
  @ApiProperty({ description: '年龄段', required: false, enum: ['0-17', '18-25', '26-35', '36-45', '46-55', '56-65', '66+'] })
  @IsOptional()
  @IsEnum(['0-17', '18-25', '26-35', '36-45', '46-55', '56-65', '66+'], { message: '年龄段参数无效' })
  ageRange?: AgeRange;

  @ApiProperty({ description: '性别', required: false, enum: ['male', 'female', 'other'] })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'], { message: '性别参数无效' })
  gender?: Gender;

  @ApiProperty({ description: '婚姻状况', required: false, enum: ['single', 'married', 'divorced', 'widowed'] })
  @IsOptional()
  @IsEnum(['single', 'married', 'divorced', 'widowed'], { message: '婚姻状况参数无效' })
  maritalStatus?: MaritalStatus;

  @ApiProperty({ description: '是否有子女', required: false })
  @IsOptional()
  @IsBoolean({ message: 'hasChildren必须是布尔值' })
  hasChildren?: boolean;

  @ApiProperty({ description: '学历水平', required: false, enum: ['primary', 'junior_high', 'senior_high', 'college', 'bachelor', 'master', 'phd'] })
  @IsOptional()
  @IsEnum(['primary', 'junior_high', 'senior_high', 'college', 'bachelor', 'master', 'phd'], { message: '学历水平参数无效' })
  educationLevel?: EducationLevel;

  @ApiProperty({ description: '职业类型', required: false, enum: ['government', 'institution', 'enterprise', 'self_employed', 'freelance', 'student', 'retired', 'unemployed', 'other'] })
  @IsOptional()
  @IsEnum(['government', 'institution', 'enterprise', 'self_employed', 'freelance', 'student', 'retired', 'unemployed', 'other'], { message: '职业类型参数无效' })
  occupationType?: OccupationType;

  @ApiProperty({ description: '收入区间', required: false, enum: ['below_3k', '3k-5k', '5k-10k', '10k-20k', '20k-50k', 'above_50k'] })
  @IsOptional()
  @IsEnum(['below_3k', '3k-5k', '5k-10k', '10k-20k', '20k-50k', 'above_50k'], { message: '收入区间参数无效' })
  incomeRange?: IncomeRange;

  @ApiProperty({ description: '所在城市', required: false })
  @IsOptional()
  @IsString({ message: 'city必须是字符串' })
  city?: string;

  @ApiProperty({ description: '所在区县', required: false })
  @IsOptional()
  @IsString({ message: 'district必须是字符串' })
  district?: string;

  @ApiProperty({ description: '所在社区', required: false })
  @IsOptional()
  @IsString({ message: 'community必须是字符串' })
  community?: string;

  @ApiProperty({ description: '居住年限(年)', required: false })
  @IsOptional()
  @IsInt({ message: 'residentYears必须是整数' })
  @Min(0, { message: '居住年限不能小于0' })
  residentYears?: number;

  @ApiProperty({ description: '健康状况', required: false, enum: ['excellent', 'good', 'fair', 'poor', 'chronic'] })
  @IsOptional()
  @IsEnum(['excellent', 'good', 'fair', 'poor', 'chronic'], { message: '健康状况参数无效' })
  healthStatus?: HealthStatus;

  @ApiProperty({ description: '住房状况', required: false, enum: ['own_full', 'own_mortgage', 'rental', 'family', 'public_housing', 'other'] })
  @IsOptional()
  @IsEnum(['own_full', 'own_mortgage', 'rental', 'family', 'public_housing', 'other'], { message: '住房状况参数无效' })
  housingStatus?: HousingStatus;

  @ApiProperty({ description: '是否有车', required: false })
  @IsOptional()
  @IsBoolean({ message: 'carOwner必须是布尔值' })
  carOwner?: boolean;

  @ApiProperty({ description: '社保状态', required: false, enum: ['active', 'paused', 'retired', 'uninsured'] })
  @IsOptional()
  @IsEnum(['active', 'paused', 'retired', 'uninsured'], { message: '社保状态参数无效' })
  socialSecurityStatus?: SocialSecurityStatus;
}

export class ProfileQueryDto {
  @ApiProperty({ description: '用户ID(不传则取当前登录用户)', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'userId格式无效' })
  userId?: string;
}
