import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const userRepository = () => AppDataSource.getRepository(User);

const JWT_SECRET = process.env.JWT_SECRET || 'zhihui_education_jwt_secret_key_2024';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as string | undefined) || '7d';

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度需在3-20之间'),
  body('email').isEmail().withMessage('请输入有效的邮箱'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('无效的用户角色')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    const existingUser = await userRepository().findOne({
      where: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepository().create({
      username,
      email,
      password: hashedPassword,
      role: role || UserRole.STUDENT,
      nickname: username
    });

    await userRepository().save(user);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名或邮箱'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '请填写登录信息',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    const user = await userRepository().findOne({
      where: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN as any }
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
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userRepository().findOne({
      where: { id: req.user?.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { nickname, phone, avatar } = req.body;
    
    const user = await userRepository().findOne({
      where: { id: req.user?.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (nickname !== undefined) user.nickname = nickname;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await userRepository().save(user);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: '更新成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;
