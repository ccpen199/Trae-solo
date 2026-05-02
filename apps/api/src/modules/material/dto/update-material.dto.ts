import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  safetyStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
