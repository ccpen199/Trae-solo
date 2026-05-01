import { config } from '../config';
import { logger } from '../utils/logger';
import {
  TranscodeJob,
  TranscodeProgress,
  TranscodeResult,
  ThumbnailGenerationResult,
  ApiResponse,
  VideoStatus,
  TranscodeStatus,
} from '../types';
import Redis from 'ioredis';
import amqp, { Channel, Connection } from 'amqplib';
import * as Minio from 'minio';
import { Op } from 'sequelize';

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

const TRANSCODE_PROGRESS_PREFIX = 'transcode_progress:';
const TRANSCODE_QUEUE_PREFIX = 'transcode_queue:';

export const initRabbitMQ = async (): Promise<void> => {
  try {
    const connectionString = `amqp://${config.rabbitmq.user}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}`;
    rabbitmqConnection = await amqp.connect(connectionString);
    rabbitmqChannel = await rabbitmqConnection.createChannel();

    await rabbitmqChannel.assertQueue(config.queues.videoTranscode, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.videoSafety, { durable: true });

    await rabbitmqChannel.prefetch(config.transcoding.maxConcurrent);

    logger.info('RabbitMQ initialized successfully for transcoding engine');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ for transcoding engine', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const simulateVideoTranscode = async (
  videoId: string,
  objectKey: string,
  quality: string,
  requestId: string
): Promise<TranscodeResult> => {
  const log = logger.child({ requestId, videoId, quality });

  try {
    log.info('Starting video transcoding simulation');

    const resolution = config.transcoding.resolutions[quality as keyof typeof config.transcoding.resolutions];
    if (!resolution) {
      return {
        success: false,
        videoId,
        quality,
        error: `Unsupported quality: ${quality}`,
      };
    }

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const fileExtension = objectKey.split('.').pop() || 'mp4';
    const transcodedObjectKey = `videos/${videoId}/${quality}.${fileExtension}`;

    log.info('Video transcoding completed successfully');

    return {
      success: true,
      videoId,
      quality,
      fileUrl: transcodedObjectKey,
      fileSize: Math.floor(Math.random() * 100000000) + 10000000,
      duration: Math.floor(Math.random() * 300) + 10,
      width: resolution.width,
      height: resolution.height,
    };
  } catch (error) {
    log.error('Video transcoding failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      videoId,
      quality,
      error: error instanceof Error ? error.message : 'Transcoding failed',
    };
  }
};

export const simulateThumbnailGeneration = async (
  videoId: string,
  objectKey: string,
  requestId: string
): Promise<ThumbnailGenerationResult> => {
  const log = logger.child({ requestId, videoId });

  try {
    log.info('Starting thumbnail generation simulation');

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const thumbnailObjectKey = `videos/${videoId}/thumbnail.jpg`;

    log.info('Thumbnail generation completed successfully');

    return {
      success: true,
      thumbnailUrl: thumbnailObjectKey,
    };
  } catch (error) {
    log.error('Thumbnail generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Thumbnail generation failed',
    };
  }
};

export const updateTranscodeProgress = async (
  videoId: string,
  quality: string,
  progress: number,
  status: TranscodeStatus,
  error?: string,
  requestId?: string
): Promise<void> => {
  const log = logger.child({ requestId, videoId, quality });

  try {
    const transcodeProgress: TranscodeProgress = {
      videoId,
      quality,
      status,
      progress,
      error,
    };

    const progressKey = `${TRANSCODE_PROGRESS_PREFIX}${videoId}:${quality}`;
    await redisClient.setex(progressKey, 86400, JSON.stringify(transcodeProgress));

    log.debug('Transcode progress updated', { status, progress });
  } catch (error) {
    log.error('Failed to update transcode progress', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getTranscodeProgress = async (
  videoId: string,
  quality: string,
  requestId: string
): Promise<ApiResponse<TranscodeProgress>> => {
  const log = logger.child({ requestId, videoId, quality });

  try {
    const progressKey = `${TRANSCODE_PROGRESS_PREFIX}${videoId}:${quality}`;
    const progressData = await redisClient.get(progressKey);

    if (!progressData) {
      log.warn('Transcode progress not found');
      return {
        success: false,
        error: {
          code: 'PROGRESS_NOT_FOUND',
          message: 'Transcode progress not found',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const progress: TranscodeProgress = JSON.parse(progressData);
    log.info('Transcode progress retrieved successfully');

    return {
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get transcode progress', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'PROGRESS_RETRIEVAL_FAILED',
        message: 'Failed to get transcode progress',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const processTranscodeJob = async (job: TranscodeJob): Promise<void> => {
  const log = logger.child({ requestId: job.requestId, videoId: job.videoId });

  try {
    log.info('Processing transcode job', { qualities: job.qualities });

    for (const quality of job.qualities) {
      await updateTranscodeProgress(
        job.videoId,
        quality,
        0,
        'processing',
        undefined,
        job.requestId
      );

      const result = await simulateVideoTranscode(
        job.videoId,
        job.objectKey,
        quality,
        job.requestId
      );

      if (result.success) {
        await updateTranscodeProgress(
          job.videoId,
          quality,
          100,
          'completed',
          undefined,
          job.requestId
        );
        log.info('Quality transcoded successfully', { quality });
      } else {
        await updateTranscodeProgress(
          job.videoId,
          quality,
          0,
          'failed',
          result.error,
          job.requestId
        );
        log.error('Quality transcoding failed', { quality, error: result.error });
      }
    }

    if (job.generateThumbnail) {
      const thumbnailResult = await simulateThumbnailGeneration(
        job.videoId,
        job.objectKey,
        job.requestId
      );

      if (thumbnailResult.success) {
        log.info('Thumbnail generated successfully');
      } else {
        log.error('Thumbnail generation failed', { error: thumbnailResult.error });
      }
    }

    if (rabbitmqChannel) {
      await rabbitmqChannel.sendToQueue(
        config.queues.videoSafety,
        Buffer.from(JSON.stringify({
          videoId: job.videoId,
          requestId: job.requestId,
        })),
        { persistent: true }
      );
      log.info('Video sent to safety check queue');
    }

    log.info('Transcode job completed successfully');
  } catch (error) {
    log.error('Transcode job processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const startTranscodeConsumer = async (): Promise<void> => {
  try {
    if (!rabbitmqChannel) {
      logger.error('RabbitMQ channel not initialized');
      return;
    }

    logger.info('Starting transcode consumer');

    await rabbitmqChannel.consume(config.queues.videoTranscode, async (msg) => {
      if (msg === null) return;

      try {
        const job: TranscodeJob = JSON.parse(msg.content.toString());
        logger.info('Received transcode job', {
          videoId: job.videoId,
          requestId: job.requestId,
        });

        await processTranscodeJob(job);

        rabbitmqChannel?.ack(msg);
      } catch (error) {
        logger.error('Failed to process transcode job', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        rabbitmqChannel?.nack(msg, false, false);
      }
    });

    logger.info('Transcode consumer started successfully');
  } catch (error) {
    logger.error('Failed to start transcode consumer', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const submitTranscodeJob = async (
  videoId: string,
  objectKey: string,
  requestId: string,
  qualities?: string[]
): Promise<ApiResponse> => {
  const log = logger.child({ requestId, videoId });

  try {
    const job: TranscodeJob = {
      videoId,
      requestId,
      objectKey,
      qualities: qualities || config.transcoding.qualities,
      generateThumbnail: true,
    };

    if (!rabbitmqChannel) {
      log.error('RabbitMQ channel not initialized');
      return {
        success: false,
        error: {
          code: 'QUEUE_NOT_AVAILABLE',
          message: 'Transcoding queue not available',
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    await rabbitmqChannel.sendToQueue(
      config.queues.videoTranscode,
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );

    for (const quality of job.qualities) {
      await updateTranscodeProgress(
        videoId,
        quality,
        0,
        'pending',
        undefined,
        requestId
      );
    }

    log.info('Transcode job submitted successfully');
    return {
      success: true,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to submit transcode job', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'JOB_SUBMISSION_FAILED',
        message: 'Failed to submit transcode job',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};
