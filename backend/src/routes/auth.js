const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../data/app.sqlite');

const getDb = () => new sqlite3.Database(dbPath);

router.post('/client/register', async (req, res) => {
  try {
    const { phone, password, name } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    const db = getDb();
    db.get('SELECT id FROM users WHERE phone = ?', [phone], async (err, existing) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: '数据库错误' });
      }

      if (existing) {
        db.close();
        return res.status(400).json({ error: '该手机号已注册' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (phone, password, name) VALUES (?, ?, ?)', [phone, hashedPassword, name || ''], function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: '注册失败' });
          }

          const token = jwt.sign({ id: this.lastID, type: 'client' }, process.env.JWT_SECRET, { expiresIn: '7d' });
          db.close();

          res.json({
            success: true,
            token,
            user: {
              id: this.lastID,
              phone,
              name: name || ''
            }
          });
        });
      } catch (error) {
        db.close();
        res.status(500).json({ error: '注册失败' });
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/client/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const db = getDb();

    db.get('SELECT * FROM users WHERE phone = ?', [phone], async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        db.close();
        return res.status(401).json({ error: '手机号或密码错误' });
      }

      try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          db.close();
          return res.status(401).json({ error: '手机号或密码错误' });
        }

        const token = jwt.sign({ id: user.id, type: 'client' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        db.close();

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            rating: user.rating
          }
        });
      } catch (error) {
        db.close();
        res.status(500).json({ error: '登录失败' });
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/courier/register', async (req, res) => {
  try {
    const { phone, password, name, id_card } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    const db = getDb();
    db.get('SELECT id FROM couriers WHERE phone = ?', [phone], async (err, existing) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: '数据库错误' });
      }

      if (existing) {
        db.close();
        return res.status(400).json({ error: '该手机号已注册' });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO couriers (phone, password, name, id_card, status) VALUES (?, ?, ?, ?, ?)', [phone, hashedPassword, name || '', id_card || '', 'pending'], function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: '注册失败' });
          }

          const token = jwt.sign({ id: this.lastID, type: 'courier' }, process.env.JWT_SECRET, { expiresIn: '7d' });
          db.close();

          res.json({
            success: true,
            token,
            message: '注册成功，请等待资质审核',
            courier: {
              id: this.lastID,
              phone,
              name: name || '',
              status: 'pending'
            }
          });
        });
      } catch (error) {
        db.close();
        res.status(500).json({ error: '注册失败' });
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/courier/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const db = getDb();

    db.get('SELECT * FROM couriers WHERE phone = ?', [phone], async (err, courier) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!courier) {
        db.close();
        return res.status(401).json({ error: '手机号或密码错误' });
      }

      try {
        const validPassword = await bcrypt.compare(password, courier.password);
        if (!validPassword) {
          db.close();
          return res.status(401).json({ error: '手机号或密码错误' });
        }

        const token = jwt.sign({ id: courier.id, type: 'courier' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        db.run('INSERT INTO courier_audit_logs (courier_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)', [courier.id, 'login', '登录成功', req.ip], (err) => {
          if (err) console.error('审计日志写入失败:', err);
        });

        db.close();

        res.json({
          success: true,
          token,
          courier: {
            id: courier.id,
            phone: courier.phone,
            name: courier.name,
            status: courier.status,
            face_verified: courier.face_verified,
            credit_score: courier.credit_score
          }
        });
      } catch (error) {
        db.close();
        res.status(500).json({ error: '登录失败' });
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/courier/face-verify', (req, res) => {
  try {
    const { courier_id, face_data } = req.body;
    const db = getDb();

    db.run('UPDATE couriers SET face_verified = 1 WHERE id = ?', [courier_id], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: '验证失败' });
      }

      if (this.changes > 0) {
        db.run('INSERT INTO courier_audit_logs (courier_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)', [courier_id, 'face_verify', '人脸识别验证通过', req.ip], (err) => {
          if (err) console.error('审计日志写入失败:', err);
        });

        db.close();
        res.json({ success: true, message: '人脸识别验证成功' });
      } else {
        db.close();
        res.status(400).json({ error: '验证失败' });
      }
    });
  } catch (error) {
    console.error('人脸验证错误:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

router.post('/courier/license-verify', (req, res) => {
  try {
    const { courier_id, license_types } = req.body;
    const db = getDb();

    db.run('UPDATE couriers SET service_license = ?, license_types = ?, status = ? WHERE id = ?', [JSON.stringify(license_types), license_types.join(','), 'approved', courier_id], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: '审核失败' });
      }

      if (this.changes > 0) {
        db.run('INSERT INTO courier_audit_logs (courier_id, action_type, action_detail, ip_address) VALUES (?, ?, ?, ?)', [courier_id, 'license_verify', `资质审核通过:${license_types.join(',')}`, req.ip], (err) => {
          if (err) console.error('审计日志写入失败:', err);
        });

        db.close();
        res.json({ success: true, message: '资质审核通过' });
      } else {
        db.close();
        res.status(400).json({ error: '审核失败' });
      }
    });
  } catch (error) {
    console.error('资质审核错误:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { admin_id, secret_key } = req.body;
    const db = getDb();

    db.get('SELECT * FROM admins WHERE admin_id = ? AND status = ?', [admin_id, 'active'], async (err, admin) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!admin) {
        db.close();
        return res.status(401).json({ error: '管理员ID或密钥错误' });
      }

      try {
        const validSecret = await bcrypt.compare(secret_key, admin.secret_hash);
        if (!validSecret) {
          db.close();
          return res.status(401).json({ error: '管理员ID或密钥错误' });
        }

        const token = jwt.sign({ id: admin.id, type: 'admin', role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

        db.run('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [admin.id], (err) => {
          if (err) console.error('更新登录时间失败:', err);
        });

        db.close();

        res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            admin_id: admin.admin_id,
            name: admin.name,
            role: admin.role
          }
        });
      } catch (error) {
        db.close();
        res.status(500).json({ error: '登录失败' });
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

module.exports = router;
