import { Request, Response } from 'express';
import Joi from 'joi';
import { getUserById, updateUser, changePassword, upgradeRole, deactivateUser } from '../services/userService';
import { logger } from '../utils/logger';
import { ApiResponse, UpdateUserRequest, ChangePasswordRequest, UserRole } from '../types';

const getUserSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
});

const updateUserSchema = Joi.object({
  nickname: Joi.string()
    .min(1)
    .max(100)
    .optional(),
  bio: Joi.string()
    .max(1000)
    .optional(),
  avatarUrl: Joi.string()
    .uri()
    .max(500)
    .optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password must be at most 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required',
    }),
});

const upgradeRoleSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  newRole: Joi.string()
    .valid('viewer', 'creator', 'auditor', 'advertiser', 'admin')
    .required()
    .messages({
      'any.only': 'New role must be one of: viewer, creator, auditor, advertiser, admin',
      'any.required': 'New role is required',
    }),
});

const deactivateUserSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
});

export const getCurrentUserController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const userId = req.context.userId;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(401).json(response);
    }

    const result = await getUserById(userId, requestId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    log.info('Current user retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get current user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(response);
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = getUserSchema.validate(req.params);
    if (error) {
      log.warn('Get user validation failed', { error: error.details[0].message });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const result = await getUserById(value.userId, requestId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    log.info('User retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(response);
  }
};

export const updateCurrentUserController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      log.warn('Update user validation failed', { error: error.details[0].message });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const userId = req.context.userId;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(401).json(response);
    }

    const result = await updateUser(userId, value as UpdateUserRequest, requestId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('User updated successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Update user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(response);
  }
};

export const changePasswordController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      log.warn('Change password validation failed', { error: error.details[0].message });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const userId = req.context.userId;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(401).json(response);
    }

    const result = await changePassword(userId, value as ChangePasswordRequest, requestId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Password changed successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Change password controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(response);
  }
};

export const upgradeRoleController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = upgradeRoleSchema.validate(req.body);
    if (error) {
      log.warn('Upgrade role validation failed', { error: error.details[0].message });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const requesterRole = req.context.userRole;
    const result = await upgradeRole(value.userId, value.newRole as UserRole, requestId, requesterRole);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('User role upgraded successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Upgrade role controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(response);
  }
};

export const deactivateUserController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = deactivateUserSchema.validate(req.body);
    if (error) {
      log.warn('Deactivate user validation failed', { error: error.details[0].message });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const requesterRole = req.context.userRole;
    const result = await deactivateUser(value.userId, requestId, requesterRole);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('User deactivated successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Deactivate user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(response);
  }
};
