import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { config } from '../config';
import { logger } from '../utils/logger';
import { JwtPayload, LoginRequest, RegisterRequest, LoginResponse, UserRole } from '../types';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
});

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.password.saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as UserRole,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.jwt.expiresIn,
  };

  return jwt.sign(payload, config.jwt.secret);
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const refreshToken = uuidv4();
  const key = `refresh_token:${refreshToken}`;

  await redisClient.set(
    key,
    userId,
    'EX',
    config.jwt.refreshExpiresIn
  );

  return refreshToken;
};

export const validateRefreshToken = async (refreshToken: string): Promise<string | null> => {
  const key = `refresh_token:${refreshToken}`;
  const userId = await redisClient.get(key);
  return userId;
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const key = `refresh_token:${refreshToken}`;
  await redisClient.del(key);
};

export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  const pattern = `refresh_token:*`;
  const keys = await redisClient.keys(pattern);

  for (const key of keys) {
    const storedUserId = await redisClient.get(key);
    if (storedUserId === userId) {
      await redisClient.del(key);
    }
  }
};

export const register = async (request: RegisterRequest, requestId: string): Promise<LoginResponse> => {
  const log = logger.child({ requestId, username: request.username, email: request.email });

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: request.username },
          { email: request.email },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.username === request.username ? 'username' : 'email';
      log.warn('Registration failed - user already exists', { field });
      return {
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: `A user with this ${field} already exists`,
        },
      };
    }

    const passwordHash = await hashPassword(request.password);

    const user = await User.create({
      username: request.username,
      email: request.email,
      passwordHash,
      nickname: request.nickname || request.username,
      role: 'viewer',
      isActive: true,
      isVerified: false,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    log.info('User registered successfully', { userId: user.id, role: user.role });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl,
          nickname: user.nickname,
        },
      },
    };
  } catch (error) {
    log.error('Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'An error occurred during registration',
      },
    };
  }
};

export const login = async (request: LoginRequest, requestId: string): Promise<LoginResponse> => {
  const log = logger.child({ requestId, emailOrUsername: request.emailOrUsername });

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: request.emailOrUsername },
          { email: request.emailOrUsername },
        ],
      },
    });

    if (!user) {
      log.warn('Login failed - user not found');
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      };
    }

    if (!user.isActive) {
      log.warn('Login failed - user account is deactivated', { userId: user.id });
      return {
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated',
        },
      };
    }

    const passwordValid = await comparePassword(request.password, user.passwordHash);
    if (!passwordValid) {
      log.warn('Login failed - invalid password', { userId: user.id });
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      };
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    log.info('User logged in successfully', { userId: user.id, role: user.role });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl,
          nickname: user.nickname,
        },
      },
    };
  } catch (error) {
    log.error('Login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'An error occurred during login',
      },
    };
  }
};

export const logout = async (refreshToken: string, requestId: string): Promise<{ success: boolean }> => {
  const log = logger.child({ requestId });

  try {
    await revokeRefreshToken(refreshToken);
    log.info('User logged out successfully');
    return { success: true };
  } catch (error) {
    log.error('Logout failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false };
  }
};

export const refreshTokens = async (refreshToken: string, requestId: string): Promise<LoginResponse> => {
  const log = logger.child({ requestId });

  try {
    const userId = await validateRefreshToken(refreshToken);
    if (!userId) {
      log.warn('Token refresh failed - invalid or expired refresh token');
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      };
    }

    const user = await User.findByPk(userId);
    if (!user) {
      log.warn('Token refresh failed - user not found', { userId });
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    if (!user.isActive) {
      log.warn('Token refresh failed - user account is deactivated', { userId });
      return {
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated',
        },
      };
    }

    await revokeRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user.id);

    log.info('Tokens refreshed successfully', { userId: user.id });

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: config.jwt.expiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl,
          nickname: user.nickname,
        },
      },
    };
  } catch (error) {
    log.error('Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: 'An error occurred during token refresh',
      },
    };
  }
};
