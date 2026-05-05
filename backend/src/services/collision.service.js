import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';
import configService from './config.service.js';
import config from '../config/index.js';
import fetch from 'node-fetch';
import moment from 'moment';

class CollisionService {
  async checkTargetProductActivity(phoneMd5) {
    try {
      const response = await fetch(`${config.userActivityUrl}/target-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneMd5, apiKey: config.getApiKey() })
      });
      const data = await response.json();
      return {
        hasActivity: data.hasActivity || false,
        lastClearDate: data.lastClearDate ? moment(data.lastClearDate) : null
      };
    } catch (error) {
      logger.error(`Check target product activity failed: ${error.message}`);
      return { hasActivity: false, lastClearDate: null };
    }
  }

  async checkBlacklists(phoneMd5) {
    const collisionConfig = await configService.getCollisionConfig();
    const blacklistDays = collisionConfig.blacklistDays;
    
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        phoneMd5,
        OR: [
          { expireAt: null },
          { expireAt: { gt: new Date() } }
        ]
      }
    });

    if (blacklist) {
      return {
        isBlacklisted: true,
        reason: blacklist.reason || '命中黑名单'
      };
    }

    try {
      const response = await fetch(`${config.riskCheckUrl}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneMd5, 
          blacklistDays,
          apiKey: config.getApiKey() 
        })
      });
      const data = await response.json();
      
      if (data.isBlacklisted) {
        return {
          isBlacklisted: true,
          reason: data.reason || '命中风控黑名单'
        };
      }
    } catch (error) {
      logger.error(`Check external blacklist failed: ${error.message}`);
    }

    return { isBlacklisted: false };
  }

  async validateCollision(phoneMd5, accessResult) {
    logger.info(`Starting collision validation for phoneMd5: ${phoneMd5}`);
    
    const collisionConfig = await configService.getCollisionConfig();
    
    const targetActivity = await this.checkTargetProductActivity(phoneMd5);
    logger.info(`Target product activity: hasActivity=${targetActivity.hasActivity}`);

    if (!targetActivity.hasActivity) {
      logger.info('Unused user in target product, checking blacklists...');
      const blacklistResult = await this.checkBlacklists(phoneMd5);
      
      if (blacklistResult.isBlacklisted) {
        logger.info(`Blacklist hit: ${blacklistResult.reason}`);
        return {
          result: 'REJECT',
          code: 403,
          message: blacklistResult.reason,
          isOldUser: false
        };
      }

      logger.info('Collision passed: new user');
      return {
        result: 'NEW_USER',
        code: 200,
        message: '未动用用户，未命中黑名单，判定为新用户',
        isOldUser: false
      };
    }

    logger.info('Used user in target product, checking last clear date...');
    
    if (targetActivity.lastClearDate) {
      const daysSinceClear = moment().diff(targetActivity.lastClearDate, 'days');
      const minClearDays = collisionConfig.minClearDays;
      
      logger.info(`Days since last clear: ${daysSinceClear}, required: ${minClearDays}`);
      
      if (daysSinceClear < minClearDays) {
        return {
          result: 'REJECT',
          code: 403,
          message: `结清时间不足${minClearDays}天，当前为${daysSinceClear}天`,
          isOldUser: true
        };
      }
    }

    logger.info('Checking blacklists for used user...');
    const blacklistResult = await this.checkBlacklists(phoneMd5);
    
    if (blacklistResult.isBlacklisted) {
      logger.info(`Blacklist hit: ${blacklistResult.reason}`);
      return {
        result: 'REJECT',
        code: 403,
        message: blacklistResult.reason,
        isOldUser: true
      };
    }

    logger.info('Collision passed: old user');
    return {
      result: 'OLD_USER',
      code: 200,
      message: '已动用用户，结清时间达标，未命中黑名单，判定为老用户',
      isOldUser: true
    };
  }
}

export default new CollisionService();
