import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

export function getCounselors() {
  const rows = db.prepare('SELECT * FROM counselors ORDER BY rating DESC').all() as any[]
  return rows.map(row => ({
    ...row,
    expertise_tags: JSON.parse(row.expertise_tags),
  }))
}

export function getCounselor(id: string) {
  const row = db.prepare('SELECT * FROM counselors WHERE id = ?').get(id) as any
  if (!row) return null
  return {
    ...row,
    expertise_tags: JSON.parse(row.expertise_tags),
  }
}

export function verifyCounselor(id: string, ocrStatus: string, dbMatchStatus: string) {
  const counselor = getCounselor(id)
  if (!counselor) return null

  db.prepare(`
    UPDATE counselors SET ocr_status = ?, db_match_status = ? WHERE id = ?
  `).run(ocrStatus, dbMatchStatus, id)

  return getCounselor(id)
}

export function getTimeSlots(counselorId: string) {
  return db.prepare('SELECT * FROM time_slots WHERE counselor_id = ? AND is_available = 1 ORDER BY slot_date, start_time').all(counselorId)
}

export function addTimeSlot(counselorId: string, slotDate: string, startTime: string, endTime: string) {
  const id = uuidv4()
  db.prepare(`
    INSERT INTO time_slots (id, counselor_id, slot_date, start_time, end_time)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, counselorId, slotDate, startTime, endTime)
  return { id, counselor_id: counselorId, slot_date: slotDate, start_time: startTime, end_time: endTime, is_available: 1 }
}

export function bookTimeSlot(slotId: string) {
  return db.prepare('UPDATE time_slots SET is_available = 0 WHERE id = ? AND is_available = 1').run(slotId).changes > 0
}

export function getPendingVerifications() {
  const rows = db.prepare("SELECT * FROM counselors WHERE ocr_status = 'pending' OR db_match_status = 'pending'").all() as any[]
  return rows.map(row => ({
    ...row,
    expertise_tags: JSON.parse(row.expertise_tags),
  }))
}
