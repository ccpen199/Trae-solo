import logger from '../utils/logger.js';
import moment from 'moment';

class MockController {
  async checkUserActivity(req, res) {
    const { phoneMd5, productId } = req.body;
    logger.info(`[MOCK] Check user activity: phoneMd5=${phoneMd5}, productId=${productId}`);
    
    const hasActivity = phoneMd5 ? (phoneMd5.endsWith('1') || phoneMd5.endsWith('3') || phoneMd5.endsWith('5')) : false;
    
    res.json({
      hasActivity,
      productId
    });
  }

  async getRiskLevel(req, res) {
    const { phoneMd5 } = req.body;
    logger.info(`[MOCK] Get risk level: phoneMd5=${phoneMd5}`);
    
    const lastChar = phoneMd5 ? phoneMd5.slice(-1) : '';
    let riskLevel;
    
    switch (lastChar) {
      case '0':
      case '1':
        riskLevel = 'A';
        break;
      case '2':
      case '3':
        riskLevel = 'B';
        break;
      case '4':
      case '5':
        riskLevel = 'C';
        break;
      case '6':
      case '7':
        riskLevel = 'D';
        break;
      case '8':
        riskLevel = 'E';
        break;
      case '9':
        riskLevel = 'Z';
        break;
      case 'a':
      case 'f':
        riskLevel = '';
        break;
      default:
        riskLevel = 'A';
    }
    
    res.json({
      riskLevel,
      phoneMd5
    });
  }

  async checkTargetProductActivity(req, res) {
    const { phoneMd5 } = req.body;
    logger.info(`[MOCK] Check target product activity: phoneMd5=${phoneMd5}`);
    
    const hasActivity = phoneMd5 ? (phoneMd5.endsWith('3') || phoneMd5.endsWith('7') || phoneMd5.endsWith('9')) : false;
    let lastClearDate = null;
    
    if (hasActivity && phoneMd5) {
      const daysAgo = phoneMd5.endsWith('3') ? 15 : phoneMd5.endsWith('7') ? 60 : 25;
      lastClearDate = moment().subtract(daysAgo, 'days').format('YYYY-MM-DD');
    }
    
    res.json({
      hasActivity,
      lastClearDate,
      phoneMd5
    });
  }

  async checkBlacklist(req, res) {
    const { phoneMd5, blacklistDays } = req.body;
    logger.info(`[MOCK] Check blacklist: phoneMd5=${phoneMd5}, blacklistDays=${blacklistDays}`);
    
    const isBlacklisted = phoneMd5 ? (phoneMd5.endsWith('b') || phoneMd5.endsWith('d')) : false;
    
    res.json({
      isBlacklisted,
      reason: isBlacklisted ? '风控黑名单命中' : null,
      phoneMd5
    });
  }

  async checkMemberCenter(req, res) {
    const { phonePlain } = req.body;
    logger.info(`[MOCK] Check member center: phonePlain=${phonePlain}`);
    
    const isRegistered = phonePlain && phonePlain.endsWith('9');
    
    res.json({
      isRegistered,
      userId: isRegistered ? `USER_${Date.now()}` : null
    });
  }

  async registerMember(req, res) {
    const { phonePlain, userData } = req.body;
    logger.info(`[MOCK] Register member: phonePlain=${phonePlain}`);
    
    const success = phonePlain ? !phonePlain.endsWith('8') : true;
    
    if (success) {
      res.json({
        success: true,
        userId: `USER_${Date.now()}`,
        message: '注册成功'
      });
    } else {
      res.json({
        success: false,
        message: '手机号已被注册或格式错误'
      });
    }
  }
}

export default new MockController();
