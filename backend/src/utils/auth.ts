import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const saltRounds = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: { id: number; username: string; role: string; departmentId?: number }): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId
    },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};
