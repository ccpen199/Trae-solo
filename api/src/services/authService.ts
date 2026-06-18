import type { User, Reviewer, Brand } from '../../../shared/types.js';
import { userRepo, reviewerRepo, brandRepo } from '../repositories/userRepo.js';
import db from '../utils/database.js';

export interface LoginResult {
  user: User;
  token: string;
  reviewer?: Reviewer;
  brand?: Brand;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResult | null> {
    const user = userRepo.findByUsername(username) || userRepo.findByEmail(username);
    if (!user) return null;

    if (user.passwordHash !== password) return null;

    const token = `mock_token_${user.id}_${Date.now()}`;

    let reviewer: Reviewer | undefined;
    let brand: Brand | undefined;

    if (user.role === 'reviewer') {
      reviewer = reviewerRepo.findByUserId(user.id) || undefined;
    }

    const result: LoginResult = { user, token };
    if (reviewer) result.reviewer = reviewer;
    if (brand) result.brand = brand;

    return result;
  },

  async register(username: string, email: string, password: string): Promise<User> {
    return userRepo.create(username, email, password, 'user');
  },

  async applyReviewer(data: {
    userId: number;
    realName: string;
    qualifications: string[];
    professionalFields: string[];
  }): Promise<Reviewer> {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('reviewer', data.userId);
    return reviewerRepo.create(data);
  },

  async applyBrand(data: {
    name: string;
    category: string;
    businessLicense: string;
    contactName: string;
    contactPhone: string;
  }): Promise<Brand> {
    return brandRepo.create(data);
  },

  async getUserById(id: number): Promise<User | null> {
    return userRepo.findById(id);
  },
};
