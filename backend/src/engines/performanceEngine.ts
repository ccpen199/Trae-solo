import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface DailyPerformance {
  courierId: string;
  courierName: string;
  date: string;
  totalPackages: number;
  signedPackages: number;
  exceptionPackages: number;
  pendingPackages: number;
  signRate: number;
  exceptionRate: number;
}

export interface PerformanceReport {
  courierId: string;
  courierName: string;
  period: {
    start: string;
    end: string;
  };
  totalPackages: number;
  totalSigned: number;
  totalExceptions: number;
  avgSignRate: number;
  avgExceptionRate: number;
  dailyDetails: DailyPerformance[];
}

export interface SiteDashboard {
  totalInStation: number;
  totalSignedToday: number;
  totalExceptions: number;
  signRateToday: number;
  couriers: {
    id: string;
    name: string;
    assignedPackages: number;
    signedPackages: number;
    exceptionPackages: number;
    signRate: number;
  }[];
  areas: {
    id: string;
    name: string;
    code: string;
    packageCount: number;
  }[];
}

export class PerformanceEngine {
  
  static getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  static async recordPackageAssignment(
    courierId: string,
    packageId: string
  ): Promise<void> {
    const today = this.getToday();
    const now = new Date().toISOString();

    const existing = db.prepare(`
      SELECT id FROM performance_records WHERE courier_id = ? AND date = ?
    `).get(courierId, today) as any;

    if (existing) {
      db.prepare(`
        UPDATE performance_records 
        SET total_packages = total_packages + 1, updated_at = ?
        WHERE id = ?
      `).run(now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO performance_records (id, courier_id, date, total_packages, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `).run(uuidv4(), courierId, today, now, now);
    }
  }

  static async recordSignature(
    courierId: string,
    packageId: string
  ): Promise<void> {
    const today = this.getToday();
    const now = new Date().toISOString();

    const record = db.prepare(`
      SELECT id, total_packages, signed_packages, exception_packages
      FROM performance_records 
      WHERE courier_id = ? AND date = ?
    `).get(courierId, today) as any;

    if (record) {
      const newSigned = record.signed_packages + 1;
      const newSignRate = record.total_packages > 0 
        ? (newSigned / record.total_packages) * 100 
        : 0;

      db.prepare(`
        UPDATE performance_records 
        SET signed_packages = ?, sign_rate = ?, updated_at = ?
        WHERE id = ?
      `).run(newSigned, newSignRate, now, record.id);
    }
  }

  static async recordException(
    courierId: string,
    packageId: string
  ): Promise<void> {
    const today = this.getToday();
    const now = new Date().toISOString();

    const record = db.prepare(`
      SELECT id, total_packages, signed_packages, exception_packages
      FROM performance_records 
      WHERE courier_id = ? AND date = ?
    `).get(courierId, today) as any;

    if (record) {
      const newException = record.exception_packages + 1;
      const newExceptionRate = record.total_packages > 0 
        ? (newException / record.total_packages) * 100 
        : 0;

      db.prepare(`
        UPDATE performance_records 
        SET exception_packages = ?, exception_rate = ?, updated_at = ?
        WHERE id = ?
      `).run(newException, newExceptionRate, now, record.id);
    }
  }

  static getDailyPerformance(courierId: string, date: string): DailyPerformance | null {
    const record = db.prepare(`
      SELECT pr.*, u.name as courier_name
      FROM performance_records pr
      LEFT JOIN users u ON pr.courier_id = u.id
      WHERE pr.courier_id = ? AND pr.date = ?
    `).get(courierId, date) as any;

    if (!record) return null;

    const pending = record.total_packages - record.signed_packages - record.exception_packages;

    return {
      courierId: record.courier_id,
      courierName: record.courier_name,
      date: record.date,
      totalPackages: record.total_packages,
      signedPackages: record.signed_packages,
      exceptionPackages: record.exception_packages,
      pendingPackages: pending,
      signRate: record.sign_rate,
      exceptionRate: record.exception_rate
    };
  }

  static getCourierPerformanceReport(
    courierId: string,
    startDate: string,
    endDate: string
  ): PerformanceReport {
    const records = db.prepare(`
      SELECT pr.*, u.name as courier_name
      FROM performance_records pr
      LEFT JOIN users u ON pr.courier_id = u.id
      WHERE pr.courier_id = ? AND pr.date >= ? AND pr.date <= ?
      ORDER BY pr.date
    `).all(courierId, startDate, endDate) as any[];

    const dailyDetails: DailyPerformance[] = records.map(record => ({
      courierId: record.courier_id,
      courierName: record.courier_name,
      date: record.date,
      totalPackages: record.total_packages,
      signedPackages: record.signed_packages,
      exceptionPackages: record.exception_packages,
      pendingPackages: record.total_packages - record.signed_packages - record.exception_packages,
      signRate: record.sign_rate,
      exceptionRate: record.exception_rate
    }));

    const totalPackages = dailyDetails.reduce((sum, d) => sum + d.totalPackages, 0);
    const totalSigned = dailyDetails.reduce((sum, d) => sum + d.signedPackages, 0);
    const totalExceptions = dailyDetails.reduce((sum, d) => sum + d.exceptionPackages, 0);
    
    const avgSignRate = dailyDetails.length > 0 
      ? dailyDetails.reduce((sum, d) => sum + d.signRate, 0) / dailyDetails.length 
      : 0;
    const avgExceptionRate = dailyDetails.length > 0 
      ? dailyDetails.reduce((sum, d) => sum + d.exceptionRate, 0) / dailyDetails.length 
      : 0;

    const courierName = dailyDetails.length > 0 ? dailyDetails[0].courierName : '';

    return {
      courierId,
      courierName,
      period: { start: startDate, end: endDate },
      totalPackages,
      totalSigned,
      totalExceptions,
      avgSignRate,
      avgExceptionRate,
      dailyDetails
    };
  }

  static getSiteDashboard(): SiteDashboard {
    const today = this.getToday();

    const inStationCount = db.prepare(`
      SELECT COUNT(*) as count FROM packages 
      WHERE status IN ('in_station', 'sorted', 'notified', 'delivering')
    `).get() as any;

    const signedTodayCount = db.prepare(`
      SELECT COUNT(*) as count FROM packages 
      WHERE status = 'signed' AND date(sign_time) = ?
    `).get(today) as any;

    const exceptionCount = db.prepare(`
      SELECT COUNT(*) as count FROM exceptions
      WHERE status IN ('pending', 'processing')
    `).get() as any;

    const totalTodayCount = db.prepare(`
      SELECT SUM(total_packages) as total FROM performance_records WHERE date = ?
    `).get(today) as any;

    const signRateToday = totalTodayCount?.total > 0 
      ? (signedTodayCount?.count || 0) / totalTodayCount.total * 100 
      : 0;

    const couriers = db.prepare(`
      SELECT u.id, u.name,
             COALESCE(SUM(pr.total_packages), 0) as assigned_packages,
             COALESCE(SUM(pr.signed_packages), 0) as signed_packages,
             COALESCE(SUM(pr.exception_packages), 0) as exception_packages,
             CASE WHEN COALESCE(SUM(pr.total_packages), 0) > 0 
                  THEN ROUND(COALESCE(SUM(pr.signed_packages), 0) * 100.0 / SUM(pr.total_packages), 2)
                  ELSE 0 END as sign_rate
      FROM users u
      LEFT JOIN performance_records pr ON u.id = pr.courier_id AND pr.date = ?
      WHERE u.role = 'courier'
      GROUP BY u.id, u.name
      ORDER BY u.name
    `).all(today) as any[];

    const areas = db.prepare(`
      SELECT a.id, a.name, a.code,
             COUNT(p.id) as package_count
      FROM areas a
      LEFT JOIN packages p ON a.id = p.area_id AND p.status NOT IN ('signed')
      GROUP BY a.id, a.name, a.code
      ORDER BY a.code
    `).all() as any[];

    return {
      totalInStation: inStationCount?.count || 0,
      totalSignedToday: signedTodayCount?.count || 0,
      totalExceptions: exceptionCount?.count || 0,
      signRateToday,
      couriers: couriers.map(c => ({
        id: c.id,
        name: c.name,
        assignedPackages: c.assigned_packages,
        signedPackages: c.signed_packages,
        exceptionPackages: c.exception_packages,
        signRate: c.sign_rate
      })),
      areas: areas.map(a => ({
        id: a.id,
        name: a.name,
        code: a.code,
        packageCount: a.package_count
      }))
    };
  }
}

export default PerformanceEngine;
