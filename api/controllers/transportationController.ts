import { Request, Response } from 'express';
import { transportationService } from '../services/transportationService';
import type { ApiResponse } from '../../shared/types';

export const generateBRTQRCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const result = await transportationService.generateBRTQRCode(userId);
    res.json({
      code: 200,
      message: '生成成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getNearbyParking = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        code: 400,
        message: '经纬度不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await transportationService.getNearbyParking(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseInt(radius as string) : 2000
    );
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getTrafficViolations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const { plateNumber } = req.query;
    const result = await transportationService.getTrafficViolations(
      userId,
      plateNumber as string | undefined
    );
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const payViolation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await transportationService.payViolation(id);
    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: '缴费失败',
        data: result,
        timestamp: Date.now(),
      } as ApiResponse<typeof result>);
    }
    res.json({
      code: 200,
      message: '缴费成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getBusRealTime = async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const result = await transportationService.getBusRealTime(routeId);
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};
