import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';
import { jwtService, TokenPair } from '../services/jwt.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.js';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    const user = await userRepository.findOne({
      where: [{ username }, { phone: username }],
      select: ['id', 'username', 'password', 'phone', 'realName', 'roleCode', 'isActive', 'isLocked', 'retailStoreId', 'farmerId', 'expertId'],
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: '账户已被禁用',
      });
      return;
    }

    if (user.isLocked) {
      res.status(403).json({
        success: false,
        message: '账户已被锁定',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || null;
    await userRepository.save(user);

    const tokenPair: TokenPair = jwtService.generateTokenPair({
      userId: user.id,
      username: user.username,
      roleCode: user.roleCode,
      retailStoreId: user.retailStoreId || undefined,
      farmerId: user.farmerId || undefined,
      expertId: user.expertId || undefined,
    });

    res.json({
      success: true,
      data: {
        tokenPair,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          realName: user.realName,
          roleCode: user.roleCode,
          retailStoreId: user.retailStoreId,
          farmerId: user.farmerId,
          expertId: user.expertId,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
    });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, phone, realName, roleCode } = req.body;

    if (!username || !password || !phone || !realName) {
      res.status(400).json({
        success: false,
        message: '必填字段不能为空',
      });
      return;
    }

    const existingUser = await userRepository.findOne({
      where: [{ username }, { phone }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '用户名或手机号已存在',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const validRoleCode = roleCode || UserRole.FARMER;

    const user = userRepository.create({
      username,
      password: hashedPassword,
      phone,
      realName,
      roleCode: validRoleCode,
      isActive: true,
      isLocked: false,
    });

    await userRepository.save(user);

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
    });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: '刷新令牌不能为空',
      });
      return;
    }

    const decoded = jwtService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: '刷新令牌无效或已过期',
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive || user.isLocked) {
      res.status(401).json({
        success: false,
        message: '账户不存在或已被禁用',
      });
      return;
    }

    const tokenPair = jwtService.generateTokenPair({
      userId: user.id,
      username: user.username,
      roleCode: user.roleCode,
      retailStoreId: user.retailStoreId || undefined,
      farmerId: user.farmerId || undefined,
      expertId: user.expertId || undefined,
    });

    res.json({
      success: true,
      data: { tokenPair },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败',
    });
  }
});

router.get('/me', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        realName: user.realName,
        roleCode: user.roleCode,
        retailStoreId: user.retailStoreId,
        farmerId: user.farmerId,
        expertId: user.expertId,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    });
  }
});

router.put('/password', authMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未登录',
      });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      select: ['id', 'password'],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      res.status(400).json({
        success: false,
        message: '旧密码错误',
      });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await userRepository.save(user);

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
    });
  }
});

export default router;
