import { Request, Response } from 'express';
import { educationService, type EnrollmentRequest } from '../services/educationService';
import type { ApiResponse } from '../../shared/types';

export const getSchools = async (req: Request, res: Response) => {
  try {
    const { type, district } = req.query;
    const result = await educationService.getSchools(
      type as 'primary' | 'middle' | 'high' | undefined,
      district as string | undefined
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

export const getSchoolByAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({
        code: 400,
        message: '地址不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await educationService.getSchoolByAddress(address as string);
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

export const submitEnrollment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const request: EnrollmentRequest = {
      ...req.body,
      userId,
    };
    if (!request.childName || !request.childIdCard || !request.schoolId) {
      return res.status(400).json({
        code: 400,
        message: '必填项不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await educationService.submitEnrollment(request);
    res.json({
      code: 200,
      message: '提交成功',
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

export const getEnrollmentStatus = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const result = await educationService.getEnrollmentStatus(applicationId);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
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

export const getEnrollmentList = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const result = await educationService.getEnrollmentList(userId);
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

export const getEnrollmentGuidelines = async (_req: Request, res: Response) => {
  try {
    const result = await educationService.getEnrollmentGuidelines();
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
