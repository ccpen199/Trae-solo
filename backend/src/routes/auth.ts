import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import { verifyToken, JWT_SECRET } from '../middleware/auth';
import type { AuthenticatedRequest, Resident, Community } from '../types';

const router = Router();

router.get('/communities', (_req, res) => {
  const db = getDb();
  const communities = db.prepare('SELECT id, name, subdomain, address, lat, lng FROM communities ORDER BY id').all();
  res.json({ success: true, data: communities });
});

router.post('/login', (req, res) => {
  const { phone, verification_code, community_id } = req.body;

  if (!phone || !verification_code) {
    res.status(400).json({ success: false, error: '手机号和验证码不能为空' });
    return;
  }

  if (!community_id) {
    res.status(400).json({ success: false, error: '请选择所属社区' });
    return;
  }

  if (verification_code !== '123456') {
    res.status(401).json({ success: false, error: '验证码错误' });
    return;
  }

  const db = getDb();
  const resident = db.prepare('SELECT * FROM residents WHERE phone = ? AND community_id = ? AND status = ?').get(phone, community_id, 'active') as Resident | undefined;

  if (!resident) {
    res.status(404).json({ success: false, error: '该手机号在所选社区未注册，请确认社区选择是否正确' });
    return;
  }

  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(community_id) as Community;
  const token = jwt.sign({ id: resident.id }, JWT_SECRET, { expiresIn: '7d' });

  const fraudLog = db.prepare(
    'INSERT INTO fraud_logs (entity_type, entity_id, action, actor_id, actor_role, ip_address, user_agent, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  fraudLog.run('resident', resident.id, 'login', resident.id, resident.role, req.ip || '', req.headers['user-agent'] || '', `手机号登录 community_id=${community_id}`);

  res.json({ success: true, data: { token, user: resident, community } });
});

router.post('/saml/login', (req, res) => {
  const { community_id } = req.body;

  if (!community_id) {
    res.status(400).json({ success: false, error: 'SAML SSO 登录需要指定社区' });
    return;
  }

  const db = getDb();
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(community_id) as Community | undefined;

  if (!community) {
    res.status(404).json({ success: false, error: '社区不存在' });
    return;
  }

  const samlCallbackUrl = `${req.protocol}://${req.get('host')}/api/auth/saml/callback`;
  const samlIdpUrl = `https://property-sso.example.com/saml/auth?community=${community.subdomain}&sp_callback=${encodeURIComponent(samlCallbackUrl)}&community_id=${community_id}`;

  res.json({
    success: true,
    data: {
      redirect_url: samlIdpUrl,
      community,
      message: '物业 SAML SSO 认证入口，实际部署时对接物业 IdP。当前为演示模式，将自动模拟 SAML 回调。',
      demo_saml_ids: db.prepare(
        'SELECT r.saml_id, r.real_name, r.role, r.id FROM residents r WHERE r.community_id = ? AND r.saml_id IS NOT NULL AND r.status = ?'
      ).all(community_id, 'active'),
    },
  });
});

router.post('/saml/callback', (req, res) => {
  const { saml_id, community_id } = req.body;

  if (!saml_id) {
    res.status(400).json({ success: false, error: 'SAML ID 不能为空' });
    return;
  }

  const db = getDb();
  const resident = db.prepare('SELECT * FROM residents WHERE saml_id = ? AND status = ?').get(saml_id, 'active') as Resident | undefined;

  if (!resident) {
    res.status(404).json({ success: false, error: 'SAML 用户未关联，请先在社区注册并绑定 SAML 账号' });
    return;
  }

  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(resident.community_id) as Community;
  const token = jwt.sign({ id: resident.id }, JWT_SECRET, { expiresIn: '7d' });

  const fraudLog = db.prepare(
    'INSERT INTO fraud_logs (entity_type, entity_id, action, actor_id, actor_role, ip_address, user_agent, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  fraudLog.run('resident', resident.id, 'saml_login', resident.id, resident.role, req.ip || '', req.headers['user-agent'] || '', `SAML SSO 登录 saml_id=${saml_id}`);

  res.json({ success: true, data: { token, user: resident, community } });
});

router.post('/saml/demo', (req, res) => {
  const { community_id } = req.body;

  if (!community_id) {
    res.status(400).json({ success: false, error: '请指定社区' });
    return;
  }

  const db = getDb();
  const propertyAdmin = db.prepare(
    'SELECT * FROM residents WHERE community_id = ? AND role = ? AND status = ?'
  ).get(community_id, 'property_admin', 'active') as Resident | undefined;

  if (!propertyAdmin) {
    res.status(404).json({ success: false, error: '该社区暂无物业管理人员' });
    return;
  }

  if (!propertyAdmin.saml_id) {
    const samlId = `saml_${propertyAdmin.community_id}_${propertyAdmin.id}`;
    db.prepare('UPDATE residents SET saml_id = ? WHERE id = ?').run(samlId, propertyAdmin.id);
    propertyAdmin.saml_id = samlId;
  }

  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(propertyAdmin.community_id) as Community;
  const token = jwt.sign({ id: propertyAdmin.id }, JWT_SECRET, { expiresIn: '7d' });

  const fraudLog = db.prepare(
    'INSERT INTO fraud_logs (entity_type, entity_id, action, actor_id, actor_role, ip_address, user_agent, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  fraudLog.run('resident', propertyAdmin.id, 'saml_demo_login', propertyAdmin.id, propertyAdmin.role, req.ip || '', req.headers['user-agent'] || '', `SAML SSO 演示登录 community_id=${community_id}`);

  res.json({ success: true, data: { token, user: { ...propertyAdmin }, community } });
});

router.get('/me', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(authReq.user!.community_id) as Community | undefined;
  res.json({ success: true, data: { ...authReq.user, community } });
});

export default router;
