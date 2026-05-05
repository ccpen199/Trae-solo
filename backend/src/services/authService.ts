import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/User';
import { Enterprise, EnterpriseType } from '../entities/Enterprise';
import { AppDataSource } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, JwtPayload } from '../utils/jwt';

interface LoginResult {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    realName?: string;
    phone?: string;
    email?: string;
    enterprise?: {
      id: string;
      enterpriseCode: string;
      enterpriseName: string;
      enterpriseType: EnterpriseType;
    } | null;
  };
}

interface RegisterParams {
  username: string;
  password: string;
  enterpriseCode: string;
  enterpriseName: string;
  enterpriseType: EnterpriseType;
  realName?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private enterpriseRepository: Repository<Enterprise>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.enterpriseRepository = AppDataSource.getRepository(Enterprise);
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['enterprise']
    });

    if (!user) {
      return {
        success: false,
        message: '用户名或密码错误'
      };
    }

    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return {
        success: false,
        message: '用户名或密码错误'
      };
    }

    if (user.role !== 'admin' && user.status !== 'approved') {
      return {
        success: false,
        message: user.status === 'pending'
          ? '您的账户尚未审核，请等待管理员审核'
          : '您的账户已被拒绝，请联系管理员'
      };
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
      role: user.role,
      enterpriseId: user.enterpriseId,
      enterpriseCode: user.enterprise?.enterpriseCode || null,
      enterpriseName: user.enterprise?.enterpriseName || null,
    };

    const token = generateToken(payload);

    return {
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        enterprise: user.enterprise ? {
          id: user.enterprise.id,
          enterpriseCode: user.enterprise.enterpriseCode,
          enterpriseName: user.enterprise.enterpriseName,
          enterpriseType: user.enterprise.enterpriseType,
        } : null
      }
    };
  }

  async register(params: RegisterParams): Promise<{ success: boolean; message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { username: params.username }
    });

    if (existingUser) {
      return {
        success: false,
        message: '用户名已存在'
      };
    }

    const existingEnterprise = await this.enterpriseRepository.findOne({
      where: { enterpriseCode: params.enterpriseCode }
    });

    if (existingEnterprise) {
      return {
        success: false,
        message: '企业编号已存在'
      };
    }

    const enterprise = this.enterpriseRepository.create({
      enterpriseCode: params.enterpriseCode,
      enterpriseName: params.enterpriseName,
      enterpriseType: params.enterpriseType,
      contactPerson: params.contactPerson,
      contactPhone: params.contactPhone,
      address: params.address,
    });

    await this.enterpriseRepository.save(enterprise);

    const hashedPassword = await hashPassword(params.password);

    const user = this.userRepository.create({
      username: params.username,
      password: hashedPassword,
      role: 'enterprise',
      enterpriseId: enterprise.id,
      enterprise: enterprise,
      status: 'pending',
      realName: params.realName,
      phone: params.phone,
      email: params.email,
    });

    await this.userRepository.save(user);

    return {
      success: true,
      message: '注册成功，请等待管理员审核'
    };
  }

  async createAdmin(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await this.userRepository.findOne({
      where: { username: adminUsername, role: 'admin' }
    });

    if (existingAdmin) {
      console.log('管理员账户已存在');
      return;
    }

    const hashedPassword = await hashPassword(adminPassword);

    const admin = this.userRepository.create({
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      realName: '系统管理员',
    });

    await this.userRepository.save(admin);
    console.log('管理员账户创建成功:', adminUsername);
  }

  async updateProfile(userId: string, params: {
    realName?: string;
    phone?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    if (params.realName) user.realName = params.realName;
    if (params.phone) user.phone = params.phone;
    if (params.email) user.email = params.email;

    if (params.newPassword) {
      if (!params.oldPassword) {
        return {
          success: false,
          message: '请提供原密码'
        };
      }

      const passwordValid = await comparePassword(params.oldPassword, user.password);
      if (!passwordValid) {
        return {
          success: false,
          message: '原密码错误'
        };
      }

      user.password = await hashPassword(params.newPassword);
    }

    await this.userRepository.save(user);

    return {
      success: true,
      message: '更新成功'
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['enterprise']
    });
  }
}

export const authService = new AuthService();
