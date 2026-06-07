import { BaseRepository } from './BaseRepository.js';
import type { WorkTicket } from '../types/index.js';

export class TicketRepository extends BaseRepository<WorkTicket> {
  protected tableName = 'work_tickets';
  protected columns = [
    'id',
    'title',
    'description',
    'type',
    'priority',
    'status',
    'reporter_id',
    'assignee_id',
    'unit_id',
    'location',
    'contact_name',
    'contact_phone',
    'scheduled_at',
    'started_at',
    'completed_at',
    'rating',
    'feedback',
    'skills_required',
    'created_at',
    'updated_at',
  ];

  public findByStatus(status: string): WorkTicket[] {
    return this.findAllByField('status', status);
  }

  public findByAssignee(assigneeId: number): WorkTicket[] {
    return this.findAllByField('assignee_id', assigneeId);
  }

  public findByReporter(reporterId: number): WorkTicket[] {
    return this.findAllByField('reporter_id', reporterId);
  }

  public findPendingTickets(): WorkTicket[] {
    const sql = `
      SELECT ${this.columns.join(', ')} 
      FROM ${this.tableName} 
      WHERE status = 'pending' 
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at ASC
    `;
    return this.executeQuery<WorkTicket>(sql);
  }

  public getTicketsWithDetails(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters) {
      if (filters.status) {
        conditions.push('wt.status = ?');
        params.push(filters.status);
      }
      if (filters.type) {
        conditions.push('wt.type = ?');
        params.push(filters.type);
      }
      if (filters.priority) {
        conditions.push('wt.priority = ?');
        params.push(filters.priority);
      }
      if (filters.assignee_id) {
        conditions.push('wt.assignee_id = ?');
        params.push(filters.assignee_id);
      }
      if (filters.reporter_id) {
        conditions.push('wt.reporter_id = ?');
        params.push(filters.reporter_id);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total 
      FROM work_tickets wt
      ${whereClause}
    `;

    const dataSql = `
      SELECT 
        wt.*,
        ur.name as reporter_name,
        ua.name as assignee_name,
        u.unit_number,
        b.name as building_name
      FROM work_tickets wt
      LEFT JOIN users ur ON wt.reporter_id = ur.id
      LEFT JOIN users ua ON wt.assignee_id = ua.id
      LEFT JOIN units u ON wt.unit_id = u.id
      LEFT JOIN buildings b ON u.building_id = b.id
      ${whereClause}
      ORDER BY 
        CASE wt.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        wt.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, pageSize, offset];

    const { total } = this.executeGet<{ total: number }>(countSql, countParams) || { total: 0 };
    const items = this.executeQuery(dataSql, dataParams);

    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getTicketStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
      FROM work_tickets
    `;
    return this.executeGet(sql);
  }

  public getTicketsByStatusGroup() {
    const sql = `
      SELECT status, COUNT(*) as count 
      FROM work_tickets 
      GROUP BY status
      ORDER BY count DESC
    `;
    return this.executeQuery<{ status: string; count: number }>(sql);
  }

  public getTicketsByTypeGroup() {
    const sql = `
      SELECT type, COUNT(*) as count 
      FROM work_tickets 
      GROUP BY type
      ORDER BY count DESC
    `;
    return this.executeQuery<{ type: string; count: number }>(sql);
  }

  public getRecentTickets(limit: number = 10) {
    const sql = `
      SELECT 
        wt.*,
        ur.name as reporter_name,
        ua.name as assignee_name
      FROM work_tickets wt
      LEFT JOIN users ur ON wt.reporter_id = ur.id
      LEFT JOIN users ua ON wt.assignee_id = ua.id
      ORDER BY wt.created_at DESC
      LIMIT ?
    `;
    return this.executeQuery(sql, [limit]);
  }

  public updateStatus(ticketId: number, status: WorkTicket['status'], extra?: Partial<WorkTicket>): boolean {
    const data: Partial<WorkTicket> = { status, ...extra };
    return this.update(ticketId, data);
  }

  public assignTicket(ticketId: number, assigneeId: number): boolean {
    return this.update(ticketId, {
      assignee_id: assigneeId,
      status: 'assigned',
    });
  }

  public completeTicket(ticketId: number, rating?: number, feedback?: string): boolean {
    const data: Partial<WorkTicket> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    };
    if (rating !== undefined) data.rating = rating;
    if (feedback) data.feedback = feedback;
    return this.update(ticketId, data);
  }
}

export default TicketRepository;
