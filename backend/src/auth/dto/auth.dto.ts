import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsString()
  @MinLength(6)
  @Transform(({ value }) => value?.trim())
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(100)
  displayName?: string;
}

export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    displayName: string;
  };
}
