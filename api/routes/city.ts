import { Router, Request, Response } from 'express';
import db from '../database';
import { authMiddleware } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../utils/response';
import {
  generateMockBusArrivals,
  generateMockTimeSlots,
  generateMockActivities,
} from '../utils/mockData';
import type { BusArrival, Hospital, Department, Venue } from '../../shared/types';

const router = Router();

router.use(authMiddleware());

router.get('/transport/bus', auditMiddleware('get_bus_arrival', 'transport'), (req: Request, res: Response) => {
  const { station = '市政府站' } = req.query;
  const arrivals = generateMockBusArrivals(station as string);
  successResponse(res, { station, arrivals }, '获取公交实时信息成功');
});

router.get('/transport/metro', auditMiddleware('get_metro_info', 'transport'), (req: Request, res: Response) => {
  const metroLines = [
    {
      id: 'line1',
      name: '1号线',
      color: '#E52428',
      firstTrain: '06:30',
      lastTrain: '23:00',
      stations: [
        { id: 's1', name: '岩内', transferLines: [], exitCount: 4 },
        { id: 's2', name: '厦门北站', transferLines: ['4号线'], exitCount: 8 },
        { id: 's3', name: '集美大道', transferLines: [], exitCount: 4 },
        { id: 's4', name: '高崎', transferLines: [], exitCount: 4 },
        { id: 's5', name: '殿前', transferLines: [], exitCount: 4 },
        { id: 's6', name: '火炬园', transferLines: ['3号线'], exitCount: 6 },
        { id: 's7', name: '塘边', transferLines: [], exitCount: 4 },
        { id: 's8', name: '乌石浦', transferLines: [], exitCount: 4 },
        { id: 's9', name: '莲花路口', transferLines: [], exitCount: 4 },
        { id: 's10', name: '湖滨东路', transferLines: ['3号线'], exitCount: 6 },
        { id: 's11', name: '文灶', transferLines: [], exitCount: 4 },
        { id: 's12', name: '将军祠', transferLines: [], exitCount: 4 },
        { id: 's13', name: '中山公园', transferLines: [], exitCount: 4 },
        { id: 's14', name: '镇海路', transferLines: [], exitCount: 4 },
      ],
    },
    {
      id: 'line2',
      name: '2号线',
      color: '#00A0E9',
      firstTrain: '06:30',
      lastTrain: '23:00',
      stations: [
        { id: 's1', name: '天竺山', transferLines: [], exitCount: 4 },
        { id: 's2', name: '东孚', transferLines: [], exitCount: 4 },
        { id: 's3', name: '新阳', transferLines: [], exitCount: 4 },
        { id: 's4', name: '马銮中心', transferLines: ['6号线'], exitCount: 6 },
        { id: 's5', name: '海沧行政中心', transferLines: [], exitCount: 4 },
        { id: 's6', name: '海沧湾公园', transferLines: [], exitCount: 4 },
        { id: 's7', name: '邮轮中心', transferLines: [], exitCount: 6 },
        { id: 's8', name: '建业路', transferLines: [], exitCount: 4 },
        { id: 's9', name: '湖滨中路', transferLines: [], exitCount: 4 },
        { id: 's10', name: '体育中心', transferLines: ['3号线'], exitCount: 6 },
        { id: 's11', name: '育秀东路', transferLines: [], exitCount: 4 },
        { id: 's12', name: '吕厝', transferLines: ['1号线'], exitCount: 6 },
        { id: 's13', name: '江头', transferLines: [], exitCount: 4 },
        { id: 's14', name: '蔡塘', transferLines: [], exitCount: 4 },
        { id: 's15', name: '软件园', transferLines: [], exitCount: 4 },
        { id: 's16', name: '岭兜', transferLines: [], exitCount: 4 },
        { id: 's17', name: '古地石', transferLines: [], exitCount: 4 },
        { id: 's18', name: '两岸金融中心', transferLines: [], exitCount: 4 },
        { id: 's19', name: '五通', transferLines: [], exitCount: 4 },
        { id: 's20', name: '五缘湾', transferLines: ['3号线'], exitCount: 6 },
      ],
    },
    {
      id: 'line3',
      name: '3号线',
      color: '#E9A800',
      firstTrain: '06:30',
      lastTrain: '22:30',
      stations: [
        { id: 's1', name: '沙坡尾', transferLines: [], exitCount: 4 },
        { id: 's2', name: '厦门火车站', transferLines: ['BRT'], exitCount: 8 },
        { id: 's3', name: '湖滨东路', transferLines: ['1号线'], exitCount: 6 },
        { id: 's4', name: '体育中心', transferLines: ['2号线'], exitCount: 6 },
        { id: 's5', name: '人才中心', transferLines: [], exitCount: 4 },
        { id: 's6', name: '湖里公园', transferLines: [], exitCount: 4 },
        { id: 's7', name: '火炬园', transferLines: ['1号线'], exitCount: 6 },
        { id: 's8', name: '安兜', transferLines: [], exitCount: 4 },
        { id: 's9', name: '坂尚', transferLines: [], exitCount: 4 },
        { id: 's10', name: '五缘湾', transferLines: ['2号线'], exitCount: 6 },
        { id: 's11', name: '创新园', transferLines: [], exitCount: 4 },
        { id: 's12', name: '翔安南', transferLines: ['4号线'], exitCount: 6 },
      ],
    },
  ];

  successResponse(res, metroLines, '获取地铁线路信息成功');
});

router.get('/health/hospitals', auditMiddleware('list_hospitals', 'health'), (req: Request, res: Response) => {
  const { level, page = 1, pageSize = 10 } = req.query;

  let query = 'SELECT * FROM hospitals';
  const params: any[] = [];

  if (level) {
    query += ' WHERE level = ?';
    params.push(level);
  }

  query += ' ORDER BY name LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const hospitals = db.prepare(query).all(...params) as any[];

  const result: Hospital[] = hospitals.map((h) => {
    const depts = db
      .prepare('SELECT * FROM departments WHERE hospital_id = ?')
      .all(h.id) as any[];

    const departments: Department[] = depts.map((d) => {
      const doctors = db
        .prepare('SELECT * FROM doctors WHERE department_id = ?')
        .all(d.id) as any[];

      return {
        id: d.id,
        name: d.name,
        description: d.description || undefined,
        todayAvailable: Math.floor(Math.random() * 15 + 5),
        tomorrowAvailable: Math.floor(Math.random() * 20 + 10),
        doctors: doctors.map((doc) => ({
          id: doc.id,
          name: doc.name,
          title: doc.title,
          specialty: doc.specialty,
          availableSlots: generateMockTimeSlots(),
        })),
      };
    });

    return {
      id: h.id,
      name: h.name,
      level: h.level,
      address: h.address,
      phone: h.phone,
      longitude: h.longitude,
      latitude: h.latitude,
      departments,
    };
  });

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM hospitals ${level ? 'WHERE level = ?' : ''}`)
    .get(...(level ? [level] : [])) as { count: number };

  successResponse(
    res,
    {
      items: result,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total.count / Number(pageSize)),
    },
    '获取医院列表成功'
  );
});

router.get('/health/hospitals/:id', auditMiddleware('view_hospital', 'health'), (req: Request, res: Response) => {
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any;

  if (!hospital) {
    return errorResponse(res, '医院不存在', 404);
  }

  const depts = db
    .prepare('SELECT * FROM departments WHERE hospital_id = ?')
    .all(hospital.id) as any[];

  const departments: Department[] = depts.map((d) => {
    const doctors = db
      .prepare('SELECT * FROM doctors WHERE department_id = ?')
      .all(d.id) as any[];

    return {
      id: d.id,
      name: d.name,
      description: d.description || undefined,
      todayAvailable: Math.floor(Math.random() * 15 + 5),
      tomorrowAvailable: Math.floor(Math.random() * 20 + 10),
      doctors: doctors.map((doc) => ({
        id: doc.id,
        name: doc.name,
        title: doc.title,
        specialty: doc.specialty,
        availableSlots: generateMockTimeSlots(),
      })),
    };
  });

  const result: Hospital = {
    id: hospital.id,
    name: hospital.name,
    level: hospital.level,
    address: hospital.address,
    phone: hospital.phone,
    longitude: hospital.longitude,
    latitude: hospital.latitude,
    departments,
  };

  successResponse(res, result, '获取医院详情成功');
});

router.post('/health/appointment', auditMiddleware('make_appointment', 'health'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const { hospitalId, departmentId, doctorId, appointmentDate, timeSlot } = req.body;

  if (!hospitalId || !departmentId || !doctorId || !appointmentDate || !timeSlot) {
    return errorResponse(res, '预约信息不完整', 400);
  }

  const appointmentId = 'appt_' + Date.now();
  const fee = Math.random() > 0.5 ? 30 : 40;

  db.prepare(`
    INSERT INTO appointments (id, user_id, hospital_id, department_id, doctor_id, appointment_date, time_slot, status, fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
  `).run(
    appointmentId,
    req.user.userId,
    hospitalId,
    departmentId,
    doctorId,
    appointmentDate,
    timeSlot,
    fee
  );

  const hospital = db.prepare('SELECT name FROM hospitals WHERE id = ?').get(hospitalId) as any;
  const doctor = db.prepare('SELECT name, title FROM doctors WHERE id = ?').get(doctorId) as any;

  successResponse(
    res,
    {
      appointmentId,
      status: 'confirmed',
      hospitalName: hospital?.name,
      doctorName: doctor?.name,
      doctorTitle: doctor?.title,
      appointmentDate,
      timeSlot,
      fee,
    },
    '预约成功'
  );
});

router.get('/health/appointments', auditMiddleware('list_appointments', 'health'), (req: Request, res: Response) => {
  if (!req.user) return errorResponse(res, '未登录', 401);

  const appointments = db
    .prepare(
      `SELECT a.*, h.name as hospital_name, d.name as department_name, doc.name as doctor_name, doc.title as doctor_title
       FROM appointments a
       JOIN hospitals h ON a.hospital_id = h.id
       JOIN departments d ON a.department_id = d.id
       JOIN doctors doc ON a.doctor_id = doc.id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC, a.time_slot ASC`
    )
    .all(req.user.userId) as any[];

  successResponse(res, appointments, '获取预约记录成功');
});

router.get('/culture/venues', auditMiddleware('list_venues', 'culture'), (req: Request, res: Response) => {
  const { type, page = 1, pageSize = 10 } = req.query;

  let query = 'SELECT * FROM venues';
  const params: any[] = [];

  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }

  query += ' ORDER BY name LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const venues = db.prepare(query).all(...params) as any[];

  const allActivities = generateMockActivities();

  const result: Venue[] = venues.map((v) => {
    const venueActivities = allActivities.filter((a) => {
      if (v.type === 'stadium' && a.type === '体育运动') return true;
      if (v.type === 'library' && a.type === '文化服务') return true;
      if (v.type === 'museum' && a.type === '展览') return true;
      if (v.type === 'theater' && a.type === '演出') return true;
      if (v.type === 'community' && a.type === '培训') return true;
      return false;
    });

    return {
      id: v.id,
      name: v.name,
      type: v.type as Venue['type'],
      address: v.address,
      capacity: v.capacity,
      currentOccupancy: Math.floor(Math.random() * (v.capacity * 0.8)),
      openingHours: v.opening_hours,
      phone: v.phone,
      todayActivities: venueActivities,
    };
  });

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM venues ${type ? 'WHERE type = ?' : ''}`)
    .get(...(type ? [type] : [])) as { count: number };

  successResponse(
    res,
    {
      items: result,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total.count / Number(pageSize)),
    },
    '获取文体场馆成功'
  );
});

router.get('/culture/venues/:id', auditMiddleware('view_venue', 'culture'), (req: Request, res: Response) => {
  const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(req.params.id) as any;

  if (!venue) {
    return errorResponse(res, '场馆不存在', 404);
  }

  const allActivities = generateMockActivities();
  const venueActivities = allActivities.filter((a) => {
    if (venue.type === 'stadium' && a.type === '体育运动') return true;
    if (venue.type === 'library' && a.type === '文化服务') return true;
    if (venue.type === 'museum' && a.type === '展览') return true;
    if (venue.type === 'theater' && a.type === '演出') return true;
    if (venue.type === 'community' && a.type === '培训') return true;
    return false;
  });

  const result: Venue = {
    id: venue.id,
    name: venue.name,
    type: venue.type as Venue['type'],
    address: venue.address,
    capacity: venue.capacity,
    currentOccupancy: Math.floor(Math.random() * (venue.capacity * 0.8)),
    openingHours: venue.opening_hours,
    phone: venue.phone,
    todayActivities: venueActivities,
  };

  successResponse(res, result, '获取场馆详情成功');
});

export default router;
