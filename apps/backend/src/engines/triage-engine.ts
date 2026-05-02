import { query } from '../database';
import { redis, getQueueKey } from '../database/redis';
import { TriagePath, TriageStep, QueueItem, Department } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TriageEngineConfig {
  maxQueueSize: number;
  priorityWeights: {
    departmentLoad: number;
    estimatedTime: number;
    patientType: number;
  };
}

const defaultConfig: TriageEngineConfig = {
  maxQueueSize: 50,
  priorityWeights: {
    departmentLoad: 0.4,
    estimatedTime: 0.3,
    patientType: 0.3,
  },
};

export class IntelligentTriageEngine {
  private config: TriageEngineConfig;

  constructor(config?: Partial<TriageEngineConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  async generateTriagePath(
    reservationId: string,
    patientId: string,
    packageId: string
  ): Promise<TriagePath> {
    const packageItems = await this.getPackageItems(packageId);
    const departments = await this.getDepartments();
    
    const departmentGroups = this.groupItemsByDepartment(packageItems, departments);
    const optimizedOrder = this.optimizeDepartmentOrder(departmentGroups);
    
    const triagePathId = uuidv4();
    const steps: TriageStep[] = optimizedOrder.map((group, index) => ({
      id: uuidv4(),
      stepIndex: index,
      departmentId: group.departmentId,
      departmentName: group.departmentName,
      status: 'pending',
    }));

    const triagePath: TriagePath = {
      id: triagePathId,
      reservationId,
      patientId,
      currentStep: 0,
      totalSteps: steps.length,
      steps,
      isCompleted: false,
      createdAt: new Date(),
    };

    await this.saveTriagePath(triagePath);
    return triagePath;
  }

  private async getPackageItems(packageId: string): Promise<any[]> {
    const result = await query(
      `SELECT pi.*, d.name as department_name 
       FROM package_items pi 
       LEFT JOIN departments d ON pi.department_id = d.id 
       WHERE pi.package_id = $1 
       ORDER BY pi.sort_order`,
      [packageId]
    );
    return result.rows;
  }

  private async getDepartments(): Promise<Department[]> {
    const result = await query(
      `SELECT * FROM departments WHERE is_active = true ORDER BY capacity DESC`
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      location: row.location,
      capacity: row.capacity,
      currentCount: row.current_count,
      avgExamTime: row.avg_exam_time,
      doctors: [],
      isActive: row.is_active,
    }));
  }

  private groupItemsByDepartment(items: any[], departments: Department[]) {
    const groups: Array<{
      departmentId: string;
      departmentName: string;
      items: any[];
      estimatedDuration: number;
    }> = [];

    const departmentMap = new Map(departments.map(d => [d.id, d]));

    items.forEach(item => {
      const existingGroup = groups.find(g => g.departmentId === item.department_id);
      const dept = departmentMap.get(item.department_id);
      
      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.estimatedDuration += item.estimated_duration || 15;
      } else {
        groups.push({
          departmentId: item.department_id,
          departmentName: dept?.name || item.department_name || '未知科室',
          items: [item],
          estimatedDuration: item.estimated_duration || 15,
        });
      }
    });

    return groups;
  }

  private optimizeDepartmentOrder(groups: Array<{
    departmentId: string;
    departmentName: string;
    estimatedDuration: number;
  }>) {
    return [...groups].sort((a, b) => {
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  private async saveTriagePath(triagePath: TriagePath): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO triage_paths (id, reservation_id, patient_id, current_step, total_steps, is_completed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          triagePath.id,
          triagePath.reservationId,
          triagePath.patientId,
          triagePath.currentStep,
          triagePath.totalSteps,
          triagePath.isCompleted,
        ]
      );

      for (const step of triagePath.steps) {
        await client.query(
          `INSERT INTO triage_steps (id, triage_path_id, step_index, department_id, department_name, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            step.id,
            triagePath.id,
            step.stepIndex,
            step.departmentId,
            step.departmentName,
            step.status,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addToQueue(
    patientId: string,
    patientName: string,
    departmentId: string,
    orderId: string,
    reservationCode: string
  ): Promise<QueueItem> {
    const queueSize = await this.getQueueSize(departmentId);
    
    if (queueSize >= this.config.maxQueueSize) {
      throw new Error('科室队列已满，请稍后重试');
    }

    const queuePosition = queueSize + 1;
    const estimatedWaitTime = await this.calculateEstimatedWaitTime(departmentId, queuePosition);

    const queueItem: QueueItem = {
      id: uuidv4(),
      patientId,
      patientName,
      departmentId,
      orderId,
      reservationCode,
      status: 'waiting',
      queuePosition,
      estimatedWaitTime,
      joinedAt: new Date(),
    };

    await this.saveQueueItem(queueItem);
    await this.updateDepartmentCurrentCount(departmentId, queueSize + 1);
    await this.broadcastQueueUpdate(departmentId);

    return queueItem;
  }

  private async getQueueSize(departmentId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM queue_items 
       WHERE department_id = $1 AND status IN ('waiting', 'in_examination')`,
      [departmentId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  private async calculateEstimatedWaitTime(
    departmentId: string,
    queuePosition: number
  ): Promise<number> {
    const result = await query(
      `SELECT avg_exam_time FROM departments WHERE id = $1`,
      [departmentId]
    );
    
    const avgExamTime = result.rows[0]?.avg_exam_time || 15;
    return queuePosition * avgExamTime;
  }

  private async saveQueueItem(queueItem: QueueItem): Promise<void> {
    await query(
      `INSERT INTO queue_items (
        id, patient_id, patient_name, department_id, order_id, 
        reservation_code, status, queue_position, estimated_wait_time, joined_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        queueItem.id,
        queueItem.patientId,
        queueItem.patientName,
        queueItem.departmentId,
        queueItem.orderId,
        queueItem.reservationCode,
        queueItem.status,
        queueItem.queuePosition,
        queueItem.estimatedWaitTime,
        queueItem.joinedAt,
      ]
    );
  }

  private async updateDepartmentCurrentCount(departmentId: string, count: number): Promise<void> {
    await query(
      `UPDATE departments SET current_count = $1 WHERE id = $2`,
      [count, departmentId]
    );
  }

  async callNextPatient(departmentId: string): Promise<QueueItem | null> {
    const waitingPatients = await query(
      `SELECT * FROM queue_items 
       WHERE department_id = $1 AND status = 'waiting' 
       ORDER BY queue_position ASC LIMIT 1`,
      [departmentId]
    );

    if (waitingPatients.rows.length === 0) {
      return null;
    }

    const patient = waitingPatients.rows[0];
    const calledAt = new Date();

    await query(
      `UPDATE queue_items SET status = 'in_examination', called_at = $1 WHERE id = $2`,
      [calledAt, patient.id]
    );

    await this.broadcastQueueUpdate(departmentId);

    return {
      id: patient.id,
      patientId: patient.patient_id,
      patientName: patient.patient_name,
      departmentId: patient.department_id,
      orderId: patient.order_id,
      reservationCode: patient.reservation_code,
      status: 'in_examination',
      queuePosition: patient.queue_position,
      estimatedWaitTime: patient.estimated_wait_time,
      calledAt,
      joinedAt: patient.joined_at,
    };
  }

  async completeExamination(queueItemId: string): Promise<void> {
    const result = await query(
      `SELECT department_id FROM queue_items WHERE id = $1`,
      [queueItemId]
    );

    if (result.rows.length === 0) {
      throw new Error('排队记录不存在');
    }

    const departmentId = result.rows[0].department_id;
    const completedAt = new Date();

    await query(
      `UPDATE queue_items SET status = 'completed', completed_at = $1 WHERE id = $2`,
      [completedAt, queueItemId]
    );

    const remainingCount = await this.getQueueSize(departmentId);
    await this.updateDepartmentCurrentCount(departmentId, remainingCount);
    await this.broadcastQueueUpdate(departmentId);
  }

  private async broadcastQueueUpdate(departmentId: string): Promise<void> {
    const queueData = await query(
      `SELECT * FROM queue_items 
       WHERE department_id = $1 AND status IN ('waiting', 'in_examination') 
       ORDER BY queue_position ASC`,
      [departmentId]
    );

    await redis.publish(
      `queue:${departmentId}:updates`,
      JSON.stringify({
        departmentId,
        timestamp: new Date(),
        queue: queueData.rows,
      })
    );
  }

  async getQueueStatus(departmentId: string): Promise<QueueItem[]> {
    const result = await query(
      `SELECT * FROM queue_items 
       WHERE department_id = $1 AND status IN ('waiting', 'in_examination') 
       ORDER BY queue_position ASC`,
      [departmentId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      departmentId: row.department_id,
      orderId: row.order_id,
      reservationCode: row.reservation_code,
      status: row.status,
      queuePosition: row.queue_position,
      estimatedWaitTime: row.estimated_wait_time,
      joinedAt: row.joined_at,
      calledAt: row.called_at,
      completedAt: row.completed_at,
    }));
  }
}

import { pool } from '../database';
export const triageEngine = new IntelligentTriageEngine();
