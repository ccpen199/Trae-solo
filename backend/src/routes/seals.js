const express = require('express');
const router = express.Router();
const db = require('../database');
const { buildSuccessResponse, buildErrorResponse, generateId } = require('../utils');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const sealManagerEngine = require('../engines/sealManagerEngine');
const evidenceBlockEngine = require('../engines/evidenceBlockEngine');

router.get('/my-seals', authMiddleware, async (req, res) => {
  try {
    const result = await sealManagerEngine.getUserSeals(req.user.userId);
    
    res.json(buildSuccessResponse({
      seals: result.seals
    }, '获取印章列表成功'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '获取印章列表失败'));
  }
});

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { sealName, sealType } = req.body;
    
    if (!sealName) {
      return res.status(400).json(
        buildErrorResponse(new Error('缺少参数'), '印章名称不能为空')
      );
    }
    
    const result = await sealManagerEngine.createSeal(
      req.user.userId,
      sealName,
      sealType || 'personal'
    );
    
    db.run(
      `INSERT INTO activity_logs 
       (id, user_id, user_name, action, description)
       VALUES (?, ?, ?, '创建印章', ?)`,
      [
        generateId(),
        req.user.userId,
        req.user.realName || req.user.username,
        `创建印章: ${sealName}`
      ]
    );
    
    res.json(buildSuccessResponse({
      sealId: result.sealId,
      sealName: result.sealName,
      sealType: result.sealType,
      createdAt: result.createdAt
    }, '印章创建成功'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '创建印章失败'));
  }
});

router.get('/:sealId', authMiddleware, async (req, res) => {
  try {
    const sealId = req.params.sealId;
    
    const result = await sealManagerEngine.getSealById(sealId, req.user.userId);
    
    if (!result.success) {
      return res.status(404).json(
        buildErrorResponse(new Error(result.error), '印章不存在')
      );
    }
    
    res.json(buildSuccessResponse({
      seal: {
        sealId: result.sealId,
        sealName: result.sealName,
        sealType: result.sealType,
        isActive: result.isActive,
        createdAt: result.createdAt
      }
    }, '获取印章成功'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '获取印章失败'));
  }
});

router.get('/:sealId/image', authMiddleware, async (req, res) => {
  try {
    const sealId = req.params.sealId;
    
    const result = await sealManagerEngine.getSealById(sealId, req.user.userId);
    
    if (!result.success) {
      return res.status(404).json(
        buildErrorResponse(new Error(result.error), '印章不存在')
      );
    }
    
    if (!result.sealImage) {
      return res.status(404).json(
        buildErrorResponse(new Error('印章图像不存在'), '印章图像不存在')
      );
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `inline; filename="seal-${sealId}.svg"`);
    res.send(result.sealImage);
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '获取印章图像失败'));
  }
});

router.post('/:sealId/deactivate', authMiddleware, async (req, res) => {
  try {
    const sealId = req.params.sealId;
    
    const result = await sealManagerEngine.deactivateSeal(sealId, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(
        buildErrorResponse(new Error(result.error), '停用印章失败')
      );
    }
    
    db.run(
      `INSERT INTO activity_logs 
       (id, user_id, user_name, action, description)
       VALUES (?, ?, ?, '停用印章', ?)`,
      [
        generateId(),
        req.user.userId,
        req.user.realName || req.user.username,
        `停用印章: ${sealId}`
      ]
    );
    
    res.json(buildSuccessResponse({
      sealId,
      deactivatedAt: result.deactivatedAt
    }, '印章已停用'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '停用印章失败'));
  }
});

router.post('/verify-access', authMiddleware, async (req, res) => {
  try {
    const { sealId, contractId } = req.body;
    
    if (!sealId) {
      return res.status(400).json(
        buildErrorResponse(new Error('缺少参数'), '印章ID不能为空')
      );
    }
    
    const accessResult = await sealManagerEngine.verifySealAccess(sealId, req.user.userId);
    
    if (!accessResult.success) {
      return res.status(403).json(
        buildErrorResponse(new Error(accessResult.error), '印章访问验证失败')
      );
    }
    
    if (contractId) {
      const tokenResult = await sealManagerEngine.generateSealVerificationToken(
        sealId,
        contractId
      );
      
      res.json(buildSuccessResponse({
        canUse: accessResult.canUse,
        seal: accessResult.seal,
        verificationToken: tokenResult.verificationToken,
        verificationData: tokenResult.verificationData
      }, '印章访问验证通过'));
      
    } else {
      res.json(buildSuccessResponse({
        canUse: accessResult.canUse,
        seal: accessResult.seal
      }, '印章访问验证通过'));
    }
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '印章访问验证失败'));
  }
});

module.exports = router;
