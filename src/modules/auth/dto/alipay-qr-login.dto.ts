import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AlipayQrLoginDto {
  @ApiProperty({ description: '场景值，用于唯一标识一次扫码登录', example: 'scene_xxx', required: false })
  @IsOptional()
  @IsString({ message: '场景值必须是字符串' })
  scene?: string;

  @ApiProperty({ description: '授权码，用户扫码确认后获得', example: 'auth_code_xxx', required: false })
  @IsOptional()
  @IsString({ message: '授权码必须是字符串' })
  authCode?: string;
}
