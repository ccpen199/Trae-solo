const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM accounts WHERE user_id = ? ORDER BY is_default DESC, id ASC',
    [req.user.id],
    (err, accounts) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }

      db.all('SELECT * FROM payment_records WHERE user_id = ? AND is_agent = 1', [req.user.id], (agentErr, agentRecords) => {
        const now = new Date();
        const enhancedAccounts = accounts.map((acc, idx) => {
          const isDefault = acc.is_default === 1;
          const daysToDue = 30 - (idx * 7);
          const dueDate = new Date(now.getTime() + daysToDue * 24 * 60 * 60 * 1000);
          const agentRelations = agentRecords
            .filter(r => r.account_id === acc.id)
            .map(r => ({
              payer_name: r.payer_name,
              agent_relation: r.agent_relation,
              amount: r.amount
            }));

          return {
            ...acc,
            payment_due_date: dueDate.toISOString(),
            payment_due_days: daysToDue,
            archive_source: '省级营销系统',
            archive_verify_time: acc.created_at,
            archive_confidence: 98,
            agent_relations: agentRelations,
            agent_count: agentRelations.length,
            bind_permission: isDefault ? 'owner' : 'authorized',
            bind_permission_level: isDefault ? 3 : 2,
            max_bind_accounts: 5,
            current_bind_count: accounts.length,
            is_default: isDefault
          };
        });

        res.json(enhancedAccounts);
      });
    }
  );
});

router.post('/verify', authenticateToken, (req, res) => {
  const { account_number, account_name, meter_number } = req.body;
  const errors = [];

  if (!account_number) {
    errors.push({ field: 'account_number', message: '户号不能为空' });
  } else if (!/^\d{16}$/.test(account_number)) {
    errors.push({ field: 'account_number', message: '户号格式不正确，应为16位数字' });
  }

  if (!account_name) {
    errors.push({ field: 'account_name', message: '户名不能为空' });
  }

  if (!meter_number) {
    errors.push({ field: 'meter_number', message: '电表编号不能为空' });
  } else if (!/^M?\d{8,12}$/i.test(meter_number)) {
    errors.push({ field: 'meter_number', message: '电表编号格式不正确，应为8-12位数字（可含M前缀）' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: '输入信息有误，请检查', errors });
  }

  db.get('SELECT id FROM accounts WHERE account_number = ?', [account_number], (err, existing) => {
    if (existing) {
      return res.status(400).json({
        error: '该户号已被绑定',
        verify_code: 'ALREADY_BOUND',
        verify_status: 'failed',
        verify_step: 'duplicate_check',
        errors: [{ field: 'account_number', message: '该户号已被绑定，不可重复绑定' }]
      });
    }

    if (account_name.length < 2) {
      return res.status(400).json({
        error: '户名与档案记录不匹配',
        verify_code: 'NAME_MISMATCH',
        verify_status: 'failed',
        verify_step: 'name_verification',
        expected_name: '请输入与电力系统档案一致的户名',
        errors: [{ field: 'account_name', message: '户名与档案记录不匹配，请核对户名信息' }]
      });
    }

    if (account_number.startsWith('9')) {
      return res.status(400).json({
        error: '户号不存在',
        verify_code: 'ACCOUNT_NOT_FOUND',
        verify_status: 'failed',
        verify_step: 'existence_check',
        suggestion: '请检查16位户号是否正确输入，如有疑问可拨打95598咨询',
        errors: [{ field: 'account_number', message: '户号不存在，请核对后重新输入' }]
      });
    }

    if (meter_number.startsWith('99')) {
      return res.status(400).json({
        error: '电表编号与户号不匹配',
        verify_code: 'METER_MISMATCH',
        verify_status: 'failed',
        verify_step: 'meter_verification',
        suggestion: '请核对电表编号，可在电表正面左下角查看10位编号',
        errors: [{ field: 'meter_number', message: '电表编号与该户号档案不匹配' }]
      });
    }

    db.all('SELECT name FROM local_services WHERE province = ? AND is_active = 1 LIMIT 5',
      ['北京市'],
      (err, services) => {
        const district = account_number.startsWith('01') ? '朝阳区' : (account_number.startsWith('02') ? '海淀区' : '东城区');
        const street = account_number.startsWith('01') ? '朝阳门外大街' : (account_number.startsWith('02') ? '中关村南大街' : '东长安街');
        const buildingNo = Math.floor(parseInt(account_number.slice(-4)) % 200 + 1);

        const mockResult = {
          account_number,
          account_name,
          meter_number,
          voltage_level: account_number.startsWith('02') ? '380V' : '220V',
          province: '北京市',
          city: '北京市',
          district: district,
          address: `北京市${district}${street}${buildingNo}号${Math.floor(Math.random()*10+1)}单元${Math.floor(Math.random()*20+1)}室`,
          local_services: services ? services.map(s => s.name) : ['煤改电补贴申领', '光伏并网申请', '充电桩报装', '峰谷电价变更', '多人口电价申请'],
          verified: true,
          verify_status: 'success',
          verify_code: 'VERIFY_SUCCESS',
          verify_time: new Date().toISOString(),
          address_match_confidence: 98,
          verification_source: '省级营销系统对接',
          binding_requirements: [
            '已核验户号真实性',
            '户名与档案一致',
            '电表编号关联正确',
            '地址属地匹配成功'
          ]
        };

        db.run(
          'INSERT INTO account_verification_logs (user_id, account_number, account_name, meter_number, verify_status, verify_code, verify_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, account_number, account_name, meter_number, 'success', 'VERIFY_SUCCESS', JSON.stringify(mockResult)]
        );

        res.json(mockResult);
      }
    );
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { account_number, account_name, meter_number, voltage_level, province, city, district, address, verify_code } = req.body;

  if (!account_number) {
    return res.status(400).json({ error: '户号不能为空' });
  }
  if (!account_name) {
    return res.status(400).json({ error: '户名不能为空' });
  }
  if (!meter_number) {
    return res.status(400).json({ error: '电表编号不能为空' });
  }

  const isDefault = 0;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO accounts (user_id, account_number, account_name, meter_number, voltage_level, province, city, district, address, balance, arrears, daily_usage, monthly_usage, is_default, verify_code, verify_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?)',
      [req.user.id, account_number, account_name, meter_number, voltage_level || '220V', province || '', city || '', district || '', address || '', isDefault, verify_code || 'VERIFY_SUCCESS', 'verified'],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: '该户号已被绑定' });
          }
          return res.status(500).json({ error: '绑定失败' });
        }

        const accountId = this.lastID;
        const voucherNo = 'BVD' + Date.now() + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const bindingRequirements = JSON.stringify([
          '已核验户号真实性',
          '户名与档案一致',
          '电表编号关联正确',
          '地址属地匹配成功',
          '用户已确认地址信息'
        ]);

        db.run(
          'INSERT INTO binding_vouchers (user_id, account_id, voucher_no, verify_status, binding_status, address_confirmed, binding_requirements) VALUES (?, ?, ?, ?, ?, 1, ?)',
          [req.user.id, accountId, voucherNo, 'verified', 'success', bindingRequirements]
        );

        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '绑定失败' });
          }

          db.get('SELECT * FROM accounts WHERE id = ?', [accountId], (err, account) => {
            if (err || !account) {
              return res.json({ id: accountId, message: '绑定成功' });
            }

            db.get('SELECT * FROM binding_vouchers WHERE id = (SELECT MAX(id) FROM binding_vouchers WHERE user_id = ? AND account_id = ?)',
              [req.user.id, accountId],
              (err, voucher) => {
                res.json({
                  id: accountId,
                  message: '绑定成功',
                  account,
                  voucher: voucher || null,
                  binding_status: 'success',
                  binding_time: new Date().toISOString()
                });
              }
            );
          });
        });
      }
    );
  });
});

router.put('/:id/default', authenticateToken, (req, res) => {
  const accountId = req.params.id;

  db.get('SELECT id FROM accounts WHERE id = ? AND user_id = ?', [accountId, req.user.id], (err, account) => {
    if (err || !account) {
      return res.status(404).json({ error: '户号不存在' });
    }

    db.run('UPDATE accounts SET is_default = 0 WHERE user_id = ?', [req.user.id], (err) => {
      if (err) {
        return res.status(500).json({ error: '设置失败' });
      }

      db.run('UPDATE accounts SET is_default = 1 WHERE id = ?', [accountId], (err) => {
        if (err) {
          return res.status(500).json({ error: '设置失败' });
        }
        res.json({ message: '设置成功' });
      });
    });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const accountId = req.params.id;

  db.get('SELECT id, is_default FROM accounts WHERE id = ? AND user_id = ?', [accountId, req.user.id], (err, account) => {
    if (err || !account) {
      return res.status(404).json({ error: '户号不存在' });
    }

    if (account.is_default) {
      return res.status(400).json({ error: '不能删除默认户号' });
    }

    db.run('DELETE FROM accounts WHERE id = ?', [accountId], (err) => {
      if (err) {
        return res.status(500).json({ error: '删除失败' });
      }
      res.json({ message: '删除成功' });
    });
  });
});

router.get('/:id/usage', authenticateToken, (req, res) => {
  const accountId = req.params.id;
  const { days = 30 } = req.query;

  db.get('SELECT id FROM accounts WHERE id = ? AND user_id = ?', [accountId, req.user.id], (err, account) => {
    if (err || !account) {
      return res.status(404).json({ error: '户号不存在' });
    }

    db.all('SELECT date, kwh, amount, peak_kwh, valley_kwh FROM usage_records WHERE account_id = ? ORDER BY date DESC LIMIT ?',
      [accountId, parseInt(days)],
      (err, records) => {
        if (err) {
          return res.status(500).json({ error: '服务器错误' });
        }
        res.json(records);
      }
    );
  });
});

module.exports = router;
