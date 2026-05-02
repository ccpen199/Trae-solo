import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/database.js';
import { AuditService, auditActions } from '../services/auditService.js';
import { BusinessOrderService, BusinessOrderType } from '../services/businessOrderService.js';
import { ScheduleStatus, ReservationStatus } from '../types/index.js';

export interface ScheduleParams {
  courseId: string;
  trainerId: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  operatorId: string;
  operatorRole: string;
}

export interface ReservationParams {
  memberId: string;
  scheduleId: string;
  operatorId: string;
  operatorRole: string;
}

export interface ScheduleValidationResult {
  valid: boolean;
  conflicts: string[];
  suggestions?: string[];
}

export interface ReservationResult {
  success: boolean;
  message: string;
  reservationId?: string;
  businessOrderId?: string;
}

export class TrainerScheduleEngine {
  static async validateSchedule(params: ScheduleParams): Promise<ScheduleValidationResult> {
    const db = await getDb();
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    try {
      if (params.endTime <= params.startTime) {
        conflicts.push('结束时间必须晚于开始时间');
      }

      const duration = (params.endTime.getTime() - params.startTime.getTime()) / (1000 * 60);
      if (duration < 30) {
        conflicts.push('课程时长不能少于30分钟');
      }

      if (params.capacity <= 0) {
        conflicts.push('容量必须大于0');
      }

      const overlappingSchedules = await db.all(`
        SELECT s.*, c.name as course_name, u.name as trainer_name
        FROM schedules s
        JOIN courses c ON s.course_id = c.id
        JOIN users u ON s.trainer_id = u.id
        WHERE s.trainer_id = ? 
        AND s.status IN ('scheduled', 'ongoing')
        AND (
          (s.start_time < ? AND s.end_time > ?) OR
          (s.start_time >= ? AND s.start_time < ?) OR
          (s.end_time > ? AND s.end_time <= ?)
        )
      `, [
        params.trainerId,
        params.endTime.toISOString(),
        params.startTime.toISOString(),
        params.startTime.toISOString(),
        params.endTime.toISOString(),
        params.startTime.toISOString(),
        params.endTime.toISOString()
      ]);

      if (overlappingSchedules.length > 0) {
        conflicts.push(`教练在该时间段已有安排：${overlappingSchedules.map(s => s.course_name).join(', ')}`);
        
        const nextAvailable = await db.get(`
          SELECT * FROM schedules
          WHERE trainer_id = ? AND status IN ('scheduled', 'ongoing')
          AND start_time >= ?
          ORDER BY start_time ASC
          LIMIT 1
        `, [params.trainerId, params.endTime.toISOString()]);
        
        if (nextAvailable) {
          suggestions.push(`建议选择 ${new Date(nextAvailable.end_time).toLocaleString()} 之后的时间`);
        }
      }

      const course = await db.get('SELECT * FROM courses WHERE id = ?', [params.courseId]);
      if (!course) {
        conflicts.push('课程不存在');
      }

      const trainer = await db.get("SELECT * FROM users WHERE id = ? AND role = 'trainer'", [params.trainerId]);
      if (!trainer) {
        conflicts.push('教练不存在或不是教练角色');
      }

      await db.close();

      return {
        valid: conflicts.length === 0,
        conflicts,
        suggestions
      };

    } catch (error: any) {
      await db.close();
      throw error;
    }
  }

  static async createSchedule(params: ScheduleParams): Promise<{ success: boolean; message: string; scheduleId?: string }> {
    const validation = await this.validateSchedule(params);
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.conflicts.join('; ')
      };
    }

    const db = await getDb();

    try {
      const scheduleId = uuidv4();
      const now = new Date();

      await db.run(`
        INSERT INTO schedules (
          id, course_id, trainer_id, start_time, end_time, 
          capacity, booked_count, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        scheduleId,
        params.courseId,
        params.trainerId,
        params.startTime.toISOString(),
        params.endTime.toISOString(),
        params.capacity,
        0,
        ScheduleStatus.SCHEDULED,
        now.toISOString(),
        now.toISOString()
      ]);

      await AuditService.log({
        action: auditActions.CREATE,
        entityType: 'Schedule',
        entityId: scheduleId,
