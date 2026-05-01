import { Router, Request, Response } from 'express';
import { contextMiddleware } from '../middleware/context';
import { ApiResponse } from '../types';
import { getTranscodeProgress, submitTranscodeJob } from '../services/transcodeService';
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
      service: 'transcoding-engine',
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };
  res.json(response);
});

router.use('/health', healthCheckRouter);

const transcodeRouter = Router();

transcodeRouter.get('/progress/:videoId/:quality', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const { videoId, quality } = req.params;
    if (!videoId || !quality) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Video ID and quality are required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const result = await getTranscodeProgress(videoId, quality, requestId);
    if (!result.success) {
      return res.status(404).json(result);
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

const submitJobSchema = Joi.object({
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
  qualities: Joi.array()
    .items(Joi.string().valid('360p', '480p', '720p', '1080p'))
    .optional(),
});

transcodeRouter.post('/submit', async (req: Request, res: Response) => {
  const requestId = req.context.requestId;

  try {
    const { error, value } = submitJobSchema.validate(req.body);
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

    const result = await submitTranscodeJob(
      value.videoId,
      value.objectKey,
      requestId,
      value.qualities
    );

    if (!result.success) {
      return res.status(400).json(result);
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

router.use('/transcode', transcodeRouter);

export default router;
