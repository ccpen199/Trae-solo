const express = require('express');
const router = express.Router();
const db = require('../database');
const logger = require('../utils/logger');
const { success, error, pagination } = require('../utils/response');

router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      account_id,
      project_id,
      product,
      region,
      start_date,
      end_date,
      resource_id,
      is_assigned
    } = req.query;

    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (account_id) {
      conditions.push('b.account_id = ?');
      params.push(account_id);
    }
    if (project_id) {
      conditions.push('b.project_id = ?');
      params.push(project_id);
    }
    if (product) {
      conditions.push('b.product LIKE ?');
      params.push(`%${product}%`);
    }
    if (region) {
      conditions.push('b.region = ?');
      params.push(region);
    }
    if (resource_id) {
      conditions.push('b.resource_id LIKE ?');
      params.push(`%${resource_id}%`);
    }
    if (start_date) {
      conditions.push('b.bill_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('b.bill_date <= ?');
      params.push(end_date);
    }
    if (is_assigned !== undefined && is_assigned !== '') {
      if (is_assigned === '1' || is_assigned === 'true') {
        conditions.push('(b.project_id IS NOT NULL AND b.tags != \'{}\' AND b.tags IS NOT NULL)');
      } else {
        conditions.push('(b.project_id IS NULL OR b.tags = \'{}\' OR b.tags IS NULL)');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM bills b
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN cloud_accounts ca ON b.account_id = ca.account_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT b.*, p.project_name, p.project_code, ca.account_name
      FROM bills b
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN cloud_accounts ca ON b.account_id = ca.account_id
      ${whereClause}
      ORDER BY b.bill_date DESC, b.id DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    logger.info('查询账单列表', { count: list.length, total, page, pageSize });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询账单列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/aggregate', (req, res) => {
  try {
    const {
      group_by = 'account',
      start_date,
      end_date,
      account_id,
      project_id,
      is_assigned
    } = req.query;

    const conditions = [];
    const params = [];

    if (account_id) {
      conditions.push('b.account_id = ?');
      params.push(account_id);
    }
    if (project_id) {
      conditions.push('b.project_id = ?');
      params.push(project_id);
    }
    if (start_date) {
      conditions.push('b.bill_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('b.bill_date <= ?');
      params.push(end_date);
    }
    if (is_assigned !== undefined && is_assigned !== '') {
      if (is_assigned === '1' || is_assigned === 'true') {
        conditions.push('(b.project_id IS NOT NULL AND b.tags != \'{}\' AND b.tags IS NOT NULL)');
      } else {
        conditions.push('(b.project_id IS NULL OR b.tags = \'{}\' OR b.tags IS NULL)');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let groupField, joinClause = '';
    switch (group_by) {
      case 'account':
        groupField = 'b.account_id, ca.account_name';
        joinClause = 'LEFT JOIN cloud_accounts ca ON b.account_id = ca.account_id';
        break;
      case 'project':
        groupField = 'b.project_id, p.project_name, p.project_code';
        joinClause = 'LEFT JOIN projects p ON b.project_id = p.id';
        break;
      case 'product':
        groupField = 'b.product';
        break;
      case 'region':
        groupField = 'b.region';
        break;
      case 'date':
        groupField = 'b.bill_date';
        break;
      case 'tag':
        groupField = 'b.tags';
        break;
      default:
        groupField = 'b.account_id, ca.account_name';
        joinClause = 'LEFT JOIN cloud_accounts ca ON b.account_id = ca.account_id';
    }

    const sql = `
      SELECT ${groupField},
             SUM(b.cost) as total_cost,
             COUNT(DISTINCT b.resource_id) as resource_count
      FROM bills b
      ${joinClause}
      ${whereClause}
      GROUP BY ${groupField}
      ORDER BY total_cost DESC
    `;

    const data = db.prepare(sql).all(...params);

    data.forEach(item => {
      if (item.tags) {
        try {
          item.tags = JSON.parse(item.tags);
        } catch (e) {
          // keep as string
        }
      }
    });

    logger.info('账单聚合查询', { group_by, count: data.length });
    res.json(success(data));
  } catch (err) {
    logger.error('账单聚合查询失败', err);
    res.json(error(err.message));
  }
});

router.post('/', (req, res) => {
  try {
    const { bills } = req.body;

    if (!Array.isArray(bills) || bills.length === 0) {
      return res.json(error('账单数据不能为空'));
    }

    const insertStmt = db.prepare(`
      INSERT INTO bills (bill_date, resource_id, account_id, project_id, product, region, tags, cost, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((billList) => {
      let successCount = 0;
      for (const bill of billList) {
        try {
          insertStmt.run(
            bill.bill_date,
            bill.resource_id,
            bill.account_id,
            bill.project_id || null,
            bill.product,
            bill.region || null,
            bill.tags ? JSON.stringify(bill.tags) : '{}',
            bill.cost,
            bill.currency || 'CNY'
          );
          successCount++;
        } catch (e) {
          logger.warn('导入账单跳过', { resource_id: bill.resource_id, error: e.message });
        }
      }
      return successCount;
    });

    const count = transaction(bills);

    logger.info('导入账单', { total: bills.length, success: count });
    res.json(success({ imported: count, total: bills.length }, '导入成功'));
  } catch (err) {
    logger.error('导入账单失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
