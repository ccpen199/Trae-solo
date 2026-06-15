import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({ description: '刷新令牌，用于黑名单注册', example: 'refresh_token_xxx', required: false })
  @IsOptional()
  @IsString({ message: '刷新令牌必须是字符串' })
  refreshToken?: string;
}
