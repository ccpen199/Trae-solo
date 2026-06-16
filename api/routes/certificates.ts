import { Router, type Request, type Response } from 'express';
import { mockCertificates, type ApiResponse, type Certificate } from '../data/mockData.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

let certificatesData = [...mockCertificates];

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const userId = req.user?.id || '1';

    let certs = certificatesData.filter(c => c.userId === userId);

    if (type) {
      certs = certs.filter(c => c.type === type);
    }

    res.status(200).json({
      success: true,
      data: certs,
      message: '获取电子证照列表成功',
    } as ApiResponse<Certificate[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取电子证照列表失败',
    } as ApiResponse);
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    const certificate = certificatesData.find(c => c.id === id && c.userId === userId);

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: '证照不存在',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: certificate,
      message: '获取证照详情成功',
    } as ApiResponse<Certificate>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取证照详情失败',
    } as ApiResponse);
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certData = req.body;
    const userId = req.user?.id || '1';

    const newCertificate: Certificate = {
      id: `cert_${Date.now()}`,
      userId,
      type: certData.type,
      certificateNumber: certData.certificateNumber,
      name: certData.name,
      issueDate: new Date(certData.issueDate),
      expiryDate: new Date(certData.expiryDate),
      issuer: certData.issuer,
      imageUrl: certData.imageUrl || '',
      isValid: true,
    };

    certificatesData.push(newCertificate);

    res.status(201).json({
      success: true,
      data: newCertificate,
      message: '添加电子证照成功',
    } as ApiResponse<Certificate>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加电子证照失败',
    } as ApiResponse);
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id || '1';

    const index = certificatesData.findIndex(c => c.id === id && c.userId === userId);

    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '证照不存在',
      } as ApiResponse);
      return;
    }

    certificatesData[index] = {
      ...certificatesData[index],
      ...updateData,
    };

    res.status(200).json({
      success: true,
      data: certificatesData[index],
      message: '更新证照成功',
    } as ApiResponse<Certificate>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新证照失败',
    } as ApiResponse);
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    const index = certificatesData.findIndex(c => c.id === id && c.userId === userId);

    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '证照不存在',
      } as ApiResponse);
      return;
    }

    certificatesData.splice(index, 1);

    res.status(200).json({
      success: true,
      message: '删除证照成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除证照失败',
    } as ApiResponse);
  }
});

router.post('/verify/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    const certificate = certificatesData.find(c => c.id === id && c.userId === userId);

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: '证照不存在',
      } as ApiResponse);
      return;
    }

    const verificationResult = {
      isValid: certificate.isValid,
      verifiedAt: new Date(),
      certificateInfo: certificate,
      verificationCode: `VER_${Date.now()}`,
    };

    res.status(200).json({
      success: true,
      data: verificationResult,
      message: certificate.isValid ? '证照验证通过' : '证照已失效',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '证照验证失败',
    } as ApiResponse);
  }
});

router.post('/share/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { targetDepartment, expireHours = 24 } = req.body;
    const userId = req.user?.id || '1';

    const certificate = certificatesData.find(c => c.id === id && c.userId === userId);

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: '证照不存在',
      } as ApiResponse);
      return;
    }

    const shareLink = {
      shareId: `share_${Date.now()}`,
      certificateId: id,
      targetDepartment,
      expireAt: new Date(Date.now() + expireHours * 60 * 60 * 1000),
      createdAt: new Date(),
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAABmJLR0QA/wD/AP+gvaeTAAA=',
    };

    res.status(200).json({
      success: true,
      data: shareLink,
      message: '生成证照分享链接成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成证照分享链接失败',
    } as ApiResponse);
  }
});

router.get('/types', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certTypes = [
      { key: 'id_card', name: '居民身份证' },
      { key: 'household', name: '居民户口簿' },
      { key: 'social_security', name: '社会保障卡' },
      { key: 'marriage', name: '结婚证' },
      { key: 'birth', name: '出生医学证明' },
      { key: 'real_estate', name: '不动产权证' },
      { key: 'business_license', name: '营业执照' },
      { key: 'other', name: '其他证照' },
    ];

    res.status(200).json({
      success: true,
      data: certTypes,
      message: '获取证照类型成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取证照类型失败',
    } as ApiResponse);
  }
});

export default router;
