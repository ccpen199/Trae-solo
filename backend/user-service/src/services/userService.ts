import { User } from '../models/User';
import { logger } from '../utils/logger';
import { UpdateUserRequest, ChangePasswordRequest, ApiResponse, UserRole } from '../types';
import { hashPassword, comparePassword, revokeAllUserRefreshTokens } from './authService';
import Redis from 'ioredis';
import { config } from '../config';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
});

const USER_CACHE_PREFIX = 'user:';

export const getUserById = async (
  userId: string,
  requestId: string
): Promise<ApiResponse<Omit<User, 'passwordHash'>>> => {
  const log = logger.child({ requestId, userId });

  try {
    const cacheKey = `${USER_CACHE_PREFIX}${userId}`;
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      log.debug('User found in cache');
      return {
        success: true,
        data: JSON.parse(cachedUser),
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const user = await User.findByPk(userId);
    if (!user) {
      log.warn('User not found');
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const userData = user.toJSON();
    await redisClient.set(cacheKey, JSON.stringify(userData), 'EX', config.cache.userTTL);

    log.info('User retrieved successfully');
    return {
      success: true,
      data: userData,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get user', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'GET_USER_FAILED',
        message: 'Failed to get user',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const updateUser = async (
  userId: string,
  request: UpdateUserRequest,
  requestId: string
): Promise<ApiResponse<Omit<User, 'passwordHash'>>> => {
  const log = logger.child({ requestId, userId });

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      log.warn('User not found');
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (request.nickname !== undefined) {
      user.nickname = request.nickname;
    }
    if (request.bio !== undefined) {
      user.bio = request.bio;
    }
    if (request.avatarUrl !== undefined) {
      user.avatarUrl = request.avatarUrl;
    }

    await user.save();

    const cacheKey = `${USER_CACHE_PREFIX}${userId}`;
    await redisClient.del(cacheKey);

    log.info('User updated successfully');
    return {
      success: true,
      data: user.toJSON(),
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to update user', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'UPDATE_USER_FAILED',
        message: 'Failed to update user',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const changePassword = async (
  userId: string,
  request: ChangePasswordRequest,
  requestId: string
): Promise<ApiResponse> => {
  const log = logger.child({ requestId, userId });

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      log.warn('User not found');
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const passwordValid = await comparePassword(request.currentPassword, user.passwordHash);
    if (!passwordValid) {
      log.warn('Password change failed - current password is invalid');
      return {
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is invalid',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (
      request.newPassword.length < config.password.minLength ||
      request.newPassword.length > config.password.maxLength
    ) {
      log.warn('Password change failed - invalid password length');
      return {
        success: false,
        error: {
          code: 'INVALID_PASSWORD_LENGTH',
          message: `Password must be between ${config.password.minLength} and ${config.password.maxLength} characters`,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    user.passwordHash = await hashPassword(request.newPassword);
    await user.save();

    await revokeAllUserRefreshTokens(userId);

    const cacheKey = `${USER_CACHE_PREFIX}${userId}`;
    await redisClient.del(cacheKey);

    log.info('Password changed successfully');
    return {
      success: true,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to change password', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_FAILED',
        message: 'Failed to change password',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const upgradeRole = async (
  userId: string,
  newRole: UserRole,
  requestId: string,
  requesterRole?: UserRole
): Promise<ApiResponse<Omit<User, 'passwordHash'>>> => {
  const log = logger.child({ requestId, userId, newRole, requesterRole });

  try {
    const validRoles: UserRole[] = ['viewer', 'creator', 'auditor', 'advertiser', 'admin'];
    if (!validRoles.includes(newRole)) {
      log.warn('Invalid role specified');
      return {
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid role specified',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (requesterRole !== 'admin' && newRole === 'admin') {
      log.warn('Non-admin user attempting to upgrade to admin role');
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to upgrade to admin role',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const user = await User.findByPk(userId);
    if (!user) {
      log.warn('User not found');
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    user.role = newRole;
    await user.save();

    const cacheKey = `${USER_CACHE_PREFIX}${userId}`;
    await redisClient.del(cacheKey);

    log.info('User role upgraded successfully');
    return {
      success: true,
      data: user.toJSON(),
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to upgrade user role', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'UPGRADE_ROLE_FAILED',
        message: 'Failed to upgrade user role',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const deactivateUser = async (
  userId: string,
  requestId: string,
  requesterRole?: UserRole
): Promise<ApiResponse> => {
  const log = logger.child({ requestId, userId, requesterRole });

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      log.warn('User not found');
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    user.isActive = false;
    await user.save();

    await revokeAllUserRefreshTokens(userId);

    const cacheKey = `${USER_CACHE_PREFIX}${userId}`;
    await redisClient.del(cacheKey);

    log.info('User deactivated successfully');
    return {
      success: true,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to deactivate user', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'DEACTIVATE_USER_FAILED',
        message: 'Failed to deactivate user',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};
