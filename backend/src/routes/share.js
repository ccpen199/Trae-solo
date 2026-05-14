const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.post('/create', authenticate, (req, res) => {
  try {
    const { type_id, share_mode, total_count } = req.body;

    if (!type_id) {
      return res.status(400).json({ success: false, message: '优惠券类型ID必填' });
    }

    const type = db.prepare('SELECT * FROM coupon_types WHERE id = ? AND status = ?').get(type_id, 'active');

    if (!type) {
      return res.status(404).json({ success: false, message: '优惠券类型不存在' });
    }

    if (type.remain_count <= 0) {
      return res.status(400).json({ success: false, message: '优惠券库存不足' });
    }

    const shareId = uuidv4();
    const shareUrl = `${process.env.CORS_ORIGIN}/share/${shareId}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO shares (id, user_id, type_id, share_url, share_mode, total_count, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(shareId, req.user.id, type_id, shareUrl, share_mode || 'chat', total_count || type.remain_count, expiresAt);

    db.prepare(`INSERT INTO coupon_logs (id, action, user_id, details) VALUES (?, ?, ?, ?)`).run(
      uuidv4(), 'share_create', req.user.id,
      JSON.stringify({ share_id: shareId, type_id, share_mode })
    );

    const existingStat = db.prepare("SELECT id FROM statistics WHERE date = date('now')").get();
    if (existingStat) {
      db.prepare("UPDATE statistics SET share_count = share_count + 1 WHERE id = ?").run(existingStat.id);
    } else {
      db.prepare(`INSERT INTO statistics (id, date, share_count) VALUES (?, date('now'), 1)`).run(uuidv4());
    }

    res.json({
      success: true,
      data: {
        shareId,
        shareUrl,
        shareMode: share_mode || 'chat',
        expiresAt
      }
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ success: false, message: '创建分享失败' });
  }
});

router.get('/info/:shareId', optionalAuth, (req, res) => {
  try {
    const share = db.prepare(`
      SELECT s.*, ct.name as coupon_name, ct.amount, ct.min_amount, ct.type as coupon_type,
             ct.remain_count, u.username as sharer_name
      FROM shares s
      JOIN coupon_types ct ON s.type_id = ct.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(req.params.shareId);

    if (!share) {
      return res.status(404).json({ success: false, message: '分享不存在' });
    }

    if (new Date(share.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '分享已过期' });
    }

    const receiveRecords = db.prepare(`
      SELECT sr.*, u.username, u.phone
      FROM share_records sr
      LEFT JOIN users u ON sr.receiver_id = u.id
      WHERE sr.share_id = ?
      ORDER BY sr.created_at DESC
      LIMIT 10
    `).all(share.id);

    const isExpired = share.remain_count <= 0 || share.receive_count >= share.total_count;

    res.json({
      success: true,
      data: {
        ...share,
        receiveRecords,
        isExpired,
        canReceive: !isExpired && (!req.user || share.user_id !== req.user.id)
      }
    });
  } catch (error) {
    console.error('Get share info error:', error);
    res.status(500).json({ success: false, message: '获取分享信息失败' });
  }
});

router.post('/receive', optionalAuth, (req, res) => {
  try {
    const { share_id, user_id, openid } = req.body;

    const targetUserId = user_id || (req.user?.id);
    const receiverOpenid = openid || (req.user?.openid);

    if (!targetUserId && !receiverOpenid) {
      return res.status(400).json({ success: false, message: '用户未登录' });
    }

    const share = db.prepare(`
      SELECT s.*, ct.name as coupon_name, ct.type as coupon_type, ct.amount, ct.min_amount,
             ct.max_amount, ct.remain_count, ct.valid_days, ct.per_user_limit
      FROM shares s
      JOIN coupon_types ct ON s.type_id = ct.id
      WHERE s.id = ?
    `).get(share_id);

    if (!share) {
      return res.status(404).json({ success: false, message: '分享不存在' });
    }

    if (new Date(share.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '分享已过期' });
    }

    if (share.receive_count >= share.total_count) {
      return res.status(400).json({ success: false, message: '优惠券已领完' });
    }

    if (share.remain_count !== undefined && share.remain_count <= 0) {
      return res.status(400).json({ success: false, message: '优惠券库存不足' });
    }

    const existingRecord = db.prepare('SELECT * FROM share_records WHERE share_id = ? AND (receiver_id = ? OR receiver_openid = ?)').get(share_id, targetUserId, receiverOpenid);
    if (existingRecord) {
      return res.status(400).json({ success: false, message: '您已领取过该分享的优惠券' });
    }

    const userCouponCount = db.prepare('SELECT COUNT(*) as count FROM coupons WHERE type_id = ? AND user_id = ?').get(share.type_id, targetUserId);
    if (userCouponCount.count >= share.per_user_limit) {
      return res.status(400).json({ success: false, message: '您已领取过该优惠券' });
    }

    const prevRecords = db.prepare('SELECT amount FROM share_records WHERE share_id = ? ORDER BY created_at DESC').all(share_id);
    let actualAmount = share.amount;

    if (share.coupon_type === 'random') {
      const min = share.min_amount || 1;
      const max = share.max_amount || share.amount;
      actualAmount = Math.floor(Math.random() * (max - min + 1)) + min;

      if (prevRecords.length > 0) {
        const maxPrev = Math.max(...prevRecords.map(r => r.amount));
        if (actualAmount <= maxPrev) {
          actualAmount = Math.min(maxPrev + 1, max);
        }
      }
    }

    const couponId = uuidv4();
    const code = 'SH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + (share.valid_days || 30) * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO coupons (id, type_id, user_id, code, amount, min_amount, status, expires_at, share_id)
      VALUES (?, ?, ?, ?, ?, ?, 'unused', ?, ?)
    `).run(couponId, share.type_id, targetUserId, code, actualAmount, share.min_amount || 0, expiresAt, share_id);

    db.prepare('UPDATE shares SET receive_count = receive_count + 1 WHERE id = ?').run(share_id);
    db.prepare('UPDATE coupon_types SET remain_count = remain_count - 1 WHERE id = ?').run(share.type_id);

    const recordId = uuidv4();
    db.prepare(`
      INSERT INTO share_records (id, share_id, receiver_id, receiver_openid, coupon_id, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(recordId, share_id, targetUserId, receiverOpenid, couponId, actualAmount);

    db.prepare(`INSERT INTO coupon_logs (id, coupon_id, action, user_id, details) VALUES (?, ?, ?, ?, ?)`).run(
      uuidv4(), couponId, 'share_receive', targetUserId,
      JSON.stringify({ share_id, amount: actualAmount, is_new_user: false })
    );

    const statsUpdate = (column) => {
      const existingStat = db.prepare("SELECT id FROM statistics WHERE date = date('now')").get();
      if (existingStat) {
        db.prepare(`UPDATE statistics SET ${column} = ${column} + 1 WHERE id = ?`).run(existingStat.id);
      } else {
        db.prepare(`INSERT INTO statistics (id, date, ${column}) VALUES (?, date('now'), 1)`).run(uuidv4());
      }
    };

    statsUpdate('receive_count');

    const totalUserCoupons = db.prepare('SELECT COUNT(*) as count FROM coupons WHERE user_id = ?').get(targetUserId);
    const isNewUser = totalUserCoupons.count <= 1;
    if (isNewUser) {
      statsUpdate('new_user_count');
    }

    res.json({
      success: true,
      data: {
        couponId,
        code,
        amount: actualAmount,
        couponName: share.coupon_name,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Receive share coupon error:', error);
    res.status(500).json({ success: false, message: '领取优惠券失败' });
  }
});

router.get('/my', authenticate, (req, res) => {
  try {
    const shares = db.prepare(`
      SELECT s.*, ct.name as coupon_name, ct.amount, ct.remain_count
      FROM shares s
      JOIN coupon_types ct ON s.type_id = ct.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);

    res.json({ success: true, data: shares });
  } catch (error) {
    console.error('Get my shares error:', error);
    res.status(500).json({ success: false, message: '获取分享记录失败' });
  }
});

router.get('/records/:shareId', authenticate, (req, res) => {
  try {
    const share = db.prepare('SELECT * FROM shares WHERE id = ? AND user_id = ?').get(req.params.shareId, req.user.id);

    if (!share) {
      return res.status(404).json({ success: false, message: '分享不存在' });
    }

    const records = db.prepare(`
      SELECT sr.*, u.username, u.phone
      FROM share_records sr
      LEFT JOIN users u ON sr.receiver_id = u.id
      WHERE sr.share_id = ?
      ORDER BY sr.created_at DESC
    `).all(share.id);

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get share records error:', error);
    res.status(500).json({ success: false, message: '获取领取记录失败' });
  }
});

module.exports = router;
