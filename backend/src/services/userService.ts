import { User, IUser } from '@models/User';
import { config } from '@config/index';
import { CryptoService } from '@security/crypto';
import { logger } from '@utils/logger';
import { generateTransactionNo } from '@utils/helpers';
import { generateToken as authGenerateToken } from '@middleware/auth';

export interface LoginParams {
  phone: string;
  verificationCode: string;
}

export interface UserUpdateParams {
  realName?: string;
  avatar?: string;
}

export interface BalanceChangeParams {
  userId: string;
  amount: number;
  type: 'recharge' | 'deduct' | 'refund';
  description?: string;
}

export interface VerificationCodeParams {
  phone: string;
  type: 'login' | 'reset_password' | 'bind_phone';
}

const verificationCodeStore = new Map<string, { code: string; expiresAt: number; type: string }>();

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  public async sendVerificationCode(params: VerificationCodeParams): Promise<boolean> {
    try {
      const { phone, type } = params;

      if (!this.validatePhone(phone)) {
        throw new Error('无效的手机号格式');
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      verificationCodeStore.set(phone, { code, expiresAt, type });

      logger.info(`发送验证码成功: phone=${phone}, type=${type}, code=${code}`);

      return true;
    } catch (error) {
      logger.error('发送验证码失败:', error);
      throw error;
    }
  }

  private verifyCode(phone: string, code: string, type: string): boolean {
    const stored = verificationCodeStore.get(phone);
    
    if (!stored) {
      return false;
    }

    if (stored.code !== code) {
      return false;
    }

    if (stored.type !== type) {
      return false;
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodeStore.delete(phone);
      return false;
    }

    verificationCodeStore.delete(phone);
    return true;
  }

  public async login(params: LoginParams): Promise<{ user: IUser; token: string }> {
    try {
      const { phone, verificationCode } = params;

      if (!this.validatePhone(phone)) {
        throw new Error('无效的手机号格式');
      }

      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('验证码格式不正确');
      }

      if (!this.verifyCode(phone, verificationCode, 'login')) {
        throw new Error('验证码错误或已过期');
      }

      let user = await User.findOne({ phone });

      if (!user) {
        user = new User({
          phone,
          realName: `用户${phone.slice(-4)}`,
          balance: 0,
          isActive: true
        });
        await user.save();
        logger.info(`创建新用户: phone=${phone}`);
      }

      const token = authGenerateToken(user._id.toString(), user.role);

      return { user, token };
    } catch (error) {
      logger.error('用户登录失败:', error);
      throw error;
    }
  }

  public async getUserById(userId: string): Promise<IUser> {
    try {
      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      const user = await User.findById(userId);

      if (!user) {
        throw new Error('用户不存在');
      }

      return user;
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      throw error;
    }
  }

  public async updateUser(userId: string, params: UserUpdateParams): Promise<IUser> {
    try {
      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      const updateData: Partial<IUser> = {};

      if (params.realName !== undefined) {
        if (params.realName.length < 1 || params.realName.length > 20) {
          throw new Error('姓名长度必须在1-20个字符之间');
        }
        updateData.realName = params.realName;
      }

      if (params.avatar !== undefined) {
        updateData.avatar = params.avatar;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      );

      if (!user) {
        throw new Error('用户不存在');
      }

      logger.info(`更新用户信息成功: userId=${userId}`);
      return user;
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      throw error;
    }
  }

  public async getBalance(userId: string): Promise<number> {
    try {
      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      const user = await User.findById(userId);

      if (!user) {
        throw new Error('用户不存在');
      }

      return user.balance || 0;
    } catch (error) {
      logger.error('获取用户余额失败:', error);
      throw error;
    }
  }

  public async changeBalance(params: BalanceChangeParams): Promise<IUser> {
    try {
      const { userId, amount, type, description } = params;

      if (!userId) {
        throw new Error('用户ID不能为空');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('金额必须大于0');
      }

      const user = await User.findById(userId);

      if (!user) {
        throw new Error('用户不存在');
      }

      let newBalance: number;

      switch (type) {
        case 'recharge':
          newBalance = (user.balance || 0) + amount;
          break;
        case 'deduct':
          if ((user.balance || 0) < amount) {
            throw new Error('余额不足');
          }
          newBalance = (user.balance || 0) - amount;
          break;
        case 'refund':
          newBalance = (user.balance || 0) + amount;
          break;
        default:
          throw new Error('无效的余额变更类型');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: { balance: newBalance }
        },
        { new: true }
      );

      logger.info(`余额变更成功: userId=${userId}, type=${type}, amount=${amount}, newBalance=${newBalance}`);
      return updatedUser!;
    } catch (error) {
      logger.error('余额变更失败:', error);
      throw error;
    }
  }

  public async checkBalanceSufficient(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      logger.error('检查余额失败:', error);
      throw error;
    }
  }

  public async freezeBalance(userId: string, amount: number): Promise<void> {
    try {
      if (!userId || amount <= 0) {
        throw new Error('参数错误');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      if ((user.balance || 0) < amount) {
        throw new Error('余额不足');
      }

      await User.findByIdAndUpdate(userId, {
        $inc: { balance: -amount, frozenBalance: amount }
      });

      logger.info(`冻结余额成功: userId=${userId}, amount=${amount}`);
    } catch (error) {
      logger.error('冻结余额失败:', error);
      throw error;
    }
  }

  public async unfreezeBalance(userId: string, amount: number): Promise<void> {
    try {
      if (!userId || amount <= 0) {
        throw new Error('参数错误');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      if ((user.frozenBalance || 0) < amount) {
        throw new Error('冻结余额不足');
      }

      await User.findByIdAndUpdate(userId, {
        $inc: { balance: amount, frozenBalance: -amount }
      });

      logger.info(`解冻余额成功: userId=${userId}, amount=${amount}`);
    } catch (error) {
      logger.error('解冻余额失败:', error);
      throw error;
    }
  }
}

export const userService = UserService.getInstance();
