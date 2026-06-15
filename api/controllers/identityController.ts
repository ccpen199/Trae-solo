import { Request, Response } from 'express';
import { identityService } from '../services/identityService';
import type { ApiResponse, CertificateType } from '../../shared/types';

export const getCertificates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const certificates = await identityService.getCertificates(userId);
    res.json({
      code: 200,
      message: '获取成功',
      data: certificates,
      timestamp: Date.now(),
    } as ApiResponse<typeof certificates>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getCertificateByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const userId = (req as any).user?.id || 'user-001';
    const certificate = await identityService.getCertificateByType(userId, type as CertificateType);
    if (!certificate) {
      return res.status(404).json({
        code: 404,
        message: '证照不存在',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    res.json({
      code: 200,
      message: '获取成功',
      data: certificate,
      timestamp: Date.now(),
    } as ApiResponse<typeof certificate>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await identityService.verifyCertificate(id);
    res.json({
      code: 200,
      message: result.message,
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
