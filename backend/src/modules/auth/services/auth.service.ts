import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { virtualAccount: true },
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: registerDto.username },
          { phone: registerDto.phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === registerDto.username) {
        throw new ConflictException('用户名已存在');
      }
      throw new ConflictException('手机号已被注册');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          username: registerDto.username,
          password: hashedPassword,
          realName: registerDto.realName,
          phone: registerDto.phone,
          email: registerDto.email,
          role: registerDto.role,
        },
      });

      await prisma.virtualAccount.create({
        data: {
          userId: newUser.id,
          balance: 0,
          frozenAmount: 0,
          status: 'ACTIVE',
        },
      });

      return newUser;
    });

    const { password, ...result } = user;
    return result;
  }
}
