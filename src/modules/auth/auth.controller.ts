import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  SetMetadata,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService, LoginResult } from './auth.service';
import { TokenService, TokenPair } from './services/token.service';
import { WechatAuthService, WechatQrResult, WechatPollResult } from './services/wechat-auth.service';
import { AlipayAuthService, AlipayQrResult } from './services/alipay-auth.service';
import { NxGovLoginDto } from './dto/nx-gov-login.dto';
import { WechatQrLoginDto } from './dto/wechat-qr-login.dto';
import { AlipayQrLoginDto } from './dto/alipay-qr-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('认证中心')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly wechatAuthService: WechatAuthService,
    private readonly alipayAuthService: AlipayAuthService,
  ) {}

  @Public()
  @Post('nx-gov/login')
  @ApiOperation({ summary: '宁夏政务登录', description: '通过宁夏政务授权码登录系统' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @AuditLog({ module: 'auth', action: 'login', description: '宁夏政务系统登录' })
  async nxGovLogin(
    @Body() dto: NxGovLoginDto,
    @Req() req: Request,
  ): Promise<ApiRespType<LoginResult>> {
    const ip = this.getClientIp(req);
    const result = await this.authService.loginWithNxGov(dto.code, ip);
    return ResponseUtil.success(result, '登录成功');
  }

  @Public()
  @Post('wechat/qrcode')
  @ApiOperation({ summary: '生成微信扫码二维码', description: '生成微信扫码登录的二维码URL' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateWechatQrcode(
    @Body() _dto: WechatQrLoginDto,
  ): Promise<ApiRespType<WechatQrResult>> {
    const result = await this.wechatAuthService.generateQrCode();
    return ResponseUtil.success(result, '二维码生成成功');
  }

  @Public()
  @Get('wechat/poll/:scene')
  @ApiOperation({ summary: '轮询微信扫码状态', description: '轮询检查用户是否已扫码确认' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async pollWechatQrcode(
    @Param('scene') scene: string,
    @Req() req: Request,
  ): Promise<ApiRespType<WechatPollResult & { tokens?: TokenPair }>> {
    const result = await this.wechatAuthService.pollQrStatus(scene);

    if (result.status === 'confirmed' && result.userId) {
      const ip = this.getClientIp(req);
      const tokens = await this.authService.completeWechatLogin(result.userId, ip);
      await this.wechatAuthService.clearSceneData(scene);
      return ResponseUtil.success({ ...result, tokens }, '登录成功');
    }

    return ResponseUtil.success(result, '查询成功');
  }

  @Public()
  @Get('wechat/callback')
  @ApiOperation({ summary: '微信扫码回调', description: '微信扫码授权后的回调接口' })
  @ApiQuery({ name: 'code', description: '授权码', required: false })
  @ApiQuery({ name: 'state', description: '场景值', required: false })
  async wechatCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ): Promise<void> {
    if (!code || !state) {
      this.logger.warn('微信回调缺少必要参数');
      if (res) {
        res.redirect('/auth/login?error=invalid_callback');
        return;
      }
      return;
    }

    try {
      await this.wechatAuthService.handleCallback(code, state);

      if (res) {
        res.redirect('/auth/login?status=success&scene=' + state);
        return;
      }
    } catch (error) {
      this.logger.error(`微信回调处理异常: ${error.message}`);
      if (res) {
        res.redirect('/auth/login?error=callback_failed');
        return;
      }
    }
  }

  @Public()
  @Post('alipay/qrcode')
  @ApiOperation({ summary: '生成支付宝扫码二维码', description: '生成支付宝扫码登录的二维码URL' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateAlipayQrcode(
    @Body() _dto: AlipayQrLoginDto,
  ): Promise<ApiRespType<AlipayQrResult>> {
    const result = await this.alipayAuthService.generateQrCode();
    return ResponseUtil.success(result, '二维码生成成功');
  }

  @Public()
  @Get('alipay/poll/:scene')
  @ApiOperation({ summary: '轮询支付宝扫码状态', description: '轮询检查用户是否已扫码确认' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async pollAlipayQrcode(
    @Param('scene') scene: string,
    @Req() req: Request,
  ): Promise<ApiRespType<any>> {
    const result = await this.alipayAuthService.pollQrStatus(scene);

    if (result.status === 'confirmed' && result.userId) {
      const ip = this.getClientIp(req);
      const tokens = await this.authService.completeAlipayLogin(result.userId, ip);
      await this.alipayAuthService.clearSceneData(scene);
      return ResponseUtil.success({ ...result, tokens }, '登录成功');
    }

    return ResponseUtil.success(result, '查询成功');
  }

  @Public()
  @Get('alipay/callback')
  @ApiOperation({ summary: '支付宝扫码回调', description: '支付宝扫码授权后的回调接口' })
  @ApiQuery({ name: 'auth_code', description: '授权码', required: false })
  @ApiQuery({ name: 'state', description: '场景值', required: false })
  async alipayCallback(
    @Query('auth_code') authCode?: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ): Promise<void> {
    if (!authCode || !state) {
      this.logger.warn('支付宝回调缺少必要参数');
      if (res) {
        res.redirect('/auth/login?error=invalid_callback');
        return;
      }
      return;
    }

    try {
      await this.alipayAuthService.handleCallback(authCode, state);

      if (res) {
        res.redirect('/auth/login?status=success&scene=' + state);
        return;
      }
    } catch (error) {
      this.logger.error(`支付宝回调处理异常: ${error.message}`);
      if (res) {
        res.redirect('/auth/login?error=callback_failed');
        return;
      }
    }
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌', description: '使用刷新令牌获取新的访问令牌' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<ApiRespType<TokenPair>> {
    const tokens = await this.authService.refreshToken(dto.refreshToken);
    return ResponseUtil.success(tokens, '令牌刷新成功');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出', description: '注销当前用户登录状态，令牌加入黑名单' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @AuditLog({ module: 'auth', action: 'logout', description: '用户登出系统' })
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: Request,
  ): Promise<ApiRespType<null>> {
    const user = (req as any).user;
    const accessTokenJti = (req as any).user?.jti;

    await this.authService.logout(user.sub, accessTokenJti, dto.refreshToken);
    return ResponseUtil.success(null, '登出成功');
  }

  @Get('userinfo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息', description: '获取当前登录用户的基本信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'auth', action: 'query', description: '查询当前用户信息', recordRequest: false })
  async getUserInfo(@Req() req: Request): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userInfo = await this.authService.getUserInfo(user.sub);
    const roles = await this.authService.getUserRoles(user.sub);
    return ResponseUtil.success({ ...userInfo, roles }, '获取成功');
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户权限列表', description: '获取当前登录用户的所有权限' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @AuditLog({ module: 'auth', action: 'query', description: '查询用户权限列表', recordRequest: false })
  async getUserPermissions(@Req() req: Request): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const permissions = await this.authService.getUserPermissions(user.sub);
    const permissionCodes = permissions.map((p) => p.code);
    return ResponseUtil.success(
      {
        list: permissions,
        codes: permissionCodes,
        total: permissions.length,
      },
      '获取成功',
    );
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
  }
}
