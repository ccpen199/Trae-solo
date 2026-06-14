import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class YueShengshiLoginDto {
  @ApiProperty({ description: '粤省事授权码' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class FaceLoginDto {
  @ApiProperty({ description: '人脸图片Base64' })
  @IsString()
  @IsNotEmpty()
  faceImage: string;

  @ApiProperty({ description: '身份证号码' })
  @IsString()
  @IsNotEmpty()
  idCardNumber: string;
}

export class SocialCardLoginDto {
  @ApiProperty({ description: '社保卡NFC读取数据' })
  @IsString()
  @IsNotEmpty()
  nfcData: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
