import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';
import configService from './config.service.js';
import config from '../config/index.js';
import fetch from 'node-fetch';

class AccessService {
  async checkUserActivity(phoneMd5, productId) {
    try {
      const response = await fetch(`${config.userActivityUrl}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneMd5, productId, apiKey: config.getApiKey() })
      });
      const data = await response.json();
      return data.hasActivity || false;
    } catch (error) {
      logger.error(`Check user activity failed: ${error.message}`);
      return false;
    }
  }

  async getRiskLevel(phoneMd5) {
    try {
      const response = await fetch(`${config.riskCheckUrl}/level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneMd5, apiKey: config.getApiKey() })
      });
      const data = await response.json();
      return data.riskLevel || null;
    } catch (error) {
      logger.error(`Get risk level failed: ${error.message}`);
      return 'FAILED';
    }
  }

  async validateAccess(phoneMd5, productId, channelCode) {
    logger.info(`Starting access validation for phoneMd5: ${phoneMd5}, productId: ${productId}`);
    
    const accessConfig = await configService.getAccessConfig();
    
    const hasActivity = await this.checkUserActivity(phoneMd5, productId);
    logger.info(`User activity check: hasActivity=${hasActivity}`);

    if (!hasActivity) {
      const passed = accessConfig.unUsedUserPass;
      logger.info(`Unused user, access result: ${passed ? 'PASS' : 'REJECT'}`);
      return {
        passed,
        code: passed ? 200 : 403,
        message: passed ? '未动用用户，准入通过' : '未动用用户，准入不通过',
        riskLevel: null,
        hasActivity: false
      };
    }

    const riskLevel = await this.getRiskLevel(phoneMd5);
    logger.info(`Risk level check: riskLevel=${riskLevel}`);

    let passed = false;
    let message = '';

    if (riskLevel === null || riskLevel === undefined || riskLevel === '') {
      passed = accessConfig.emptyLevelPass;
      message = passed ? '风控等级为空，默认准入通过' : '风控等级为空，准入不通过';
    } else if (riskLevel === 'FAILED') {
      passed = accessConfig.failedLevelPass;
      message = passed ? '风控等级获取失败，默认准入通过' : '风控等级获取失败，准入不通过';
    } else {
      const levelKey = `riskLevel${riskLevel.toUpperCase()}Pass`;
      passed = accessConfig[levelKey] ?? true;
      message = passed 
        ? `风控等级${riskLevel.toUpperCase()}，准入通过` 
        : `风控等级${riskLevel.toUpperCase()}，准入不通过`;
    }

    logger.info(`Access validation result: ${passed ? 'PASS' : 'REJECT'}`);

    return {
      passed,
      code: passed ? 200 : 403,
      message,
      riskLevel,
      hasActivity: true
    };
  }
}

export default new AccessService();
