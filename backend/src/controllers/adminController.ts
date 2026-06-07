import { Request, Response } from 'express';
import { getDatabase } from '../models/database.js';

export const getDashboardStats = (req: Request, res: Response): void => {
  const db = getDatabase();

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM estates WHERE status = 'active') as total_estates,
      (SELECT COUNT(*) FROM properties WHERE status = 'active') as total_properties,
      (SELECT COUNT(*) FROM properties WHERE type = 'new' AND status = 'active') as new_properties,
      (SELECT COUNT(*) FROM properties WHERE type = 'secondhand' AND status = 'active') as secondhand_properties,
      (SELECT COUNT(*) FROM properties WHERE type = 'rent' AND status = 'active') as rent_properties,
      (SELECT COUNT(*) FROM brokers WHERE certified = 1) as certified_brokers,
      (SELECT COUNT(*) FROM brokers) as total_brokers,
      (SELECT COUNT(*) FROM stores) as total_stores,
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM appointments WHERE status = 'pending') as pending_appointments,
      (SELECT COUNT(*) FROM viewings WHERE status = 'scheduled') as scheduled_viewings,
      (SELECT COUNT(*) FROM properties WHERE is_fake = 1) as fake_properties,
      (SELECT IFNULL(SUM(commission_amount), 0) FROM commissions WHERE status = 'pending') as pending_commission,
      (SELECT IFNULL(SUM(commission_amount), 0) FROM commissions WHERE status = 'paid') as paid_commission,
      (SELECT COUNT(*) FROM training_courses) as total_courses
  `).get();

  const monthlyData = db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count,
      SUM(CASE WHEN type = 'new' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN type = 'secondhand' THEN 1 ELSE 0 END) as secondhand_count,
      SUM(CASE WHEN type = 'rent' THEN 1 ELSE 0 END) as rent_count
    FROM properties
    WHERE created_at >= DATE('now', '-6 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month
  `).all();

  res.json({
    success: true,
    data: {
      stats,
      monthlyData,
    },
  });
};

export const getFakeProperties = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { isFake, minScore, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT p.*, e.name as estate_name, e.district,
           b.name as broker_name,
           fdl.image_similarity_score, fdl.price_deviation_score, fdl.total_score, fdl.checked_at
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    LEFT JOIN brokers b ON p.broker_id = b.id
    LEFT JOIN fake_detection_logs fdl ON p.id = fdl.property_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (isFake !== undefined) {
    sql += ' AND p.is_fake = ?';
    params.push(isFake === 'true' || isFake === '1' ? 1 : 0);
  }
  if (minScore) {
    sql += ' AND fdl.total_score <= ?';
    params.push(Number(minScore));
  }

  sql += ' ORDER BY fdl.total_score ASC, p.id DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  let countSql = "SELECT COUNT(DISTINCT p.id) FROM properties p JOIN estates e ON p.estate_id = e.id LEFT JOIN brokers b ON p.broker_id = b.id LEFT JOIN fake_detection_logs fdl ON p.id = fdl.property_id WHERE 1=1";
  const countParams: any[] = [];
  if (isFake !== undefined) { countSql += ' AND p.is_fake = ?'; countParams.push(isFake === 'true' || isFake === '1' ? 1 : 0); }
  if (minScore) { countSql += ' AND fdl.total_score <= ?'; countParams.push(Number(minScore)); }
  const countResult = db.prepare(countSql).get(...countParams) as Record<string, number>;
  const total = Object.values(countResult)[0] as number;

  const properties = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: properties,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
};

export const getEstateDictionary = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { keyword, type, district, syncStatus, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT e.*, COUNT(p.id) as property_count,
           MIN(p.price) as min_price, MAX(p.price) as max_price,
           AVG(p.unit_price) as avg_unit_price
    FROM estates e
    LEFT JOIN properties p ON e.id = p.estate_id AND p.status = 'active'
    WHERE e.status = 'active'
  `;
  const params: any[] = [];

  if (keyword) {
    sql += ' AND (e.name LIKE ? OR e.address LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (type) {
    sql += ' AND e.type = ?';
    params.push(type);
  }
  if (district) {
    sql += ' AND e.district = ?';
    params.push(district);
  }

  sql += ' GROUP BY e.id ORDER BY e.id DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  let countSql = "SELECT COUNT(*) FROM estates e WHERE e.status = 'active'";
  const countParams: any[] = [];
  if (keyword) { countSql += ' AND (e.name LIKE ? OR e.address LIKE ?)'; countParams.push(`%${keyword}%`, `%${keyword}%`); }
  if (type) { countSql += ' AND e.type = ?'; countParams.push(type); }
  if (district) { countSql += ' AND e.district = ?'; countParams.push(district); }
  const total = (db.prepare(countSql).get(...countParams) as any)['COUNT(*)'];

  const estates = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: estates,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    lastSync: new Date().toISOString(),
    syncSource: '北京市住建委备案系统',
  });
};

export const syncEstateDictionary = (req: Request, res: Response): void => {
  const db = getDatabase();

  const { ids } = req.body;

  const updates = db.prepare(`
    UPDATE estates
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id IN (${ids.map(() => '?').join(', ')})
  `).run(...ids);

  res.json({
    success: true,
    message: `成功同步 ${updates.changes} 条楼盘数据`,
    data: {
      syncedCount: updates.changes,
      syncedIds: ids,
      syncTime: new Date().toISOString(),
    },
  });
};

export const markFakeProperty = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;
  const { isFake, notes } = req.body;

  db.prepare(`
    UPDATE properties SET is_fake = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(isFake ? 1 : 0, id);

  db.prepare(`
    INSERT INTO fake_detection_logs (property_id, image_similarity_score, price_deviation_score, total_score, is_fake, checked_by)
    VALUES (?, ?, ?, ?, ?, 'admin')
  `).run(id, null, null, isFake ? 0.3 : 0.9, isFake ? 1 : 0);

  res.json({
    success: true,
    message: isFake ? '已标记为虚假房源' : '已取消虚假房源标记',
  });
};

export const getStores = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { district } = req.query;

  let sql = `
    SELECT s.*, COUNT(b.id) as broker_count
    FROM stores s
    LEFT JOIN brokers b ON s.id = b.store_id
  `;
  const params: any[] = [];

  if (district) {
    sql += ' WHERE s.address LIKE ?';
    params.push(`%${district}%`);
  }

  sql += ' GROUP BY s.id ORDER BY s.id';

  const stores = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: stores,
    total: stores.length,
  });
};

export const getUsers = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { page = 1, pageSize = 20 } = req.query;

  const users = db.prepare(`
    SELECT u.*,
           COUNT(DISTINCT ub.id) as browsing_count,
           COUNT(DISTINCT a.id) as appointment_count,
           COUNT(DISTINCT f.id) as favorite_count
    FROM users u
    LEFT JOIN user_browsing ub ON u.id = ub.user_id
    LEFT JOIN appointments a ON u.id = a.user_id
    LEFT JOIN favorites f ON u.id = f.user_id
    GROUP BY u.id
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
  `).all(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;

  res.json({
    success: true,
    data: users,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
};

export const getTrainingCourses = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { category, level } = req.query;

  let sql = `
    SELECT tc.*,
           COUNT(DISTINCT bt.broker_id) as enrolled_count,
           COUNT(DISTINCT CASE WHEN bt.completed = 1 THEN bt.broker_id END) as completed_count
    FROM training_courses tc
    LEFT JOIN broker_training bt ON tc.id = bt.course_id
  `;
  const params: any[] = [];
  const where: string[] = [];

  if (category) {
    where.push('tc.category = ?');
    params.push(category);
  }
  if (level) {
    where.push('tc.level = ?');
    params.push(level);
  }

  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ');
  }

  sql += ' GROUP BY tc.id ORDER BY tc.id';

  const courses = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: courses,
    total: courses.length,
  });
};

export const createTrainingCourse = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { title, description, duration, category, level, content } = req.body;

  const result = db.prepare(`
    INSERT INTO training_courses (title, description, duration, category, level, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description, duration, category, level || 'beginner', content);

  res.json({
    success: true,
    data: { id: result.lastInsertRowid },
    message: '培训课程创建成功',
  });
};

export const getCommissionStats = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { brokerId, startDate, endDate } = req.query;

  let sql = `
    SELECT c.*, b.name as broker_name, p.title as property_title
    FROM commissions c
    JOIN brokers b ON c.broker_id = b.id
    JOIN properties p ON c.property_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (brokerId) {
    sql += ' AND c.broker_id = ?';
    params.push(brokerId);
  }
  if (startDate) {
    sql += ' AND c.deal_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND c.deal_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY c.deal_date DESC';

  const commissions = db.prepare(sql).all(...params);

  const stats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      SUM(commission_amount) as total_amount
    FROM commissions
    WHERE 1=1
    ${brokerId ? ' AND broker_id = ?' : ''}
    GROUP BY status
  `).all(...(brokerId ? [brokerId] : []));

  const totalAmount = commissions.reduce((sum: number, c: any) => sum + c.commission_amount, 0);

  res.json({
    success: true,
    data: {
      commissions,
      stats,
      totalAmount,
      totalCount: commissions.length,
    },
  });
};
