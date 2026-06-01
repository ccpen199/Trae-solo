import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { logOperation, addBlockchainRecord } from '../security.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tax_service_secret_key_2024';

const TAX_BRACKETS = [
  { min: 0, max: 36000, rate: 0.03, deduction: 0 },
  { min: 36000, max: 144000, rate: 0.10, deduction: 2520 },
  { min: 144000, max: 300000, rate: 0.20, deduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, deduction: 31920 },
  { min: 420000, max: 660000, rate: 0.30, deduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, deduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, deduction: 181920 },
];

function calculateTax(taxableIncome: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.max) {
      return Math.max(0, taxableIncome * bracket.rate - bracket.deduction);
    }
  }
  return Math.max(0, taxableIncome * 0.45 - 181920);
}

function verifyDeduction(deductionType: string, details: any): { valid: boolean; error?: string } {
  const currentYear = new Date().getFullYear();
  
  switch (deductionType) {
    case 'children_education':
      if (!details.childBirthYear) {
        return { valid: false, error: '请填写子女出生年份' };
      }
      const childAge = currentYear - parseInt(details.childBirthYear);
      if (childAge < 3 || childAge > 25) {
        return { valid: false, error: '子女年龄不符合扣除条件（3岁-25岁）' };
      }
      return { valid: true };
      
    case 'continuing_education':
      if (!details.educationType) {
        return { valid: false, error: '请选择继续教育类型' };
      }
      return { valid: true };
      
    case 'serious_illness':
      if (!details.medicalAmount || parseFloat(details.medicalAmount) < 15000) {
        return { valid: false, error: '大病医疗支出需超过15000元才可扣除' };
      }
      return { valid: true };
      
    case 'housing_loan':
      if (!details.loanStartDate) {
        return { valid: false, error: '请填写贷款起始日期' };
      }
      return { valid: true };
      
    case 'housing_rent':
      if (!details.city) {
        return { valid: false, error: '请填写租赁城市' };
      }
      return { valid: true };
      
    case 'elderly_support':
      if (!details.elderBirthYear) {
        return { valid: false, error: '请填写老人出生年份' };
      }
      const elderAge = currentYear - parseInt(details.elderBirthYear);
      if (elderAge < 60) {
        return { valid: false, error: '被赡养老人需年满60周岁' };
      }
      return { valid: true };
      
    default:
      return { valid: false, error: '未知的扣除类型' };
  }
}

function getDeductionAmount(deductionType: string, _details: any): number {
  const amounts: Record<string, number> = {
    children_education: 12000,
    continuing_education: 4800,
    serious_illness: 80000,
    housing_loan: 12000,
    housing_rent: 18000,
    elderly_support: 24000,
  };
  return amounts[deductionType] || 0;
}

router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const declarations = db.prepare(`
      SELECT * FROM tax_declarations 
      WHERE user_id = ? 
      ORDER BY tax_year DESC
    `).all(decoded.userId);
    
    res.json({
      success: true,
      data: declarations
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const declaration = db.prepare(`
      SELECT * FROM tax_declarations 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, decoded.userId) as any;
    
    if (!declaration) {
      res.status(404).json({ success: false, error: '申报记录不存在' });
      return;
    }
    
    const deductions = db.prepare(`
      SELECT * FROM special_deductions WHERE declaration_id = ?
    `).all(req.params.id);
    
    const incomeDetails = db.prepare(`
      SELECT * FROM income_details WHERE declaration_id = ?
    `).all(req.params.id);
    
    const refundTracking = db.prepare(`
      SELECT * FROM refund_tracking WHERE declaration_id = ? ORDER BY created_at ASC
    `).all(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...declaration,
        deductions,
        incomeDetails,
        refundTracking
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { taxYear } = req.body;
    const year = taxYear || new Date().getFullYear() - 1;
    
    const existing = db.prepare(`
      SELECT id FROM tax_declarations WHERE user_id = ? AND tax_year = ?
    `).get(decoded.userId, year);
    
    if (existing) {
      res.json({
        success: true,
        message: '申报记录已存在',
        data: { declarationId: (existing as any).id }
      });
      return;
    }
    
    const result = db.prepare(`
      INSERT INTO tax_declarations (user_id, tax_year, status)
      VALUES (?, ?, 'draft')
    `).run(decoded.userId, year);
    
    const declarationId = result.lastInsertRowid as number;
    
    const mockIncomes = [
      { type: '工资薪金', payer: '某科技有限公司', amount: 180000, tax: 10800 },
      { type: '劳务报酬', payer: '某咨询公司', amount: 20000, tax: 3200 },
    ];
    
    const insertIncome = db.prepare(`
      INSERT INTO income_details (user_id, declaration_id, income_type, payer_name, income_amount, tax_withheld, income_date, tax_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const income of mockIncomes) {
      insertIncome.run(
        decoded.userId,
        declarationId,
        income.type,
        income.payer,
        income.amount,
        income.tax,
        `${year}-12-31`,
        year
      );
    }
    
    const totalIncome = mockIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalTaxPaid = mockIncomes.reduce((sum, i) => sum + i.tax, 0);
    
    db.prepare(`
      UPDATE tax_declarations 
      SET total_income = ?, total_tax_paid = ?
      WHERE id = ?
    `).run(totalIncome, totalTaxPaid, declarationId);
    
    logOperation('declaration_create', decoded.userId, undefined, req.ip, undefined, { declarationId, taxYear: year });
    
    res.json({
      success: true,
      message: '申报记录创建成功',
      data: { declarationId, taxYear: year }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '创建申报记录失败' });
  }
});

router.post('/:id/deduction', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const declarationId = parseInt(req.params.id);
    const { deductionType, details, startDate, endDate } = req.body;
    
    const declaration = db.prepare(`
      SELECT * FROM tax_declarations WHERE id = ? AND user_id = ?
    `).get(declarationId, decoded.userId);
    
    if (!declaration) {
      res.status(404).json({ success: false, error: '申报记录不存在' });
      return;
    }
    
    const verification = verifyDeduction(deductionType, details || {});
    if (!verification.valid) {
      res.status(400).json({ success: false, error: verification.error });
      return;
    }
    
    const amount = getDeductionAmount(deductionType, details || {});
    
    db.prepare(`
      INSERT INTO special_deductions (declaration_id, deduction_type, amount, details, start_date, end_date, verified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(declarationId, deductionType, amount, JSON.stringify(details), startDate || null, endDate || null);
    
    const totalDeduction = db.prepare(`
      SELECT SUM(amount) as total FROM special_deductions WHERE declaration_id = ?
    `).get(declarationId) as { total: number };
    
    db.prepare(`
      UPDATE tax_declarations SET total_deduction = ? WHERE id = ?
    `).run(totalDeduction.total || 0, declarationId);
    
    logOperation('deduction_add', decoded.userId, undefined, req.ip, undefined, { declarationId, deductionType });
    
    res.json({
      success: true,
      message: '专项附加扣除添加成功',
      data: { deductionType, amount, totalDeduction: totalDeduction.total || 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '添加扣除失败' });
  }
});

router.post('/:id/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const declarationId = parseInt(req.params.id);
    
    const declaration = db.prepare(`
      SELECT * FROM tax_declarations WHERE id = ? AND user_id = ?
    `).get(declarationId, decoded.userId) as any;
    
    if (!declaration) {
      res.status(404).json({ success: false, error: '申报记录不存在' });
      return;
    }
    
    const standardDeduction = 60000;
    const taxableIncome = Math.max(0, declaration.total_income - standardDeduction - declaration.total_deduction);
    const taxPayable = calculateTax(taxableIncome);
    
    let taxRefund = 0;
    let taxSupplement = 0;
    
    if (declaration.total_tax_paid > taxPayable) {
      taxRefund = declaration.total_tax_paid - taxPayable;
    } else {
      taxSupplement = taxPayable - declaration.total_tax_paid;
    }
    
    db.prepare(`
      UPDATE tax_declarations 
      SET tax_refund = ?, tax_supplement = ?
      WHERE id = ?
    `).run(taxRefund, taxSupplement, declarationId);
    
    res.json({
      success: true,
      data: {
        totalIncome: declaration.total_income,
        standardDeduction,
        specialDeduction: declaration.total_deduction,
        taxableIncome,
        taxPayable,
        taxPaid: declaration.total_tax_paid,
        taxRefund,
        taxSupplement
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '计算失败' });
  }
});

router.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const declarationId = parseInt(req.params.id);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as any;
    if (!user || user.face_verified !== 1 || user.bank_card_verified !== 1) {
      res.status(400).json({ success: false, error: '请先完成人脸识别和银行卡验证' });
      return;
    }
    
    const declaration = db.prepare(`
      SELECT * FROM tax_declarations WHERE id = ? AND user_id = ?
    `).get(declarationId, decoded.userId) as any;
    
    if (!declaration) {
      res.status(404).json({ success: false, error: '申报记录不存在' });
      return;
    }
    
    db.prepare(`
      UPDATE tax_declarations 
      SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, refund_status = 'reviewing'
      WHERE id = ?
    `).run(declarationId);
    
    db.prepare(`
      INSERT INTO refund_tracking (declaration_id, status, status_text, operator, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(declarationId, 'submitted', '已提交申报', 'system', '纳税人已完成年度汇算申报提交');
    
    addBlockchainRecord('declaration_submit', declarationId, {
      userId: decoded.userId,
      declarationId,
      totalIncome: declaration.total_income,
      taxRefund: declaration.tax_refund,
      timestamp: Date.now()
    });
    
    logOperation('declaration_submit', decoded.userId, undefined, req.ip, undefined, { declarationId });
    
    res.json({
      success: true,
      message: '申报提交成功，请等待税务机关审核',
      data: { declarationId, status: 'submitted' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: '提交失败' });
  }
});

router.get('/:id/refund-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const declarationId = parseInt(req.params.id);
    
    const declaration = db.prepare(`
      SELECT id, status, refund_status, tax_refund FROM tax_declarations 
      WHERE id = ? AND user_id = ?
    `).get(declarationId, decoded.userId) as any;
    
    if (!declaration) {
      res.status(404).json({ success: false, error: '申报记录不存在' });
      return;
    }
    
    const tracking = db.prepare(`
      SELECT * FROM refund_tracking 
      WHERE declaration_id = ? 
      ORDER BY created_at ASC
    `).all(declarationId);
    
    res.json({
      success: true,
      data: {
        declarationStatus: declaration.status,
        refundStatus: declaration.refund_status,
        taxRefund: declaration.tax_refund,
        tracking
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token无效或已过期' });
  }
});

export default router;
