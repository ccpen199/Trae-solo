import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize || req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const projectId = (req.query.projectId || req.query.project_id) as string;
    const status = req.query.status as string;

    const params: any[] = [];
    const conditions: string[] = [];
    if (projectId) {
      conditions.push('q.project_id = ?');
      params.push(projectId);
    }
    if (status) {
      conditions.push('q.status = ?');
      params.push(status === 'accepted' ? 'approved' : status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM quotations q ${whereClause}`).get(...params) as any).count;
    const quotations = db.prepare(
      `SELECT q.*, u.name as company_name
       FROM quotations q
       JOIN users u ON q.company_id = u.id
       ${whereClause}
       ORDER BY q.updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: quotations, total, page, limit, pageSize: limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报价列表失败' });
  }
});

router.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { project_id, title, labor_cost, material_cost, management_fee } = req.body;
    if (!project_id || !title) {
      return res.status(400).json({ success: false, error: '项目ID和标题不能为空' });
    }

    const labor = labor_cost || 0;
    const material = material_cost || 0;
    const management = management_fee || 0;
    const total = labor + material + management;

    const result = db.prepare(
      `INSERT INTO quotations (project_id, company_id, title, total_price, labor_cost, material_cost, management_fee)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(project_id, req.user!.id, title, total, labor, material, management);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建报价失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const quotation = db.prepare(
      `SELECT q.*, u.name as company_name
       FROM quotations q
       JOIN users u ON q.company_id = u.id WHERE q.id = ?`
    ).get(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: '报价不存在' });
    }

    const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...quotation, items } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报价详情失败' });
  }
});

function updateQuotation(req: AuthenticatedRequest, res: any) {
  try {
    const { title, labor_cost, material_cost, management_fee, status, warning_flags } = req.body;

    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id) as any;
    if (!quotation) {
      return res.status(404).json({ success: false, error: '报价不存在' });
    }

    const labor = labor_cost ?? quotation.labor_cost;
    const material = material_cost ?? quotation.material_cost;
    const management = management_fee ?? quotation.management_fee;
    const total = labor + material + management;

    db.prepare(
      `UPDATE quotations SET title = ?, labor_cost = ?, material_cost = ?, management_fee = ?, total_price = ?, status = ?, warning_flags = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      title ?? quotation.title,
      labor,
      material,
      management,
      total,
      status ? (status === 'accepted' ? 'approved' : status) : quotation.status,
      warning_flags ? JSON.stringify(warning_flags) : quotation.warning_flags,
      req.params.id
    );

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新报价失败' });
  }
}

router.put('/:id', updateQuotation);
router.patch('/:id', updateQuotation);

router.get('/:id/items', (req: AuthenticatedRequest, res) => {
  try {
    const quotation = db.prepare('SELECT id FROM quotations WHERE id = ?').get(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: '报价不存在' });
    }
    const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC').all(req.params.id);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报价项目失败' });
  }
});

router.post('/:id/items', (req: AuthenticatedRequest, res) => {
  try {
    const { category, item_name, specification, unit_price, quantity, unit, craft_standard, is_additional } = req.body;
    if (!category || !item_name || !unit_price || !quantity) {
      return res.status(400).json({ success: false, error: '分类、项目名、单价和数量不能为空' });
    }

    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: '报价不存在' });
    }

    const subtotal = unit_price * quantity;
    const result = db.prepare(
      `INSERT INTO quotation_items (quotation_id, category, item_name, specification, unit_price, quantity, unit, craft_standard, is_additional, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(req.params.id, category, item_name, specification || null, unit_price, quantity, unit || null, craft_standard || null, is_additional ? 1 : 0, subtotal);

    recalcTotals(Number(req.params.id));

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加报价项目失败' });
  }
});

function updateQuotationItem(req: AuthenticatedRequest, res: any) {
  try {
    const { category, item_name, specification, unit_price, quantity, unit, craft_standard, is_additional } = req.body;

    const item = db.prepare('SELECT * FROM quotation_items WHERE id = ? AND quotation_id = ?').get(req.params.itemId, req.params.id) as any;
    if (!item) {
      return res.status(404).json({ success: false, error: '报价项目不存在' });
    }

    const price = unit_price ?? item.unit_price;
    const qty = quantity ?? item.quantity;
    const subtotal = price * qty;

    db.prepare(
      `UPDATE quotation_items SET category = ?, item_name = ?, specification = ?, unit_price = ?, quantity = ?, unit = ?, craft_standard = ?, is_additional = ?, subtotal = ? WHERE id = ?`
    ).run(
      category ?? item.category,
      item_name ?? item.item_name,
      specification ?? item.specification,
      price,
      qty,
      unit ?? item.unit,
      craft_standard ?? item.craft_standard,
      is_additional !== undefined ? (is_additional ? 1 : 0) : item.is_additional,
      subtotal,
      req.params.itemId
    );

    recalcTotals(Number(req.params.id));

    res.json({ success: true, data: { id: req.params.itemId } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新报价项目失败' });
  }
}

router.put('/:id/items/:itemId', updateQuotationItem);
router.patch('/:id/items/:itemId', updateQuotationItem);

router.delete('/:id/items/:itemId', (req: AuthenticatedRequest, res) => {
  try {
    const item = db.prepare('SELECT * FROM quotation_items WHERE id = ? AND quotation_id = ?').get(req.params.itemId, req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: '报价项目不存在' });
    }

    db.prepare('DELETE FROM quotation_items WHERE id = ?').run(req.params.itemId);
    recalcTotals(Number(req.params.id));

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除报价项目失败' });
  }
});

router.get('/compare', (req: AuthenticatedRequest, res) => {
  try {
    const idsStr = req.query.ids as string;
    if (!idsStr) {
      return res.status(400).json({ success: false, error: '请提供报价ID列表' });
    }

    const ids = idsStr.split(',').map(Number);
    if (ids.length < 2) {
      return res.status(400).json({ success: false, error: '至少需要两个报价进行比较' });
    }

    const quotations: any[] = [];
    for (const id of ids) {
      const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
      if (!q) continue;
      const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(id);
      quotations.push({ ...q, items });
    }

    const allCategories = new Set<string>();
    quotations.forEach(q => q.items.forEach((i: any) => allCategories.add(i.category)));

    const priceDiffs: any[] = [];
    for (const cat of allCategories) {
      const catItems = quotations.map(q => {
        const items = q.items.filter((i: any) => i.category === cat);
        const total = items.reduce((sum: number, i: any) => sum + i.subtotal, 0);
        return { quotation_id: q.id, title: q.title, total, items };
      });

      const prices = catItems.map(c => c.total).filter(p => p > 0);
      if (prices.length >= 2) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const diffPercent = ((maxPrice - minPrice) / minPrice) * 100;
        if (diffPercent > 20) {
          priceDiffs.push({ category: cat, diffPercent: Math.round(diffPercent * 100) / 100, details: catItems });
        }
      }
    }

    const additionalItems: any[] = [];
    const baseItems = quotations[0]?.items || [];
    for (let i = 1; i < quotations.length; i++) {
      const qItems = quotations[i].items;
      const additional = qItems.filter((item: any) => item.is_additional === 1);
      if (additional.length > 0) {
        additionalItems.push({ quotation_id: quotations[i].id, title: quotations[i].title, items: additional });
      }
    }

    const craftDiffs: any[] = [];
    for (const cat of allCategories) {
      const craftStandards = quotations.map(q => {
        const items = q.items.filter((i: any) => i.category === cat && i.craft_standard);
        return { quotation_id: q.id, title: q.title, standards: items.map((i: any) => ({ name: i.item_name, craft_standard: i.craft_standard })) };
      }).filter(c => c.standards.length > 0);

      if (craftStandards.length >= 2) {
        const standards = new Set(craftStandards.flatMap((c: any) => c.standards.map((s: any) => s.craft_standard)));
        if (standards.size > 1) {
          craftDiffs.push({ category: cat, details: craftStandards });
        }
      }
    }

    res.json({
      success: true,
      data: {
        quotations: quotations.map(q => ({ id: q.id, title: q.title, total_price: q.total_price, labor_cost: q.labor_cost, material_cost: q.material_cost, management_fee: q.management_fee })),
        priceDifferences: priceDiffs,
        additionalItems,
        craftStandardDifferences: craftDiffs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '比较报价失败' });
  }
});

router.get('/:id/warnings', (req: AuthenticatedRequest, res) => {
  try {
    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id) as any;
    if (!quotation) {
      return res.status(404).json({ success: false, error: '报价不存在' });
    }

    const additionalItems = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? AND is_additional = 1').all(req.params.id);
    const warningFlags = JSON.parse(quotation.warning_flags || '[]');

    res.json({
      success: true,
      data: {
        additionalItems,
        existingWarnings: warningFlags,
        totalAdditionalCost: additionalItems.reduce((sum: number, i: any) => sum + i.subtotal, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取警告信息失败' });
  }
});

function recalcTotals(quotationId: number) {
  const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(quotationId) as any[];
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  db.prepare("UPDATE quotations SET total_price = ?, updated_at = datetime('now') WHERE id = ?").run(total, quotationId);
}

export default router;
