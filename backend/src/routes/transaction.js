const express = require('express');
const db = require('../db');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

function calculateDiscount(member, fuelTypeId, stationId, originalAmount) {
  if (!member) return { discountAmount: 0, discountRate: 0 };
  const level = db.prepare('SELECT * FROM member_levels WHERE id = ?').get(member.level_id);
  if (!level) return { discountAmount: 0, discountRate: 0 };
  const discountAmount = originalAmount * (level.discount_rate || 0);
  return { discountAmount, discountRate: level.discount_rate };
}

function calculateCoupon(couponId, fuelTypeId, stationId, originalAmount, memberId) {
  if (!couponId) return { couponAmount: 0, coupon: null };
  const memberCoupon = db.prepare(`
    SELECT mc.*, c.* FROM member_coupons mc
    JOIN coupons c ON mc.coupon_id = c.id
    WHERE mc.id = ? AND mc.member_id = ? AND mc.status = 'available'
  `).get(couponId, memberId);
  
  if (!memberCoupon) return { couponAmount: 0, coupon: null };
  
  const now = new Date();
  const validFrom = new Date(memberCoupon.valid_from);
  const validTo = new Date(memberCoupon.valid_to);
  if (now < validFrom || now > validTo) return { couponAmount: 0, coupon: null };
  
  if (memberCoupon.min_amount && originalAmount < memberCoupon.min_amount) {
    return { couponAmount: 0, coupon: null };
  }
  
  if (memberCoupon.fuel_type_ids) {
    const allowedFuelTypes = memberCoupon.fuel_type_ids.split(',').map(Number);
    if (!allowedFuelTypes.includes(fuelTypeId)) return { couponAmount: 0, coupon: null };
  }
  
  let couponAmount = 0;
  if (memberCoupon.type === 'fixed') {
    couponAmount = memberCoupon.value;
  } else if (memberCoupon.type === 'percent') {
    couponAmount = originalAmount * (memberCoupon.value / 100);
  }
  
  return { couponAmount, coupon: memberCoupon };
}

function calculatePoints(member, originalAmount) {
  if (!member) return 0;
  const rule = db.prepare('SELECT * FROM point_rules WHERE status = ? LIMIT 1').get('active');
  const level = db.prepare('SELECT * FROM member_levels WHERE id = ?').get(member.level_id);
  const pointsPerYuan = rule ? rule.points_per_yuan : 1;
  const multiplier = level ? level.point_multiplier : 1;
  return Math.floor(originalAmount * pointsPerYuan * multiplier);
}

router.post('/calculate', authenticate, (req, res) => {
  const { station_id, nozzle_id, fuel_type_id, volume, member_phone, member_coupon_id } = req.body;
  
  if (!station_id || !nozzle_id || !fuel_type_id || !volume) {
    return res.status(400).json({ error: '请填写完整的加油信息' });
  }
  
  const price = db.prepare(`
    SELECT price FROM station_fuel_prices 
    WHERE station_id = ? AND fuel_type_id = ? AND effective_to IS NULL
    ORDER BY effective_from DESC LIMIT 1
  `).get(station_id, fuel_type_id);
  
  if (!price) return res.status(400).json({ error: '未获取到油品价格' });
  
  const unitPrice = price.price;
  const originalAmount = Math.round(volume * unitPrice * 100) / 100;
  
  let member = null;
  if (member_phone) {
    member = db.prepare('SELECT * FROM members WHERE phone = ? AND status = ?').get(member_phone, 'active');
  }
  
  const { discountAmount, discountRate } = calculateDiscount(member, fuel_type_id, station_id, originalAmount);
  const { couponAmount, coupon } = calculateCoupon(member_coupon_id, fuel_type_id, station_id, originalAmount, member?.id);
  
  const finalAmount = Math.max(0, Math.round((originalAmount - discountAmount - couponAmount) * 100) / 100);
  const pointsEarned = calculatePoints(member, originalAmount);
  
  res.json({
    unit_price: unitPrice,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    discount_rate: discountRate,
    coupon_amount: couponAmount,
    final_amount: finalAmount,
    points_earned: pointsEarned,
    member_balance: member?.balance || 0,
    member_points: member?.points || 0,
    coupon_valid: !!coupon
  });
});

router.post('/create', authenticate, requireRoles(['cashier', 'manager', 'hq']), (req, res) => {
  const {
    station_id, nozzle_id, member_phone, vehicle_id, fuel_type_id, volume,
    payment_method, member_coupon_id, points_used
  } = req.body;
  
  if (!station_id || !nozzle_id || !fuel_type_id || !volume || !payment_method) {
    return res.status(400).json({ error: '请填写完整的交易信息' });
  }
  
  const nozzle = db.prepare('SELECT * FROM nozzles WHERE id = ? AND station_id = ?').get(nozzle_id, station_id);
  if (!nozzle) return res.status(400).json({ error: '油枪信息错误' });
  
  const price = db.prepare(`
    SELECT price FROM station_fuel_prices 
    WHERE station_id = ? AND fuel_type_id = ? AND effective_to IS NULL
    ORDER BY effective_from DESC LIMIT 1
  `).get(station_id, fuel_type_id);
  if (!price) return res.status(400).json({ error: '未获取到油品价格' });
  
  const unitPrice = price.price;
  const originalAmount = Math.round(volume * unitPrice * 100) / 100;
  
  let member = null;
  if (member_phone) {
    member = db.prepare('SELECT * FROM members WHERE phone = ? AND status = ?').get(member_phone, 'active');
    if (!member) return res.status(400).json({ error: '会员不存在' });
  }
  
  const { discountAmount } = calculateDiscount(member, fuel_type_id, station_id, originalAmount);
  const { couponAmount, coupon } = calculateCoupon(member_coupon_id, fuel_type_id, station_id, originalAmount, member?.id);
  
  let pointsDiscount = 0;
  const actualPointsUsed = points_used && member ? Math.min(points_used, member.points) : 0;
  if (actualPointsUsed > 0) {
    pointsDiscount = actualPointsUsed / 100;
  }
  
  const finalAmount = Math.max(0, Math.round((originalAmount - discountAmount - couponAmount - pointsDiscount) * 100) / 100);
  const pointsEarned = calculatePoints(member, originalAmount);
  
  let vehicleId = vehicle_id;
  if (member && !vehicleId) {
    const defaultVehicle = db.prepare('SELECT * FROM vehicles WHERE member_id = ? AND default_flag = 1').get(member.id);
    vehicleId = defaultVehicle?.id || null;
  }
  
  const shift = db.prepare(`
    SELECT * FROM shifts WHERE station_id = ? AND status = 'open' AND cashier_id = ?
  `).get(station_id, req.user.id);
  
  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO transactions 
      (station_id, nozzle_id, member_id, vehicle_id, fuel_type_id, volume, unit_price, 
       original_amount, discount_amount, coupon_amount, points_used, points_discount, 
       final_amount, payment_method, points_earned, coupon_id, cashier_id, shift_id, status, invoice_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `).run(
      station_id, nozzle_id, member?.id || null, vehicleId, fuel_type_id, volume, unitPrice,
      originalAmount, discountAmount, couponAmount, actualPointsUsed, pointsDiscount,
      finalAmount, payment_method, pointsEarned, coupon?.id || null, req.user.id, shift?.id || null,
      member ? 'not_issued' : 'none'
    );
    
    if (member) {
      let newBalance = member.balance;
      let newPoints = member.points - actualPointsUsed + pointsEarned;
      
      if (payment_method === 'balance') {
        if (member.balance < finalAmount) {
          throw new Error('余额不足');
        }
        newBalance = member.balance - finalAmount;
      }
      
      db.prepare('UPDATE members SET balance = ?, points = ? WHERE id = ?').run(newBalance, newPoints, member.id);
      
      const newLevel = db.prepare(`
        SELECT * FROM member_levels WHERE min_points <= ? ORDER BY min_points DESC LIMIT 1
      `).get(newPoints);
      if (newLevel && newLevel.id !== member.level_id) {
        db.prepare('UPDATE members SET level_id = ? WHERE id = ?').run(newLevel.id, member.id);
      }
    }
    
    if (coupon) {
      db.prepare(`
        UPDATE member_coupons SET status = 'used', used_at = CURRENT_TIMESTAMP, transaction_id = ?
        WHERE id = ?
      `).run(result.lastInsertRowid, coupon.id);
    }
    
    db.prepare(`
      UPDATE tank_inventory SET current_volume = current_volume - ?, last_updated = CURRENT_TIMESTAMP
      WHERE station_id = ? AND fuel_type_id = ?
    `).run(volume, station_id, fuel_type_id);
    
    db.prepare(`
      INSERT INTO inventory_transactions (station_id, fuel_type_id, type, volume, reference_id, operator_id)
      VALUES (?, ?, 'sale', ?, ?, ?)
    `).run(station_id, fuel_type_id, volume, result.lastInsertRowid, req.user.id);
    
    return result.lastInsertRowid;
  });
  
  try {
    const transactionId = tx();
    const transaction = db.prepare(`
      SELECT t.*, s.name as station_name, ft.name as fuel_type_name
      FROM transactions t
      JOIN stations s ON t.station_id = s.id
      JOIN fuel_types ft ON t.fuel_type_id = ft.id
      WHERE t.id = ?
    `).get(transactionId);
    
    const response = { message: '交易完成', transaction };
    if (member) {
      const updatedMember = db.prepare(`
        SELECT m.*, ml.name as level_name, ml.discount_rate
        FROM members m
        JOIN member_levels ml ON m.level_id = ml.id
        WHERE m.id = ?
      `).get(member.id);
      response.member = {
        id: updatedMember.id,
        phone: updatedMember.phone,
        name: updatedMember.name,
        level_id: updatedMember.level_id,
        level_name: updatedMember.level_name,
        balance: updatedMember.balance,
        points: updatedMember.points,
        discount_rate: updatedMember.discount_rate
      };
    }
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/list', authenticate, (req, res) => {
  const { station_id, start_date, end_date, member_id, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT t.*, s.name as station_name, n.nozzle_number, ft.name as fuel_type_name,
           m.phone as member_phone, m.name as member_name, v.plate_number, u.name as cashier_name
    FROM transactions t
    JOIN stations s ON t.station_id = s.id
    JOIN nozzles n ON t.nozzle_id = n.id
    JOIN fuel_types ft ON t.fuel_type_id = ft.id
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN users u ON t.cashier_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'cashier' || req.user.role === 'manager') {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    sql += ' AND t.station_id = ?';
    params.push(user.station_id);
  } else if (station_id) {
    sql += ' AND t.station_id = ?';
    params.push(station_id);
  }
  
  if (start_date) {
    sql += ' AND DATE(t.end_time) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(t.end_time) <= ?';
    params.push(end_date);
  }
  if (member_id) {
    sql += ' AND t.member_id = ?';
    params.push(member_id);
  }
  
  const countSql = sql.replace('SELECT t.*', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY t.end_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  res.json({ list, total, page, pageSize });
});

router.get('/:id', authenticate, (req, res) => {
  const transaction = db.prepare(`
    SELECT t.*, s.name as station_name, s.address as station_address,
           n.nozzle_number, ft.name as fuel_type_name, ft.code as fuel_type_code,
           m.phone as member_phone, m.name as member_name, v.plate_number,
           v.brand, v.model, u.name as cashier_name
    FROM transactions t
    JOIN stations s ON t.station_id = s.id
    JOIN nozzles n ON t.nozzle_id = n.id
    JOIN fuel_types ft ON t.fuel_type_id = ft.id
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN users u ON t.cashier_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!transaction) return res.status(404).json({ error: '交易记录不存在' });
  res.json(transaction);
});

module.exports = router;
