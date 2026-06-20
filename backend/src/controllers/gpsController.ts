import { Request, Response } from 'express';
import db from '../db';

export const createTrack = (req: Request, res: Response) => {
  try {
    const { order_id, driver_id, lng, lat, speed, timestamp } = req.body;

    const info = db.prepare(`
      INSERT INTO gps_tracks (order_id, driver_id, lng, lat, speed, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      order_id,
      driver_id,
      lng,
      lat,
      speed || 0,
      timestamp || new Date().toISOString()
    );

    const track = db.prepare('SELECT * FROM gps_tracks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create GPS track' });
  }
};

export const getTracksByOrderId = (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const tracks = db.prepare(`
      SELECT * FROM gps_tracks 
      WHERE order_id = ? 
      ORDER BY timestamp ASC
    `).all(orderId);

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GPS tracks' });
  }
};
