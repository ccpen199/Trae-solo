import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository.js';
import { LoginRequest, LoginResponse, UserInfo } from '../types/index.js';

const userRepository = new UserRepository();

export class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse | null> {
    const user = userRepository.findByIdCard(request.idCard);
    
    if (!user) {
      return null;
    }

    const u = user as any;
    const passwordHash = u.password_hash || u.passwordHash;
    const userType = u.user_type || u.userType;
    const idCard = u.id_card || u.idCard;
    const roles = u.roles;

    let isValidPassword = false;
    try {
      if (passwordHash && String(passwordHash).startsWith('$2a$')) {
        isValidPassword = bcrypt.compareSync(request.password, passwordHash);
      } else {
        isValidPassword = request.password === passwordHash;
      }
    } catch {
      isValidPassword = false;
    }

    if (!isValidPassword) {
      return null;
    }

    const userInfo: UserInfo = {
      id: user.id,
      userType: userType,
      name: user.name,
      idCard: idCard,
      phone: user.phone || '',
      roles: roles ? String(roles).split(',') : [],
      avatar: user.avatar,
    };

    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    const token = jwt.sign(userInfo, secret, { expiresIn: expiresIn as any });

    return {
      token,
      user: userInfo,
    };
  }

  verifyToken(token: string): UserInfo | null {
    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      return jwt.verify(token, secret) as UserInfo;
    } catch {
      return null;
    }
  }

  hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    return bcrypt.hash(password, saltRounds);
  }
}
