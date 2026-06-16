import { Router, type Request, type Response } from 'express';
import { type ApiResponse, type SignatureResult } from '../data/mockData.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/sign', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, signType = 'digital', certificateId } = req.body;
    const userId = req.user?.id || '1';

    if (!data) {
      res.status(400).json({
        success: false,
        message: '请提供待签名数据',
      } as ApiResponse);
      return;
    }

    const signatureResult: SignatureResult = {
      success: true,
      signatureId: `sig_${Date.now()}`,
      signedData: Buffer.from(`${data}_signed_${userId}_${Date.now()}`).toString('base64'),
      timestamp: new Date(),
    };

    res.status(200).json({
      success: true,
      data: {
        ...signatureResult,
        signType,
        certificateId,
        signerId: userId,
      },
      message: '电子签名成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '电子签名失败，请稍后重试',
    } as ApiResponse);
  }
});

router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { signatureId, signedData, originalData } = req.body;

    if (!signatureId || !signedData || !originalData) {
      res.status(400).json({
        success: false,
        message: '请提供完整的签名验证数据',
      } as ApiResponse);
      return;
    }

    const isValid = Math.random() > 0.1;

    res.status(200).json({
      success: true,
      data: {
        isValid,
        signatureId,
        verifiedAt: new Date(),
        signer: isValid ? { id: '1', name: '张三' } : null,
        verificationCode: `VER_${Date.now()}`,
      },
      message: isValid ? '签名验证通过' : '签名验证失败',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '签名验证失败，请稍后重试',
    } as ApiResponse);
  }
});

router.get('/certificates', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || '1';

    const signCertificates = [
      {
        id: 'cert_sig_1',
        name: '个人数字证书',
        type: 'personal',
        issuer: 'XX电子认证服务中心',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        isValid: true,
        userId,
      },
      {
        id: 'cert_sig_2',
        name: '企业数字证书',
        type: 'enterprise',
        issuer: 'XX电子认证服务中心',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        isValid: true,
        userId,
      },
    ];

    res.status(200).json({
      success: true,
      data: signCertificates,
      message: '获取签名证书成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取签名证书失败',
    } as ApiResponse);
  }
});

router.post('/handwritten', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { image, data } = req.body;
    const userId = req.user?.id || '1';

    if (!image) {
      res.status(400).json({
        success: false,
        message: '请上传手写签名图片',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        signatureId: `sig_hand_${Date.now()}`,
        imageUrl: image,
        signedData: data ? Buffer.from(`${data}_handwritten_${Date.now()}`).toString('base64') : null,
        timestamp: new Date(),
        signerId: userId,
      },
      message: '手写签名成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '手写签名失败，请稍后重试',
    } as ApiResponse);
  }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || '1';
    const { page = 1, pageSize = 10 } = req.query;

    const history = [];
    for (let i = 0; i < 5; i++) {
      history.push({
        id: `sig_history_${i}`,
        type: i % 2 === 0 ? 'digital' : 'handwritten',
        documentName: `申请文件_${i + 1}.pdf`,
        signedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: 'success',
        userId,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        list: history,
        total: history.length,
        page: Number(page),
        pageSize: Number(pageSize),
      },
      message: '获取签名历史成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取签名历史失败',
    } as ApiResponse);
  }
});

export default router;
