import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, status, reminder_type } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = 'SELECT * FROM reminders WHERE 1=1'
    const params: any[] = []
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    if (reminder_type) {
      query += ' AND reminder_type = ?'
      params.push(reminder_type)
    }
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY trigger_date ASC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const reminders = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: reminders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    
    const result = db.prepare(`
      INSERT INTO reminders (
        reminder_type, title_en, title_zh, message_en, message_zh,
        related_type, related_id, trigger_date, send_sms, send_email,
        recipient_id, recipient_email, recipient_phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.reminder_type, data.title_en, data.title_zh,
      data.message_en, data.message_zh,
      data.related_type, data.related_id, data.trigger_date,
      data.send_sms || 0, data.send_email || 1,
      data.recipient_id, data.recipient_email, data.recipient_phone,
      data.status || 'pending'
    )
    
    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, ...data }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/check-due', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const dueReminders = db.prepare(`
      SELECT * FROM reminders
      WHERE status = 'pending' AND trigger_date <= ?
    `).all(today)
    
    const sentReminders: number[] = []
    
    for (const reminder of dueReminders) {
      console.log(`Sending reminder: ${(reminder as any).title_en}`)
      
      if ((reminder as any).send_email) {
        console.log(`  -> Email sent to: ${(reminder as any).recipient_email}`)
      }
      if ((reminder as any).send_sms) {
        console.log(`  -> SMS sent to: ${(reminder as any).recipient_phone}`)
      }
      
      db.prepare(`
        UPDATE reminders SET sent = 1, sent_at = CURRENT_TIMESTAMP, status = 'sent'
        WHERE id = ?
      `).run((reminder as any).id)
      
      sentReminders.push((reminder as any).id)
      
      if ((reminder as any).recipient_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          (reminder as any).recipient_id,
          (reminder as any).reminder_type,
          (reminder as any).title_en,
          (reminder as any).message_en,
          (reminder as any).related_type,
          (reminder as any).related_id
        )
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${sentReminders.length} reminders`,
      sent_ids: sentReminders
    })
  } catch (e) {
    next(e)
  }
})

router.post('/generate-lease-renewal', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const leases = db.prepare(`
      SELECT l.*, p.title as property_title, p.address_en,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh,
             o.email as owner_email, o.phone as owner_phone,
             t.full_name_en as tenant_name_en
      FROM lease_agreements l
      JOIN properties p ON l.property_id = p.id
      JOIN owners o ON l.owner_id = o.id
      JOIN tenants t ON l.tenant_id = t.id
      WHERE l.status = 'active'
      AND l.end_date IS NOT NULL
      AND date(l.end_date) BETWEEN date('now') AND date('now', '+30 days')
      AND l.renewal_notice_sent = 0
    `).all()
    
    const created: number[] = []
    
    for (const lease of leases) {
      const triggerDate = new Date((lease as any).end_date)
      triggerDate.setDate(triggerDate.getDate() - 30)
      
      const result = db.prepare(`
        INSERT INTO reminders (
          reminder_type, title_en, title_zh, message_en, message_zh,
          related_type, related_id, trigger_date, send_sms, send_email,
          recipient_email, recipient_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'lease_renewal',
        'Lease Agreement Expiring Soon',
        '租约即将到期',
        `The lease agreement for ${(lease as any).property_title} will expire on ${(lease as any).end_date}. Please start the renewal process.`,
        `${(lease as any).property_title}的租约将于${(lease as any).end_date}到期，请启动续约流程。`,
        'lease_agreement',
        (lease as any).id,
        triggerDate.toISOString().split('T')[0],
        1, 1,
        (lease as any).owner_email,
        (lease as any).owner_phone,
        'pending'
      )
      
      created.push(result.lastInsertRowid as number)
      
      db.prepare(`
        UPDATE lease_agreements SET renewal_notice_sent = 1 WHERE id = ?
      `).run((lease as any).id)
    }
    
    res.json({
      success: true,
      message: `Generated ${created.length} lease renewal reminders`,
      reminder_ids: created
    })
  } catch (e) {
    next(e)
  }
})

router.post('/generate-loan-reminders', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const loans = db.prepare(`
      SELECT l.*, p.title as property_title,
             o.email as owner_email, o.phone as owner_phone
      FROM loan_contracts l
      JOIN properties p ON l.property_id = p.id
      JOIN owners o ON l.owner_id = o.id
      WHERE l.status = 'active'
      AND l.next_repayment_date IS NOT NULL
      AND date(l.next_repayment_date) BETWEEN date('now') AND date('now', '+7 days')
    `).all()
    
    const created: number[] = []
    
    for (const loan of loans) {
      const result = db.prepare(`
        INSERT INTO reminders (
          reminder_type, title_en, title_zh, message_en, message_zh,
          related_type, related_id, trigger_date, send_sms, send_email,
          recipient_email, recipient_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'loan_repayment',
        'Loan Repayment Due',
        '贷款还款日',
        `Your monthly loan repayment of $${(loan as any).monthly_repayment.toLocaleString()} for ${(loan as any).property_title} is due on ${(loan as any).next_repayment_date}.`,
        `您在${(loan as any).property_title}的月供$${(loan as any).monthly_repayment.toLocaleString()}将于${(loan as any).next_repayment_date}到期。`,
        'loan_contract',
        (loan as any).id,
        (loan as any).next_repayment_date,
        1, 1,
        (loan as any).owner_email,
        (loan as any).owner_phone,
        'pending'
      )
      
      created.push(result.lastInsertRowid as number)
    }
    
    res.json({
      success: true,
      message: `Generated ${created.length} loan repayment reminders`,
      reminder_ids: created
    })
  } catch (e) {
    next(e)
  }
})

router.post('/generate-tax-reminders', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const taxReturns = db.prepare(`
      SELECT t.*, o.email as owner_email, o.phone as owner_phone
      FROM tax_returns t
      JOIN owners o ON t.owner_id = o.id
      WHERE t.status IN ('pending', 'in_progress')
      AND date(t.due_date) BETWEEN date('now') AND date('now', '+30 days')
    `).all()
    
    const created: number[] = []
    
    for (const tax of taxReturns) {
      const triggerDate = new Date((tax as any).due_date)
      triggerDate.setDate(triggerDate.getDate() - 30)
      
      const result = db.prepare(`
        INSERT INTO reminders (
          reminder_type, title_en, title_zh, message_en, message_zh,
          related_type, related_id, trigger_date, send_sms, send_email,
          recipient_email, recipient_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'tax_filing',
        'Tax Return Due Date Reminder',
        '报税截止日提醒',
        `The ${(tax as any).financial_year} financial year tax return is due on ${(tax as any).due_date}. Please prepare your documents.`,
        `${(tax as any).financial_year}财年度的报税截止日为${(tax as any).due_date}，请准备好相关文件。`,
        'tax_return',
        (tax as any).id,
        triggerDate.toISOString().split('T')[0],
        1, 1,
        (tax as any).owner_email,
        (tax as any).owner_phone,
        'pending'
      )
      
      created.push(result.lastInsertRowid as number)
    }
    
    res.json({
      success: true,
      message: `Generated ${created.length} tax filing reminders`,
      reminder_ids: created
    })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: 'Reminder deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
