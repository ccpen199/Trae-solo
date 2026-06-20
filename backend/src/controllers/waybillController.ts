import { Request, Response } from 'express';
import db from '../db';

export const createWaybill = (req: Request, res: Response) => {
  try {
    const { order_id, notes } = req.body;

    const existingWaybill = db.prepare('SELECT * FROM waybills WHERE order_id = ?').get(order_id);
    if (existingWaybill) {
      return res.status(400).json({ error: 'Waybill already exists for this order' });
    }

    const info = db.prepare(`
      INSERT INTO waybills (order_id, notes)
      VALUES (?, ?)
    `).run(order_id, notes || null);

    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(waybill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create waybill' });
  }
};

export const signWaybill = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signer_name, signature_image, notes } = req.body;

    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id);
    if (!waybill) {
      return res.status(404).json({ error: 'Waybill not found' });
    }

    db.prepare(`
      UPDATE waybills 
      SET signer_name = ?, sign_time = datetime('now'), signature_image = ?, status = 'signed', notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(signer_name, signature_image || null, notes || null, id);

    const updatedWaybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id);
    res.json(updatedWaybill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign waybill' });
  }
};

export const getWaybillByOrderId = (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const waybill = db.prepare('SELECT * FROM waybills WHERE order_id = ?').get(orderId);
    if (!waybill) {
      return res.status(404).json({ error: 'Waybill not found' });
    }

    res.json(waybill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waybill' });
  }
};
