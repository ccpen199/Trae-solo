import { Router, Request, Response } from 'express';
import { contextMiddleware } from '../middleware/context';
import { ApiResponse, RecommendationRequest, InteractionType } from '../types';
import { generatePersonalizedFeed, recordInteraction, getTrendingVideos } from '../services/recommendService';
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
      service: 'recommend-engine',
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };
  res.json(response);
});

router.use('/health', healthCheckRouter);

const feedRouter = Router();

const feedRequestSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
  sessionId: Joi.string()
    .optional(),
  count: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  excludedVideoIds: Joi.array()
    .items(Joi.string().uuid())
    .optional(),
});

feedRouter.post('/personalized', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const { error, value } = feedRequestSchema.validate(req.body);
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

    const result = await generatePersonalizedFeed(value as RecommendationRequest, requestId);
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

feedRouter.get('/trending', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const count = parseInt(req.query.count as string) || 20;
    const result = await getTrendingVideos(requestId, Math.min(count, 100));

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

const interactionSchema = Joi.object({
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
  interactionType: Joi.string()
    .valid('like', 'comment', 'share', 'collect', 'play', 'complete')
    .required()
    .messages({
      'any.only': 'Interaction type must be one of: like, comment, share, collect, play, complete',
      'any.required': 'Interaction type is required',
    }),
  value: Joi.number()
    .min(0)
    .default(1),
});

feedRouter.post('/interaction', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const { error, value } = interactionSchema.validate(req.body);
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

    const result = await recordInteraction(
      value.userId,
      value.videoId,
      value.interactionType as InteractionType,
      value.value,
      requestId
    );

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

router.use('/feed', feedRouter);

export default router;
