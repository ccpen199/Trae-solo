import express from 'express';
import db from '../db/index.js';
import { authenticate, requireRole } from '../middleware/oauth.js';
import { encrypt, decrypt, maskPhone, maskIdCard } from '../utils/encryption.js';

const router = express.Router();

router.get('/profile', authenticate, requireRole('rider', 'admin'), (req, res) => {
  const user = db.prepare(`SELECT id, username, real_name, phone, avatar, status FROM users WHERE id = ?`).get(req.user.id);
  const verification = db.prepare(`SELECT * FROM rider_verifications WHERE user_id = ?`).get(req.user.id);
  const vehicle = db.prepare(`SELECT * FROM rider_vehicles WHERE user_id = ?`).get(req.user.id);
  const stats = db.prepare(`SELECT * FROM rider_stats WHERE user_id = ?`).get(req.user.id);

  res.json({
    user: {
      ...user,
      phone: maskPhone(user.phone)
    },
    verification: verification ? {
      ...verification,
      id_card_number: maskIdCard(verification.id_card_number)
    } : null,
    vehicle,
    stats
  });
});

router.post('/verification', authenticate, requireRole('rider'), (req, res) => {
  const { id_card_number, id_card_front, id_card_back, face_photo } = req.body;

  if (!id_card_number || !id_card_front || !id_card_back || !face_photo) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const encryptedIdCard = encrypt(id_card_number);

  const existing = db.prepare(`SELECT id FROM rider_verifications WHERE user_id = ?`).get(req.user.id);
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    db.prepare(`UPDATE rider_verifications SET id_card_number = ?, id_card_front = ?, id_card_back = ?, face_photo = ?, verification_status = 'pending', updated_at = ? WHERE user_id = ?`).run(
      encryptedIdCard, id_card_front, id_card_back, face_photo, now, req.user.id
    );
  } else {
    db.prepare(`INSERT INTO rider_verifications (user_id, id_card_number, id_card_front, id_card_back, face_photo) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, encryptedIdCard, id_card_front, id_card_back, face_photo
    );
  }

  db.prepare(`INSERT INTO system_logs (user_id, action, target_type, request_id) VALUES (?, 'submit_verification', 'rider_verification', ?)`).run(
    req.user.id, req.requestId
  );

  res.json({ success: true, message: 'Verification submitted' });
});

router.post('/vehicle', authenticate, requireRole('rider'), (req, res) => {
  const { vehicle_type, plate_number, vehicle_license, insurance_certificate } = req.body;

  if (!vehicle_type || !plate_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const existing = db.prepare(`SELECT id FROM rider_vehicles WHERE user_id = ?`).get(req.user.id);
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    db.prepare(`UPDATE rider_vehicles SET vehicle_type = ?, plate_number = ?, vehicle_license = ?, insurance_certificate = ?, binding_status = 'pending', updated_at = ? WHERE user_id = ?`).run(
      vehicle_type, plate_number, vehicle_license, insurance_certificate, now, req.user.id
    );
  } else {
    db.prepare(`INSERT INTO rider_vehicles (user_id, vehicle_type, plate_number, vehicle_license, insurance_certificate) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, vehicle_type, plate_number, vehicle_license, insurance_certificate
    );
  }

  db.prepare(`INSERT INTO system_logs (user_id, action, target_type, request_id) VALUES (?, 'submit_vehicle', 'rider_vehicle', ?)`).run(
    req.user.id, req.requestId
  );

  res.json({ success: true, message: 'Vehicle binding submitted' });
});

router.get('/verification', authenticate, requireRole('rider'), (req, res) => {
  const verification = db.prepare(`SELECT * FROM rider_verifications WHERE user_id = ?`).get(req.user.id);
  if (!verification) return res.json({ status: 'none' });

  res.json({
    ...verification,
    id_card_number: maskIdCard(verification.id_card_number)
  });
});

router.get('/vehicle', authenticate, requireRole('rider'), (req, res) => {
  const vehicle = db.prepare(`SELECT * FROM rider_vehicles WHERE user_id = ?`).get(req.user.id);
  res.json(vehicle || { status: 'none' });
});

export default router;
