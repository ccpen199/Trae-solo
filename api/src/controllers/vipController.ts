import { Request, Response } from 'express';
import * as vipService from '../services/vipService.js';
import type { ApiResponse } from '../types/index.js';

export const getVipInfo = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    
    const info = vipService.getVipInfo(userId);
    
    if (!info) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '用户不存在'
      });
      return;
    }
    
    const response: ApiResponse = {
      code: 0,
      data: info
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取VIP信息失败'
    });
  }
};

export const getPoints = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    
    const points = vipService.getUserPoints(userId);
    
    const response: ApiResponse = {
      code: 0,
      data: points
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取积分失败'
    });
  }
};

export const addPoints = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { points, source } = req.body;
    
    if (!points || !source) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '参数不完整'
      });
      return;
    }
    
    const result = vipService.addPoints(userId, points, source);
    
    if (result) {
      res.json({
        code: 0,
        data: { success: true },
        message: '积分添加成功'
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        message: '积分添加失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '积分添加失败'
    });
  }
};

export const usePoints = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    
    if (!points) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '请输入使用积分数'
      });
      return;
    }
    
    const result = vipService.usePoints(userId, points);
    
    if (result) {
      res.json({
        code: 0,
        data: { success: true },
        message: '积分使用成功'
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        message: '积分不足或使用失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '积分使用失败'
    });
  }
};

export const getCoupons = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    
    const coupons = vipService.getUserCoupons(userId);
    
    const response: ApiResponse = {
      code: 0,
      data: coupons
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取优惠券失败'
    });
  }
};

export const issueBuy1Get1Coupon = (req: Request, res: Response): void => {
  try {
    const { userId } = req.body;
    
    const coupon = vipService.issueBuy1Get1Coupon(userId);
    
    if (coupon) {
      res.json({
        code: 0,
        data: coupon,
        message: '买一赠一券发放成功'
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        message: '发放失败，请检查VIP等级或已拥有的优惠券数量'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '发放失败'
    });
  }
};

export const checkIn = (req: Request, res: Response): void => {
  try {
    const { userId } = req.body;
    
    const result = vipService.checkIn(userId);
    
    if (result.success) {
      res.json({
        code: 0,
        data: result,
        message: `签到成功，获得${result.points}积分`
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        message: '今日已签到'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '签到失败'
    });
  }
};
