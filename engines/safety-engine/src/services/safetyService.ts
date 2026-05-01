import { config } from '../config';
import { logger } from '../utils/logger';
import {
  CheckResult,
  SafetyCheckRequest,
  CommentFilterRequest,
  CommentFilterResult,
  ApiResponse,
  RiskLevel,
  VideoStatus,
} from '../types';
import Redis from 'ioredis';
import amqp, { Channel, Connection } from 'amqplib';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
});

let rabbitmqChannel: Channel | null = null;
let rabbitmqConnection: Connection | null = null;

const SAFETY_CHECK_CACHE_PREFIX = 'safety_check:';
const COMMENT_FILTER_CACHE_PREFIX = 'comment_filter:';

export const initRabbitMQ = async (): Promise<void> => {
  try {
    const connectionString = `amqp://${config.rabbitmq.user}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}`;
    rabbitmqConnection = await amqp.connect(connectionString);
    rabbitmqChannel = await rabbitmqConnection.createChannel();

    await rabbitmqChannel.assertQueue(config.queues.videoSafety, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.videoReview, { durable: true });
    await rabbitmqChannel.assertQueue(config.queues.commentFilter, { durable: true });

    await rabbitmqChannel.prefetch(4);

    logger.info('RabbitMQ initialized successfully for safety engine');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ for safety engine', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const calculateRiskLevel = (score: number): RiskLevel => {
  if (score >= config.safety.riskLevels.critical) {
    return 'critical';
  } else if (score >= config.safety.riskLevels.high) {
    return 'high';
  } else if (score >= config.safety.riskLevels.medium) {
    return 'medium';
  }
  return 'low';
};

export const simulateSafetyCheck = async (
  request: SafetyCheckRequest,
  requestId: string
): Promise<CheckResult> => {
  const log = logger.child({ requestId, videoId: request.videoId });

  try {
    log.info('Starting safety check simulation');

    const allText = `${request.title || ''} ${request.description || ''} ${(request.tags || []).join(' ')}`;

    let riskScore = Math.random() * 0.3;
    const riskCategories: string[] = [];

    for (const sensitiveWord of config.commentFilter.sensitiveWords) {
      if (allText.includes(sensitiveWord)) {
        riskScore += 0.15;
        riskCategories.push('sensitive_content');
        log.debug('Sensitive word detected', { word: sensitiveWord });
      }
    }

    const visualRisk = Math.random() * 0.2;
    riskScore += visualRisk;

    if (visualRisk > 0.15) {
      riskCategories.push('visual_content');
    }

    riskScore = Math.min(1.0, riskScore);
    const riskLevel = calculateRiskLevel(riskScore);

    const isManualReviewRequired =
      riskScore >= config.safety.manualReviewThreshold &&
      riskScore < config.safety.autoRejectThreshold;

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    log.info('Safety check completed', {
      riskScore,
      riskLevel,
      isManualReviewRequired,
      riskCategories,
    });

    return {
      videoId: request.videoId,
      checkType: 'comprehensive',
      status: 'completed',
      riskLevel,
      riskScore,
      riskCategories,
      isManualReviewRequired,
      engineVersion: config.safety.engineVersion,
    };
  } catch (error) {
    log.error('Safety check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      videoId: request.videoId,
      checkType: 'comprehensive',
      status: 'failed',
      riskLevel: 'low',
      riskScore: 0,
      isManualReviewRequired: true,
      error: error instanceof Error ? error.message : 'Safety check failed',
    };
  }
};

export const filterComment = async (
  request: CommentFilterRequest,
  requestId: string
): Promise<CommentFilterResult> => {
  const log = logger.child({ requestId, commentId: request.commentId });

  try {
    log.info('Starting comment filter');

    let riskScore = 0;
    const sensitiveWordsFound: string[] = [];

    for (const sensitiveWord of config.commentFilter.sensitiveWords) {
      if (request.content.includes(sensitiveWord)) {
        riskScore += 0.2;
        sensitiveWordsFound.push(sensitiveWord);
        log.debug('Sensitive word detected in comment', { word: sensitiveWord });
      }
    }

    riskScore = Math.min(1.0, riskScore);
    const riskLevel = calculateRiskLevel(riskScore);

    const isFiltered = riskScore >= config.safety.autoRejectThreshold;

    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));

    const result: CommentFilterResult = {
      commentId: request.commentId,
      isFiltered,
      filterReason: isFiltered ? '包含敏感内容' : undefined,
      riskScore,
      riskLevel,
      sensitiveWords: sensitiveWordsFound.length > 0 ? sensitiveWordsFound : undefined,
    };

    log.info('Comment filter completed', {
      isFiltered,
      riskScore,
      riskLevel,
      sensitiveWordsCount: sensitiveWordsFound.length,
    });

    return result;
  } catch (error) {
    log.error('Comment filter failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      commentId: request.commentId,
      isFiltered: false,
      riskScore: 0,
      riskLevel: 'low',
    };
  }
};

export const performSafetyCheck = async (
  request: SafetyCheckRequest,
  requestId: string
): Promise<ApiResponse<CheckResult>> => {
  const log = logger.child({ requestId, videoId: request.videoId });

  try {
    log.info('Performing safety check');

    const cacheKey = `${SAFETY_CHECK_CACHE_PREFIX}${request.videoId}`;
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
      log.debug('Safety check result found in cache');
      return {
        success: true,
        data: JSON.parse(cachedResult),
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const result = await simulateSafetyCheck(request, requestId);

    if (result.status === 'completed') {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(result));
    }

    if (result.isManualReviewRequired && rabbitmqChannel) {
      await rabbitmqChannel.sendToQueue(
        config.queues.videoReview,
        Buffer.from(JSON.stringify({
          videoId: request.videoId,
          requestId,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          riskCategories: result.riskCategories,
        })),
        { persistent: true }
      );
      log.info('Video sent to review queue');
    }

    log.info('Safety check performed successfully');
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to perform safety check', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'SAFETY_CHECK_FAILED',
        message: 'Failed to perform safety check',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const filterCommentRequest = async (
  request: CommentFilterRequest,
  requestId: string
): Promise<ApiResponse<CommentFilterResult>> => {
  const log = logger.child({ requestId, commentId: request.commentId });

  try {
    log.info('Filtering comment');

    const result = await filterComment(request, requestId);

    log.info('Comment filtered successfully');
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to filter comment', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'COMMENT_FILTER_FAILED',
        message: 'Failed to filter comment',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const startSafetyCheckConsumer = async (): Promise<void> => {
  try {
    if (!rabbitmqChannel) {
      logger.error('RabbitMQ channel not initialized');
      return;
    }

    logger.info('Starting safety check consumer');

    await rabbitmqChannel.consume(config.queues.videoSafety, async (msg) => {
      if (msg === null) return;

      try {
        const request: SafetyCheckRequest = JSON.parse(msg.content.toString());
        const requestId = `auto-${Date.now()}`;

        logger.info('Received safety check job', {
          videoId: request.videoId,
          requestId,
        });

        const result = await performSafetyCheck(request, requestId);

        if (result.success) {
          rabbitmqChannel?.ack(msg);
        } else {
          rabbitmqChannel?.nack(msg, false, false);
        }
      } catch (error) {
        logger.error('Failed to process safety check job', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        rabbitmqChannel?.nack(msg, false, false);
      }
    });

    logger.info('Safety check consumer started successfully');
  } catch (error) {
    logger.error('Failed to start safety check consumer', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
