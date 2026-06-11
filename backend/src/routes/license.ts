import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getDb } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { generateLicenseNumber, generateVerifyCode, generateQRCodeData, verifyQRCode } from '../utils/token';
import { License, LicenseVerifyRecord, LicenseUsageRecord, User, InsuranceInfo } from '../types';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { status, page = 1, pageSize = 20 } = req.query;
    const db = getDb();

    let sql = 'SELECT * FROM licenses WHERE user_id = ?';
    const params: any[] = [userId];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    const total = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as any;
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const licenses = db.prepare(sql).all(...params) as any[];

    const result = licenses.map((lic: any) => ({
      ...lic,
      electronicSignature: !!lic.electronic_signature
    }));

    return paginatedResponse(res, result, total.count, Number(page), Number(pageSize));
  } catch (error) {
    console.error('[License] 获取证照列表失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/ecard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const db = getDb();

    const ecard = db.prepare(`
      SELECT * FROM licenses 
      WHERE user_id = ? AND type = 'social_security_card'
      ORDER BY created_at DESC LIMIT 1
    `).get(userId) as any;

    if (!ecard) {
      return errorResponse(res, '电子社保卡不存在', 404);
    }

    const insurance = db.prepare('SELECT * FROM insurance_info WHERE user_id = ?').get(userId) as InsuranceInfo;

    return successResponse(res, {
      id: ecard.id,
      cardNumber: ecard.license_code,
      holderName: ecard.holder_name,
      holderIdCard: ecard.holder_id_card,
      issuer: ecard.issuer,
      issueDate: ecard.issue_date,
      validDate: ecard.valid_to,
      status: ecard.status,
      medicalBalance: insurance?.pension_balance || 0,
      pensionBalance: insurance?.pension_balance || 0
    });
  } catch (error) {
    console.error('[License] 获取电子社保卡失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const db = getDb();

    const license = db.prepare('SELECT * FROM licenses WHERE id = ? AND user_id = ?').get(id, userId) as any;

    if (!license) {
      return errorResponse(res, '证照不存在', 404);
    }

    const verifyRecords = db.prepare(`
      SELECT * FROM license_verify_records 
      WHERE license_id = ? 
      ORDER BY verify_time DESC LIMIT 20
    `).all(id) as LicenseVerifyRecord[];

    const usageRecords = db.prepare(`
      SELECT * FROM license_usage_records 
      WHERE license_id = ? 
      ORDER BY usage_time DESC LIMIT 20
    `).all(id) as LicenseUsageRecord[];

    return successResponse(res, {
      ...license,
      electronicSignature: !!license.electronic_signature,
      verifyRecords,
      usageRecords
    });
  } catch (error) {
    console.error('[License] 获取证照详情失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.post('/apply', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { type, name, deliveryMethod, deliveryAddress, bankName, bankCardNumber } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    const licenseNumber = generateLicenseNumber();
    const verifyCode = generateVerifyCode(8);
    const qrCode = generateQRCodeData(`${licenseNumber}_${userId}`);

    const now = dayjs();
    const validTo = now.add(10, 'year').format('YYYY-MM-DD');

    const insertLicense = db.prepare(`
      INSERT INTO licenses (user_id, type, type_name, license_code, holder_name, holder_id_card,
                            issuer, issuer_code, issue_date, valid_from, valid_to, status,
                            verify_code, qr_code, electronic_signature, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `);

    const result = insertLicense.run(
      userId,
      type || 'social_security_card',
      name || '社会保障卡',
      licenseNumber,
      user.real_name,
      user.id_card,
      '江苏省人力资源和社会保障厅',
      'JS_HRSS_320000',
      now.format('YYYY-MM-DD'),
      now.format('YYYY-MM-DD'),
      validTo,
      verifyCode,
      qrCode,
      1,
      now.toISOString(),
      now.toISOString()
    );

    const licenseId = result.lastInsertRowid as number;

    return successResponse(res, {
      licenseId,
      licenseNumber,
      status: 'pending',
      estimatedTime: '3个工作日'
    }, '证照申请已提交');
  } catch (error) {
    console.error('[License] 证照申请失败:', error);
    return errorResponse(res, '证照申请失败，请重试', 500);
  }
});

router.post('/:id/activate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const db = getDb();

    const result = db.prepare(`
      UPDATE licenses SET status = 'active', updated_at = ? 
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `).run(dayjs().toISOString(), id, userId);

    if (result.changes === 0) {
      return errorResponse(res, '证照不存在或状态不允许激活', 400);
    }

    return successResponse(res, { activated: true, status: 'active' }, '证照激活成功');
  } catch (error) {
    console.error('[License] 证照激活失败:', error);
    return errorResponse(res, '激活失败，请重试', 500);
  }
});

router.post('/:id/report-loss', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const db = getDb();

    const result = db.prepare(`
      UPDATE licenses SET status = 'revoked', updated_at = ? 
      WHERE id = ? AND user_id = ? AND status IN ('active', 'expiring')
    `).run(dayjs().toISOString(), id, userId);

    if (result.changes === 0) {
      return errorResponse(res, '证照不存在或状态不允许挂失', 400);
    }

    return successResponse(res, { reported: true, status: 'revoked' }, '证照挂失成功');
  } catch (error) {
    console.error('[License] 证照挂失失败:', error);
    return errorResponse(res, '挂失失败，请重试', 500);
  }
});

router.post('/:id/unreport-loss', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const db = getDb();

    const result = db.prepare(`
      UPDATE licenses SET status = 'active', updated_at = ? 
      WHERE id = ? AND user_id = ? AND status = 'revoked'
    `).run(dayjs().toISOString(), id, userId);

    if (result.changes === 0) {
      return errorResponse(res, '证照不存在或状态不允许解挂', 400);
    }

    return successResponse(res, { unreported: true, status: 'active' }, '证照解挂成功');
  } catch (error) {
    console.error('[License] 证照解挂失败:', error);
    return errorResponse(res, '解挂失败，请重试', 500);
  }
});

router.post('/:id/renew', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const db = getDb();

    const license = db.prepare('SELECT * FROM licenses WHERE id = ? AND user_id = ?').get(id, userId) as any;

    if (!license) {
      return errorResponse(res, '证照不存在', 404);
    }

    const currentValidTo = dayjs(license.valid_to);
    const newValidTo = currentValidTo.add(1, 'year').format('YYYY-MM-DD');

    db.prepare(`
      UPDATE licenses SET valid_to = ?, status = 'active', updated_at = ? 
      WHERE id = ? AND user_id = ?
    `).run(newValidTo, dayjs().toISOString(), id, userId);

    return successResponse(res, { renewed: true, newValidTo, status: 'active' }, '证照续期成功');
  } catch (error) {
    console.error('[License] 证照续期失败:', error);
    return errorResponse(res, '续期失败，请重试', 500);
  }
});

router.post('/ecard/qrcode', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const db = getDb();

    const ecard = db.prepare(`
      SELECT * FROM licenses 
      WHERE user_id = ? AND type = 'social_security_card' AND status = 'active'
    `).get(userId) as any;

    if (!ecard) {
      return errorResponse(res, '没有有效的电子社保卡', 400);
    }

    const qrData = generateQRCodeData(`${ecard.license_code}_${Date.now()}`);
    
    db.prepare(`
      UPDATE licenses SET qr_code = ?, updated_at = ? 
      WHERE id = ? AND user_id = ?
    `).run(qrData, dayjs().toISOString(), ecard.id, userId);

    db.prepare(`
      INSERT INTO license_verify_records (license_id, verify_method, verify_time, verifier, verify_location, result, created_at)
      VALUES (?, 'qrcode', ?, '用户主动出示', '移动端APP', 'valid', ?)
    `).run(ecard.id, dayjs().toISOString(), dayjs().toISOString());

    return successResponse(res, {
      qrCode: qrData,
      expiresIn: 60,
      cardNumber: ecard.license_code,
      holderName: ecard.holder_name
    }, '二维码生成成功');
  } catch (error) {
    console.error('[License] 生成二维码失败:', error);
    return errorResponse(res, '生成失败，请重试', 500);
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { qrCode, verifyCode, licenseNumber } = req.body;

    if (qrCode) {
      const verifyResult = verifyQRCode(qrCode);
      if (!verifyResult.valid) {
        return successResponse(res, {
          valid: false,
          reason: '二维码已过期或无效'
        }, '验真完成');
      }

      const db = getDb();
      const license = db.prepare('SELECT * FROM licenses WHERE qr_code = ?').get(qrCode) as any;
      
      if (!license) {
        return successResponse(res, { valid: false, reason: '证照信息不存在' }, '验真完成');
      }

      db.prepare(`
        INSERT INTO license_verify_records (license_id, verify_method, verify_time, verifier, verify_location, result, created_at)
        VALUES (?, 'qrcode', ?, '扫码验真', '线下网点', ?, ?)
      `).run(license.id, dayjs().toISOString(), license.status === 'active' ? 'valid' : 'expired', dayjs().toISOString());

      return successResponse(res, {
        valid: license.status === 'active',
        license: {
          name: license.type_name,
          licenseNumber: license.license_code,
          holderName: license.holder_name,
          issuer: license.issuer,
          validTo: license.valid_to,
          status: license.status
        }
      }, '验真完成');
    }

    if (verifyCode && licenseNumber) {
      const db = getDb();
      const license = db.prepare(`
        SELECT * FROM licenses 
        WHERE license_code = ? AND verify_code = ?
      `).get(licenseNumber, verifyCode) as any;

      if (!license) {
        return successResponse(res, { valid: false, reason: '验证码或证照编号不匹配' }, '验真完成');
      }

      db.prepare(`
        INSERT INTO license_verify_records (license_id, verify_method, verify_time, verifier, verify_location, result, created_at)
        VALUES (?, 'manual', ?, '人工核验', '线下网点', ?, ?)
      `).run(license.id, dayjs().toISOString(), license.status === 'active' ? 'valid' : 'expired', dayjs().toISOString());

      return successResponse(res, {
        valid: license.status === 'active',
        license: {
          name: license.type_name,
          licenseNumber: license.license_code,
          holderName: license.holder_name,
          issuer: license.issuer,
          validTo: license.valid_to,
          status: license.status
        }
      }, '验真完成');
    }

    return errorResponse(res, '请提供二维码或验证码和证照编号', 400);
  } catch (error) {
    console.error('[License] 证照验真失败:', error);
    return errorResponse(res, '验真失败，请重试', 500);
  }
});

router.get('/:id/usage-records', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const db = getDb();

    const license = db.prepare('SELECT id FROM licenses WHERE id = ? AND user_id = ?').get(id, userId) as any;
    
    if (!license) {
      return errorResponse(res, '证照不存在', 404);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM license_usage_records WHERE license_id = ?
    `).get(id) as any;

    const records = db.prepare(`
      SELECT * FROM license_usage_records 
      WHERE license_id = ? 
      ORDER BY usage_time DESC LIMIT ? OFFSET ?
    `).all(id, Number(pageSize), (Number(page) - 1) * Number(pageSize)) as any[];

    return paginatedResponse(res, records, total.count, Number(page), Number(pageSize));
  } catch (error) {
    console.error('[License] 获取使用记录失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

router.get('/:id/verify-records', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const db = getDb();

    const license = db.prepare('SELECT id FROM licenses WHERE id = ? AND user_id = ?').get(id, userId) as any;
    
    if (!license) {
      return errorResponse(res, '证照不存在', 404);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM license_verify_records WHERE license_id = ?
    `).get(id) as any;

    const records = db.prepare(`
      SELECT * FROM license_verify_records 
      WHERE license_id = ? 
      ORDER BY verify_time DESC LIMIT ? OFFSET ?
    `).all(id, Number(pageSize), (Number(page) - 1) * Number(pageSize)) as any[];

    return paginatedResponse(res, records, total.count, Number(page), Number(pageSize));
  } catch (error) {
    console.error('[License] 获取验真记录失败:', error);
    return errorResponse(res, '获取失败，请重试', 500);
  }
});

export default router;
