import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware';
import { DecorationDemand, AISolution, DesignerMatch, User, Store } from '../types';

const router = Router();

const createDemandSchema = z.object({
  city: z.string().min(1, '城市不能为空'),
  district: z.string().optional(),
  address: z.string().min(1, '地址不能为空'),
  house_type: z.string().min(1, '户型不能为空'),
  area: z.number().min(1, '面积不能为空'),
  budget_min: z.number().min(0, '最低预算不能为负'),
  budget_max: z.number().min(0, '最高预算不能为负'),
  decoration_style: z.string().min(1, '装修风格不能为空'),
  requirement_desc: z.string().optional(),
  contact_name: z.string().min(1, '联系人不能为空'),
  contact_phone: z.string().min(1, '联系电话不能为空'),
});

router.post('/', authMiddleware, roleMiddleware('owner'), (req: AuthRequest, res) => {
  const result = createDemandSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO decoration_demands (id, owner_id, city, district, address, house_type, area, budget_min, budget_max, decoration_style, requirement_desc, contact_name, contact_phone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(
    id,
    req.user!.id,
    result.data.city,
    result.data.district || null,
    result.data.address,
    result.data.house_type,
    result.data.area,
    result.data.budget_min,
    result.data.budget_max,
    result.data.decoration_style,
    result.data.requirement_desc || null,
    result.data.contact_name,
    result.data.contact_phone,
    now,
    now
  );

  const demand = db.prepare('SELECT * FROM decoration_demands WHERE id = ?').get(id);
  res.status(201).json(demand);
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { status, city } = req.query;
  let query = 'SELECT d.*, u.real_name as owner_name FROM decoration_demands d LEFT JOIN users u ON d.owner_id = u.id WHERE 1=1';
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    query += ' AND d.owner_id = ?';
    params.push(req.user!.id);
  }
  if (req.user!.role === 'designer' || req.user!.role === 'store_manager') {
    const user = db.prepare('SELECT city, store_id FROM users WHERE id = ?').get(req.user!.id) as User;
    if (user.city) {
      query += ' AND d.city = ?';
      params.push(user.city);
    }
  }
  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }
  if (city) {
    query += ' AND d.city = ?';
    params.push(city);
  }

  query += ' ORDER BY d.created_at DESC';
  const demands = db.prepare(query).all(...params);
  res.json(demands);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const demand = db.prepare('SELECT d.*, u.real_name as owner_name, u.phone as owner_phone FROM decoration_demands d LEFT JOIN users u ON d.owner_id = u.id WHERE d.id = ?').get(id) as DecorationDemand | undefined;

  if (!demand) {
    return res.status(404).json({ error: '需求不存在' });
  }

  if (req.user!.role === 'owner' && demand.owner_id !== req.user!.id) {
    return res.status(403).json({ error: '无权查看此需求' });
  }

  const result: any = { ...demand };

  const contract = db.prepare('SELECT id, contract_no, status, total_amount, escrow_amount FROM decoration_contracts WHERE demand_id = ?').get(id) as any;
  if (contract) {
    result.contract = contract;
  }

  const storeRows = db.prepare(`
    SELECT s.id, s.name, s.city, s.address, s.service_radius, s.longitude, s.latitude,
      ROUND(6371 * ACOS(
        COS(RADIANS(s.latitude)) * COS(RADIANS(39.9042)) * COS(RADIANS(s.longitude - 116.4074))
        + SIN(RADIANS(s.latitude)) * SIN(RADIANS(39.9042))
      ), 1) as distance_km
    FROM stores s
    WHERE s.city = ? AND s.status = 'active'
    ORDER BY distance_km ASC
    LIMIT 5
  `).all(demand.city) as any[];
  if (storeRows.length > 0) {
    result.nearby_stores = storeRows;
  }

  res.json(result);
});

router.post('/:id/ai-solution', authMiddleware, roleMiddleware('owner', 'store_manager', 'designer'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const demand = db.prepare('SELECT * FROM decoration_demands WHERE id = ?').get(id) as DecorationDemand | undefined;

  if (!demand) {
    return res.status(404).json({ error: '需求不存在' });
  }

  const existingSolution = db.prepare('SELECT * FROM ai_solutions WHERE demand_id = ?').get(id);
  if (existingSolution) {
    return res.status(400).json({ error: '该需求已有AI方案' });
  }

  const styles = ['现代简约', '北欧风格', '新中式', '轻奢', '美式乡村', '日式禅意'];
  const stylePlan = `
    风格定位：${demand.decoration_style || styles[Math.floor(Math.random() * styles.length)]}
    空间布局：开放型客餐厨一体化设计，主卧套房设计，次卧多功能房
    色彩方案：主色调米白色，搭配原木色和深灰色点缀
    照明设计：无主灯设计，结合筒灯、灯带和重点照明
    收纳系统：定制整体衣柜、玄关柜、阳台柜，收纳率提升30%
  `;

  const layoutPlan = `
    总面积：${demand.area}㎡
    户型：${demand.house_type}
    客厅：${(demand.area * 0.35).toFixed(1)}㎡ - 南向采光，景观阳台
    主卧：${(demand.area * 0.2).toFixed(1)}㎡ - 独立卫生间，步入式衣帽间
    次卧：${(demand.area * 0.12).toFixed(1)}㎡ - 儿童房/书房两用
    厨房：${(demand.area * 0.1).toFixed(1)}㎡ - U型布局，操作动线流畅
    卫生间：${(demand.area * 0.08).toFixed(1)}㎡ - 干湿分离设计
  `;

  const materials = [
    { name: '地砖', spec: '800x800mm 抛光砖', price: 150, qty: demand.area * 0.8 },
    { name: '木地板', spec: '15mm 多层实木', price: 280, qty: demand.area * 0.6 },
    { name: '墙面涂料', spec: '净味乳胶漆', price: 85, qty: demand.area * 2.5 },
    { name: '定制橱柜', spec: '颗粒板柜体+石英石台面', price: 2800, qty: 4 },
    { name: '室内门', spec: '实木复合门', price: 1800, qty: 3 },
  ];

  const materialPlan = materials.map(m => `${m.name} - ${m.spec} - 数量:${m.qty.toFixed(1)} - 单价:¥${m.price}`).join('\n');
  const materialTotal = materials.reduce((sum, m) => sum + m.price * m.qty, 0);

  const solutionId = uuidv4();
  const estimatedBudget = Math.round((demand.budget_min + demand.budget_max) / 2 / 10000) * 10000 || Math.round(materialTotal * 2.5);
  const estimatedPeriod = Math.max(60, Math.round(demand.area * 0.8));

  db.prepare(`
    INSERT INTO ai_solutions (id, demand_id, style_plan, layout_plan, material_plan, estimated_budget, estimated_period, renderings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    solutionId,
    id,
    stylePlan,
    layoutPlan,
    materialPlan,
    estimatedBudget,
    estimatedPeriod,
    JSON.stringify([
      `/images/render_${id}_1.jpg`,
      `/images/render_${id}_2.jpg`,
      `/images/render_${id}_3.jpg`,
    ])
  );

  db.prepare("UPDATE decoration_demands SET status = 'matched', updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);

  const solution = db.prepare('SELECT * FROM ai_solutions WHERE id = ?').get(solutionId);
  res.status(201).json(solution);
});

router.get('/:id/ai-solution', authMiddleware, (req, res) => {
  const { id } = req.params;
  const solution = db.prepare('SELECT * FROM ai_solutions WHERE demand_id = ?').get(id) as AISolution | undefined;
  if (!solution) {
    return res.json(null);
  }
  res.json(solution);
});

router.post('/:id/match-designers', authMiddleware, roleMiddleware('store_manager', 'owner'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const demand = db.prepare('SELECT * FROM decoration_demands WHERE id = ?').get(id) as DecorationDemand | undefined;

  if (!demand) {
    return res.status(404).json({ error: '需求不存在' });
  }

  const existingMatches = db.prepare('SELECT * FROM designer_matches WHERE demand_id = ?').all(id);
  if (existingMatches.length > 0) {
    return res.json(existingMatches);
  }

  const designers = db.prepare(`
    SELECT u.*, s.name as store_name, s.id as store_id, s.longitude, s.latitude
    FROM users u
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.role = 'designer' AND u.status = 'active' AND (u.city = ? OR s.city = ?)
  `).all(demand.city, demand.city) as (User & { store_id: string; store_name: string; longitude: number; latitude: number })[];

  const matches = designers.map(designer => {
    const score = Math.round(70 + Math.random() * 30);
    const matchId = uuidv4();
    db.prepare(`
      INSERT INTO designer_matches (id, demand_id, designer_id, store_id, match_score, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(matchId, id, designer.id, designer.store_id, score, new Date().toISOString());

    return {
      id: matchId,
      designer_id: designer.id,
      designer_name: designer.real_name,
      store_id: designer.store_id,
      store_name: designer.store_name,
      match_score: score,
      status: 'pending',
    };
  });

  res.json(matches);
});

router.get('/:id/matches', authMiddleware, (req, res) => {
  const { id } = req.params;
  const matches = db.prepare(`
    SELECT m.*, u.real_name as designer_name, s.name as store_name
    FROM designer_matches m
    LEFT JOIN users u ON m.designer_id = u.id
    LEFT JOIN stores s ON m.store_id = s.id
    WHERE m.demand_id = ?
    ORDER BY m.match_score DESC
  `).all(id);
  res.json(matches);
});

router.post('/matches/:id/accept', authMiddleware, roleMiddleware('owner'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const match = db.prepare('SELECT * FROM designer_matches WHERE id = ?').get(id) as DesignerMatch | undefined;

  if (!match) {
    return res.status(404).json({ error: '匹配记录不存在' });
  }

  const demand = db.prepare('SELECT * FROM decoration_demands WHERE id = ?').get(match.demand_id) as DecorationDemand;
  if (demand.owner_id !== req.user!.id) {
    return res.status(403).json({ error: '无权操作此需求' });
  }

  db.prepare("UPDATE designer_matches SET status = 'accepted' WHERE id = ?").run(id);
  db.prepare("UPDATE designer_matches SET status = 'rejected' WHERE demand_id = ? AND id != ?").run(match.demand_id, id);
  db.prepare("UPDATE decoration_demands SET status = 'matched', updated_at = ? WHERE id = ?").run(new Date().toISOString(), match.demand_id);

  res.json({ message: '已确认设计师' });
});

export default router;
