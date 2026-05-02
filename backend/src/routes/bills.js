const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const billService = require('../services/billService');

const getCurrentUser = (req) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (!userId || !userRole) {
    return null;
  }
  return {
    id: parseInt(userId),
    role: userRole,
  };
};

router.get('/main/:mainId', (req, res) => {
  try {
    const { mainId } = req.params;
    const bill = billService.getBillByMainId(parseInt(mainId));

    if (!bill) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error('Get bill by mainId error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bill = billService.getBillById(parseInt(id));

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: '提单不存在',
      });
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', [
  body('mainId').notEmpty().withMessage('主单ID不能为空'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const {
      mainId,
      consignor,
      consignee,
      notifyParty,
      portOfLoading,
      portOfDischarge,
      vesselName,
      voyageNumber,
      containerCount,
      grossWeight,
      measurement,
    } = req.body;

    const result = billService.createBill({
      mainId: parseInt(mainId),
      consignor,
      consignee,
      notifyParty,
      portOfLoading,
      portOfDischarge,
      vesselName,
      voyageNumber,
      containerCount: containerCount ? parseInt(containerCount) : null,
      grossWeight: grossWeight ? parseFloat(grossWeight) : null,
      measurement: measurement ? parseFloat(measurement) : null,
      userId: user.id,
      userRole: user.role,
    });

    res.json(result);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const {
      consignor,
      consignee,
      notifyParty,
      portOfLoading,
      portOfDischarge,
      vesselName,
      voyageNumber,
      containerCount,
      grossWeight,
      measurement,
    } = req.body;

    const result = billService.updateBill({
      id: parseInt(id),
      consignor,
      consignee,
      notifyParty,
      portOfLoading,
      portOfDischarge,
      vesselName,
      voyageNumber,
      containerCount: containerCount !== undefined ? parseInt(containerCount) : undefined,
      grossWeight: grossWeight !== undefined ? parseFloat(grossWeight) : undefined,
      measurement: measurement !== undefined ? parseFloat(measurement) : undefined,
      userId: user.id,
      userRole: user.role,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/lock/:mainId', (req, res) => {
  try {
    const { mainId } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const result = billService.lockBill(
      parseInt(mainId),
      user.id,
      user.role
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Lock bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/unlock/:mainId', (req, res) => {
  try {
    const { mainId } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const result = billService.unlockBill(
      parseInt(mainId),
      user.id,
      user.role
    );

    res.json(result);
  } catch (error) {
    console.error('Unlock bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/release/:mainId', (req, res) => {
  try {
    const { mainId } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment } = req.body;

    const result = billService.releaseBill({
      mainId: parseInt(mainId),
      userId: user.id,
      userRole: user.role,
      comment,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Release bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
