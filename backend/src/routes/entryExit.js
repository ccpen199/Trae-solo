import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const records = db.prepare(`
    SELECT e.*, p.name as parking_lot_name
    FROM entry_exit_records e
    LEFT JOIN parking_lots p ON e.parking_lot_id = p.id
    ORDER BY entry_time DESC
    LIMIT 100
  `).all();
  res.json(records);
});

router.post('/entry', (req, res) => {
  const { plate_number, parking_lot_id, spot_number } = req.body;
  const stmt = db.prepare(`
    INSERT INTO entry_exit_records (plate_number, parking_lot_id, entry_time, spot_number)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?)
  `);
  const result = stmt.run(plate_number, parking_lot_id, spot_number);
  
  if (spot_number) {
    db.prepare('UPDATE spot_status SET status = ? WHERE parking_lot_id = ? AND spot_number = ?')
      .run('occupied', parking_lot_id, spot_number);
  }
  
  res.json({ id: result.lastInsertRowid });
});

router.post('/exit', (req, res) => {
  const { plate_number, parking_lot_id } = req.body;
  
  const record = db.prepare(`
    SELECT * FROM entry_exit_records 
    WHERE plate_number = ? AND parking_lot_id = ? AND exit_time IS NULL
    ORDER BY entry_time DESC LIMIT 1
  `).get(plate_number, parking_lot_id);
  
  if (!record) {
    return res.status(404).json({ error: 'Entry record not found' });
  }
  
  const entryTime = new Date(record.entry_time).getTime();
  const exitTime = Date.now();
  const durationMinutes = Math.ceil((exitTime - entryTime) / 60000);
  
  const lot = db.prepare('SELECT price_per_hour FROM parking_lots WHERE id = ?').get(parking_lot_id);
  const fee = Math.ceil(durationMinutes / 60) * (lot?.price_per_hour || 10);
  
  db.prepare(`
    UPDATE entry_exit_records 
    SET exit_time = CURRENT_TIMESTAMP, duration = ?, fee = ?
    WHERE id = ?
  `).run(durationMinutes, fee, record.id);
  
  if (record.spot_number) {
    db.prepare('UPDATE spot_status SET status = ? WHERE parking_lot_id = ? AND spot_number = ?')
      .run('available', parking_lot_id, record.spot_number);
  }
  
  res.json({ id: record.id, duration: durationMinutes, fee });
});

router.post('/pay', (req, res) => {
  const { record_id } = req.body;
  db.prepare('UPDATE entry_exit_records SET payment_status = ? WHERE id = ?')
    .run('paid', record_id);
  res.json({ success: true });
});

router.get('/verify/:lotId', (req, res) => {
  const lotId = req.params.lotId;
  
  const occupiedFromRecords = db.prepare(`
    SELECT COUNT(DISTINCT spot_number) as count
    FROM entry_exit_records 
    WHERE parking_lot_id = ? AND exit_time IS NULL AND spot_number IS NOT NULL
  `).get(lotId);
  
  const occupiedFromSpots = db.prepare(`
    SELECT COUNT(*) as count FROM spot_status 
    WHERE parking_lot_id = ? AND status = 'occupied'
  `).get(lotId);
  
  const mismatch = occupiedFromRecords.count !== occupiedFromSpots.count;
  
  res.json({
    occupied_records: occupiedFromRecords.count,
    occupied_spots: occupiedFromSpots.count,
    mismatch,
    recommendation: mismatch ? '建议手动核对车位状态' : '数据一致'
  });
});

export default router;
