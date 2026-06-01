import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

router.get('/check-conflict', (req, res) => {
  const { photographer_id, date } = req.query;
  if (!photographer_id || !date) {
    return res.status(400).json({ success: false, message: 'photographer_id 和 date 参数必填' });
  }

  const scheduleRow = db.prepare(
    'SELECT * FROM photographer_schedule WHERE photographer_id = ? AND date = ?'
  ).get(photographer_id, date) as { status: string; booking_id: number | null } | undefined;

  const existingBooking = db.prepare(`
    SELECT * FROM bookings
    WHERE photographer_id = ? AND shoot_date = ? AND status NOT IN ('cancelled', 'completed')
  `).get(photographer_id, date) as { id: number; client_name: string; status: string } | undefined;

  const conflict = !!(scheduleRow?.status === 'booked' || existingBooking);

  res.json({
    success: true,
    data: {
      conflict,
      existingBooking: existingBooking || null,
      scheduleStatus: scheduleRow?.status || null,
    },
  });
});

router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT b.*, p.name AS photographer_name, p.style AS photographer_style
    FROM bookings b
    LEFT JOIN photographers p ON p.id = b.photographer_id
    ORDER BY b.shoot_date DESC, b.created_at DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.get('/:id', (req, res) => {
  const booking = db.prepare(`
    SELECT b.*, p.name AS photographer_name, p.style AS photographer_style
    FROM bookings b
    LEFT JOIN photographers p ON p.id = b.photographer_id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: '预约不存在' });
  }
  res.json({ success: true, data: booking });
});

router.post('/', (req, res) => {
  const {
    client_name, client_phone, client_email, photographer_id,
    shoot_type, shoot_date, shoot_time, location,
    people_count, requirements, budget, notes,
  } = req.body ?? {};

  if (!client_name || !shoot_date) {
    return res.status(400).json({ success: false, message: '客户姓名和拍摄日期不能为空' });
  }

  if (photographer_id) {
    const scheduleRow = db.prepare(
      'SELECT * FROM photographer_schedule WHERE photographer_id = ? AND date = ?'
    ).get(photographer_id, shoot_date) as { status: string } | undefined;

    if (scheduleRow?.status === 'booked') {
      return res.status(409).json({ success: false, message: '该摄影师此日期已有预约' });
    }

    const conflictingBooking = db.prepare(`
      SELECT * FROM bookings
      WHERE photographer_id = ? AND shoot_date = ? AND status NOT IN ('cancelled', 'completed')
    `).get(photographer_id, shoot_date);

    if (conflictingBooking) {
      return res.status(409).json({ success: false, message: '该摄影师此日期已有预约' });
    }
  }

  const result = db.prepare(`
    INSERT INTO bookings (client_name, client_phone, client_email, photographer_id, shoot_type, shoot_date, shoot_time, location, people_count, requirements, budget, status, notes)
    VALUES (@client_name, @client_phone, @client_email, @photographer_id, @shoot_type, @shoot_date, @shoot_time, @location, @people_count, @requirements, @budget, @status, @notes)
  `).run({
    client_name,
    client_phone: client_phone || null,
    client_email: client_email || null,
    photographer_id: photographer_id || null,
    shoot_type: shoot_type || null,
    shoot_date,
    shoot_time: shoot_time || null,
    location: location || null,
    people_count: people_count || 1,
    requirements: requirements || null,
    budget: budget ? Number(budget) : null,
    status: 'pending',
    notes: notes || null,
  });

  const bookingId = Number(result.lastInsertRowid);

  if (photographer_id) {
    db.prepare(`
      INSERT INTO photographer_schedule (photographer_id, date, status, booking_id)
      VALUES (@photographer_id, @date, 'booked', @booking_id)
      ON CONFLICT(photographer_id, date) DO UPDATE SET status = 'booked', booking_id = @booking_id
    `).run({ photographer_id: Number(photographer_id), date: shoot_date, booking_id: bookingId });
  }

  const created = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  res.status(201).json({ success: true, data: created });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as {
    id: number;
    photographer_id: number | null;
    shoot_date: string;
    status: string;
  } | undefined;

  if (!existing) {
    return res.status(404).json({ success: false, message: '预约不存在' });
  }

  const { status, shoot_date, shoot_time, location, people_count, requirements, budget, notes } = req.body ?? {};

  if (status === 'cancelled') {
    if (existing.photographer_id) {
      db.prepare(`
        UPDATE photographer_schedule SET status = 'available', booking_id = NULL
        WHERE photographer_id = ? AND date = ?
      `).run(existing.photographer_id, existing.shoot_date);
    }
  }

  if (status === 'rescheduled' && shoot_date && shoot_date !== existing.shoot_date) {
    if (existing.photographer_id) {
      db.prepare(`
        UPDATE photographer_schedule SET status = 'available', booking_id = NULL
        WHERE photographer_id = ? AND date = ?
      `).run(existing.photographer_id, existing.shoot_date);

      db.prepare(`
        INSERT INTO photographer_schedule (photographer_id, date, status, booking_id)
        VALUES (@photographer_id, @date, 'booked', @booking_id)
        ON CONFLICT(photographer_id, date) DO UPDATE SET status = 'booked', booking_id = @booking_id
      `).run({ photographer_id: existing.photographer_id, date: shoot_date, booking_id: existing.id });

      const relatedOrder = db.prepare('SELECT * FROM orders WHERE booking_id = ?').get(id) as {
        id: number;
        reschedule_count: number;
      } | undefined;
      if (relatedOrder) {
        db.prepare('UPDATE orders SET reschedule_count = reschedule_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(relatedOrder.id);
      }
    }
  }

  if (status === 'confirmed' && existing.photographer_id) {
    db.prepare(`
      INSERT INTO photographer_schedule (photographer_id, date, status, booking_id)
      VALUES (@photographer_id, @date, 'booked', @booking_id)
      ON CONFLICT(photographer_id, date) DO UPDATE SET status = 'booked', booking_id = @booking_id
    `).run({ photographer_id: existing.photographer_id, date: existing.shoot_date, booking_id: existing.id });
  }

  db.prepare(`
    UPDATE bookings SET
      shoot_date = COALESCE(@shoot_date, shoot_date),
      shoot_time = COALESCE(@shoot_time, shoot_time),
      location = COALESCE(@location, location),
      people_count = COALESCE(@people_count, people_count),
      requirements = COALESCE(@requirements, requirements),
      budget = COALESCE(@budget, budget),
      notes = COALESCE(@notes, notes),
      status = COALESCE(@status, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    shoot_date: shoot_date ?? null,
    shoot_time: shoot_time ?? null,
    location: location ?? null,
    people_count: people_count ?? null,
    requirements: requirements ?? null,
    budget: budget != null ? Number(budget) : null,
    notes: notes ?? null,
    status: status ?? null,
  });

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

export default router;
