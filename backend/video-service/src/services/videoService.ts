import { Video } from '../models/Video';
import { logger } from '../utils/logger';
import {
  UploadVideoRequest,
  UpdateVideoRequest,
  VideoReviewRequest,
  ApiResponse,
  VideoStatus,
  UploadProgress,
} from '../types';
import { config } from '../config';
import Redis from 'ioredis';
import amqp, { Channel, Connection } from 'amqplib';
import * as Minio from 'minio';
import { Op } from 'sequelize';
import axios from 'axios';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
});

const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

let rabbitmqChannel: Channel | null = null;
let rabbitmqConnection: Connection | null = null;

const VIDEO_UPLOAD_PROGRESS_PREFIX = 'video_upload_progress:';

export const initRabbitMQ = async (): Promise<void> => {
  try {
    const connectionString = `amqp://${config.rabbitmq.user}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}`;
    rabbitmqConnection = await amqp.connect(connectionString);
    rabbitmqChannel = await rabbitmqConnection.createChannel();

    await rabbitmqChannel.assertQueue(config.queues.videoUpload, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.videoTranscode, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.videoSafety, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.videoReview, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.videoPublish, { durable: true });

    logger.info('RabbitMQ initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const initMinio = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(config.minio.bucket);
    if (!bucketExists) {
      await minioClient.makeBucket(config.minio.bucket, 'us-east-1');
      await minioClient.setBucketPolicy(
        config.minio.bucket,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${config.minio.bucket}/*`],
            },
          ],
        })
      );
      logger.info('MinIO bucket created successfully');
    }
    logger.info('MinIO initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize MinIO', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const generatePresignedUploadUrl = async (
  userId: string,
  fileName: string,
  fileSize: number,
  requestId: string
): Promise<ApiResponse<{ uploadUrl: string; videoId: string; objectKey: string }>> => {
  const log = logger.child({ requestId, userId, fileName, fileSize });

  try {
    if (fileSize > config.video.maxFileSize) {
      log.warn('File size exceeds maximum limit');
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum limit of ${config.video.maxFileSize} bytes`,
          details: {
            fileSize,
            maxSize: config.video.maxFileSize,
          },
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    if (!config.video.allowedFormats.includes(fileExtension)) {
      log.warn('Invalid file format');
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: `Invalid file format. Allowed formats: ${config.video.allowedFormats.join(', ')}`,
          details: {
            format: fileExtension,
            allowedFormats: config.video.allowedFormats,
          },
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const videoId = crypto.randomUUID();
    const objectKey = `videos/${userId}/${videoId}/original.${fileExtension}`;

    const uploadUrl = await minioClient.presignedPutObject(
      config.minio.bucket,
      objectKey,
      3600
    );

    log.info('Presigned upload URL generated successfully');
    return {
      success: true,
      data: {
        uploadUrl,
        videoId,
        objectKey,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to generate presigned upload URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'UPLOAD_URL_GENERATION_FAILED',
        message: 'Failed to generate upload URL',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const createVideo = async (
  userId: string,
  videoId: string,
  objectKey: string,
  request: UploadVideoRequest,
  requestId: string
): Promise<ApiResponse<Video>> => {
  const log = logger.child({ requestId, userId, videoId });

  try {
    const video = await Video.create({
      id: videoId,
      creatorId: userId,
      title: request.title,
      description: request.description,
      originalUrl: objectKey,
      fileSize: 0,
      format: objectKey.split('.').pop(),
      status: 'uploading',
      visibility: request.visibility || 'public',
      category: request.category,
      tags: request.tags || [],
    });

    const progress: UploadProgress = {
      videoId,
      status: 'uploading',
      progress: 0,
      message: 'Video upload started',
    };
    await redisClient.setex(
      `${VIDEO_UPLOAD_PROGRESS_PREFIX}${videoId}`,
      86400,
      JSON.stringify(progress)
    );

    if (rabbitmqChannel) {
      await rabbitmqChannel.sendToQueue(
        config.queues.videoUpload,
        Buffer.from(JSON.stringify({
          videoId,
          userId,
          objectKey,
          requestId,
        })),
        { persistent: true }
      );
      log.info('Video upload message sent to queue');
    }

    log.info('Video created successfully');
    return {
      success: true,
      data: video.toJSON() as Video,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to create video', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'VIDEO_CREATION_FAILED',
        message: 'Failed to create video',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const updateUploadProgress = async (
  videoId: string,
  progress: number,
  status: VideoStatus,
  message: string,
  requestId: string
): Promise<ApiResponse<UploadProgress>> => {
  const log = logger.child({ requestId, videoId });

  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      log.warn('Video not found');
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    video.status = status;
    await video.save();

    const uploadProgress: UploadProgress = {
      videoId,
      status,
      progress,
      message,
    };
    await redisClient.setex(
      `${VIDEO_UPLOAD_PROGRESS_PREFIX}${videoId}`,
      86400,
      JSON.stringify(uploadProgress)
    );

    if (status === 'uploading' && progress === 100 && rabbitmqChannel) {
      await rabbitmqChannel.sendToQueue(
        config.queues.videoTranscode,
        Buffer.from(JSON.stringify({
          videoId,
          requestId,
        })),
        { persistent: true }
      );
      log.info('Video transcode message sent to queue');
    }

    log.info('Upload progress updated successfully');
    return {
      success: true,
      data: uploadProgress,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to update upload progress', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'PROGRESS_UPDATE_FAILED',
        message: 'Failed to update upload progress',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const getUploadProgress = async (
  videoId: string,
  requestId: string
): Promise<ApiResponse<UploadProgress>> => {
  const log = logger.child({ requestId, videoId });

  try {
    const progressData = await redisClient.get(`${VIDEO_UPLOAD_PROGRESS_PREFIX}${videoId}`);
    if (!progressData) {
      const video = await Video.findByPk(videoId);
      if (!video) {
        log.warn('Video not found');
        return {
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found',
          },
          timestamp: new Date().toISOString(),
          requestId,
        };
      }

      const progress: UploadProgress = {
        videoId,
        status: video.status,
        progress: ['published', 'rejected', 'taken_down'].includes(video.status) ? 100 : 50,
        message: `Video status: ${video.status}`,
      };

      log.info('Upload progress retrieved from database');
      return {
        success: true,
        data: progress,
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const progress: UploadProgress = JSON.parse(progressData);
    log.info('Upload progress retrieved successfully');
    return {
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get upload progress', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'PROGRESS_RETRIEVAL_FAILED',
        message: 'Failed to get upload progress',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const getVideoById = async (
  videoId: string,
  requestId: string
): Promise<ApiResponse<Video>> => {
  const log = logger.child({ requestId, videoId });

  try {
    const cacheKey = `video:${videoId}`;
    const cachedVideo = await redisClient.get(cacheKey);

    if (cachedVideo) {
      log.debug('Video found in cache');
      return {
        success: true,
        data: JSON.parse(cachedVideo),
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const video = await Video.findByPk(videoId);
    if (!video) {
      log.warn('Video not found');
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const videoData = video.toJSON() as Video;
    await redisClient.setex(cacheKey, config.cache.videoTTL, JSON.stringify(videoData));

    log.info('Video retrieved successfully');
    return {
      success: true,
      data: videoData,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get video', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'VIDEO_RETRIEVAL_FAILED',
        message: 'Failed to get video',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const updateVideo = async (
  videoId: string,
  userId: string,
  request: UpdateVideoRequest,
  requestId: string
): Promise<ApiResponse<Video>> => {
  const log = logger.child({ requestId, videoId, userId });

  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      log.warn('Video not found');
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (video.creatorId !== userId) {
      log.warn('User not authorized to update this video');
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this video',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (request.title !== undefined) {
      video.title = request.title;
    }
    if (request.description !== undefined) {
      video.description = request.description;
    }
    if (request.category !== undefined) {
      video.category = request.category;
    }
    if (request.tags !== undefined) {
      video.tags = request.tags;
    }
    if (request.visibility !== undefined) {
      video.visibility = request.visibility;
    }

    video.version += 1;
    await video.save();

    const cacheKey = `video:${videoId}`;
    await redisClient.del(cacheKey);

    log.info('Video updated successfully');
    return {
      success: true,
      data: video.toJSON() as Video,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to update video', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'VIDEO_UPDATE_FAILED',
        message: 'Failed to update video',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const deleteVideo = async (
  videoId: string,
  userId: string,
  requestId: string
): Promise<ApiResponse> => {
  const log = logger.child({ requestId, videoId, userId });

  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      log.warn('Video not found');
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    if (video.creatorId !== userId) {
      log.warn('User not authorized to delete this video');
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to delete this video',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    await video.destroy();

    const cacheKey = `video:${videoId}`;
    await redisClient.del(cacheKey);

    log.info('Video deleted successfully');
    return {
      success: true,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to delete video', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'VIDEO_DELETION_FAILED',
        message: 'Failed to delete video',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const getPendingReviews = async (
  requestId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<{ videos: Video[]; total: number; page: number; limit: number }>> => {
  const log = logger.child({ requestId });

  try {
    const { count, rows } = await Video.findAndCountAll({
      where: {
        status: 'pending_review',
      },
      order: [['createdAt', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });

    log.info('Pending reviews retrieved successfully', { total: count });
    return {
      success: true,
      data: {
        videos: rows.map(row => row.toJSON() as Video),
        total: count,
        page,
        limit,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get pending reviews', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'REVIEWS_RETRIEVAL_FAILED',
        message: 'Failed to get pending reviews',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const reviewVideo = async (
  request: VideoReviewRequest,
  auditorId: string,
  requestId: string
): Promise<ApiResponse<Video>> => {
  const log = logger.child({ requestId, videoId: request.videoId, auditorId });

  try {
    const video = await Video.findByPk(request.videoId);
    if (!video) {
      log.warn('Video not found');
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const previousStatus = video.status;
    const newStatus = request.decision === 'approve' ? 'published' : 'rejected';

    video.status = newStatus;
    video.version += 1;
    await video.save();

    const cacheKey = `video:${request.videoId}`;
    await redisClient.del(cacheKey);

    if (newStatus === 'published' && rabbitmqChannel) {
      await rabbitmqChannel.sendToQueue(
        config.queues.videoPublish,
        Buffer.from(JSON.stringify({
          videoId: request.videoId,
          requestId,
        })),
        { persistent: true }
      );
      log.info('Video publish message sent to queue');
    }

    log.info('Video reviewed successfully', { decision: request.decision });
    return {
      success: true,
      data: video.toJSON() as Video,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to review video', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'REVIEW_FAILED',
        message: 'Failed to review video',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const getUserVideos = async (
  userId: string,
  requestId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<{ videos: Video[]; total: number; page: number; limit: number }>> => {
  const log = logger.child({ requestId, userId });

  try {
    const { count, rows } = await Video.findAndCountAll({
      where: {
        creatorId: userId,
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    log.info('User videos retrieved successfully', { total: count });
    return {
      success: true,
      data: {
        videos: rows.map(row => row.toJSON() as Video),
        total: count,
        page,
        limit,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get user videos', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'USER_VIDEOS_RETRIEVAL_FAILED',
        message: 'Failed to get user videos',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const getHotVideos = async (
  requestId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<{ videos: Video[]; total: number; page: number; limit: number }>> => {
  const log = logger.child({ requestId });

  try {
    const cacheKey = `hot_videos:${page}:${limit}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      log.debug('Hot videos found in cache');
      return {
        success: true,
        data: JSON.parse(cachedData),
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const { count, rows } = await Video.findAndCountAll({
      where: {
        status: 'published',
        visibility: 'public',
      },
      order: [['hotScore', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const result = {
      videos: rows.map(row => row.toJSON() as Video),
      total: count,
      page,
      limit,
    };

    await redisClient.setex(cacheKey, config.cache.feedTTL, JSON.stringify(result));

    log.info('Hot videos retrieved successfully', { total: count });
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get hot videos', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'HOT_VIDEOS_RETRIEVAL_FAILED',
        message: 'Failed to get hot videos',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};
