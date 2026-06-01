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
      resource_type,
      region,
      status,
      is_assigned,
      keyword
    } = req.query;

    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (account_id) {
      conditions.push('r.account_id = ?');
      params.push(account_id);
    }
    if (project_id) {
      conditions.push('r.project_id = ?');
      params.push(project_id);
    }
    if (resource_type) {
      conditions.push('r.resource_type = ?');
      params.push(resource_type);
    }
    if (region) {
      conditions.push('r.region = ?');
      params.push(region);
    }
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (is_assigned !== undefined && is_assigned !== '') {
      conditions.push('r.is_assigned = ?');
      params.push(is_assigned === '1' || is_assigned === 'true' ? 1 : 0);
    }
    if (keyword) {
      conditions.push('(r.resource_id LIKE ? OR r.resource_name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM resources r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT r.*, p.project_name, p.project_code, ca.account_name
      FROM resources r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      ${whereClause}
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];

    const { total } = db.prepare(countSql).get(...countParams);
    const list = db.prepare(dataSql).all(...dataParams);

    list.forEach(item => {
      if (item.tags) {
        try {
          item.tags = JSON.parse(item.tags);
        } catch (e) {
          // keep as string
        }
      }
    });

    logger.info('查询资源列表', { count: list.length, total, page, pageSize });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询资源列表失败', err);
    res.json(error(err.message));
  }
});

router.get('/unassigned', (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    const conditions = ['r.is_assigned = 0'];
    const params = [];

    if (keyword) {
      conditions.push('(r.resource_id LIKE ? OR r.resource_name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(*) as total
      FROM resources r
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT r.*, ca.account_name,
             (SELECT IFNULL(SUM(cost), 0) FROM bills b WHERE b.resource_id = r.resource_id) as monthly_cost
      FROM resources r
      LEFT JOIN cloud_accounts ca ON r.account_id = ca.account_id
      ${whereClause}
      ORDER BY monthly_cost DESC, r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const { total } = db.prepare(countSql).get(...params);
    const list = db.prepare(dataSql).all(...params, parseInt(pageSize), parseInt(offset));

    list.forEach(item => {
      if (item.tags) {
        try {
          item.tags = JSON.parse(item.tags);
        } catch (e) {
          // keep as string
        }
      }
    });

    logger.info('查询待认领资源', { count: list.length, total });
    res.json(success(pagination(list, total, page, pageSize)));
  } catch (err) {
    logger.error('查询待认领资源失败', err);
    res.json(error(err.message));
  }
});

router.put('/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, tags } = req.body;

    if (!project_id) {
      return res.json(error('项目ID不能为空'));
    }

    let resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
    if (!resource) {
      resource = db.prepare('SELECT * FROM resources WHERE resource_id = ?').get(id);
    }
    if (!resource) {
      return res.json(error('资源不存在', 404));
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!project) {
      return res.json(error('项目不存在'));
    }

    const tagsStr = tags ? JSON.stringify(tags) : (resource.tags || '{}');

    const updateStmt = db.prepare(`
      UPDATE resources
      SET project_id = ?, tags = ?, is_assigned = 1
      WHERE id = ?
    `);

    const updateBillsStmt = db.prepare(`
      UPDATE bills
      SET project_id = ?, tags = ?
      WHERE resource_id = ?
    `);

    const transaction = db.transaction(() => {
      updateStmt.run(project_id, tagsStr, resource.id);
      updateBillsStmt.run(project_id, tagsStr, resource.resource_id);
    });

    transaction();

    logger.info('资源分配成功', { resource_id: resource.resource_id, project_id });

    const updatedResource = db.prepare(`
      SELECT r.*, p.project_name, p.project_code
      FROM resources r
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `).get(resource.id);

    if (updatedResource.tags) {
      try {
        updatedResource.tags = JSON.parse(updatedResource.tags);
      } catch (e) {}
    }

    res.json(success(updatedResource, '分配成功'));
  } catch (err) {
    logger.error('资源分配失败', err);
    res.json(error(err.message));
  }
});

module.exports = router;
