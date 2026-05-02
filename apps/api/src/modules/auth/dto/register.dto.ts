import { IsString, IsNotEmpty } from 'class-validator';

export type Role = 'PURCHASER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_LEADER' | 'QUALITY_INSPECTOR' | 'ADMIN';

export class RegisterDto {
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
}
