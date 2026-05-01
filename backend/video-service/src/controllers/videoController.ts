import { Request, Response } from 'express';
import Joi from 'joi';
import {
  generatePresignedUploadUrl,
  createVideo,
  updateUploadProgress,
  getUploadProgress,
  getVideoById,
  updateVideo,
  deleteVideo,
  getPendingReviews,
  reviewVideo,
  getUserVideos,
  getHotVideos,
} from '../services/videoService';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  UploadVideoRequest,
  UpdateVideoRequest,
  VideoReviewRequest,
  VideoStatus,
} from '../types';

const generateUploadUrlSchema = Joi.object({
  fileName: Joi.string()
    .required()
    .messages({
      'any.required': 'File name is required',
    }),
  fileSize: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'File size must be a number',
      'number.integer': 'File size must be an integer',
      'number.min': 'File size must be at least 1 byte',
      'any.required': 'File size is required',
    }),
});

const createVideoSchema = Joi.object({
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
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 1 character',
      'string.max': 'Title must be at most 200 characters',
      'any.required': 'Title is required',
    }),
  description: Joi.string()
    .max(2000)
    .optional(),
  category: Joi.string()
    .max(50)
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  visibility: Joi.string()
    .valid('public', 'private', 'unlisted')
    .optional(),
});

const updateProgressSchema = Joi.object({
  videoId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Video ID must be a valid UUID',
      'any.required': 'Video ID is required',
    }),
  progress: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.min': 'Progress must be at least 0',
      'number.max': 'Progress must be at most 100',
      'any.required': 'Progress is required',
    }),
  status: Joi.string()
    .valid('uploading', 'transcoding', 'safety_checking', 'pending_review', 'published', 'rejected', 'taken_down')
    .required()
    .messages({
      'any.only': 'Invalid status',
      'any.required': 'Status is required',
    }),
  message: Joi.string()
    .optional(),
});

const updateVideoSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .optional(),
  description: Joi.string()
    .max(2000)
    .optional(),
  category: Joi.string()
    .max(50)
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  visibility: Joi.string()
    .valid('public', 'private', 'unlisted')
    .optional(),
});

const reviewVideoSchema = Joi.object({
  videoId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Video ID must be a valid UUID',
      'any.required': 'Video ID is required',
    }),
  decision: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': 'Decision must be either "approve" or "reject"',
      'any.required': 'Decision is required',
    }),
  reason: Joi.string()
    .max(500)
    .optional(),
  notes: Joi.string()
    .max(1000)
    .optional(),
});

const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
});

export const generateUploadUrlController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = generateUploadUrlSchema.validate(req.body);
    if (error) {
      log.warn('Generate upload URL validation failed', { error: error.details[0].message });
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

    const result = await generatePresignedUploadUrl(userId, value.fileName, value.fileSize, requestId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Upload URL generated successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Generate upload URL controller error', {
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

export const createVideoController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = createVideoSchema.validate(req.body);
    if (error) {
      log.warn('Create video validation failed', { error: error.details[0].message });
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

    const result = await createVideo(
      userId,
      value.videoId,
      value.objectKey,
      value as UploadVideoRequest,
      requestId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Video created successfully');
    res.status(201).json(result);
  } catch (error) {
    log.error('Create video controller error', {
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

export const updateProgressController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = updateProgressSchema.validate(req.body);
    if (error) {
      log.warn('Update progress validation failed', { error: error.details[0].message });
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

    const result = await updateUploadProgress(
      value.videoId,
      value.progress,
      value.status as VideoStatus,
      value.message || '',
      requestId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Upload progress updated successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Update progress controller error', {
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

export const getProgressController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { videoId } = req.params;
    if (!videoId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Video ID is required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const result = await getUploadProgress(videoId, requestId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    log.info('Upload progress retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get progress controller error', {
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

export const getVideoController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { videoId } = req.params;
    if (!videoId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Video ID is required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const result = await getVideoById(videoId, requestId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    log.info('Video retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get video controller error', {
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

export const updateVideoController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { videoId } = req.params;
    if (!videoId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Video ID is required',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
      return res.status(400).json(response);
    }

    const { error, value } = updateVideoSchema.validate(req.body);
    if (error) {
      log.warn('Update video validation failed', { error: error.details[0].message });
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

    const result = await updateVideo(videoId, userId, value as UpdateVideoRequest, requestId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Video updated successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Update video controller error', {
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

export const deleteVideoController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { videoId } = req.params;
    if (!videoId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Video ID is required',
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

    const result = await deleteVideo(videoId, userId, requestId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Video deleted successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Delete video controller error', {
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

export const getPendingReviewsController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      log.warn('Get pending reviews validation failed', { error: error.details[0].message });
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

    const result = await getPendingReviews(requestId, value.page, value.limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Pending reviews retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get pending reviews controller error', {
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

export const reviewVideoController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = reviewVideoSchema.validate(req.body);
    if (error) {
      log.warn('Review video validation failed', { error: error.details[0].message });
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

    const auditorId = req.context.userId;
    if (!auditorId) {
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

    const result = await reviewVideo(value as VideoReviewRequest, auditorId, requestId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Video reviewed successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Review video controller error', {
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

export const getUserVideosController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      log.warn('Get user videos validation failed', { error: error.details[0].message });
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

    const result = await getUserVideos(userId, requestId, value.page, value.limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('User videos retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get user videos controller error', {
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

export const getHotVideosController = async (req: Request, res: Response) => {
  const requestId = req.context.requestId;
  const log = logger.child({ requestId });

  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      log.warn('Get hot videos validation failed', { error: error.details[0].message });
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

    const result = await getHotVideos(requestId, value.page, value.limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    log.info('Hot videos retrieved successfully');
    res.status(200).json(result);
  } catch (error) {
    log.error('Get hot videos controller error', {
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
