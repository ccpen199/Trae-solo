import { IsString, IsOptional, IsBoolean } from 'class-validator';

type Role = 'PURCHASER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_LEADER' | 'QUALITY_INSPECTOR' | 'ADMIN';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
