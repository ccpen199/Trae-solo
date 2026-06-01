import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { authenticate, AuthRequest, requirePermission, logOperation } from '../middleware/auth';
import { success, error, buildPagination } from '../utils';

const router = Router();

router.get('/products', authenticate, (req: AuthRequest, res) => {
  const { keyword, category_id, page, pageSize } = req.query;
  const { limit, offset } = buildPagination(page as any, pageSize as any);

  let where = "WHERE p.status = 'active'";
  const params: any[] = [];

  if (keyword) {
    where += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.bar_code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category_id) {
    where += ' AND p.category_id = ?';
    params.push(category_id);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM products p ${where}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${where}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  success(res, { list, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/products/:id', authenticate, (req: AuthRequest, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) {
    return error(res, '商品不存在');
  }
  success(res, product);
});

router.get('/categories', authenticate, (req: AuthRequest, res) => {
  const list = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
    FROM categories c
    ORDER BY c.sort_order, c.id
  `).all();
  success(res, list);
});

router.get('/members', authenticate, (req: AuthRequest, res) => {
  const { keyword, page, pageSize } = req.query;
  const { limit, offset } = buildPagination(page as any, pageSize as any);

  let where = "WHERE status = 'active'";
  const params: any[] = [];

  if (keyword) {
    where += ' AND (name LIKE ? OR phone LIKE ? OR code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM members ${where}`).get(...params).count;
  const list = db.prepare(`
    SELECT * FROM members ${where} ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  success(res, { list, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/members/:id', authenticate, (req: AuthRequest, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) {
    return error(res, '会员不存在');
  }
  success(res, member);
});

router.get('/members/phone/:phone', authenticate, (req: AuthRequest, res) => {
  const member = db.prepare("SELECT * FROM members WHERE phone = ? AND status = 'active'").get(req.params.phone);
  if (!member) {
    return error(res, '会员不存在');
  }
  success(res, member);
});

router.get('/stores', authenticate, (req: AuthRequest, res) => {
  const { status } = req.query;
  let where = '';
  const params: any[] = [];

  if (status) {
    where = 'WHERE status = ?';
    params.push(status);
  }

  const list = db.prepare(`SELECT * FROM stores ${where} ORDER BY id`).all(...params);
  success(res, list);
});

router.get('/stores/:id', authenticate, (req: AuthRequest, res) => {
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
  if (!store) {
    return error(res, '门店不存在');
  }
  success(res, store);
});

router.get('/promotions', authenticate, (req: AuthRequest, res) => {
  const { status } = req.query;
  let where = '';
  const params: any[] = [];

  if (status) {
    where = 'WHERE status = ?';
    params.push(status);
  }

  const list = db.prepare(`
    SELECT * FROM promotions ${where}
    AND (start_date IS NULL OR start_date <= DATE('now'))
    AND (end_date IS NULL OR end_date >= DATE('now'))
    ORDER BY id
  `).all(...params);
  success(res, list);
});

router.get('/users', authenticate, requirePermission('user:view'), (req: AuthRequest, res) => {
  const { role_id, store_id, status } = req.query;
  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (role_id) {
    where += ' AND u.role_id = ?';
    params.push(role_id);
  }
  if (store_id) {
    where += ' AND u.store_id = ?';
    params.push(store_id);
  }
  if (status) {
    where += ' AND u.status = ?';
    params.push(status);
  }

  const list = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.phone, u.email, u.status,
           u.role_id, u.store_id, r.name as role_name, s.name as store_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN stores s ON u.store_id = s.id
    ${where}
    ORDER BY u.id
  `).all(...params);

  success(res, list);
});

router.get('/roles', authenticate, (req: AuthRequest, res) => {
  const list = db.prepare('SELECT * FROM roles ORDER BY id').all();
  list.forEach((r: any) => {
    r.permissions = JSON.parse(r.permissions || '[]');
  });
  success(res, list);
});

router.post('/products', authenticate, requirePermission('product:create'), logOperation('product', 'create'), (req: AuthRequest, res) => {
  const { code, name, category_id, price, cost_price, stock, unit, bar_code } = req.body;
  if (!code || !name || !price) {
    return error(res, '商品编码、名称和价格不能为空');
  }

  const exists = db.prepare('SELECT id FROM products WHERE code = ?').get(code);
  if (exists) {
    return error(res, '商品编码已存在');
  }

  const result = db.prepare(`
    INSERT INTO products (code, name, category_id, price, cost_price, stock, unit, bar_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, name, category_id || null, price, cost_price || 0, stock || 0, unit || '件', bar_code || null);

  success(res, { id: result.lastInsertRowid }, '商品创建成功');
});

router.put('/products/:id', authenticate, requirePermission('product:update'), logOperation('product', 'update'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, category_id, price, cost_price, stock, unit, bar_code, status } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) {
    return error(res, '商品不存在');
  }

  db.prepare(`
    UPDATE products SET name = ?, category_id = ?, price = ?, cost_price = ?,
                        stock = ?, unit = ?, bar_code = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || product.name, category_id || product.category_id, price || product.price,
         cost_price || product.cost_price, stock ?? product.stock, unit || product.unit,
         bar_code || product.bar_code, status || product.status, id);

  success(res, null, '商品更新成功');
});

router.delete('/products/:id', authenticate, requirePermission('product:delete'), logOperation('product', 'delete'), (req: AuthRequest, res) => {
  db.prepare("UPDATE products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  success(res, null, '商品已停用');
});

router.post('/members', authenticate, requirePermission('member:create'), logOperation('member', 'create'), (req: AuthRequest, res) => {
  const { code, name, phone, email, level, birthday, address } = req.body;
  if (!code || !name || !phone) {
    return error(res, '会员编码、姓名和手机号不能为空');
  }

  const exists = db.prepare('SELECT id FROM members WHERE code = ? OR phone = ?').get(code, phone);
  if (exists) {
    return error(res, '会员编码或手机号已存在');
  }

  const result = db.prepare(`
    INSERT INTO members (code, name, phone, email, level, birthday, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(code, name, phone, email || null, level || '普通', birthday || null, address || null);

  success(res, { id: result.lastInsertRowid }, '会员创建成功');
});

router.post('/stores', authenticate, requirePermission('store:create'), logOperation('store', 'create'), (req: AuthRequest, res) => {
  const { code, name, address, phone } = req.body;
  if (!code || !name) {
    return error(res, '门店编码和名称不能为空');
  }

  const exists = db.prepare('SELECT id FROM stores WHERE code = ?').get(code);
  if (exists) {
    return error(res, '门店编码已存在');
  }

  const result = db.prepare(`
    INSERT INTO stores (code, name, address, phone)
    VALUES (?, ?, ?, ?)
  `).run(code, name, address || null, phone || null);

  success(res, { id: result.lastInsertRowid }, '门店创建成功');
});

router.post('/users', authenticate, requirePermission('user:create'), logOperation('user', 'create'), (req: AuthRequest, res) => {
  const { username, password, real_name, role_id, store_id, phone, email } = req.body;
  if (!username || !password || !real_name || !role_id) {
    return error(res, '用户名、密码、姓名和角色不能为空');
  }

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return error(res, '用户名已存在');
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPwd = bcrypt.hashSync(password, salt);

  const result = db.prepare(`
    INSERT INTO users (username, password, real_name, role_id, store_id, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, hashPwd, real_name, role_id, store_id || null, phone || null, email || null);

  success(res, { id: result.lastInsertRowid }, '用户创建成功');
});

export default router;
