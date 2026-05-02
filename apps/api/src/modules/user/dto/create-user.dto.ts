import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export type Role = 'PURCHASER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_LEADER' | 'QUALITY_INSPECTOR' | 'ADMIN';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  role!: Role;

  @IsOptional()
  isActive?: boolean;
}
