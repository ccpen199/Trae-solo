const express = require('express');
const db = require('../db');
const { authMiddleware, optionalAuth, requireBarOwnerOrOperator } = require('../middleware/auth');
const { success, error, notFound, serverError, forbidden } = require('../utils/response');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, category, status = 'active', sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = `WHERE pb.status = ?`;
    const params = [status];

    if (keyword) {
      whereClause += ` AND (pb.name LIKE ? OR pb.description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      whereClause += ` AND p.category = ?`;
      params.push(category);
    }

    let orderBy = 'ORDER BY pb.created_at DESC';
    if (sort === 'hot') {
      orderBy = 'ORDER BY pb.view_count DESC, pb.post_count DESC';
    } else if (sort === 'members') {
      orderBy = 'ORDER BY pb.member_count DESC';
    }

    const countQuery = `
      SELECT COUNT(*) as total FROM product_bars pb
      LEFT JOIN products p ON pb.product_id = p.id
      ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params);

    const bars = db.prepare(`
      SELECT pb.*, 
             p.name as product_name, p.brand as product_brand, p.cover_image as product_cover, p.price as product_price,
             u.nickname as owner_nickname, u.avatar as owner_avatar
      FROM product_bars pb
      LEFT JOIN products p ON pb.product_id = p.id
      LEFT JOIN users u ON pb.owner_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    return success(res, {
      list: bars,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取产品吧列表错误:', err);
    return serverError(res, '获取列表失败');
  }
});

router.get('/my', authMiddleware, (req, res) => {
  try {
    const bars = db.prepare(`
      SELECT pb.*, 
             p.name as product_name, p.brand as product_brand,
             bm.role as member_role
      FROM product_bars pb
      LEFT JOIN products p ON pb.product_id = p.id
      LEFT JOIN bar_members bm ON pb.id = bm.bar_id AND bm.user_id = ?
      WHERE bm.user_id = ? OR pb.owner_id = ?
      ORDER BY pb.updated_at DESC
    `).all(req.user.id, req.user.id, req.user.id);

    return success(res, bars);
  } catch (err) {
    console.error('获取我的产品吧错误:', err);
    return serverError(res, '获取失败');
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM products 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `).all();

    return success(res, categories.map(c => c.category));
  } catch (err) {
    console.error('获取分类错误:', err);
    return serverError(res, '获取失败');
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const bar = db.prepare(`
      SELECT pb.*, 
             p.name as product_name, p.category as product_category, p.brand as product_brand, 
             p.description as product_description, p.cover_image as product_cover, p.price as product_price,
             u.nickname as owner_nickname, u.avatar as owner_avatar,
             (SELECT COUNT(*) FROM bar_members WHERE bar_id = pb.id) as member_count
      FROM product_bars pb
      LEFT JOIN products p ON pb.product_id = p.id
      LEFT JOIN users u ON pb.owner_id = u.id
      WHERE pb.id = ?
    `).get(req.params.id);

    if (!bar) {
      return notFound(res, '产品吧不存在');
    }

    if (bar.status !== 'active' && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'operator' && req.user.id !== bar.owner_id))) {
      return forbidden(res, '该产品吧暂不可访问');
    }

    db.prepare('UPDATE product_bars SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    let isMember = false;
    let memberRole = null;
    if (req.user) {
      const membership = db.prepare('SELECT role FROM bar_members WHERE bar_id = ? AND user_id = ?').get(req.params.id, req.user.id);
      if (membership) {
        isMember = true;
        memberRole = membership.role;
      }
    }

    const columns = db.prepare(`
      SELECT * FROM content_columns 
      WHERE bar_id = ? 
      ORDER BY sort_order ASC, id ASC
    `).all(req.params.id);

    const products = db.prepare(`
      SELECT bp.relation_type, bp.sort_order,
             p.*
      FROM bar_products bp
      LEFT JOIN products p ON bp.product_id = p.id
      WHERE bp.bar_id = ?
      ORDER BY bp.sort_order ASC, bp.id ASC
    `).all(req.params.id);

    return success(res, {
      ...bar,
      isMember,
      memberRole,
      columns,
      relatedProducts: products
    });
  } catch (err) {
    console.error('获取产品吧详情错误:', err);
    return serverError(res, '获取详情失败');
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description, cover_image, product_id } = req.body;

    if (!name || !name.trim()) {
      return error(res, '产品吧名称不能为空');
    }

    if (name.length > 50) {
      return error(res, '产品吧名称不能超过50个字符');
    }

    const existingBar = db.prepare('SELECT id FROM product_bars WHERE name = ?').get(name.trim());
    if (existingBar) {
      return error(res, '已存在同名产品吧');
    }

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO product_bars (name, description, cover_image, product_id, creator_id, owner_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(name.trim(), description || null, cover_image || null, product_id || null, req.user.id, req.user.id);

      const barId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO bar_members (bar_id, user_id, role)
        VALUES (?, ?, 'owner')
      `).run(barId, req.user.id);

      const defaultColumns = [
        { name: '选购指南', description: '如何选择这款产品', content_type: 'forum', sort_order: 1 },
        { name: '使用经验', description: '产品使用技巧和心得', content_type: 'blog', sort_order: 2 },
        { name: '问题交流', description: '使用中遇到的问题和解答', content_type: 'qa', sort_order: 3 }
      ];

      const colStmt = db.prepare(`
        INSERT INTO content_columns (bar_id, name, description, content_type, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      defaultColumns.forEach(col => {
        colStmt.run(barId, col.name, col.description, col.content_type, col.sort_order);
      });

      db.prepare(`
        INSERT INTO reviews (target_type, target_id, submitter_id, review_type, reason)
        VALUES ('bar', ?, ?, 'creation', '新创建产品吧申请审核')
      `).run(barId, req.user.id);

      if (product_id) {
        db.prepare(`
          INSERT OR IGNORE INTO bar_products (bar_id, product_id, relation_type, sort_order)
          VALUES (?, ?, 'main', 0)
        `).run(barId, product_id);
      }

      return barId;
    });

    const barId = tx();

    return success(res, { id: barId }, '产品吧创建成功，等待审核');
  } catch (err) {
    console.error('创建产品吧错误:', err);
    return serverError(res, '创建失败，请稍后重试');
  }
});

router.put('/:id', authMiddleware, requireBarOwnerOrOperator, (req, res) => {
  try {
    const { name, description, cover_image, product_id } = req.body;

    const bar = db.prepare('SELECT * FROM product_bars WHERE id = ?').get(req.params.id);
    if (!bar) {
      return notFound(res, '产品吧不存在');
    }

    const updates = [];
    const values = [];

    if (name !== undefined && name.trim()) {
      if (name.length > 50) {
        return error(res, '产品吧名称不能超过50个字符');
      }
      const existingBar = db.prepare('SELECT id FROM product_bars WHERE name = ? AND id != ?').get(name.trim(), req.params.id);
      if (existingBar) {
        return error(res, '已存在同名产品吧');
      }
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (cover_image !== undefined) {
      updates.push('cover_image = ?');
      values.push(cover_image);
    }

    if (updates.length === 0) {
      return success(res, null, '无需更新');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE product_bars SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return success(res, null, '更新成功');
  } catch (err) {
    console.error('更新产品吧错误:', err);
    return serverError(res, '更新失败');
  }
});

router.post('/:id/join', authMiddleware, (req, res) => {
  try {
    const bar = db.prepare('SELECT * FROM product_bars WHERE id = ?').get(req.params.id);
    if (!bar) {
      return notFound(res, '产品吧不存在');
    }

    if (bar.status !== 'active') {
      return error(res, '该产品吧暂不可加入');
    }

    const existingMember = db.prepare('SELECT id FROM bar_members WHERE bar_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (existingMember) {
      return success(res, { isMember: true }, '已是该吧成员');
    }

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO bar_members (bar_id, user_id, role)
        VALUES (?, ?, 'member')
      `).run(req.params.id, req.user.id);

      db.prepare('UPDATE product_bars SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);
    });

    tx();

    return success(res, { isMember: true }, '加入成功');
  } catch (err) {
    console.error('加入产品吧错误:', err);
    return serverError(res, '加入失败');
  }
});

router.post('/:id/leave', authMiddleware, (req, res) => {
  try {
    const bar = db.prepare('SELECT * FROM product_bars WHERE id = ?').get(req.params.id);
    if (!bar) {
      return notFound(res, '产品吧不存在');
    }

    const membership = db.prepare('SELECT role FROM bar_members WHERE bar_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!membership) {
      return success(res, { isMember: false }, '不是该吧成员');
    }

    if (membership.role === 'owner') {
      return error(res, '吧主不能退出，请先转让吧主或关闭产品吧');
    }

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM bar_members WHERE bar_id = ? AND user_id = ?').run(req.params.id, req.user.id);
      db.prepare('UPDATE product_bars SET member_count = MAX(0, member_count - 1) WHERE id = ?').run(req.params.id);
    });

    tx();

    return success(res, { isMember: false }, '已退出');
  } catch (err) {
    console.error('退出产品吧错误:', err);
    return serverError(res, '操作失败');
  }
});

module.exports = router;
