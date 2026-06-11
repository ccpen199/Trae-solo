import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordHelper {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateRandom(length = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  validateStrength(password: string): {
    score: number;
    isStrong: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else suggestions.push('密码长度至少8位');

    if (/[a-z]/.test(password)) score++;
    else suggestions.push('包含小写字母');

    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('包含大写字母');

    if (/\d/.test(password)) score++;
    else suggestions.push('包含数字');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else suggestions.push('包含特殊字符');

    return {
      score,
      isStrong: score >= 4,
      suggestions,
    };
  }
}
