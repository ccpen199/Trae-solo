import { Request, Response } from 'express';
import Joi from 'joi';
import { register, login, logout, refreshTokens } from '../services/authService';
import { logger } from '../utils/logger';
import { ApiResponse, RegisterRequest, LoginRequest } from '../types';

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must be at most 50 characters',
      'any.required': 'Username is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be at most 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
  nickname: Joi.string()
    .min(1)
    .max(100)
    .optional(),
});

const loginSchema = Joi.object({
  emailOrUsername: Joi.string()
    .required()
    .messages({
      'any.required': 'Email or username is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
    }),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
    }),
});

export const registerController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      log.warn('Registration validation failed', { error: error.details[0].message });
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

    const result = await register(value as RegisterRequest, requestId);

    if (!result.success) {
      const response: ApiResponse = {
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId,
    };

    log.info('User registration successful');
    res.status(201).json(response);
  } catch (error) {
    log.error('Registration controller error', {
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

export const loginController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      log.warn('Login validation failed', { error: error.details[0].message });
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

    const result = await login(value as LoginRequest, requestId);

    if (!result.success) {
      const response: ApiResponse = {
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId,
    };

    log.info('User login successful');
    res.status(200).json(response);
  } catch (error) {
    log.error('Login controller error', {
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

export const logoutController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = logoutSchema.validate(req.body);
    if (error) {
      log.warn('Logout validation failed', { error: error.details[0].message });
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

    const result = await logout(value.refreshToken, requestId);

    const response: ApiResponse = {
      success: result.success,
      timestamp: new Date().toISOString(),
      requestId,
    };

    log.info('User logout successful');
    res.status(200).json(response);
  } catch (error) {
    log.error('Logout controller error', {
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

export const refreshTokenController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      log.warn('Refresh token validation failed', { error: error.details[0].message });
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

    const result = await refreshTokens(value.refreshToken, requestId);

    if (!result.success) {
      const response: ApiResponse = {
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId,
    };

    log.info('Token refresh successful');
    res.status(200).json(response);
  } catch (error) {
    log.error('Refresh token controller error', {
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
