import { Router, Request, Response } from 'express';
import { contextMiddleware } from '../middleware/context';
import { ApiResponse, SafetyCheckRequest, CommentFilterRequest } from '../types';
import { performSafetyCheck, filterCommentRequest } from '../services/safetyService';
import Joi from 'joi';

const router = Router();

router.use(contextMiddleware);

const healthCheckRouter = Router();
healthCheckRouter.get('/', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string; service: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'safety-engine',
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };
  res.json(response);
});

router.use('/health', healthCheckRouter);

const safetyRouter = Router();

const safetyCheckSchema = Joi.object({
  videoId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Video ID must be a valid UUID',
      'any.required': 'Video ID is required',
    }),
  objectKey: Joi.string()
    .required()
    .messages({
      'any.required': 'Object key is required',
    }),
  title: Joi.string()
    .max(200)
    .optional(),
  description: Joi.string()
    .max(2000)
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
});

safetyRouter.post('/check', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const { error, value } = safetyCheckSchema.validate(req.body);
    if (error) {
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

    const result = await performSafetyCheck(value as SafetyCheckRequest, requestId);
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
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
});

const commentFilterSchema = Joi.object({
  commentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Comment ID must be a valid UUID',
      'any.required': 'Comment ID is required',
    }),
  content: Joi.string()
    .max(500)
    .required()
    .messages({
      'string.max': 'Content must be at most 500 characters',
      'any.required': 'Content is required',
    }),
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  videoId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Video ID must be a valid UUID',
      'any.required': 'Video ID is required',
    }),
});

safetyRouter.post('/comment/filter', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const { error, value } = commentFilterSchema.validate(req.body);
    if (error) {
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

    const result = await filterCommentRequest(value as CommentFilterRequest, requestId);
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
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
});

router.use('/safety', safetyRouter);

export default router;
