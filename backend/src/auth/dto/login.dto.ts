import { IsString, IsPhoneNumber, IsOptional } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('CN', { message: '请输入有效的手机号' })
  phone: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsPhoneNumber('CN', { message: '请输入有效的手机号' })
  phone: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  role: 'FARMER' | 'MACHINERY_OPERATOR' | 'PLATFORM_DISPATCHER' | 'MAINTENANCE_WORKER';

  @IsOptional()
  @IsString()
  avatar?: string;
}
