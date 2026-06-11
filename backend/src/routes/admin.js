const express = require('express');
const db = require('../utils/database');
const { adminRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/stats', adminRequired, (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt,
    total_enterprises: db.prepare('SELECT COUNT(*) as cnt FROM enterprises').get().cnt,
    total_contracts: db.prepare('SELECT COUNT(*) as cnt FROM labor_contracts').get().cnt,
    completed_contracts: db.prepare('SELECT COUNT(*) as cnt FROM labor_contracts WHERE status = ?').get('completed').cnt,
    unemployment_count: db.prepare('SELECT COUNT(*) as cnt FROM unemployment_registrations').get().cnt,
    title_applications: db.prepare('SELECT COUNT(*) as cnt FROM title_applications').get().cnt,
    pending_title: db.prepare('SELECT COUNT(*) as cnt FROM title_applications WHERE review_status = ?').get('pending').cnt,
    wage_accounts: db.prepare('SELECT COUNT(*) as cnt FROM wage_special_accounts').get().cnt,
    training_subsidies: db.prepare('SELECT COUNT(*) as cnt FROM training_subsidies').get().cnt,
    opinion_count: db.prepare('SELECT COUNT(*) as cnt FROM public_opinions').get().cnt,
    warning_opinions: db.prepare('SELECT COUNT(*) as cnt FROM public_opinions WHERE warning_level IN (?, ?)').all('high', 'medium').reduce((s, r) => s + Object.values(r)[0], 0)
  };
  res.json({ code: 0, data: stats });
});

router.get('/cross-system/data', adminRequired, (req, res) => {
  const { source, type, id_card, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM cross_system_data WHERE 1=1';
  const params = [];
  if (source) { sql += ' AND data_source = ?'; params.push(source); }
  if (type) { sql += ' AND data_type = ?'; params.push(type); }
  if (id_card) { sql += ' AND id_card LIKE ?'; params.push(`%${id_card}%`); }
  sql += ' ORDER BY sync_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (page - 1) * parseInt(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list.map(r => ({ ...r, data_content: JSON.parse(r.data_content || '{}') })) });
});

router.post('/cross-system/sync', adminRequired, (req, res) => {
  const { source } = req.body;
  const sources = source ? [source] : ['medical_insurance', 'tax_bureau', 'education_department'];
  const types = {
    medical_insurance: ['医保缴费记录', '医保待遇享受'],
    tax_bureau: ['个税申报记录', '完税证明'],
    education_department: ['学历认证', '学籍信息']
  };
  const mockNames = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十'];
  const inserted = [];
  sources.forEach(s => {
    (types[s] || []).forEach(t => {
      for (let i = 0; i < 3; i++) {
        const id_card = '360' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        const content = {
          name: mockNames[Math.floor(Math.random() * mockNames.length)],
          id_card,
          type: t,
          amount: Math.floor(Math.random() * 100000),
          period: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          status: '正常',
          source_detail: `${s}数据接口`
        };
        const result = db.prepare('INSERT INTO cross_system_data (data_source, data_type, id_card, data_content, sync_status) VALUES (?, ?, ?, ?, ?)').run(
          s, t, id_card, JSON.stringify(content), 'success'
        );
        inserted.push(result.lastInsertRowid);
      }
    });
  });
  res.json({ code: 0, data: { synced: inserted.length, sources }, message: `已同步${inserted.length}条跨系统数据` });
});

router.get('/cross-system/query-person', adminRequired, (req, res) => {
  const { id_card } = req.query;
  if (!id_card) return res.status(400).json({ code: 400, message: '请输入身份证号' });
  const user = db.prepare('SELECT * FROM users WHERE id_card = ?').get(id_card);
  const records = db.prepare('SELECT * FROM cross_system_data WHERE id_card = ? ORDER BY sync_time DESC').all(id_card);
  const contracts = db.prepare('SELECT * FROM labor_contracts WHERE user_id = (SELECT id FROM users WHERE id_card = ? LIMIT 1)').all(id_card);
  const unemployment = db.prepare('SELECT * FROM unemployment_registrations WHERE id_card = ?').all(id_card);
  res.json({
    code: 0,
    data: {
      user,
      medical: records.filter(r => r.data_source === 'medical_insurance').map(r => JSON.parse(r.data_content || '{}')),
      tax: records.filter(r => r.data_source === 'tax_bureau').map(r => JSON.parse(r.data_content || '{}')),
      education: records.filter(r => r.data_source === 'education_department').map(r => JSON.parse(r.data_content || '{}')),
      contracts,
      unemployment
    }
  });
});

router.get('/title-applications', adminRequired, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM title_applications WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND review_status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (page - 1) * parseInt(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list.map(r => ({ ...r, materials: JSON.parse(r.materials || '[]') })) });
});

router.post('/title-applications/review/:id', adminRequired, (req, res) => {
  const { review_status, review_opinion } = req.body;
  db.prepare('UPDATE title_applications SET review_status = ?, review_opinion = ?, reviewer_id = ?, reviewed_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(
    review_status || 'approved', review_opinion || '', req.admin.id, req.params.id
  );
  res.json({ code: 0, message: '预审完成' });
});

router.get('/training-subsidies', adminRequired, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT ts.*, e.enterprise_name FROM training_subsidies ts LEFT JOIN enterprises e ON ts.enterprise_id = e.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND ts.status = ?'; params.push(status); }
  sql += ' ORDER BY ts.created_at DESC';
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

router.post('/training-subsidies/approve/:id', adminRequired, (req, res) => {
  const { status, approved_amount } = req.body;
  db.prepare('UPDATE training_subsidies SET status = ?, approved_amount = ? WHERE id = ?').run(
    status || 'approved', approved_amount || 0, req.params.id
  );
  res.json({ code: 0, message: '审核完成' });
});

router.get('/public-opinions', adminRequired, (req, res) => {
  const { level, platform, is_handled, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM public_opinions WHERE 1=1';
  const params = [];
  if (level) { sql += ' AND warning_level = ?'; params.push(level); }
  if (platform) { sql += ' AND platform = ?'; params.push(platform); }
  if (is_handled !== undefined) { sql += ' AND is_handled = ?'; params.push(is_handled === '1' ? 1 : 0); }
  sql += ' ORDER BY crawled_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (page - 1) * parseInt(pageSize));
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

router.post('/public-opinions/crawl', adminRequired, (req, res) => {
  const mockData = [
    { platform: '微博', author: '用户A', title: '江西社保办事效率问题', content: '在南昌社保局办社保跑了三趟还没办好，材料不透明。', sentiment: 'negative', sentiment_score: 0.85, warning_level: 'high', keywords: '社保,效率,南昌' },
    { platform: '微信公众号', author: '江西观察', title: '江西创业贷款申请流程太繁琐', content: '创业担保贷款材料太多，希望能简化。', sentiment: 'negative', sentiment_score: 0.6, warning_level: 'medium', keywords: '创业贷款,流程' },
    { platform: '抖音', author: '用户B', title: '江西养老金按时发放', content: '感谢人社部门，养老金每月按时到账。', sentiment: 'positive', sentiment_score: 0.9, warning_level: 'normal', keywords: '养老金,发放' },
    { platform: '小红书', author: '职场小助手', title: '江西职称申报经验分享', content: '职称申报系统挺好用的，预审很及时。', sentiment: 'positive', sentiment_score: 0.88, warning_level: 'normal', keywords: '职称,申报' },
    { platform: '知乎', author: '匿名用户', title: '江西农民工工资被拖欠怎么办', content: '我在赣州工地干了半年，工资一直没发。', sentiment: 'negative', sentiment_score: 0.92, warning_level: 'high', keywords: '农民工,工资拖欠,赣州' },
    { platform: '微博', author: '九江市民', title: '失业金申领体验', content: '网上办失业登记确实方便，一键就搞定了。', sentiment: 'positive', sentiment_score: 0.82, warning_level: 'normal', keywords: '失业金,网上办' },
    { platform: '今日头条', author: '民生观察', title: '社保补缴政策不清晰', content: '社保补缴试算后还是搞不清楚具体金额。', sentiment: 'negative', sentiment_score: 0.55, warning_level: 'medium', keywords: '社保补缴,政策' },
    { platform: '微博', author: '用户C', title: '赣服通登录总是失败', content: '人社APP用赣服通登不上，体验差。', sentiment: 'negative', sentiment_score: 0.78, warning_level: 'high', keywords: '赣服通,登录' }
  ];
  const now = new Date();
  mockData.forEach((d, i) => {
    const pub = new Date(now.getTime() - i * 3600000 * Math.random() * 24);
    db.prepare(`INSERT INTO public_opinions (platform, author, title, content, url, sentiment, sentiment_score, warning_level, keywords, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      d.platform, d.author, d.title, d.content, `https://demo.url/opinion/${Date.now()}${i}`,
      d.sentiment, d.sentiment_score, d.warning_level, d.keywords, pub.toISOString()
    );
  });
  res.json({ code: 0, data: { crawled: mockData.length }, message: `已抓取${mockData.length}条舆情数据` });
});

router.post('/public-opinions/handle/:id', adminRequired, (req, res) => {
  const { handled_note } = req.body;
  db.prepare('UPDATE public_opinions SET is_handled = 1, handler_id = ?, handled_note = ? WHERE id = ?').run(
    req.admin.id, handled_note || '', req.params.id
  );
  res.json({ code: 0, message: '舆情已处置' });
});

router.get('/public-opinions/summary', adminRequired, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM public_opinions').get().cnt;
  const byLevel = db.prepare('SELECT warning_level, COUNT(*) as cnt FROM public_opinions GROUP BY warning_level').all();
  const byPlatform = db.prepare('SELECT platform, COUNT(*) as cnt FROM public_opinions GROUP BY platform').all();
  const bySentiment = db.prepare('SELECT sentiment, COUNT(*) as cnt FROM public_opinions GROUP BY sentiment').all();
  const unhandled = db.prepare('SELECT COUNT(*) as cnt FROM public_opinions WHERE is_handled = 0').get().cnt;
  res.json({ code: 0, data: { total, byLevel, byPlatform, bySentiment, unhandled } });
});

router.get('/labor-disputes', adminRequired, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM labor_dispute_applications WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

router.post('/labor-disputes/mediate/:id', adminRequired, (req, res) => {
  const { status, mediation_result } = req.body;
  db.prepare('UPDATE labor_dispute_applications SET status = ?, mediator_id = ?, mediation_result = ?, mediated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(
    status || 'mediated', req.admin.id, mediation_result || '', req.params.id
  );
  res.json({ code: 0, message: '调解处理完成' });
});

router.get('/policy-calculations', adminRequired, (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT pc.*, u.name, u.id_card FROM policy_calculations pc LEFT JOIN users u ON pc.user_id = u.id WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND pc.calc_type = ?'; params.push(type); }
  sql += ' ORDER BY pc.created_at DESC LIMIT 100';
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

module.exports = router;
