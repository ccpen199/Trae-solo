import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, phone, role }: RegisterData = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      });
      return;
    }

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: role || 'jobseeker'
    });

    const savedUser = await userRepository.save(user);

    const token = jwt.sign(
      {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = savedUser;

    res.json({
      success: true,
      message: '注册成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password }: LoginData = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      });
      return;
    }

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: '密码错误'
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.json({
        success: true,
        authenticated: false,
        data: null,
        message: '当前未登录'
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      res.status(401).json({
        success: false,
        authenticated: false,
        message: '认证令牌格式错误'
      });
      return;
    }

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      relations: ['companies', 'resumes']
    });

    if (!user) {
      res.status(404).json({
        success: false,
        authenticated: false,
        message: '用户不存在'
      });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      authenticated: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      authenticated: false,
      message: '认证令牌无效或已过期'
    });
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { id: req.user.id },
      relations: ['companies', 'resumes']
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
