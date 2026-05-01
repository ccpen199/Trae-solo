import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, LoginResponseDto } from './dto/auth.dto';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await this.usersService.validatePassword(user, password))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload = {
      username: user.username,
      email: user.email,
      role: user.role,
      sub: user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName || user.username,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.EDITOR,
    });

    const payload = {
      username: user.username,
      email: user.email,
      role: user.role,
      sub: user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName || user.username,
      },
    };
  }
}
