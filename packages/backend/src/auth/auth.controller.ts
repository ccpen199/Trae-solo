import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { IsPhoneNumber, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class LoginDto {
  @IsPhoneNumber('CN')
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class RegisterDto {
  @IsPhoneNumber('CN')
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    if (!user.password) {
      throw new UnauthorizedException('请通过微信登录或设置密码');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const token = this.jwtService.sign({ sub: user.id });
    return { token, user: this.sanitizeUser(user) };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new UnauthorizedException('该手机号已注册');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        password: hashed,
        nickname: dto.nickname || `用户${dto.phone.slice(-4)}`,
        role: dto.role || Role.RESIDENT,
      },
    });
    const token = this.jwtService.sign({ sub: user.id });
    return { token, user: this.sanitizeUser(user) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async profile(@CurrentUser() user: any) {
    return this.sanitizeUser(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout() {
    return { message: '已退出登录' };
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
