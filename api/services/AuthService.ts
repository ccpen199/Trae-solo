import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AdminRepository } from '../repositories/AdminRepository.js';
import type { Admin, LoginResponse } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lottery-platform-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthService {
  private adminRepo: AdminRepository;

  constructor() {
    this.adminRepo = new AdminRepository();
  }

  async login(username: string, password: string): Promise<LoginResponse | null> {
    const admin = this.adminRepo.findByUsername(username);
    if (!admin) return null;

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) return null;

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt
      }
    };
  }

  verifyToken(token: string): Admin | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Admin;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async changePassword(adminId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const admin = this.adminRepo.findById(adminId) as (Admin & { passwordHash?: string }) | null;
    if (!admin) return false;

    const adminWithPass = this.adminRepo.findByUsername(admin.username);
    if (!adminWithPass) return false;

    const isValid = await bcrypt.compare(oldPassword, adminWithPass.passwordHash);
    if (!isValid) return false;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    return this.adminRepo.create({
      username: admin.username,
      role: admin.role,
      passwordHash
    }) > 0;
  }
}
