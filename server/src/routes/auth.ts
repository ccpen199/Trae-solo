import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { authMiddleware, AuthenticatedRequest } from '../middleware';
import { UserRole } from '../types';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log('[Login] Attempting login for username:', username);
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    const result = await authService.login(
      username,
      password,
      req.ip,
      req.get('User-Agent')
    );
    
    console.log('[Login] Result:', result.success ? 'success' : 'failed');
    res.json(result);
  } catch (error) {
    console.error('[Login] Error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, storeId } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    const result = await authService.register(
      username,
      email,
      password,
      role || UserRole.CUSTOMER,
      storeId
    );
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/me', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/change-password', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      });
    }
    
    const result = await authService.changePassword(
      req.user!.id,
      oldPassword,
      newPassword
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/users', authMiddleware([UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, isActive, storeId, page, limit } = req.query;
    
    const result = await authService.listUsers({
      role: role as UserRole,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      storeId: storeId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/users/:userId', authMiddleware([UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { email, isActive, role, storeId } = req.body;
    
    const result = await authService.updateUser(
      userId,
      { email, isActive, role, storeId },
      req.user!.id
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
