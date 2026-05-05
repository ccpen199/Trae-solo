import bcrypt from 'bcryptjs';
import { config } from '../config';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = config.password;

  if (password.length < minLength) {
    errors.push(`密码长度至少为 ${minLength} 位`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
