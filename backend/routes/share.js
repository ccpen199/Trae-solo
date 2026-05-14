const express = require('express');
const { db } = require('../database');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const AVAILABLE_PLATFORMS = [
  { id: 'weibo', name: '微博', icon: 'weibo' },
  { id: 'wechat', name: '微信', icon: 'wechat' },
  { id: 'qq', name: 'QQ', icon: 'qq' },
  { id: 'douyin', name: '抖音', icon: 'douyin' }
];

router.get('/platforms', (req, res) => {
  try {
    return res.json(success(AVAILABLE_PLATFORMS));
  } catch (err) {
    return res.status(500).json(error('获取平台列表失败'));
  }
});

router.get('/accounts', authMiddleware, (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT * FROM social_accounts WHERE user_id = ?
    `).all(req.user.id);

    return res.json(success(accounts));
  } catch (err) {
    console.error('获取社交账号失败:', err);
    return res.status(500).json(error('获取账号失败'));
  }
});

router.post('/bind-account', authMiddleware, (req, res) => {
  try {
    const { platform, account_name, platform_type } = req.body;

    if (!platform || !account_name) {
      return res.status(400).json(error('平台和账号名不能为空'));
    }

    const existing = db.prepare(`
      SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?
    `).get(req.user.id, platform);

    if (existing) {
      db.prepare(`
        UPDATE social_accounts SET account_name = ?, platform_type = ? WHERE user_id = ? AND platform = ?
      `).run(account_name, platform_type || null, req.user.id, platform);
    } else {
      db.prepare(`
        INSERT INTO social_accounts (user_id, platform, account_name, platform_type)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, platform, account_name, platform_type || null);
    }

    const account = db.prepare(`
      SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?
    `).get(req.user.id, platform);

    return res.json(success(account, existing ? '账号已更新' : '账号绑定成功'));
  } catch (err) {
    console.error('绑定账号失败:', err);
    return res.status(500).json(error('绑定失败'));
  }
});

router.post('/execute', authMiddleware, (req, res) => {
  try {
    const { flash_sale_id, platform_ids, account_names, share_content } = req.body;

    if (!platform_ids || !Array.isArray(platform_ids) || platform_ids.length === 0) {
      return res.status(400).json(error('请选择要分享的平台'));
    }

    const userAccounts = db.prepare(`
      SELECT * FROM social_accounts WHERE user_id = ? AND platform IN (${platform_ids.map(() => '?').join(',')})
    `).all(req.user.id, ...platform_ids);

    const flashSale = flash_sale_id ? db.prepare('SELECT * FROM flash_sales WHERE id = ?').get(flash_sale_id) : null;

    const results = [];
    const insertRecord = db.prepare(`
      INSERT INTO share_records (user_id, flash_sale_id, platform, account_name, share_content)
      VALUES (?, ?, ?, ?, ?)
    `);

    const accountsMap = {};
    userAccounts.forEach(acc => {
      accountsMap[acc.platform] = acc;
    });

    platform_ids.forEach(platform => {
      const account = accountsMap[platform];
      const platformInfo = AVAILABLE_PLATFORMS.find(p => p.id === platform);
      
      if (account) {
        const mockShareResult = {
          platform,
          platform_name: platformInfo?.name || platform,
          account_name: account.account_name,
          success: true,
          message: '分享成功'
        };
        results.push(mockShareResult);
        
        insertRecord.run(
          req.user.id,
          flash_sale_id || null,
          platform,
          account.account_name,
          share_content || null
        );
      } else {
        results.push({
          platform,
          platform_name: platformInfo?.name || platform,
          success: false,
          message: '未绑定该平台账号'
        });
      }
    });

    const allSuccess = results.every(r => r.success);
    const someSuccess = results.some(r => r.success);

    if (allSuccess) {
      return res.json(success({ results, flash_sale: flashSale }, '全部分享成功'));
    } else if (someSuccess) {
      return res.json(success({ results, flash_sale: flashSale }, '部分分享成功'));
    } else {
      return res.status(400).json(error('分享失败，请先绑定社交账号'));
    }
  } catch (err) {
    console.error('分享失败:', err);
    return res.status(500).json(error('分享失败'));
  }
});

router.get('/records', authMiddleware, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT sr.*,
        fs.product_name,
        fs.product_thumb
      FROM share_records sr
      LEFT JOIN flash_sales fs ON sr.flash_sale_id = fs.id
      WHERE sr.user_id = ?
      ORDER BY sr.share_time DESC
      LIMIT 50
    `).all(req.user.id);

    return res.json(success(records));
  } catch (err) {
    console.error('获取分享记录失败:', err);
    return res.status(500).json(error('获取分享记录失败'));
  }
});

module.exports = router;
