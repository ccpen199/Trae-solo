import { Router, type Request, type Response } from 'express';
import { type ApiResponse, type OCRResult } from '../data/mockData.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/recognize', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { image, type = 'id_card' } = req.body;

    if (!image) {
      res.status(400).json({
        success: false,
        message: '请上传识别图片',
      } as ApiResponse);
      return;
    }

    let ocrResult: OCRResult;

    switch (type) {
      case 'id_card':
        ocrResult = {
          success: true,
          text: '居民身份证\n姓名：张三\n性别：男\n民族：汉\n出生：1990年1月1日\n住址：北京市朝阳区xxx街道xxx号\n公民身份号码：110101199001011234',
          fields: {
            name: '张三',
            gender: '男',
            ethnicity: '汉',
            birthDate: '1990-01-01',
            address: '北京市朝阳区xxx街道xxx号',
            idNumber: '110101199001011234',
          },
          confidence: 98.5,
        };
        break;
      case 'household':
        ocrResult = {
          success: true,
          text: '居民户口簿\n户别：家庭户\n户主姓名：张三\n户号：110105001234567\n住址：北京市朝阳区xxx街道xxx号',
          fields: {
            householdType: '家庭户',
            householderName: '张三',
            householdNumber: '110105001234567',
            address: '北京市朝阳区xxx街道xxx号',
          },
          confidence: 97.2,
        };
        break;
      case 'business_license':
        ocrResult = {
          success: true,
          text: '营业执照\n统一社会信用代码：91110105MA01234567\n名称：北京某某科技有限公司\n类型：有限责任公司\n法定代表人：张三\n注册资本：100万元\n成立日期：2023年01月10日',
          fields: {
            creditCode: '91110105MA01234567',
            companyName: '北京某某科技有限公司',
            companyType: '有限责任公司',
            legalPerson: '张三',
            registeredCapital: '100万元',
            establishDate: '2023-01-10',
          },
          confidence: 96.8,
        };
        break;
      default:
        ocrResult = {
          success: true,
          text: '识别结果：\n这是一段示例文本内容\nOCR识别成功',
          fields: {
            content: '这是一段示例文本内容',
          },
          confidence: 95.0,
        };
    }

    res.status(200).json({
      success: true,
      data: ocrResult,
      message: 'OCR识别成功',
    } as ApiResponse<OCRResult>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OCR识别失败，请稍后重试',
    } as ApiResponse);
  }
});

router.post('/batch', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({
        success: false,
        message: '请上传识别图片列表',
      } as ApiResponse);
      return;
    }

    const results: OCRResult[] = images.map(() => ({
      success: true,
      text: '批量识别结果',
      fields: {
        name: '张三',
        idNumber: '110101199001011234',
      },
      confidence: 95.0 + Math.random() * 4,
    }));

    res.status(200).json({
      success: true,
      data: results,
      message: '批量OCR识别成功',
    } as ApiResponse<OCRResult[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量OCR识别失败，请稍后重试',
    } as ApiResponse);
  }
});

router.get('/types', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ocrTypes = [
      { key: 'id_card', name: '身份证识别' },
      { key: 'household', name: '户口簿识别' },
      { key: 'social_security', name: '社保卡识别' },
      { key: 'marriage', name: '结婚证识别' },
      { key: 'birth', name: '出生证明识别' },
      { key: 'business_license', name: '营业执照识别' },
      { key: 'real_estate', name: '不动产证识别' },
      { key: 'other', name: '通用识别' },
    ];

    res.status(200).json({
      success: true,
      data: ocrTypes,
      message: '获取OCR识别类型成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取OCR识别类型失败',
    } as ApiResponse);
  }
});

export default router;
