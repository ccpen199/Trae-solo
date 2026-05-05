import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import fetch from 'node-fetch';

class RegisterService {
  async checkIfRegistered(phonePlain, encryptedData) {
    try {
      const response = await fetch(`${config.memberCenterUrl}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phonePlain, 
          encryptedData,
          apiKey: config.getApiKey() 
        })
      });
      const data = await response.json();
      return {
        isRegistered: data.isRegistered || false,
        userId: data.userId
      };
    } catch (error) {
      logger.error(`Check registration failed: ${error.message}`);
      return { isRegistered: false, error: error.message };
    }
  }

  async registerUser(phonePlain, userData) {
    try {
      const response = await fetch(`${config.memberCenterUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phonePlain, 
          userData,
          apiKey: config.getApiKey() 
        })
      });
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          userId: data.userId,
          message: '注册成功'
        };
      }
      
      return {
        success: false,
        message: data.message || '注册失败'
      };
    } catch (error) {
      logger.error(`Register user failed: ${error.message}`);
      return {
        success: false,
        message: `注册接口调用失败: ${error.message}`
      };
    }
  }

  async processJointRegister(phoneMd5, phonePlain, encryptedData, isOldUser, collisionResult) {
    logger.info(`Starting joint registration for phoneMd5: ${phoneMd5}`);
    
    if (collisionResult === 'REJECT') {
      return {
        registerResult: 'SKIP',
        registerCode: 403,
        message: '撞库不通过，跳过注册',
        downloadUrl: null
      };
    }

    if (isOldUser) {
      const downloadUrl = config.getDownloadUrl(false);
      return {
        registerResult: 'OLD_USER',
        registerCode: 200,
        message: '老用户，直接返回下载链接',
        downloadUrl
      };
    }

    logger.info('Checking if user is already registered...');
    const checkResult = await this.checkIfRegistered(phonePlain, encryptedData);
    
    if (checkResult.isRegistered) {
      logger.info('User already registered, treating as old user');
      const downloadUrl = config.getDownloadUrl(false);
      return {
        registerResult: 'OLD_USER',
        registerCode: 200,
        message: '已注册用户，返回老用户下载链接',
        downloadUrl,
        isRegistered: true
      };
    }

    logger.info('User not registered, proceeding to register...');
    let userData = {};
    try {
      if (encryptedData) {
        userData = JSON.parse(encryptedData);
      }
    } catch (error) {
      logger.warn(`Failed to parse encrypted data: ${error.message}`);
    }

    const registerResult = await this.registerUser(phonePlain, userData);
    
    const isNewUser = !registerResult.success;
    const downloadUrl = config.getDownloadUrl(isNewUser);

    if (registerResult.success) {
      logger.info('Registration successful');
      return {
        registerResult: 'NEW_USER_SUCCESS',
        registerCode: 200,
        message: '联合注册成功',
        downloadUrl,
        userId: registerResult.userId
      };
    }

    logger.info(`Registration failed: ${registerResult.message}`);
    return {
      registerResult: 'NEW_USER_FAILED',
      registerCode: 500,
      message: `联合注册失败: ${registerResult.message}`,
      downloadUrl
    };
  }
}

export default new RegisterService();
