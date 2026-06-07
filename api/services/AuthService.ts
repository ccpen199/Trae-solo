import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { signToken } from '../middleware/auth.js';
import type { User, LoginRequest, RegisterRequest, TokenResponse } from '../types/index.js';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  public comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  public async login(loginData: LoginRequest): Promise<TokenResponse | null> {
    const user = this.userRepository.findByUsername(loginData.username);
    
    if (!user) {
      return null;
    }

    if (user.status !== 'active') {
      return null;
    }

    if (!this.comparePassword(loginData.password, user.password)) {
      return null;
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: userWithoutPassword as Omit<User, 'password'>,
    };
  }

  public async register(registerData: RegisterRequest): Promise<TokenResponse | null> {
    const existingUser = this.userRepository.findByUsername(registerData.username);
    if (existingUser) {
      return null;
    }

    const hashedPassword = this.hashPassword(registerData.password);

    const userId = this.userRepository.create({
      username: registerData.username,
      password: hashedPassword,
      role: registerData.role as User['role'],
      name: registerData.name,
      phone: registerData.phone,
      status: 'active',
    });

    const user = this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: userWithoutPassword as Omit<User, 'password'>,
    };
  }

  public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    if (!this.comparePassword(oldPassword, user.password)) {
      return false;
    }

    const hashedNewPassword = this.hashPassword(newPassword);
    return this.userRepository.update(userId, { password: hashedNewPassword });
  }

  public async resetPassword(username: string, newPassword: string): Promise<boolean> {
    const user = this.userRepository.findByUsername(username);
    if (!user) {
      return false;
    }

    const hashedNewPassword = this.hashPassword(newPassword);
    return this.userRepository.update(user.id, { password: hashedNewPassword });
  }

  public getCurrentUser(userId: number): Omit<User, 'password'> | null {
    const user = this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}

export default AuthService;
