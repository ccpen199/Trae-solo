import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.post('/check-purchase', (req: Request, res: Response) => {
  try {
    const { buyer_id, city } = req.body;
    if (!buyer_id || !city) { res.json({ code: -1, message: '缺少 buyer_id 或 city 参数' }); return; }

    const buyer = db.prepare('SELECT * FROM buyers WHERE id = ?').get(buyer_id) as any;
    if (!buyer) { res.json({ code: -1, message: '买家不存在' }); return; }

    const eligible = true;
    const reasons: string[] = [];
    const restrictions: string[] = [];

    if (city === '上海' || city === 'Shanghai') {
      if (buyer.has_local_hukou) {
        if (buyer.existing_properties >= 2) {
          restrictions.push('本地户口家庭最多可购2套住房');
          reasons.push('您已拥有2套住房，不可再购');
          return res.json({ code: 0, data: { eligible: false, reasons, restrictions }, message: 'success' });
        }
        if (buyer.marital_status === '单身' && buyer.existing_properties >= 1) {
          restrictions.push('本地户口单身限购1套住房');
          reasons.push('单身人士仅可拥有1套住房');
          return res.json({ code: 0, data: { eligible: false, reasons, restrictions }, message: 'success' });
        }
        if (buyer.marital_status === '单身') {
          restrictions.push('本地户口单身限购1套住房');
        } else {
          restrictions.push('本地户口家庭最多可购2套住房');
        }
      } else {
        if (buyer.social_insurance_years < 5) {
          restrictions.push('非本地户口需连续缴纳5年社保方可购房');
          reasons.push(`您的社保年限为${buyer.social_insurance_years}年，不满足5年要求`);
          return res.json({ code: 0, data: { eligible: false, reasons, restrictions }, message: 'success' });
        }
        if (buyer.existing_properties >= 1) {
          restrictions.push('非本地户口限购1套住房');
          reasons.push('非本地户口仅可拥有1套住房');
          return res.json({ code: 0, data: { eligible: false, reasons, restrictions }, message: 'success' });
        }
        restrictions.push('非本地户口需5年社保且限购1套住房');
      }
    }

    res.json({ code: 0, data: { eligible, reasons, restrictions }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/check-sale', (req: Request, res: Response) => {
  try {
    const { listing_id } = req.body;
    if (!listing_id) { res.json({ code: -1, message: '缺少 listing_id 参数' }); return; }

    const listing = db.prepare('SELECT l.*, b.completion_year FROM listings l LEFT JOIN buildings b ON l.building_id = b.id WHERE l.id = ?').get(listing_id) as any;
    if (!listing) { res.json({ code: -1, message: '房源不存在' }); return; }

    const can_sell = true;
    const reasons: string[] = [];

    const currentYear = new Date().getFullYear();
    const holdYears = listing.completion_year ? currentYear - listing.completion_year : 0;

    if (holdYears < 2) {
      reasons.push(`持有年限不足2年（当前约${holdYears}年），出售需缴纳全额增值税5.3%`);
    } else {
      reasons.push(`持有年限≥2年，免征增值税`);
    }

    if (listing.property_status === 'mortgaged' || listing.property_status === '有抵押') {
      reasons.push('该房产有抵押，需先解除抵押或取得抵押权人同意方可交易');
    }

    res.json({ code: 0, data: { can_sell, reasons, hold_years: holdYears }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/tax-calculate', (req: Request, res: Response) => {
  try {
    const { listing_id, buyer_id } = req.body;
    if (!listing_id || !buyer_id) { res.json({ code: -1, message: '缺少 listing_id 或 buyer_id 参数' }); return; }

    const listing = db.prepare('SELECT l.*, b.completion_year FROM listings l LEFT JOIN buildings b ON l.building_id = b.id WHERE l.id = ?').get(listing_id) as any;
    if (!listing) { res.json({ code: -1, message: '房源不存在' }); return; }

    const buyer = db.prepare('SELECT * FROM buyers WHERE id = ?').get(buyer_id) as any;
    if (!buyer) { res.json({ code: -1, message: '买家不存在' }); return; }

    const totalPrice = listing.price * 10000;
    const area = listing.area;

    const propertyCount = buyer.existing_properties || 0;
    let deedTaxRate: number;
    if (propertyCount === 0) {
      deedTaxRate = area <= 90 ? 0.01 : 0.015;
    } else if (propertyCount === 1) {
      deedTaxRate = area <= 90 ? 0.01 : 0.02;
    } else {
      deedTaxRate = 0.03;
    }
    const deedTax = totalPrice * deedTaxRate;

    const currentYear = new Date().getFullYear();
    const holdYears = listing.completion_year ? currentYear - listing.completion_year : 3;
    const vat = holdYears < 2 ? totalPrice * 0.053 : 0;

    const personalIncomeTax = totalPrice * 0.01;

    const stampDuty = 0;

    const total = deedTax + vat + personalIncomeTax + stampDuty;

    res.json({
      code: 0,
      data: {
        deed_tax: Math.round(deedTax),
        deed_tax_rate: deedTaxRate,
        vat: Math.round(vat),
        personal_income_tax: Math.round(personalIncomeTax),
        stamp_duty: stampDuty,
        total: Math.round(total),
        details: {
          property_count: propertyCount,
          hold_years: holdYears,
          total_price: totalPrice,
          area: area
        }
      },
      message: 'success'
    });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
