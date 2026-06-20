import { Request, Response } from 'express';
import db from '../db';

export const getDrivers = (_req: Request, res: Response) => {
  try {
    const drivers = db.prepare('SELECT * FROM drivers ORDER BY id').all();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const getDriverById = (req: Request, res: Response) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};

export const createDriver = (req: Request, res: Response) => {
  try {
    const { name, phone, id_card, driver_license, vehicle_type, vehicle_plate } = req.body;
    const info = db.prepare(`
      INSERT INTO drivers (name, phone, id_card, driver_license, vehicle_type, vehicle_plate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, phone, id_card, driver_license, vehicle_type, vehicle_plate);

    db.prepare(`
      INSERT INTO driver_credit (driver_id) VALUES (?)
    `).run(info.lastInsertRowid);

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create driver' });
  }
};
