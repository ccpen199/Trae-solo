import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function verifyGeofence(projectId: number, lat: number, lng: number): { passed: boolean; distance: number; radius: number } {
  const project = db.prepare('SELECT geofence_lat, geofence_lng, geofence_radius FROM construction_projects WHERE id = ?').get(projectId) as any;
  
  if (!project || project.geofence_lat === null || project.geofence_lng === null) {
    return { passed: true, distance: 0, radius: 0 };
  }
  
  const distance = haversineDistance(lat, lng, project.geofence_lat, project.geofence_lng);
  const radius = project.geofence_radius || 200;
  
  return {
    passed: distance <= radius,
    distance,
    radius
  };
}

export function calculateWorkHours(checkInTime: string, checkOutTime: string): number {
  const inTime = new Date(checkInTime).getTime();
  const outTime = new Date(checkOutTime).getTime();
  const diffMs = outTime - inTime;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

function determineStatus(checkInTime: string, workHours: number): string {
  const inDate = new Date(checkInTime);
  const startOfDay = new Date(inDate);
  startOfDay.setHours(9, 0, 0, 0);
  
  const endOfDay = new Date(inDate);
  endOfDay.setHours(18, 0, 0, 0);
  
  const inTimeMs = inDate.getTime();
  const startOfDayMs = startOfDay.getTime();
  const endOfDayMs = endOfDay.getTime();
  
  const diffMs = inTimeMs - startOfDayMs;
  const diffMinutes = diffMs / (1000 * 60);
  
  if (diffMinutes > 30) {
    return 'late';
  }
  
  if (workHours < 8 && inTimeMs < endOfDayMs) {
    return 'early_leave';
  }
  
  if (workHours > 10) {
    return 'overtime';
  }
  
  return 'normal';
}

export function checkIn(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { projectId, lat, lng, faceVerified } = req.body;

  if (!projectId || lat === undefined || lng === undefined) {
    return res.status(400).json({ message: '请填写必填字段：项目ID、纬度、经度' });
  }

  const project = db.prepare('SELECT * FROM construction_projects WHERE id = ?').get(projectId) as any;
  if (!project) {
    return res.status(400).json({ message: '项目不存在' });
  }

  const contract = db.prepare(`
    SELECT * FROM labor_contracts 
    WHERE worker_id = ? AND project_id = ? AND status = 'signed'
  `).get(workerId, projectId) as any;
  if (!contract) {
    return res.status(403).json({ message: '您未在此项目签署有效合同，无法打卡' });
  }

  const today = new Date().toISOString().split('T')[0];
  const existingCheckIn = db.prepare(`
    SELECT * FROM attendance_records 
    WHERE worker_id = ? AND project_id = ? AND DATE(check_in_time) = ? AND check_in_time IS NOT NULL
  `).get(workerId, projectId, today) as any;
  
  if (existingCheckIn) {
    return res.status(400).json({ message: '您今天已在本项目打卡上班' });
  }

  const geofenceResult = verifyGeofence(projectId, lat, lng);
  
  if (!geofenceResult.passed) {
    return res.status(400).json({
      message: '不在项目地理围栏范围内',
      distance: geofenceResult.distance,
      radius: geofenceResult.radius
    });
  }

  if (!faceVerified) {
    return res.status(400).json({ message: '人脸识别未通过，无法打卡' });
  }

  const insert = db.prepare(`
    INSERT INTO attendance_records 
    (worker_id, project_id, contract_id, check_in_time, check_in_lat, check_in_lng, 
     check_in_face_verified, check_in_geofence_verified, status)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    workerId,
    projectId,
    contract.id,
    lat,
    lng,
    faceVerified ? 1 : 0,
    geofenceResult.passed ? 1 : 0,
    'normal'
  );

  res.json({
    id: result.lastInsertRowid,
    message: '上班打卡成功',
    distance: geofenceResult.distance,
    radius: geofenceResult.radius
  });
}

export function checkOut(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { projectId, lat, lng } = req.body;

  if (!projectId) {
    return res.status(400).json({ message: '请提供项目ID' });
  }

  const today = new Date().toISOString().split('T')[0];
  const attendance = db.prepare(`
    SELECT * FROM attendance_records 
    WHERE worker_id = ? AND project_id = ? AND DATE(check_in_time) = ? AND check_out_time IS NULL
  `).get(workerId, projectId, today) as any;

  if (!attendance) {
    return res.status(404).json({ message: '未找到今日有效的上班打卡记录' });
  }

  const workHours = calculateWorkHours(attendance.check_in_time, new Date().toISOString());
  const status = determineStatus(attendance.check_in_time, workHours);

  db.prepare(`
    UPDATE attendance_records 
    SET check_out_time = CURRENT_TIMESTAMP, check_out_lat = ?, check_out_lng = ?, 
        work_hours = ?, status = ?
    WHERE id = ?
  `).run(lat || null, lng || null, workHours, status, attendance.id);

  const updated = db.prepare('SELECT * FROM attendance_records WHERE id = ?').get(attendance.id);

  res.json({
    message: '下班打卡成功',
    attendance: updated,
    workHours
  });
}

export function getMyAttendance(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { year, month, projectId } = req.query;

  let sql = `
    SELECT ar.*, cp.project_name, cp.project_address
    FROM attendance_records ar
    LEFT JOIN construction_projects cp ON ar.project_id = cp.id
    WHERE ar.worker_id = ?
  `;
  const params: any[] = [workerId];

  if (year && month) {
    sql += ' AND strftime(\'%Y\', ar.check_in_time) = ? AND strftime(\'%m\', ar.check_in_time) = ?';
    params.push(String(year), String(month).padStart(2, '0'));
  }

  if (projectId) {
    sql += ' AND ar.project_id = ?';
    params.push(projectId);
  }

  sql += ' ORDER BY ar.check_in_time DESC';

  const records = db.prepare(sql).all(...params) as any[];

  const totalHours = records.reduce((sum: number, r: any) => sum + (r.work_hours || 0), 0);

  res.json({
    records,
    totalHours,
    count: records.length
  });
}

export function getProjectAttendance(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const role = req.user!.role;
  const { projectId, year, month, workerId } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: '请提供项目ID' });
  }

  const project = db.prepare('SELECT * FROM construction_projects WHERE id = ?').get(projectId) as any;
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  if (role === 'enterprise' && project.enterprise_id !== userId) {
    return res.status(403).json({ message: '无权查看此项目的考勤记录' });
  }

  let sql = `
    SELECT ar.*, u.username, u.real_name, cp.project_name
    FROM attendance_records ar
    JOIN users u ON ar.worker_id = u.id
    LEFT JOIN construction_projects cp ON ar.project_id = cp.id
    WHERE ar.project_id = ?
  `;
  const params: any[] = [projectId];

  if (year && month) {
    sql += ' AND strftime(\'%Y\', ar.check_in_time) = ? AND strftime(\'%m\', ar.check_in_time) = ?';
    params.push(String(year), String(month).padStart(2, '0'));
  }

  if (workerId) {
    sql += ' AND ar.worker_id = ?';
    params.push(workerId);
  }

  sql += ' ORDER BY ar.check_in_time DESC';

  const records = db.prepare(sql).all(...params) as any[];

  const stats = {
    total: records.length,
    normal: records.filter((r: any) => r.status === 'normal').length,
    late: records.filter((r: any) => r.status === 'late').length,
    earlyLeave: records.filter((r: any) => r.status === 'early_leave').length,
    overtime: records.filter((r: any) => r.status === 'overtime').length,
    totalHours: records.reduce((sum: number, r: any) => sum + (r.work_hours || 0), 0)
  };

  res.json({ records, stats });
}
