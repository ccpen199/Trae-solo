import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware';
import { DecorationContract, DecorationDemand, ProjectMilestone, PaymentRecord } from '../types';
import crypto from 'crypto';

const router = Router();

router.post('/', authMiddleware, roleMiddleware('owner', 'store_manager'), (req: AuthRequest, res) => {
  const { demand_id } = req.body;

  const demand = db.prepare('SELECT * FROM decoration_demands WHERE id = ?').get(demand_id) as DecorationDemand | undefined;
  if (!demand) {
    return res.status(404).json({ error: '需求不存在' });
  }

  const match = db.prepare("SELECT * FROM designer_matches WHERE demand_id = ? AND status = 'accepted'").get(demand_id) as any;
  if (!match) {
    return res.status(400).json({ error: '请先确认设计师' });
  }

  const existingContract = db.prepare('SELECT * FROM decoration_contracts WHERE demand_id = ?').get(demand_id);
  if (existingContract) {
    return res.status(400).json({ error: '该需求已有合同' });
  }

  const solution = db.prepare('SELECT estimated_budget FROM ai_solutions WHERE demand_id = ?').get(demand_id) as any;
  const totalAmount = solution?.estimated_budget || Math.round((demand.budget_min + demand.budget_max) / 2);
  const escrowAmount = Math.round(totalAmount * 0.2);

  const contractNo = `DEC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const contractId = uuidv4();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 90);

  db.prepare(`
    INSERT INTO decoration_contracts (
      id, demand_id, owner_id, designer_id, store_id, contract_no,
      total_amount, escrow_amount, start_date, end_date, warranty_years,
      terms, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(
    contractId,
    demand_id,
    demand.owner_id,
    match.designer_id,
    match.store_id,
    contractNo,
    totalAmount,
    escrowAmount,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    10,
    `
      第一条 工程概况
      1.1 工程地点：${demand.city}${demand.district || ''}${demand.address}
      1.2 工程户型：${demand.house_type}
      1.3 工程面积：${demand.area}平方米
      1.4 工程造价：人民币${totalAmount}元整
      1.5 工期：自${startDate.toISOString().split('T')[0]}至${endDate.toISOString().split('T')[0]}，共计90日历天

      第二条 资金托管条款
      2.1 本合同签订后3日内，业主支付合同总额20%（${escrowAmount}元）作为托管资金
      2.2 托管资金由第三方平台监管，按工程节点验收合格后释放
      2.3 资金托管账户信息：平台专用监管账户

      第三条 工程节点与付款
      3.1 水电隐蔽验收合格后，支付合同总额30%
      3.2 泥木完工验收合格后，支付合同总额35%
      3.3 竣工验收合格后，支付合同总额15%

      第四条 三方确认条款
      4.1 各工程节点完成后，须经业主、设计师、施工监理三方签字确认
      4.2 三方确认完成后，方可进行下一阶段施工和款项支付

      第五条 质量保修
      5.1 本工程质保期为10年，自竣工验收合格之日起计算
      5.2 质保期内非人为损坏的质量问题，由施工方免费维修

      第六条 违约责任
      6.1 任何一方违约，应承担相应的违约责任
      6.2 施工方逾期完工的，每日按合同总额的0.1‰支付违约金
    `,
    new Date().toISOString()
  );

  const milestones = [
    { type: '水电隐蔽验收', percent: 0.30, days: 15 },
    { type: '泥木完工', percent: 0.35, days: 45 },
    { type: '竣工', percent: 0.15, days: 90 },
  ];

  milestones.forEach((ms, idx) => {
    const plannedDate = new Date(startDate);
    plannedDate.setDate(startDate.getDate() + ms.days);
    db.prepare(`
      INSERT INTO project_milestones (
        id, contract_id, milestone_type, planned_date, payment_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      uuidv4(),
      contractId,
      ms.type,
      plannedDate.toISOString().split('T')[0],
      Math.round(totalAmount * ms.percent),
      new Date().toISOString()
    );
  });

  const materials = [
    { name: '地砖', spec: '800x800mm 抛光砖', qty: demand.area * 0.8, unit: '㎡', price: 150 },
    { name: '木地板', spec: '15mm 多层实木', qty: demand.area * 0.6, unit: '㎡', price: 280 },
    { name: '墙面涂料', spec: '净味乳胶漆', qty: demand.area * 2.5, unit: '㎡', price: 85 },
    { name: '定制橱柜', spec: '颗粒板柜体+石英石台面', qty: 4, unit: '延米', price: 2800 },
    { name: '室内门', spec: '实木复合门', qty: 3, unit: '樘', price: 1800 },
    { name: '开关插座', spec: '品牌面板', qty: 30, unit: '个', price: 45 },
    { name: '卫生洁具', spec: '坐便器+洗手盆+淋浴', qty: 1, unit: '套', price: 8500 },
    { name: '集成吊顶', spec: '铝扣板', qty: demand.area * 0.18, unit: '㎡', price: 180 },
  ];

  const suppliers = db.prepare("SELECT id FROM users WHERE role = 'supplier' AND status = 'active'").all() as any[];
  materials.forEach(mat => {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    db.prepare(`
      INSERT INTO material_bom (
        id, contract_id, material_name, specification, quantity, unit,
        unit_price, total_price, supplier_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?)
    `).run(
      uuidv4(),
      contractId,
      mat.name,
      mat.spec,
      mat.qty,
      mat.unit,
      mat.price,
      Math.round(mat.qty * mat.price),
      supplier?.id,
      new Date().toISOString()
    );
  });

  db.prepare("UPDATE decoration_demands SET status = 'signed', updated_at = ? WHERE id = ?").run(new Date().toISOString(), demand_id);

  const contract = db.prepare(`
    SELECT c.*,
      o.real_name as owner_name, o.phone as owner_phone,
      d.real_name as designer_name,
      s.name as store_name
    FROM decoration_contracts c
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN users d ON c.designer_id = d.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.id = ?
  `).get(contractId);

  res.status(201).json(contract);
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { status } = req.query;
  let query = `
    SELECT c.*,
      o.real_name as owner_name, o.phone as owner_phone,
      d.real_name as designer_name,
      s.name as store_name
    FROM decoration_contracts c
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN users d ON c.designer_id = d.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.user!.role === 'owner') {
    query += ' AND c.owner_id = ?';
    params.push(req.user!.id);
  } else if (req.user!.role === 'designer') {
    query += ' AND c.designer_id = ?';
    params.push(req.user!.id);
  } else if (req.user!.role === 'store_manager') {
    const user = db.prepare('SELECT store_id FROM users WHERE id = ?').get(req.user!.id) as any;
    if (user?.store_id) {
      query += ' AND c.store_id = ?';
      params.push(user.store_id);
    }
  }

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.created_at DESC';
  const contracts = db.prepare(query).all(...params);
  res.json(contracts);
});

router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const contract = db.prepare(`
    SELECT c.*,
      o.real_name as owner_name, o.phone as owner_phone,
      d.real_name as designer_name,
      s.name as store_name, s.contact_phone as store_phone
    FROM decoration_contracts c
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN users d ON c.designer_id = d.id
    LEFT JOIN stores s ON c.store_id = s.id
    WHERE c.id = ?
  `).get(id);

  if (!contract) {
    return res.status(404).json({ error: '合同不存在' });
  }

  res.json(contract);
});

router.post('/:id/sign', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const contract = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(id) as DecorationContract | undefined;

  if (!contract) {
    return res.status(404).json({ error: '合同不存在' });
  }

  const now = new Date().toISOString();

  if (req.user!.role === 'owner' && contract.owner_id === req.user!.id) {
    if (contract.owner_signed_at) {
      return res.status(400).json({ error: '业主已签署' });
    }
    db.prepare('UPDATE decoration_contracts SET owner_signed_at = ?, status = ? WHERE id = ?').run(
      now,
      contract.store_signed_at ? 'signed' : 'pending_sign',
      id
    );
  } else if (req.user!.role === 'store_manager') {
    if (contract.store_signed_at) {
      return res.status(400).json({ error: '门店已签署' });
    }
    db.prepare('UPDATE decoration_contracts SET store_signed_at = ?, status = ? WHERE id = ?').run(
      now,
      contract.owner_signed_at ? 'signed' : 'pending_sign',
      id
    );
  } else {
    return res.status(403).json({ error: '无权签署此合同' });
  }

  const updated = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(id) as DecorationContract;

  if (updated.status === 'signed') {
    db.prepare("UPDATE decoration_demands SET status = 'in_progress', updated_at = ? WHERE id = ?").run(now, contract.demand_id);

    const contractHash = crypto.createHash('sha256').update(JSON.stringify(updated)).digest('hex');
    const expireDate = new Date();
    expireDate.setFullYear(expireDate.getFullYear() + 10);

    db.prepare(`
      INSERT INTO electronic_contracts (id, contract_id, hash, storage_url, expire_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      id,
      contractHash,
      `/storage/contracts/${id}.pdf`,
      expireDate.toISOString().split('T')[0],
      now
    );

    db.prepare(`
      INSERT INTO payment_records (id, contract_id, amount, payment_type, payee_role, payee_id, status, created_at)
      VALUES (?, ?, ?, 'deposit', 'store', ?, 'pending', ?)
    `).run(
      uuidv4(),
      id,
      contract.escrow_amount,
      contract.store_id,
      now
    );
  }

  res.json(updated);
});

router.get('/:id/milestones', authMiddleware, (req, res) => {
  const { id } = req.params;
  const milestones = db.prepare(`
    SELECT m.*,
      o.real_name as owner_name,
      d.real_name as designer_name,
      sv.real_name as supervisor_name
    FROM project_milestones m
    LEFT JOIN decoration_contracts c ON m.contract_id = c.id
    LEFT JOIN users o ON c.owner_id = o.id
    LEFT JOIN users d ON c.designer_id = d.id
    LEFT JOIN users sv ON sv.role = 'supervisor' AND sv.status = 'active'
      AND sv.city = (SELECT city FROM stores WHERE id = c.store_id)
    WHERE m.contract_id = ?
    ORDER BY m.planned_date ASC
  `).all(id);
  res.json(milestones);
});

router.post('/:id/milestones/:milestoneId/ready', authMiddleware, roleMiddleware('supervisor', 'store_manager'), (req, res) => {
  const { milestoneId } = req.params;
  const milestone = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(milestoneId) as ProjectMilestone | undefined;

  if (!milestone) {
    return res.status(404).json({ error: '节点不存在' });
  }

  if (milestone.status !== 'pending') {
    return res.status(400).json({ error: '节点状态不允许此操作' });
  }

  db.prepare("UPDATE project_milestones SET status = 'ready', actual_date = ? WHERE id = ?").run(
    new Date().toISOString().split('T')[0],
    milestoneId
  );

  res.json({ message: '已提交验收申请' });
});

router.post('/:id/milestones/:milestoneId/confirm', authMiddleware, (req: AuthRequest, res) => {
  const { id, milestoneId } = req.params;
  const milestone = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(milestoneId) as ProjectMilestone | undefined;
  const contract = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(id) as DecorationContract | undefined;

  if (!milestone || !contract) {
    return res.status(404).json({ error: '记录不存在' });
  }

  if (milestone.status !== 'ready') {
    return res.status(400).json({ error: '节点状态不允许确认' });
  }

  let updateField = '';
  if (req.user!.role === 'owner' && contract.owner_id === req.user!.id) {
    updateField = 'owner_confirmed';
  } else if (req.user!.role === 'designer' && contract.designer_id === req.user!.id) {
    updateField = 'designer_confirmed';
  } else if (req.user!.role === 'supervisor') {
    updateField = 'supervisor_confirmed';
  } else {
    return res.status(403).json({ error: '无权确认此节点' });
  }

  db.prepare(`UPDATE project_milestones SET ${updateField} = 1 WHERE id = ?`).run(milestoneId);

  const updated = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(milestoneId) as ProjectMilestone;

  if (updated.owner_confirmed && updated.designer_confirmed && updated.supervisor_confirmed) {
    db.prepare("UPDATE project_milestones SET status = 'confirmed', payment_status = 'processing' WHERE id = ?").run(milestoneId);

    db.prepare(`
      INSERT INTO payment_records (id, contract_id, milestone_id, amount, payment_type, payee_role, payee_id, status, created_at)
      VALUES (?, ?, ?, ?, 'milestone', 'store', ?, 'processing', ?)
    `).run(
      uuidv4(),
      id,
      milestoneId,
      milestone.payment_amount,
      contract.store_id,
      new Date().toISOString()
    );

    const allMilestones = db.prepare('SELECT * FROM project_milestones WHERE contract_id = ?').all(id) as ProjectMilestone[];
    const allConfirmed = allMilestones.every(m => m.status === 'confirmed');

    if (allConfirmed) {
      db.prepare("UPDATE decoration_contracts SET status = 'signed' WHERE id = ?").run(id);
      db.prepare("UPDATE decoration_demands SET status = 'completed', updated_at = ? WHERE id = ?").run(new Date().toISOString(), contract.demand_id);
    }
  }

  res.json(db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(milestoneId));
});

router.post('/:id/milestones/:milestoneId/pay', authMiddleware, roleMiddleware('owner'), (req: AuthRequest, res) => {
  const { id, milestoneId } = req.params;
  const milestone = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(milestoneId) as ProjectMilestone | undefined;
  const contract = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(id) as DecorationContract | undefined;

  if (!milestone || !contract) {
    return res.status(404).json({ error: '记录不存在' });
  }

  if (milestone.status !== 'confirmed') {
    return res.status(400).json({ error: '请先完成三方确认' });
  }

  if (milestone.payment_status !== 'processing') {
    return res.status(400).json({ error: '付款状态不正确' });
  }

  if (contract.owner_id !== req.user!.id) {
    return res.status(403).json({ error: '无权操作' });
  }

  const now = new Date().toISOString();
  const txNo = `TX${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

  db.prepare(`
    UPDATE project_milestones
    SET payment_status = 'paid', paid_at = ?
    WHERE id = ?
  `).run(now, milestoneId);

  db.prepare(`
    UPDATE payment_records
    SET status = 'completed', transaction_no = ?, created_at = ?
    WHERE milestone_id = ?
  `).run(txNo, now, milestoneId);

  res.json({ message: '付款成功', transaction_no: txNo });
});

router.get('/:id/payments', authMiddleware, (req, res) => {
  const { id } = req.params;
  const payments = db.prepare(`
    SELECT p.*, s.name as payee_name
    FROM payment_records p
    LEFT JOIN stores s ON p.payee_id = s.id
    WHERE p.contract_id = ?
    ORDER BY p.created_at DESC
  `).all(id);
  res.json(payments);
});

router.get('/:id/bom', authMiddleware, (req, res) => {
  const { id } = req.params;
  const bom = db.prepare(`
    SELECT b.*, u.real_name as supplier_name, u.phone as supplier_phone
    FROM material_bom b
    LEFT JOIN users u ON b.supplier_id = u.id
    WHERE b.contract_id = ?
    ORDER BY b.created_at ASC
  `).all(id);
  res.json(bom);
});

router.get('/:id/electronic-contract', authMiddleware, (req, res) => {
  const { id } = req.params;
  const record = db.prepare('SELECT * FROM electronic_contracts WHERE contract_id = ?').get(id) as any;
  if (!record) {
    return res.json(null);
  }
  const contract = db.prepare('SELECT * FROM decoration_contracts WHERE id = ?').get(id) as any;
  const txHash = crypto.createHash('sha256').update(record.id + record.hash + record.created_at).digest('hex');
  res.json({
    ...record,
    blockchain_tx: record.blockchain_tx || `0x${txHash}`,
    contract_no: contract?.contract_no,
    warranty_years: contract?.warranty_years,
    total_amount: contract?.total_amount,
    owner_signed_at: contract?.owner_signed_at,
    store_signed_at: contract?.store_signed_at,
  });
});

export default router;
