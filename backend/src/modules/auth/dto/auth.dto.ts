import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Role } from '../../common/enums';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  email?: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
