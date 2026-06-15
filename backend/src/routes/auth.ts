import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username, password, real_name, phone, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (!['employer', 'worker', 'driver'].includes(role || 'employer')) {
    return res.status(400).json({ error: '无效的角色类型' });
  }

  const db = getDB();
  
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const userId = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, real_name, phone, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertUser.run(userId, username, hashedPassword, real_name || '', phone || '', role || 'employer');

  if (role === 'worker') {
    db.prepare('INSERT INTO worker_profiles (id, user_id, skills) VALUES (?, ?, ?)')
      .run(uuidv4(), userId, JSON.stringify([]));
  } else if (role === 'driver') {
    db.prepare('INSERT INTO driver_profiles (id, user_id, vehicle_type) VALUES (?, ?, ?)')
      .run(uuidv4(), userId, '厢式货车');
  }

  const token = jwt.sign(
    { id: userId, username, role: role || 'employer' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: userId,
      username,
      real_name: real_name || '',
      phone: phone || '',
      role: role || 'employer',
      credit_score: 100,
      balance: 0,
    },
  });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  const userData: any = {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    credit_score: user.credit_score,
    balance: user.balance,
    city: user.city,
    address: user.address,
  };

  if (user.role === 'worker') {
    const profile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(user.id) as any;
    if (profile) {
      userData.worker_profile = {
        skills: JSON.parse(profile.skills || '[]'),
        service_radius: profile.service_radius,
        hourly_rate: profile.hourly_rate,
        task_rate: profile.task_rate,
        completed_orders: profile.completed_orders,
        rating: profile.rating,
        bio: profile.bio,
        id_card_verified: profile.id_card_verified,
      };
    }
  } else if (user.role === 'driver') {
    const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(user.id) as any;
    if (profile) {
      userData.driver_profile = {
        vehicle_type: profile.vehicle_type,
        vehicle_brand: profile.vehicle_brand,
        plate_number: profile.plate_number,
        load_capacity: profile.load_capacity,
        vehicle_length: profile.vehicle_length,
        insurance_verified: profile.insurance_verified,
        insurance_expiry: profile.insurance_expiry,
        completed_orders: profile.completed_orders,
        rating: profile.rating,
        bio: profile.bio,
      };
    }
  }

  res.json({ token, user: userData });
});

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const userData: any = {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    credit_score: user.credit_score,
    balance: user.balance,
    city: user.city,
    address: user.address,
    created_at: user.created_at,
  };

  if (user.role === 'worker') {
    const profile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(user.id) as any;
    if (profile) {
      userData.worker_profile = {
        skills: JSON.parse(profile.skills || '[]'),
        service_radius: profile.service_radius,
        hourly_rate: profile.hourly_rate,
        task_rate: profile.task_rate,
        completed_orders: profile.completed_orders,
        rating: profile.rating,
        bio: profile.bio,
        id_card_verified: profile.id_card_verified,
      };
    }
  } else if (user.role === 'driver') {
    const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(user.id) as any;
    if (profile) {
      userData.driver_profile = {
        vehicle_type: profile.vehicle_type,
        vehicle_brand: profile.vehicle_brand,
        plate_number: profile.plate_number,
        load_capacity: profile.load_capacity,
        vehicle_length: profile.vehicle_length,
        insurance_verified: profile.insurance_verified,
        insurance_expiry: profile.insurance_expiry,
        completed_orders: profile.completed_orders,
        rating: profile.rating,
        bio: profile.bio,
      };
    }
  }

  res.json(userData);
});

router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { real_name, phone, city, address, avatar } = req.body;

  db.prepare(`
    UPDATE users SET real_name = ?, phone = ?, city = ?, address = ?, avatar = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(real_name, phone, city, address, avatar, req.user!.id);

  res.json({ success: true, message: '资料更新成功' });
});

router.put('/worker-profile', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'worker') {
    return res.status(403).json({ error: '只有工人可以更新工人资料' });
  }

  const db = getDB();
  const { skills, service_radius, hourly_rate, task_rate, bio } = req.body;

  db.prepare(`
    UPDATE worker_profiles 
    SET skills = ?, service_radius = ?, hourly_rate = ?, task_rate = ?, bio = ?
    WHERE user_id = ?
  `).run(
    JSON.stringify(skills || []),
    service_radius || 5,
    hourly_rate || 50,
    task_rate || 200,
    bio || '',
    req.user!.id
  );

  res.json({ success: true, message: '工人资料更新成功' });
});

router.put('/driver-profile', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'driver') {
    return res.status(403).json({ error: '只有司机可以更新司机资料' });
  }

  const db = getDB();
  const { vehicle_type, vehicle_brand, plate_number, load_capacity, vehicle_length, bio } = req.body;

  db.prepare(`
    UPDATE driver_profiles 
    SET vehicle_type = ?, vehicle_brand = ?, plate_number = ?, load_capacity = ?, vehicle_length = ?, bio = ?
    WHERE user_id = ?
  `).run(
    vehicle_type || '厢式货车',
    vehicle_brand || '',
    plate_number || '',
    load_capacity || 1,
    vehicle_length || 4.2,
    bio || '',
    req.user!.id
  );

  res.json({ success: true, message: '司机资料更新成功' });
});

router.get('/workers', (req: Request, res: Response) => {
  const db = getDB();
  const { city, skill, page = 1, limit = 20 } = req.query;
  
  let whereClause = 'WHERE u.role = ?';
  const params: any[] = ['worker'];

  if (city) {
    whereClause += ' AND u.city LIKE ?';
    params.push(`%${city}%`);
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const workers = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.avatar, u.city, u.credit_score,
           wp.skills, wp.service_radius, wp.hourly_rate, wp.task_rate, wp.completed_orders, wp.rating, wp.bio, wp.id_card_verified
    FROM users u
    LEFT JOIN worker_profiles wp ON u.id = wp.user_id
    ${whereClause}
    ORDER BY wp.rating DESC, wp.completed_orders DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM users u
    LEFT JOIN worker_profiles wp ON u.id = wp.user_id
    ${whereClause}
  `).get(...params) as any;

  const result = workers.map(w => ({
    ...w,
    skills: JSON.parse(w.skills || '[]'),
  }));

  if (skill) {
    const filtered = result.filter(w => w.skills.some((s: string) => s.includes(skill as string)));
    return res.json({ workers: filtered, total: filtered.length });
  }

  res.json({ workers: result, total: total.count });
});

router.get('/drivers', (req: Request, res: Response) => {
  const db = getDB();
  const { city, vehicle_type, page = 1, limit = 20 } = req.query;
  
  let whereClause = 'WHERE u.role = ?';
  const params: any[] = ['driver'];

  if (city) {
    whereClause += ' AND u.city LIKE ?';
    params.push(`%${city}%`);
  }

  if (vehicle_type) {
    whereClause += ' AND dp.vehicle_type LIKE ?';
    params.push(`%${vehicle_type}%`);
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const drivers = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.avatar, u.city, u.credit_score,
           dp.vehicle_type, dp.vehicle_brand, dp.plate_number, dp.load_capacity, 
           dp.vehicle_length, dp.insurance_verified, dp.insurance_expiry, 
           dp.completed_orders, dp.rating, dp.bio
    FROM users u
    LEFT JOIN driver_profiles dp ON u.id = dp.user_id
    ${whereClause}
    ORDER BY dp.rating DESC, dp.completed_orders DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM users u
    LEFT JOIN driver_profiles dp ON u.id = dp.user_id
    ${whereClause}
  `).get(...params) as any;

  res.json({ drivers, total: total.count });
});

export default router;
