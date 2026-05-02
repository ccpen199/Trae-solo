import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    return this.authService.getCurrentUser(req['user']);
  }

  @Post('change-password')
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req['user'].id, changePasswordDto);
  }
}
