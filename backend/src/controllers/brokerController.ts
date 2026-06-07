import { Request, Response } from 'express';
import { getDatabase } from '../models/database.js';

export const getBrokers = (req: Request, res: Response): void => {
  const db = getDatabase();
  const {
    storeId, certified, minRating, district, keyword,
    minExperience, page = 1, pageSize = 20,
  } = req.query;

  let sql = `
    SELECT b.*, s.name as store_name, s.address as store_address,
           s.lat as store_lat, s.lng as store_lng,
           COUNT(DISTINCT p.id) as property_count
    FROM brokers b
    LEFT JOIN stores s ON b.store_id = s.id
    LEFT JOIN properties p ON b.id = p.broker_id AND p.status = 'active'
  `;
  const params: any[] = [];
  const where: string[] = [];

  if (storeId) {
    where.push('b.store_id = ?');
    params.push(storeId);
  }
  const certifiedStr = String(certified);
  if (certifiedStr === 'true' || certifiedStr === '1') {
    where.push('b.certified = 1');
  }
  if (certifiedStr === 'false' || certifiedStr === '0') {
    where.push('b.certified = 0');
  }
  if (minRating) {
    where.push('b.rating >= ?');
    params.push(Number(minRating));
  }
  if (keyword) {
    where.push('b.name LIKE ?');
    params.push(`%${keyword}%`);
  }
  if (minExperience) {
    where.push('b.experience_years >= ?');
    params.push(Number(minExperience));
  }

  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ');
  }

  sql += ' GROUP BY b.id ORDER BY b.rating DESC, b.deal_count DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  let countSql = 'SELECT COUNT(*) FROM brokers b WHERE 1=1';
  const countParams: any[] = [];
  if (storeId) { countSql += ' AND b.store_id = ?'; countParams.push(storeId); }
  if (certifiedStr === 'true' || certifiedStr === '1') { countSql += ' AND b.certified = 1'; }
  if (certifiedStr === 'false' || certifiedStr === '0') { countSql += ' AND b.certified = 0'; }
  if (minRating) { countSql += ' AND b.rating >= ?'; countParams.push(Number(minRating)); }
  if (keyword) { countSql += ' AND b.name LIKE ?'; countParams.push(`%${keyword}%`); }
  if (minExperience) { countSql += ' AND b.experience_years >= ?'; countParams.push(Number(minExperience)); }
  const total = (db.prepare(countSql).get(...countParams) as any)['COUNT(*)'];

  const brokers = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: brokers,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
};

export const getBrokerById = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;

  const broker = db.prepare(`
    SELECT b.*, s.name as store_name, s.address as store_address,
           s.phone as store_phone, s.business_hours,
           s.lat as store_lat, s.lng as store_lng
    FROM brokers b
    LEFT JOIN stores s ON b.store_id = s.id
    WHERE b.id = ?
  `).get(id);

  if (!broker) {
    res.status(404).json({ success: false, message: '经纪人不存在' });
    return;
  }

  const properties = db.prepare(`
    SELECT p.*, e.name as estate_name, e.address as estate_address, e.district
    FROM properties p
    JOIN estates e ON p.estate_id = e.id
    WHERE p.broker_id = ? AND p.status = 'active'
    ORDER BY p.id DESC
    LIMIT 20
  `).all(id);

  const today = new Date().toISOString().split('T')[0];
  const schedule = db.prepare(`
    SELECT a.*, u.name as user_name, p.title as property_title
    FROM appointments a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN properties p ON a.property_id = p.id
    WHERE a.broker_id = ? AND a.appointment_date >= ?
    ORDER BY a.appointment_date, a.appointment_time
    LIMIT 20
  `).all(id, today);

  const freeSlots: string[] = [];
  const bookedTimes = schedule
    .filter((s: any) => s.appointment_date === today)
    .map((s: any) => s.appointment_time);

  const allSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  allSlots.forEach(slot => {
    if (!bookedTimes.includes(slot)) {
      freeSlots.push(slot);
    }
  });

  const commissions = db.prepare(`
    SELECT c.*, p.title as property_title
    FROM commissions c
    JOIN properties p ON c.property_id = p.id
    WHERE c.broker_id = ?
    ORDER BY c.deal_date DESC
    LIMIT 10
  `).all(id);

  const totalCommission = commissions.reduce((sum: number, c: any) => sum + c.commission_amount, 0);

  const training = db.prepare(`
    SELECT bt.*, tc.title as course_title, tc.description as course_description,
           tc.duration, tc.category, tc.level
    FROM broker_training bt
    JOIN training_courses tc ON bt.course_id = tc.id
    WHERE bt.broker_id = ?
    ORDER BY bt.created_at DESC
  `).all(id);

  res.json({
    success: true,
    data: {
      ...broker,
      properties,
      schedule,
      todayFreeSlots: freeSlots,
      commissions,
      totalCommission,
      training,
    },
  });
};

export const getBrokerWorkbench = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { brokerId } = req.params;

  const today = new Date().toISOString().split('T')[0];

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM viewings WHERE broker_id = ? AND viewing_date = ?) as today_viewings,
      (SELECT COUNT(*) FROM appointments WHERE broker_id = ? AND appointment_date = ?) as today_appointments,
      (SELECT COUNT(*) FROM customer_follows WHERE broker_id = ? AND status = 'active') as active_customers,
      (SELECT COUNT(*) FROM properties WHERE broker_id = ? AND status = 'active') as my_properties,
      (SELECT IFNULL(SUM(commission_amount), 0) FROM commissions WHERE broker_id = ? AND status = 'pending') as pending_commission,
      (SELECT IFNULL(SUM(commission_amount), 0) FROM commissions WHERE broker_id = ? AND status = 'paid') as paid_commission
  `).get(brokerId, today, brokerId, today, brokerId, brokerId, brokerId, brokerId);

  const todaySchedule = db.prepare(`
    SELECT v.*, u.name as user_name, u.phone as user_phone,
           p.title as property_title, p.price as property_price, p.area as property_area
    FROM viewings v
    JOIN users u ON v.user_id = u.id
    JOIN properties p ON v.property_id = p.id
    WHERE v.broker_id = ? AND v.viewing_date = ?
    ORDER BY v.viewing_time
  `).all(brokerId, today);

  const customers = db.prepare(`
    SELECT cf.*, u.name as user_name, u.phone as user_phone, u.avatar as user_avatar
    FROM customer_follows cf
    JOIN users u ON cf.user_id = u.id
    WHERE cf.broker_id = ? AND cf.status = 'active'
    ORDER BY cf.next_follow_date IS NULL, cf.next_follow_date ASC
    LIMIT 20
  `).all(brokerId);

  const recentCommissions = db.prepare(`
    SELECT c.*, p.title as property_title,
           u.name as customer_name
    FROM commissions c
    JOIN properties p ON c.property_id = p.id
    LEFT JOIN viewings v ON c.property_id = v.property_id
    LEFT JOIN users u ON v.user_id = u.id
    WHERE c.broker_id = ?
    ORDER BY c.deal_date DESC
    LIMIT 10
  `).all(brokerId);

  res.json({
    success: true,
    data: {
      stats,
      todaySchedule,
      customers,
      recentCommissions,
    },
  });
};

export const createCustomerFollow = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { broker_id, user_id, follow_date, content, next_follow_date } = req.body;

  const result = db.prepare(`
    INSERT INTO customer_follows (broker_id, user_id, follow_date, content, next_follow_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(broker_id, user_id, follow_date, content, next_follow_date);

  res.json({
    success: true,
    data: { id: result.lastInsertRowid },
    message: '跟进记录创建成功',
  });
};

export const createAppointment = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { user_id, broker_id, property_id, appointment_date, appointment_time, type, notes } = req.body;

  const existing = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE broker_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'
  `).get(broker_id, appointment_date, appointment_time);

  if ((existing as any).count > 0) {
    res.status(400).json({ success: false, message: '该时段已被预约' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO appointments (user_id, broker_id, property_id, appointment_date, appointment_time, type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, broker_id, property_id, appointment_date, appointment_time, type || 'viewing', notes);

  res.json({
    success: true,
    data: { id: result.lastInsertRowid },
    message: '预约成功',
  });
};

export const getFreeSlots = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { brokerId } = req.params;
  const { date } = req.query;

  const checkDate = date || new Date().toISOString().split('T')[0];

  const appointments = db.prepare(`
    SELECT appointment_time FROM appointments
    WHERE broker_id = ? AND appointment_date = ? AND status != 'cancelled'
  `).all(brokerId, checkDate);

  const bookedTimes = appointments.map((a: any) => a.appointment_time);
  const allSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const freeSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

  res.json({
    success: true,
    data: {
      date: checkDate,
      freeSlots,
      bookedSlots: bookedTimes,
    },
  });
};

export const getTrainingProgress = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { brokerId } = req.params;

  const courses = db.prepare(`
    SELECT tc.*, bt.progress, bt.completed, bt.start_date, bt.complete_date, bt.score
    FROM training_courses tc
    LEFT JOIN broker_training bt ON tc.id = bt.course_id AND bt.broker_id = ?
    ORDER BY bt.completed IS NULL DESC, bt.progress DESC
  `).all(brokerId);

  const totalCourses = courses.length;
  const completedCourses = courses.filter((c: any) => c.completed === 1).length;
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / courses.length)
    : 0;

  res.json({
    success: true,
    data: {
      courses,
      stats: {
        total: totalCourses,
        completed: completedCourses,
        inProgress: totalCourses - completedCourses,
        avgProgress,
      },
    },
  });
};

export const updateTrainingProgress = (req: Request, res: Response): void => {
  const db = getDatabase();
  const { id } = req.params;
  const { progress, completed, score } = req.body;

  const existing = db.prepare('SELECT * FROM broker_training WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ success: false, message: '培训记录不存在' });
    return;
  }

  db.prepare(`
    UPDATE broker_training
    SET progress = ?, completed = ?, score = ?, complete_date = CASE WHEN ? = 1 THEN DATE('now') ELSE complete_date END
    WHERE id = ?
  `).run(progress, completed ? 1 : 0, score, completed ? 1 : 0, id);

  res.json({ success: true, message: '培训进度已更新' });
};
