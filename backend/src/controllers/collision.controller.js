import logger from '../utils/logger.js';
import { md5, generateSignature } from '../utils/signature.js';
import accessService from '../services/access.service.js';
import collisionService from '../services/collision.service.js';
import registerService from '../services/register.service.js';
import recordService from '../services/record.service.js';
import alertService from '../services/alert.service.js';
import configService from '../services/config.service.js';

class CollisionController {
  async validateAccess(req, res) {
    try {
      const { phoneMd5, channelCode, productId } = req.body;
      const channel = req.channel;

      logger.info(`Access validation request: phoneMd5=${phoneMd5}, channelCode=${channelCode}, productId=${productId}`);

      if (!phoneMd5) {
        return res.status(400).json({
          code: 400,
          message: '缺少手机号MD5参数'
        });
      }

      const result = await accessService.validateAccess(
        phoneMd5,
        productId || channel.productId,
        channelCode
      );

      return res.json({
        code: result.code,
        message: result.message,
        data: {
          passed: result.passed,
          riskLevel: result.riskLevel,
          hasActivity: result.hasActivity
        }
      });
    } catch (error) {
      logger.error(`Access validation error: ${error.message}`);
      await alertService.recordApiFailure('validateAccess', req.body.phoneMd5, error.message);
      
      return res.status(500).json({
        code: 500,
        message: '准入校验失败'
      });
    }
  }

  async processCollision(req, res) {
    try {
      const { phoneMd5, phonePlain, channelCode, productId, accessResult } = req.body;
      const channel = req.channel;

      logger.info(`Collision processing request: phoneMd5=${phoneMd5}, channelCode=${channelCode}`);

      if (!phoneMd5) {
        return res.status(400).json({
          code: 400,
          message: '缺少手机号MD5参数'
        });
      }

      const collisionResult = await collisionService.validateCollision(phoneMd5, accessResult);

      return res.json({
        code: collisionResult.code,
        message: collisionResult.message,
        data: {
          result: collisionResult.result,
          isOldUser: collisionResult.isOldUser
        }
      });
    } catch (error) {
      logger.error(`Collision processing error: ${error.message}`);
      await alertService.recordApiFailure('processCollision', req.body.phoneMd5, error.message);
      
      return res.status(500).json({
        code: 500,
        message: '撞库处理失败'
      });
    }
  }

  async jointRegister(req, res) {
    try {
      const { phoneMd5, phonePlain, encryptedData, channelCode, isOldUser, collisionResult } = req.body;
      const channel = req.channel;

      logger.info(`Joint register request: phoneMd5=${phoneMd5}, channelCode=${channelCode}`);

      if (!phoneMd5) {
        return res.status(400).json({
          code: 400,
          message: '缺少手机号MD5参数'
        });
      }

      const result = await registerService.processJointRegister(
        phoneMd5,
        phonePlain,
        encryptedData,
        isOldUser,
        collisionResult
      );

      return res.json({
        code: result.registerCode,
        message: result.message,
        data: {
          registerResult: result.registerResult,
          downloadUrl: result.downloadUrl,
          userId: result.userId
        }
      });
    } catch (error) {
      logger.error(`Joint register error: ${error.message}`);
      await alertService.recordApiFailure('jointRegister', req.body.phoneMd5, error.message);
      
      return res.status(500).json({
        code: 500,
        message: '联合注册失败'
      });
    }
  }

  async fullProcess(req, res) {
    try {
      const { 
        phoneMd5, 
        phonePlain, 
        encryptedData, 
        channelCode, 
        productId 
      } = req.body;
      const channel = req.channel;

      logger.info(`Full process request: phoneMd5=${phoneMd5}, channelCode=${channelCode}`);

      if (!phoneMd5) {
        return res.status(400).json({
          code: 400,
          message: '缺少手机号MD5参数'
        });
      }

      const targetProductId = productId || channel.productId;
      let returnCode = 200;
      let returnMessage = '处理成功';
      let accessResultData = null;
      let collisionResultData = null;
      let registerResultData = null;
      let isOldUser = null;
      let downloadUrl = null;

      const accessResult = await accessService.validateAccess(
        phoneMd5,
        targetProductId,
        channelCode
      );
      accessResultData = {
        result: accessResult.passed ? 'PASS' : 'REJECT',
        code: accessResult.code,
        message: accessResult.message
      };

      if (!accessResult.passed) {
        returnCode = accessResult.code;
        returnMessage = accessResult.message;
        
        await recordService.createRecord({
          channelCode,
          productId: targetProductId,
          phonePlain,
          phoneMd5,
          accessResult: accessResultData.result,
          accessCode: accessResultData.code,
          returnCode,
          returnMessage
        });

        return res.json({
          code: returnCode,
          message: returnMessage,
          data: {
            accessResult: accessResultData,
            isOldUser,
            downloadUrl
          }
        });
      }

      const collisionResult = await collisionService.validateCollision(phoneMd5, accessResult.passed);
      collisionResultData = {
        result: collisionResult.result,
        code: collisionResult.code,
        message: collisionResult.message
      };
      isOldUser = collisionResult.isOldUser;

      if (collisionResult.result === 'REJECT') {
        returnCode = collisionResult.code;
        returnMessage = collisionResult.message;
        
        await recordService.createRecord({
          channelCode,
          productId: targetProductId,
          phonePlain,
          phoneMd5,
          accessResult: accessResultData.result,
          accessCode: accessResultData.code,
          collisionResult: collisionResultData.result,
          collisionCode: collisionResultData.code,
          returnCode,
          returnMessage,
          isOldUser
        });

        return res.json({
          code: returnCode,
          message: returnMessage,
          data: {
            accessResult: accessResultData,
            collisionResult: collisionResultData,
            isOldUser,
            downloadUrl
          }
        });
      }

      const registerResult = await registerService.processJointRegister(
        phoneMd5,
        phonePlain,
        encryptedData,
        isOldUser,
        collisionResult.result
      );
      registerResultData = {
        result: registerResult.registerResult,
        code: registerResult.registerCode,
        message: registerResult.message
      };
      downloadUrl = registerResult.downloadUrl;

      if (registerResult.registerCode !== 200 && !isOldUser) {
        returnCode = registerResult.registerCode;
        returnMessage = registerResult.message;
      }

      await recordService.createRecord({
        channelCode,
        productId: targetProductId,
        phonePlain,
        phoneMd5,
        accessResult: accessResultData.result,
        accessCode: accessResultData.code,
        collisionResult: collisionResultData.result,
        collisionCode: collisionResultData.code,
        registerResult: registerResultData.result,
        registerCode: registerResultData.code,
        returnCode,
        returnMessage,
        isOldUser,
        downloadUrl
      });

      return res.json({
        code: returnCode,
        message: returnMessage,
        data: {
          accessResult: accessResultData,
          collisionResult: collisionResultData,
          registerResult: registerResultData,
          isOldUser,
          downloadUrl
        }
      });
    } catch (error) {
      logger.error(`Full process error: ${error.message}`);
      await alertService.recordApiFailure('fullProcess', req.body.phoneMd5, error.message);
      
      return res.status(500).json({
        code: 500,
        message: '完整处理流程失败'
      });
    }
  }

  async getSignatureExample(req, res) {
    const params = {
      phoneMd5: 'e10adc3949ba59abbe56e057f20f883e',
      channelCode: 'SB001',
      productId: 'PROD001',
      timestamp: Date.now()
    };
    
    const sign = generateSignature(params);
    
    res.json({
      code: 200,
      message: '签名示例',
      data: {
        params,
        sign,
        fullRequest: {
          ...params,
          sign
        }
      }
    });
  }

  async generateMd5(req, res) {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        code: 400,
        message: '缺少待加密文本'
      });
    }
    
    const md5Hash = md5(text);
    res.json({
      code: 200,
      message: 'MD5加密成功',
      data: {
        original: text,
        md5: md5Hash
      }
    });
  }
}

export default new CollisionController();
