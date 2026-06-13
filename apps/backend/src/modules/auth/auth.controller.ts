import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Request, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: { username: string; email?: string; phone?: string; password: string }) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: { username: string; password: string }) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.logout(refreshToken);
  }

  @Post('vendor')
  vendorAuth(@Body() dto: { apiKey: string; apiSecret: string }, @Request() req: any) {
    const clientIp = req.headers['x-forwarded-for'] || req.ip;
    return this.authService.authenticateVendor(dto.apiKey, dto.apiSecret, clientIp);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Patch('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req: any, @Body() dto: { oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.userId, dto.oldPassword, dto.newPassword);
  }
}
