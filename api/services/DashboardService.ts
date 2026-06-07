import { TicketRepository } from '../repositories/TicketRepository.js';
import { BuildingRepository } from '../repositories/BuildingRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import type { DashboardStats, WorkTicket } from '../types/index.js';

export class DashboardService {
  private ticketRepository: TicketRepository;
  private buildingRepository: BuildingRepository;
  private userRepository: UserRepository;

  constructor() {
    this.ticketRepository = new TicketRepository();
    this.buildingRepository = new BuildingRepository();
    this.userRepository = new UserRepository();
  }

  public getStats(): DashboardStats {
    const ticketStats = this.ticketRepository.getTicketStats() as {
      total: number;
      pending: number;
      assigned: number;
      processing: number;
      completed: number;
      cancelled: number;
      urgent: number;
      high: number;
      medium: number;
      low: number;
    } | null;

    const buildingsStats = this.buildingRepository.getAllBuildingsWithStats() as {
      id: number;
      name: string;
      actual_units: number;
      occupied_units: number;
      total_residents: number;
    }[];

    const feeStats = this.getFeeStats();
    const ticketsByStatus = this.ticketRepository.getTicketsByStatusGroup();
    const ticketsByType = this.ticketRepository.getTicketsByTypeGroup();
    const recentTickets = this.ticketRepository.getRecentTickets(10) as unknown as WorkTicket[];

    const totalUnits = buildingsStats.reduce((sum, b) => sum + (b.actual_units || 0), 0);
    const occupiedUnits = buildingsStats.reduce((sum, b) => sum + (b.occupied_units || 0), 0);
    const totalResidents = buildingsStats.reduce((sum, b) => sum + (b.total_residents || 0), 0);

    return {
      total_tickets: ticketStats?.total || 0,
      pending_tickets: ticketStats?.pending || 0,
      completed_tickets: ticketStats?.completed || 0,
      total_residents: totalResidents,
      total_units: totalUnits,
      occupied_units: occupiedUnits,
      total_fee: feeStats.totalFee,
      paid_fee: feeStats.paidFee,
      unpaid_fee: feeStats.unpaidFee,
      tickets_by_status: ticketsByStatus,
      tickets_by_type: ticketsByType,
      recent_tickets: recentTickets,
    };
  }

  public getTicketTrend(days: number = 7) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM work_tickets
      WHERE created_at >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return this.ticketRepository['executeQuery'](sql, [days]);
  }

  public getStaffPerformance() {
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(wt.id) as total_tickets,
        SUM(CASE WHEN wt.status = 'completed' THEN 1 ELSE 0 END) as completed_tickets,
        ROUND(AVG(CASE WHEN wt.rating IS NOT NULL THEN wt.rating ELSE NULL END), 1) as avg_rating,
        ROUND(
          CASE 
            WHEN COUNT(CASE WHEN wt.status IN ('completed', 'cancelled') THEN 1 END) = 0 THEN 0.85
            ELSE CAST(SUM(CASE WHEN wt.status = 'completed' THEN 1 ELSE 0 END) AS REAL) / 
                 COUNT(CASE WHEN wt.status IN ('completed', 'cancelled') THEN 1 END)
          END, 2
        ) as fulfillment_rate
      FROM users u
      LEFT JOIN work_tickets wt ON u.id = wt.assignee_id
      WHERE u.role = 'property' AND u.status = 'active'
      GROUP BY u.id, u.name, u.role
      ORDER BY completed_tickets DESC
    `;

    return this.userRepository['executeQuery'](sql);
  }

  public getBuildingStats() {
    return this.buildingRepository.getAllBuildingsWithStats();
  }

  public getFeeStatsByMonth(months: number = 6) {
    const sql = `
      SELECT 
        billing_month,
        COUNT(*) as total_bills,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as unpaid_amount,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount
      FROM fee_bills
      GROUP BY billing_month
      ORDER BY billing_month DESC
      LIMIT ?
    `;

    return this.ticketRepository['executeQuery'](sql, [months]);
  }

  public getQuickStats() {
    return {
      urgent_tickets: this.ticketRepository['executeGet'](`
        SELECT COUNT(*) as count FROM work_tickets WHERE status IN ('pending', 'assigned', 'processing') AND priority = 'urgent'
      `),
      new_today: this.ticketRepository['executeGet'](`
        SELECT COUNT(*) as count FROM work_tickets WHERE DATE(created_at) = DATE('now')
      `),
      completed_today: this.ticketRepository['executeGet'](`
        SELECT COUNT(*) as count FROM work_tickets WHERE DATE(completed_at) = DATE('now')
      `),
      active_users: this.userRepository['executeGet'](`
        SELECT COUNT(*) as count FROM users WHERE status = 'active'
      `),
    };
  }

  private getFeeStats(): { totalFee: number; paidFee: number; unpaidFee: number } {
    const sql = `
      SELECT 
        SUM(amount) as total_fee,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_fee,
        SUM(CASE WHEN status IN ('unpaid', 'overdue') THEN amount ELSE 0 END) as unpaid_fee
      FROM fee_bills
    `;

    const result = this.ticketRepository['executeGet'](sql) as {
      total_fee: number;
      paid_fee: number;
      unpaid_fee: number;
    } | null;

    return {
      totalFee: result?.total_fee || 0,
      paidFee: result?.paid_fee || 0,
      unpaidFee: result?.unpaid_fee || 0,
    };
  }

  public getAccessLogs(days: number = 7) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN access_type = 'enter' THEN 1 ELSE 0 END) as entries,
        SUM(CASE WHEN access_type = 'exit' THEN 1 ELSE 0 END) as exits,
        SUM(CASE WHEN access_type LIKE 'visitor_%' THEN 1 ELSE 0 END) as visitors
      FROM access_logs
      WHERE created_at >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return this.ticketRepository['executeQuery'](sql, [days]);
  }

  public getSystemHealth() {
    const db = this.ticketRepository['db'];
    
    try {
      db.prepare('SELECT 1').get();
      return {
        database: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        database: 'unhealthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default DashboardService;
