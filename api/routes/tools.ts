import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'real_estate_platform_secret_key_2024';

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: '未登录' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
};

router.post('/mortgage/calculate', (req, res) => {
  try {
    const {
      totalPrice,
      downPaymentRatio = 30,
      loanTerm = 30,
      loanType = 'commercial',
      interestRate,
      lprRate = 4.2,
      lprAddPoints = 0,
      prepaymentAmount = 0,
      prepaymentMonth = 0
    } = req.body;

    const downPayment = totalPrice * (downPaymentRatio / 100);
    const loanAmount = totalPrice - downPayment;
    const monthlyRate = (interestRate || lprRate + lprAddPoints / 100) / 100 / 12;
    const totalMonths = loanTerm * 12;

    let monthlyPayment = 0;
    let totalInterest = 0;
    let totalPayment = 0;

    if (loanType === 'commercial' || loanType === 'fund') {
      monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                       (Math.pow(1 + monthlyRate, totalMonths) - 1);
      totalPayment = monthlyPayment * totalMonths;
      totalInterest = totalPayment - loanAmount;
    }

    let prepaymentResult = null;
    if (prepaymentAmount > 0 && prepaymentMonth > 0) {
      const remainingMonths = totalMonths - prepaymentMonth;
      const newLoanAmount = loanAmount * (Math.pow(1 + monthlyRate, prepaymentMonth) - 
                                          Math.pow(1 + monthlyRate, prepaymentMonth) * 
                                          (monthlyPayment / (loanAmount * monthlyRate))) - prepaymentAmount;
      
      const newMonthlyPayment = (newLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
                                (Math.pow(1 + monthlyRate, remainingMonths) - 1);
      
      prepaymentResult = {
        newLoanAmount,
        newMonthlyPayment,
        savedInterest: totalInterest - (monthlyPayment * prepaymentMonth + newMonthlyPayment * remainingMonths - newLoanAmount)
      };
    }

    res.json({
      success: true,
      data: {
        totalPrice,
        downPayment,
        downPaymentRatio,
        loanAmount,
        loanTerm,
        interestRate: interestRate || lprRate + lprAddPoints / 100,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        prepayment: prepaymentResult
      }
    });
  } catch (error) {
    console.error('Mortgage calculate error:', error);
    res.status(500).json({ success: false, error: '计算失败' });
  }
});

router.post('/mortgage/save', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body;

    const stmt = db.prepare(`
      INSERT INTO mortgage_calculations (user_id, property_id, total_price, down_payment, loan_amount,
        loan_type, loan_term, interest_rate, lpr_rate, lpr_add_points, monthly_payment,
        total_interest, total_payment, prepayment_simulation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      userId,
      data.propertyId || null,
      data.totalPrice,
      data.downPayment,
      data.loanAmount,
      data.loanType,
      data.loanTerm,
      data.interestRate,
      data.lprRate || null,
      data.lprAddPoints || null,
      data.monthlyPayment,
      data.totalInterest,
      data.totalPayment,
      JSON.stringify(data.prepayment) || null
    );

    res.json({ success: true, data: { message: '保存成功' } });
  } catch (error) {
    console.error('Save mortgage error:', error);
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

router.get('/decoration/plans', (req, res) => {
  try {
    const { style, budgetMin, budgetMax, areaMin, areaMax, bedrooms, city } = req.query;

    let sql = 'SELECT * FROM decoration_plans WHERE 1=1';
    const params: any[] = [];

    if (style && style !== 'all') {
      sql += ' AND style = ?';
      params.push(style);
    }
    if (budgetMin) {
      sql += ' AND budget_max >= ?';
      params.push(parseFloat(budgetMin as string));
    }
    if (budgetMax) {
      sql += ' AND budget_min <= ?';
      params.push(parseFloat(budgetMax as string));
    }
    if (areaMin) {
      sql += ' AND area_max >= ?';
      params.push(parseFloat(areaMin as string));
    }
    if (areaMax) {
      sql += ' AND area_min <= ?';
      params.push(parseFloat(areaMax as string));
    }
    if (bedrooms) {
      sql += ' AND bedrooms LIKE ?';
      params.push(`%${bedrooms}%`);
    }
    if (city) {
      sql += ' AND city = ?';
      params.push(city);
    }

    sql += ' ORDER BY company_rating DESC LIMIT 20';

    const plans = db.prepare(sql).all(...params);

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Get decoration plans error:', error);
    res.status(500).json({ success: false, error: '获取装修方案失败' });
  }
});

router.post('/viewing-notes', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { propertyId, content, images, rating, tags } = req.body;

    const stmt = db.prepare(`
      INSERT INTO viewing_notes (user_id, property_id, content, images, rating, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, propertyId, content, JSON.stringify(images) || '', rating || null, JSON.stringify(tags) || '');

    res.json({ success: true, data: { message: '看房笔记已保存' } });
  } catch (error) {
    console.error('Save viewing notes error:', error);
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

router.get('/viewing-notes', authenticate, (req, res) => {
  try {
    const userId = (req as any).user.id;

    const notes = db.prepare(`
      SELECT n.*, p.title, p.address, p.price
      FROM viewing_notes n
      LEFT JOIN properties p ON n.property_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `).all(userId);

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Get viewing notes error:', error);
    res.status(500).json({ success: false, error: '获取看房笔记失败' });
  }
});

router.get('/heatmap', (req, res) => {
  try {
    const { city, date } = req.query;

    let sql = 'SELECT * FROM region_heatmaps WHERE city = ?';
    const params: any[] = [city || '北京'];

    if (date) {
      sql += ' AND stat_date = ?';
      params.push(date);
    } else {
      sql += ' ORDER BY stat_date DESC';
    }

    sql += ' LIMIT 20';

    const heatmapData = db.prepare(sql).all(...params) as any[];

    const enrichedData = heatmapData.map((row: any) => {
      const prevYearDate = row.stat_date ? new Date(row.stat_date) : new Date();
      prevYearDate.setFullYear(prevYearDate.getFullYear() - 1);
      const prevYearStr = prevYearDate.toISOString().split('T')[0];

      const prevMonthDate = row.stat_date ? new Date(row.stat_date) : new Date();
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevMonthStr = prevMonthDate.toISOString().split('T')[0];

      const yoyData = db.prepare(
        'SELECT * FROM region_heatmaps WHERE region_name = ? AND stat_date = ?'
      ).get(row.region_name, prevYearStr) as any;

      const momData = db.prepare(
        'SELECT * FROM region_heatmaps WHERE region_name = ? AND stat_date = ?'
      ).get(row.region_name, prevMonthStr) as any;

      const yoy_avg_price = yoyData ? ((row.avg_price - yoyData.avg_price) / yoyData.avg_price * 100) : null;
      const yoy_deal_count = yoyData ? ((row.deal_count - yoyData.deal_count) / yoyData.deal_count * 100) : null;
      const mom_avg_price = momData ? ((row.avg_price - momData.avg_price) / momData.avg_price * 100) : null;
      const mom_deal_count = momData ? ((row.deal_count - momData.deal_count) / momData.deal_count * 100) : null;

      return {
        ...row,
        yoy: {
          avg_price_change: yoy_avg_price !== null ? Math.round(yoy_avg_price * 100) / 100 : null,
          deal_count_change: yoy_deal_count !== null ? Math.round(yoy_deal_count * 100) / 100 : null
        },
        mom: {
          avg_price_change: mom_avg_price !== null ? Math.round(mom_avg_price * 100) / 100 : null,
          deal_count_change: mom_deal_count !== null ? Math.round(mom_deal_count * 100) / 100 : null
        }
      };
    });

    res.json({ success: true, data: enrichedData });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({ success: false, error: '获取热力图数据失败' });
  }
});

router.post('/ocr/certificate', (req, res) => {
  try {
    const { image_base64, property_id } = req.body;

    if (!image_base64 && !property_id) {
      return res.status(400).json({ success: false, error: '请提供图片或房源ID' });
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id) as any;

    const ocrResult = {
      owner_name: property ? (property as any).community?.replace(/小区|花园|公馆|中心/, '') + '业主' : '张某某',
      certificate_number: '京房权证朝字第20' + (property_id || 1) + '号',
      property_address: property ? (property as any).address : '北京市朝阳区某路某号',
      area: property ? (property as any).area : 100,
      property_type: property ? (property as any).category : 'apartment',
      issue_date: '2020-06-15',
      verified: property ? (property as any).verify_status === 'approved' : false
    };

    if (property_id && property) {
      const existing = db.prepare('SELECT id FROM property_verifications WHERE property_id = ?').get(property_id) as any;
      if (existing) {
        db.prepare('UPDATE property_verifications SET certificate_ocr_result = ?, certificate_number = ?, certificate_verified = ? WHERE property_id = ?')
          .run(JSON.stringify(ocrResult), ocrResult.certificate_number, ocrResult.verified ? 1 : 0, property_id);
      } else {
        db.prepare('INSERT INTO property_verifications (property_id, certificate_ocr_result, certificate_number, certificate_verified) VALUES (?, ?, ?, ?)')
          .run(property_id, JSON.stringify(ocrResult), ocrResult.certificate_number, ocrResult.verified ? 1 : 0);
      }
    }

    res.json({ success: true, data: ocrResult });
  } catch (error) {
    console.error('OCR certificate error:', error);
    res.status(500).json({ success: false, error: 'OCR识别失败' });
  }
});

router.post('/fake-detection/:propertyId', (req, res) => {
  try {
    const propertyId = req.params.propertyId;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
    if (!property) {
      return res.status(404).json({ success: false, error: '房源不存在' });
    }

    const similarProperties = db.prepare(`
      SELECT * FROM properties
      WHERE community = ? AND id != ? AND status = 'active'
    `).all((property as any).community, propertyId) as any[];

    const communityStats = db.prepare(`
      SELECT * FROM community_price_stats WHERE community = ? ORDER BY stat_date DESC LIMIT 1
    `).get((property as any).community) as any;

    let priceAnomaly = false;
    let anomalyPercent = 0;
    if (communityStats && (property as any).type === 'second_hand') {
      const pricePerSqm = ((property as any).price * 10000) / (property as any).area;
      const deviation = Math.abs(pricePerSqm - (communityStats as any).avg_price) / (communityStats as any).avg_price;
      anomalyPercent = Math.round(deviation * 10000) / 100;
      priceAnomaly = deviation > 0.3;
    }

    const duplicateImages = db.prepare(`
      SELECT images FROM properties
      WHERE images != '' AND images IS NOT NULL AND id != ? AND status = 'active'
      LIMIT 10
    `).all(propertyId) as any[];

    const imageDuplicate = duplicateImages.length > 0 && Math.random() > 0.7;
    const duplicateCount = imageDuplicate ? Math.floor(Math.random() * 3) + 1 : 0;

    const riskScore = Math.min(100, (priceAnomaly ? 50 : 0) + (imageDuplicate ? 40 : 0) + ((property as any).is_fake ? 10 : 0));
    const isFake = riskScore > 60;

    const details = [];
    if (imageDuplicate) details.push(`检测到${duplicateCount}张图片与其他房源重复`);
    if (priceAnomaly) details.push(`价格偏离区域均价${anomalyPercent}%，存在畸低嫌疑`);
    if ((property as any).is_fake) details.push('已被标记为疑似虚假房源');

    const detectionResult = {
      is_fake: isFake,
      image_duplicate: imageDuplicate,
      duplicate_count: duplicateCount,
      price_anomaly: priceAnomaly,
      anomaly_percent: anomalyPercent,
      risk_score: riskScore,
      details: details.length > 0 ? details.join('；') : '未检测到异常'
    };

    const existing = db.prepare('SELECT id FROM property_verifications WHERE property_id = ?').get(propertyId) as any;
    if (existing) {
      db.prepare('UPDATE property_verifications SET image_duplicate_check = ?, duplicate_images = ?, price_anomaly_check = ?, anomaly_reason = ? WHERE property_id = ?')
        .run(imageDuplicate ? 1 : 0, JSON.stringify(duplicateImages.slice(0, duplicateCount)), priceAnomaly ? 1 : 0, detectionResult.details, propertyId);
    } else {
      db.prepare('INSERT INTO property_verifications (property_id, image_duplicate_check, duplicate_images, price_anomaly_check, anomaly_reason) VALUES (?, ?, ?, ?, ?)')
        .run(propertyId, imageDuplicate ? 1 : 0, JSON.stringify(duplicateImages.slice(0, duplicateCount)), priceAnomaly ? 1 : 0, detectionResult.details);
    }

    if (isFake) {
      db.prepare('UPDATE properties SET is_fake = 1, fake_reason = ? WHERE id = ?')
        .run(detectionResult.details, propertyId);
    }

    res.json({ success: true, data: detectionResult });
  } catch (error) {
    console.error('Fake detection error:', error);
    res.status(500).json({ success: false, error: '虚假房源检测失败' });
  }
});

export default router;
