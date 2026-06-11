import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { successResponse, errorResponse, generateRequestNo, paginate } from '../utils/common.js';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, type, keyword } = req.query as any;

  let sql = 'SELECT * FROM venues WHERE status = 1';
  const params: any[] = [];
  const conditions: string[] = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (keyword) {
    conditions.push('(name LIKE ? OR address LIKE ? OR description LIKE ?)');
    const keywordParam = `%${keyword}%`;
    params.push(keywordParam, keywordParam, keywordParam);
  }

  if (conditions.length > 0) {
    sql += ' AND ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY id ASC';

  const venues = db.prepare(sql).all(...params);
  
  const result = paginate(venues.map((v: any) => ({
    ...v,
    images: v.images ? JSON.parse(v.images) : [],
    facilities: v.facilities ? JSON.parse(v.facilities) : []
  })), parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const venue: any = db.prepare('SELECT * FROM venues WHERE id = ? AND status = 1').get(id);

  if (!venue) {
    return errorResponse(res, '场馆不存在', 404);
  }

  if (venue.images) {
    venue.images = JSON.parse(venue.images);
  }
  if (venue.facilities) {
    venue.facilities = JSON.parse(venue.facilities);
  }

  const today = new Date().toISOString().split('T')[0];
  const bookings = db.prepare(
    'SELECT booking_date, time_slot, status FROM venue_bookings WHERE venue_id = ? AND booking_date >= ?'
  ).all(id, today);

  venue.booking_info = {
    total_bookings: bookings.length,
    today_bookings: bookings.filter((b: any) => b.booking_date === today).length,
    upcoming_bookings: bookings
  };

  return successResponse(res, venue);
});

router.get('/:id/available-slots', (req, res) => {
  const { id } = req.params;
  const { date } = req.query as any;

  const venue = db.prepare('SELECT * FROM venues WHERE id = ? AND status = 1').get(id);
  if (!venue) {
    return errorResponse(res, '场馆不存在', 404);
  }

  const bookingDate = date || new Date().toISOString().split('T')[0];

  const timeSlots = generateTimeSlots(venue);

  const bookedSlots = db.prepare(
    'SELECT time_slot FROM venue_bookings WHERE venue_id = ? AND booking_date = ? AND status != "cancelled"'
  ).all(id, bookingDate).map((b: any) => b.time_slot);

  const availableSlots = timeSlots.map((slot: any) => ({
    ...slot,
    available: !bookedSlots.includes(slot.slot),
    booked_count: bookedSlots.filter((s: string) => s === slot.slot).length
  }));

  return successResponse(res, {
    venue_id: id,
    booking_date: bookingDate,
    open_time: (venue as any).open_time,
    close_time: (venue as any).close_time,
    slots: availableSlots
  });
});

function generateTimeSlots(venue: any) {
  const slots = [];
  const openTime = venue.open_time || '09:00';
  const closeTime = venue.close_time || '18:00';
  
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    currentMin += 60;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
    const end = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push({
      slot: `${start}-${end}`,
      start_time: start,
      end_time: end,
      capacity: venue.capacity || 50
    });
  }
  
  return slots;
}

router.post('/book', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { venue_id, booking_date, time_slot, purpose, people_count, contact_phone } = req.body;

  if (!venue_id || !booking_date || !time_slot) {
    return errorResponse(res, '场馆ID、预约日期和时间段不能为空');
  }

  const venue = db.prepare('SELECT * FROM venues WHERE id = ? AND status = 1').get(venue_id);
  if (!venue) {
    return errorResponse(res, '场馆不存在');
  }

  const existingBooking = db.prepare(
    'SELECT * FROM venue_bookings WHERE venue_id = ? AND booking_date = ? AND time_slot = ? AND status != "cancelled"'
  ).get(venue_id, booking_date, time_slot);

  if (existingBooking) {
    return errorResponse(res, '该时段已被预约');
  }

  const bookingNo = generateRequestNo('YY');

  const result = db.prepare(
    `INSERT INTO venue_bookings 
     (booking_no, user_id, venue_id, booking_date, time_slot, purpose, people_count, contact_phone) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    bookingNo,
    userId,
    venue_id,
    booking_date,
    time_slot,
    purpose || null,
    people_count || null,
    contact_phone || null
  );

  const booking = db.prepare(
    `SELECT vb.*, v.name as venue_name, v.address as venue_address, v.open_time, v.close_time
     FROM venue_bookings vb 
     LEFT JOIN venues v ON vb.venue_id = v.id 
     WHERE vb.id = ?`
  ).get(result.lastInsertRowid);

  return successResponse(res, booking, '预约成功');
});

router.get('/bookings/list', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, status } = req.query as any;

  let sql = `SELECT vb.*, v.name as venue_name, v.address as venue_address, v.images as venue_images
             FROM venue_bookings vb 
             LEFT JOIN venues v ON vb.venue_id = v.id 
             WHERE vb.user_id = ?`;
  const params: any[] = [userId];

  if (status) {
    sql += ' AND vb.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY vb.created_at DESC';

  const bookings = db.prepare(sql).all(...params);
  const result = paginate(bookings.map((b: any) => ({
    ...b,
    venue_images: b.venue_images ? JSON.parse(b.venue_images) : []
  })), parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/bookings/:booking_no', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { booking_no } = req.params;

  const booking: any = db.prepare(
    `SELECT vb.*, v.name as venue_name, v.address as venue_address, v.contact_phone as venue_contact,
            v.open_time, v.close_time, v.images as venue_images, v.facilities as venue_facilities
     FROM venue_bookings vb 
     LEFT JOIN venues v ON vb.venue_id = v.id 
     WHERE vb.booking_no = ? AND vb.user_id = ?`
  ).get(booking_no, userId);

  if (!booking) {
    return errorResponse(res, '预约记录不存在', 404);
  }

  if (booking.venue_images) {
    booking.venue_images = JSON.parse(booking.venue_images);
  }
  if (booking.venue_facilities) {
    booking.venue_facilities = JSON.parse(booking.venue_facilities);
  }

  return successResponse(res, booking);
});

router.put('/bookings/:booking_no/cancel', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { booking_no } = req.params;

  const booking = db.prepare(
    'SELECT * FROM venue_bookings WHERE booking_no = ? AND user_id = ?'
  ).get(booking_no, userId);

  if (!booking) {
    return errorResponse(res, '预约记录不存在', 404);
  }

  if (booking.status === 'cancelled') {
    return errorResponse(res, '该预约已取消');
  }

  if (booking.status === 'completed') {
    return errorResponse(res, '已完成的预约无法取消');
  }

  db.prepare(
    'UPDATE venue_bookings SET status = ?, updated_at = datetime(\"now\") WHERE booking_no = ?'
  ).run('cancelled', booking_no);

  return successResponse(res, { booking_no, status: 'cancelled' }, '预约已取消');
});

export default router;
