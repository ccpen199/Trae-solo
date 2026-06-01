const db = require('../models/database');

exports.getAllHotels = (req, res) => {
  try {
    const hotels = db.prepare('SELECT * FROM hotels ORDER BY created_at DESC').all();
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createHotel = (req, res) => {
  try {
    const { name, address, contact, phone } = req.body;
    const result = db.prepare(
      'INSERT INTO hotels (name, address, contact, phone) VALUES (?, ?, ?, ?)'
    ).run(name, address, contact, phone);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateHotel = (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact, phone } = req.body;
    db.prepare(
      'UPDATE hotels SET name = ?, address = ?, contact = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, address, contact, phone, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteHotel = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM hotels WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRoomTypes = (req, res) => {
  try {
    const { hotelId } = req.params;
    const roomTypes = db.prepare(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id WHERE rt.hotel_id = ? ORDER BY rt.created_at DESC'
    ).all(hotelId);
    res.json({ success: true, data: roomTypes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createRoomType = (req, res) => {
  try {
    const { hotel_id, name, beds, description } = req.body;
    
    if (beds < 1 || beds > 3) {
      return res.status(400).json({ success: false, error: '床位数必须在1-3之间' });
    }
    
    const result = db.prepare(
      'INSERT INTO room_types (hotel_id, name, beds, description) VALUES (?, ?, ?, ?)'
    ).run(hotel_id, name, beds, description);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
