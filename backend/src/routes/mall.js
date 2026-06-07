const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateBenefitCode = (category) => {
  const prefixes = {
    phone_card: 'HF',
    membership: 'HY',
    electricity: 'DF',
    shopping: 'GW',
    catering: 'CY'
  };
  const prefix = prefixes[category] || 'BD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

router.get('/products', (req, res) => {
  const { category, page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  let sql = 'SELECT * FROM products WHERE status = "active"';
  let params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);

  db.all(sql, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    db.get('SELECT COUNT(*) as total FROM products WHERE status = "active"', (err, count) => {
      res.json({
        products,
        total: count.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      });
    });
  });
});

router.post('/exchange', authenticateToken, (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  db.get('SELECT * FROM products WHERE id = ? AND status = "active"', [product_id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    const totalPoints = product.points * quantity;

    db.get('SELECT points, risk_level, username FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err || !user) {
        return res.status(500).json({ error: '服务器错误' });
      }

      if (user.points < totalPoints) {
        return res.status(400).json({ error: '积分不足' });
      }

      if (user.risk_level < product.user_level_limit) {
        return res.status(400).json({ error: '用户等级不足，当前等级不满足该商品兑换要求' });
      }

      const today = new Date().toISOString().split('T')[0];
      db.get('SELECT SUM(quantity) as today_count FROM exchange_records WHERE user_id = ? AND product_id = ? AND DATE(created_at) = ?',
        [req.user.id, product_id, today],
        (err, exchangeStats) => {
          const todayCount = (exchangeStats && exchangeStats.today_count) || 0;
          const remainingToday = product.daily_limit - todayCount;

          if (todayCount + quantity > product.daily_limit) {
            return res.status(400).json({
              error: `超出今日兑换限制，该商品每日限兑${product.daily_limit}件，今日已兑${todayCount}件`,
              today_count: todayCount,
              daily_limit: product.daily_limit
            });
          }

          let riskFlag = 0;
          let riskReason = '';
          const ip = req.ip || req.connection.remoteAddress;

          db.all('SELECT * FROM exchange_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [req.user.id],
            (err, recentExchanges) => {
              if (recentExchanges && recentExchanges.length >= 5) {
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const lastHourCount = recentExchanges.filter(e => new Date(e.created_at) > oneHourAgo).length;
                if (lastHourCount >= 3) {
                  riskFlag = 1;
                  riskReason = '短时间内频繁兑换';
                }
              }

              const sameDayProducts = recentExchanges
                ? recentExchanges.filter(e => e.product_id !== product_id && new Date(e.created_at).toDateString() === new Date().toDateString())
                : [];
              if (sameDayProducts.length >= 5) {
                riskFlag = 2;
                riskReason = riskReason ? riskReason + '；同日多品类兑换' : '同日多品类兑换，疑似转售';
              }

              if (product.is_virtual && quantity >= 3) {
                riskFlag = Math.max(riskFlag, 1);
                riskReason = riskReason ? riskReason + '；虚拟商品批量兑换' : '虚拟商品批量兑换，请确认非转售行为';
              }

              db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                db.run('UPDATE users SET points = points - ? WHERE id = ?', [totalPoints, req.user.id]);

                db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product_id]);

                db.run(
                  'INSERT INTO exchange_records (user_id, product_id, points, quantity, exchange_ip, risk_flag, risk_reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [req.user.id, product_id, product.points, quantity, ip, riskFlag, riskReason],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: '兑换失败' });
                    }

                    const recordId = this.lastID;

                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: '兑换失败' });
                      }

                      const voucherNo = 'EXV' + Date.now() + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                      const benefitCode = product.is_virtual ? generateBenefitCode(product.category) : null;
                      const traceId = 'TRACE' + Date.now() + String(req.user.id);
                      const expiryDate = new Date();
                      expiryDate.setMonth(expiryDate.getMonth() + 1);

                      const resaleProtection = product.is_virtual ? '本虚拟商品仅限本人使用，绑定账户，不可转售。如发现转售行为，平台有权冻结账户积分并收回权益。' : '实物商品需凭本人身份证签收，不可转让。';

                      db.run(
                        'INSERT INTO exchange_vouchers (user_id, product_id, record_id, voucher_no, product_name, product_category, quantity, points_used, benefit_value, benefit_code, expiry_date, risk_flag, risk_reason, resale_protection, trace_id, status, delivered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                          req.user.id, product_id, recordId, voucherNo,
                          product.name, product.category, quantity,
                          product.points * quantity,
                          product.market_value || product.points * 0.01,
                          benefitCode,
                          expiryDate.toISOString(),
                          riskFlag, riskReason,
                          resaleProtection,
                          traceId,
                          'delivered',
                          new Date().toISOString()
                        ]
                      );

                      db.get('SELECT * FROM exchange_vouchers WHERE id = (SELECT MAX(id) FROM exchange_vouchers WHERE user_id = ? AND record_id = ?)',
                        [req.user.id, recordId],
                        (err, voucher) => {
                          res.json({
                            message: riskFlag ? '兑换成功（风控提醒）' : '兑换成功',
                            record_id: recordId,
                            risk_flag: riskFlag,
                            risk_reason: riskReason,
                            points_used: totalPoints,
                            remaining_points: user.points - totalPoints,
                            product_name: product.name,
                            product_category: product.category,
                            quantity: quantity,
                            today_count: todayCount + quantity,
                            daily_limit: product.daily_limit,
                            remaining_today: remainingToday - quantity,
                            is_virtual: product.is_virtual,
                            warnings: [
                              todayCount + quantity >= product.daily_limit ? `已达到今日限兑上限（${product.daily_limit}件）` : null,
                              riskFlag >= 2 ? '检测到异常兑换行为，后续兑换可能受限' : null,
                              product.is_virtual ? '虚拟商品不可转售，违规兑换将冻结账户积分' : null
                            ].filter(Boolean),
                            voucher: voucher || null,
                            benefit_delivery: product.is_virtual ? {
                              status: 'delivered',
                              benefit_code: benefitCode,
                              expiry_date: expiryDate.toISOString(),
                              delivery_note: product.category === 'phone_card' ? '充值码已发送，请到对应运营商APP充值' :
                                             product.category === 'membership' ? '会员兑换码已发送，请到对应视频平台激活' :
                                             product.category === 'electricity' ? '电费红包已到账，可在个人中心-卡包中查看' :
                                             '权益已发放，请在有效期内使用'
                            } : {
                              status: 'pending',
                              delivery_note: '实物商品将在3-5个工作日内发货'
                            },
                            risk_assessment: {
                              risk_level: riskFlag === 0 ? 'normal' : riskFlag === 1 ? 'low' : 'high',
                              risk_factors: [
                                riskFlag >= 1 ? '近期兑换频次较高' : null,
                                riskFlag >= 2 ? '多品类同日兑换，疑似转售' : null,
                                product.is_virtual && quantity >= 3 ? '虚拟商品批量兑换' : null
                              ].filter(Boolean),
                              resale_risk_score: riskFlag >= 2 ? 85 : (riskFlag >= 1 ? 45 : 15),
                              trace_id: traceId,
                              resale_protection: resaleProtection
                            }
                          });
                        }
                      );
                    });
                  }
                );
              });
            });
        });
    });
  });
});

router.get('/exchange-check', authenticateToken, (req, res) => {
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ error: '缺少商品ID' });
  }

  db.get('SELECT * FROM products WHERE id = ? AND status = "active"', [product_id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    const today = new Date().toISOString().split('T')[0];
    db.get('SELECT SUM(quantity) as today_count FROM exchange_records WHERE user_id = ? AND product_id = ? AND DATE(created_at) = ?',
      [req.user.id, product_id, today],
      (err, exchangeStats) => {
        const todayCount = (exchangeStats && exchangeStats.today_count) || 0;

        db.get('SELECT points FROM users WHERE id = ?', [req.user.id], (err, user) => {
          res.json({
            product_name: product.name,
            points: product.points,
            stock: product.stock,
            daily_limit: product.daily_limit,
            today_count: todayCount,
            remaining_today: product.daily_limit - todayCount,
            user_points: user ? user.points : 0,
            is_virtual: product.is_virtual,
            can_exchange: todayCount < product.daily_limit && product.stock > 0,
            user_level_limit: product.user_level_limit
          });
        });
      }
    );
  });
});

router.get('/exchange-records', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  db.all(
    'SELECT er.*, p.name, p.category, p.image FROM exchange_records er LEFT JOIN products p ON er.product_id = p.id WHERE er.user_id = ? ORDER BY er.created_at DESC LIMIT ? OFFSET ?',
    [req.user.id, parseInt(page_size), offset],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }

      db.get('SELECT COUNT(*) as total FROM exchange_records WHERE user_id = ?', [req.user.id], (err, count) => {
        res.json({
          records,
          total: count.total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        });
      });
    }
  );
});

module.exports = router;
