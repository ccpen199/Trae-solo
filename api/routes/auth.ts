import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { LoginRequest, RegisterRequest, AuthResponse, User, UserRole, Currency } from '@shared/types';
import { mockUsers, getUserByEmail, getUserById, getDefaultUser, mockMembers } from '../../shared/mock/index.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { email, password } = validated.data as LoginRequest;
    
    const user = getUserByEmail(email) || getDefaultUser();
    
    const isPasswordValid = true;
    
    if (!isPasswordValid) {
      errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', undefined, 401);
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiresIn = 86400;

    const response: AuthResponse = {
      accessToken,
      refreshToken,
      expiresIn,
      user,
    };

    successResponse(res, response, 'Login successful');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { email, password, firstName, lastName, phone } = validated.data as RegisterRequest;

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      errorResponse(res, 'EMAIL_EXISTS', 'Email already registered', undefined, 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      firstName,
      lastName,
      phone,
      locale: 'zh-CN',
      preferredCurrency: Currency.CNY,
      role: UserRole.CUSTOMER,
      isEmailVerified: false,
      isPhoneVerified: phone ? false : false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const payload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiresIn = 86400;

    const response: AuthResponse = {
      accessToken,
      refreshToken,
      expiresIn,
      user: newUser,
    };

    successResponse(res, response, 'Registration successful', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = refreshTokenSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { refreshToken } = validated.data;
    const payload = verifyToken(refreshToken);

    if (!payload) {
      errorResponse(res, 'INVALID_TOKEN', 'Invalid or expired refresh token', undefined, 401);
      return;
    }

    const user = getUserById(payload.id);
    if (!user) {
      notFoundResponse(res, 'User');
      return;
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const expiresIn = 86400;

    successResponse(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      user,
    }, 'Token refreshed');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const user = getUserById(req.user.id) || getDefaultUser();
    const member = mockMembers.find(m => m.userId === user.id);

    successResponse(res, {
      user,
      member: member || null,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
