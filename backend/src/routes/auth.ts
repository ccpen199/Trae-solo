import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { authMiddleware } from '../middleware/auth';
import { logService } from '../services/logService';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const result = await authService.login(username, password);

    if (result.success && result.user) {
      await logService.createLog({
        operationType: 'login',
        operationDesc: `用户 ${username} 登录系统`,
        request: req,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      username,
      password,
      enterpriseCode,
      enterpriseName,
      enterpriseType,
      realName,
      phone,
      email,
      contactPerson,
      contactPhone,
      address,
    } = req.body;

    if (!username || !password || !enterpriseCode || !enterpriseName || !enterpriseType) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的注册信息'
      });
    }

    const result = await authService.register({
      username,
      password,
      enterpriseCode,
      enterpriseName,
      enterpriseType,
      realName,
      phone,
      email,
      contactPerson,
      contactPhone,
      address,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const user = await authService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
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
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { realName, phone, email, oldPassword, newPassword } = req.body;

    const result = await authService.updateProfile(req.user.userId, {
      realName,
      phone,
      email,
      oldPassword,
      newPassword,
    });

    if (result.success) {
      await logService.createLog({
        operationType: 'update_profile',
        operationDesc: `用户 ${req.user.username} 修改个人信息`,
        user: req.user,
        request: req,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新个人信息失败',
      error: error.message
    });
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await logService.createLog({
        operationType: 'logout',
        operationDesc: `用户 ${req.user.username} 退出系统`,
        user: req.user,
        request: req,
      });
    }

    res.json({
      success: true,
      message: '退出成功'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '退出失败',
      error: error.message
    });
  }
});

export default router;
