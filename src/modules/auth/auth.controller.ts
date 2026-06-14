import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorators/public.decorator';
import {
  YueShengshiLoginDto,
  FaceLoginDto,
  SocialCardLoginDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('yueshengshi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '粤省事登录' })
  async loginWithYueShengshi(@Body() dto: YueShengshiLoginDto) {
    return this.authService.loginWithYueShengshi(dto.code);
  }

  @Public()
  @Post('face')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '人脸识别登录' })
  async loginWithFace(@Body() dto: FaceLoginDto) {
    return this.authService.loginWithFaceRecognition(dto.faceImage, dto.idCardNumber);
  }

  @Public()
  @Post('social-card')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '社保卡NFC登录' })
  async loginWithSocialCard(@Body() dto: SocialCardLoginDto) {
    return this.authService.loginWithSocialCardNFC(dto.nfcData);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
