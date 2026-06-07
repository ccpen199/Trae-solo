import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const conditionMultipliers: Record<string, number> = {
  excellent: 0.7,
  good: 0.5,
  fair: 0.3,
  poor: 0.1
};

const brandDepreciation: Record<string, number> = {
  Haier: 0.08,
  Casarte: 0.06,
  GE: 0.07,
  'Fisher&Paykel': 0.09
};

router.post('/estimate', authMiddleware, (req: Request, res: Response) => {
  try {
    const { old_device_model, old_device_age, old_device_condition, new_product_id } = req.body;
    if (!old_device_model || !old_device_age || !old_device_condition) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const conditionMultiplier = conditionMultipliers[old_device_condition] || 0.2;
    const defaultDepreciation = 0.1;
    let baseValue = 2000;
    let depreciationRate = defaultDepreciation;

    for (const [brand, rate] of Object.entries(brandDepreciation)) {
      if (old_device_model.toLowerCase().includes(brand.toLowerCase())) {
        depreciationRate = rate;
        baseValue = brand === 'Casarte' ? 3000 : brand === 'GE' ? 2500 : 2000;
        break;
      }
    }

    const depreciationFactor = Math.max(0.05, 1 - old_device_age * depreciationRate);
    const estimatedValue = Math.round(baseValue * depreciationFactor * conditionMultiplier);

    let newProduct = null;
    if (new_product_id) {
      newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(new_product_id) as any;
    }

    const result = db.prepare(
      'INSERT INTO trade_in_estimations (user_id, old_device_model, old_device_age, old_device_condition, estimated_value, new_product_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, old_device_model, old_device_age, old_device_condition, estimatedValue, new_product_id || null, 'pending');

    const estimation = db.prepare('SELECT * FROM trade_in_estimations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: {
        estimation,
        breakdown: {
          baseValue,
          depreciationRate: `${(depreciationRate * 100).toFixed(0)}%/年`,
          depreciationFactor: depreciationFactor.toFixed(2),
          conditionMultiplier: `${(conditionMultiplier * 100).toFixed(0)}%`,
          finalValue: estimatedValue,
          newProduct: newProduct ? { id: newProduct.id, name: newProduct.name, price: newProduct.price } : null,
          netCost: newProduct ? newProduct.price - estimatedValue : null
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/estimations', authMiddleware, (req: Request, res: Response) => {
  try {
    const estimations = db.prepare('SELECT * FROM trade_in_estimations WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    res.json({ success: true, data: estimations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
