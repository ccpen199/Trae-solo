import db from '../db/index.js'
import type { Organizer, OrganizerApplication } from '../../shared/types.js'

export const organizerService = {
  async apply(userId: number, data: { companyName: string; license: string; contactName: string; contactPhone: string; documents: string[] }) {
    const existing = db.prepare('SELECT id FROM organizers WHERE user_id = ?').get(userId)
    if (existing) throw new Error('已有主办方账号')

    const orgResult = db
      .prepare('INSERT INTO organizers (user_id, company_name, license, contact_name, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, data.companyName, data.license, data.contactName, data.contactPhone, 'pending')

    const appResult = db
      .prepare(
        'INSERT INTO organizer_applications (organizer_id, company_name, license, contact_name, contact_phone, documents, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(orgResult.lastInsertRowid, data.companyName, data.license, data.contactName, data.contactPhone, JSON.stringify(data.documents), 'pending')

    return db.prepare('SELECT * FROM organizer_applications WHERE id = ?').get(appResult.lastInsertRowid) as OrganizerApplication
  },

  async getByUserId(userId: number) {
    const organizer = db.prepare('SELECT * FROM organizers WHERE user_id = ?').get(userId) as Organizer | undefined
    if (!organizer) return null

    const application = db.prepare('SELECT * FROM organizer_applications WHERE organizer_id = ? ORDER BY created_at DESC LIMIT 1').get(organizer.id)
    return { organizer, application }
  },

  async list(status?: string) {
    let sql = 'SELECT o.*, u.real_name, oa.status as app_status, oa.review_reason FROM organizers o JOIN users u ON o.user_id = u.id LEFT JOIN organizer_applications oa ON o.id = oa.organizer_id'
    const args: any[] = []
    if (status && status !== 'all') {
      sql += ' WHERE o.status = ?'
      args.push(status)
    }
    sql += ' GROUP BY o.id ORDER BY o.created_at DESC'
    return db.prepare(sql).all(...args)
  },

  async review(id: number, status: 'approved' | 'rejected', reason?: string) {
    const organizer = db.prepare('SELECT * FROM organizers WHERE id = ?').get(id) as Organizer | undefined
    if (!organizer) throw new Error('主办方不存在')

    db.prepare('UPDATE organizers SET status = ? WHERE id = ?').run(status, id)
    db.prepare('UPDATE organizer_applications SET status = ?, review_reason = ?, reviewed_at = datetime("now") WHERE organizer_id = ? ORDER BY id DESC LIMIT 1').run(status, reason || null, id)

    if (status === 'approved') {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('organizer', organizer.userId)
    }

    return db.prepare('SELECT * FROM organizers WHERE id = ?').get(id) as Organizer
  },
}
