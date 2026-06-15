import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NxGovLoginDto {
  @ApiProperty({ description: '宁夏政务授权码', example: 'auth_code_xxx' })
  @IsString({ message: '授权码必须是字符串' })
  @IsNotEmpty({ message: '授权码不能为空' })
  code: string;

  @ApiProperty({ description: '回调状态值，用于防止CSRF攻击', example: 'state_xxx', required: false })
  state?: string;
}
