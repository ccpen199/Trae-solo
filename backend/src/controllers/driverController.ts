import { Request, Response } from 'express';
import db from '../db';

export const getDrivers = (req: Request, res: Response) => {
  try {
    const { keyword, status, page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSizeNum = parseInt(pageSize as string, 10) || 10;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (keyword) {
      whereClauses.push('(name LIKE ? OR phone LIKE ? OR vehicle_plate LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM drivers ${whereStr}`).get(...params) as { count: number }).count;
    const drivers = db.prepare(`SELECT * FROM drivers ${whereStr} ORDER BY id LIMIT ? OFFSET ?`).all(...params, pageSizeNum, (pageNum - 1) * pageSizeNum);

    res.success({ list: drivers, total, page: pageNum, pageSize: pageSizeNum });
  } catch (error) {
    res.error('Failed to fetch drivers');
  }
};

export const getDriverById = (req: Request, res: Response) => {
  try {
    const driver = db.prepare(`
      SELECT d.*, dc.credit_score, dc.on_time_rate, dc.service_score, dc.violation_count
      FROM drivers d
      LEFT JOIN driver_credit dc ON d.id = dc.driver_id
      WHERE d.id = ?
    `).get(req.params.id);
    if (!driver) {
      return res.error('Driver not found');
    }
    res.success(driver);
  } catch (error) {
    res.error('Failed to fetch driver');
  }
};

export const createDriver = (req: Request, res: Response) => {
  try {
    const { name, phone, id_card, driver_license, vehicle_type, vehicle_plate, vehicle_inspection_status, rating } = req.body;
    const info = db.prepare(`
      INSERT INTO drivers (name, phone, id_card, driver_license, vehicle_type, vehicle_plate, vehicle_inspection_status, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, id_card, driver_license, vehicle_type, vehicle_plate, vehicle_inspection_status || 'valid', rating || 5.0);

    db.prepare(`
      INSERT INTO driver_credit (driver_id) VALUES (?)
    `).run(info.lastInsertRowid);

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(info.lastInsertRowid);
    res.success(driver);
  } catch (error) {
    res.error('Failed to create driver');
  }
};

export const getAvailableDrivers = (_req: Request, res: Response) => {
  try {
    const drivers = db.prepare(`
      SELECT d.*, dc.credit_score, dc.on_time_rate, dc.service_score
      FROM drivers d
      LEFT JOIN driver_credit dc ON d.id = dc.driver_id
      WHERE d.status = 'available'
      ORDER BY dc.credit_score DESC
    `).all();
    res.success(drivers);
  } catch (error) {
    res.error('Failed to fetch available drivers');
  }
};
