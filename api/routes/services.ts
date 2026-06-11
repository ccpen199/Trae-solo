import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

const vipLounges = [
  { id: 'lounge-1', name: 'T2航站楼贵宾厅A区', airport: '南京禄口国际机场', location: 'T2航站楼3层', openTime: '06:00-22:00', amenities: ['免费餐饮', 'Wi-Fi', '淋浴间', '休息区'], maxDaily: 20, bookedToday: 8 },
  { id: 'lounge-2', name: 'T1航站楼贵宾厅B区', airport: '南京禄口国际机场', location: 'T1航站楼2层', openTime: '07:00-21:00', amenities: ['免费餐饮', 'Wi-Fi', '阅读区'], maxDaily: 15, bookedToday: 5 },
  { id: 'lounge-3', name: '国内出发贵宾厅', airport: '上海虹桥机场', location: 'T2航站楼VIP区', openTime: '06:00-23:00', amenities: ['免费餐饮', 'Wi-Fi', '商务中心', '淋浴间'], maxDaily: 25, bookedToday: 12 },
]

router.get('/bookings', (req: Request, res: Response): void => {
  try {
    const { memberId } = req.query
    let sql = `
      SELECT b.id, b.type, b.member_id, m.name as member_name,
             b.resource_id, b.resource_name, b.booking_date, b.booking_time,
             b.status, b.created_at
      FROM booking b
      LEFT JOIN member m ON b.member_id = m.id
    `
    const params: any[] = []

    if (memberId) {
      sql += ' WHERE b.member_id = ?'
      params.push(memberId)
    }
    sql += ' ORDER BY b.created_at DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const data = rows.map((r: any) => {
      const item: any = {
        id: r.id,
        type: r.type,
        memberId: r.member_id,
        memberName: r.member_name,
        resourceId: r.resource_id,
        resourceName: r.resource_name,
        bookingDate: r.booking_date,
        bookingTime: r.booking_time,
        status: r.status,
        appliedAt: r.created_at,
        processedAt: r.status !== 'pending' ? r.created_at : null,
        remarks: '',
      }
      if (r.type === 'train_ticket' && r.status === 'pending') {
        item.expectedWaitTime = '24小时内'
      }
      if (r.status === 'pending') {
        const created = new Date(r.created_at).getTime()
        const now = Date.now()
        const daysDiff = (now - created) / (1000 * 60 * 60 * 24)
        if (daysDiff > 2) {
          item.remarks = '预约超时，正在加急处理'
        }
      }
      return item
    })

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/bookings/:id/cancel', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const booking = db.prepare('SELECT * FROM booking WHERE id = ?').get(id) as any
    if (!booking) {
      res.status(404).json({ success: false, message: '预约记录不存在' })
      return
    }
    if (booking.type === 'train_ticket' && booking.status === 'confirmed') {
      res.status(400).json({ success: false, message: '已确认的车票无法取消' })
      return
    }
    db.prepare("UPDATE booking SET status = 'cancelled' WHERE id = ?").run(id)
    res.json({ success: true, message: '预约已取消' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/bookings/:id/track', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const booking = db.prepare('SELECT * FROM booking WHERE id = ?').get(id) as any
    if (!booking) {
      res.status(404).json({ success: false, message: '预约记录不存在' })
      return
    }

    const createdAt = booking.created_at
    const memberName = '会员张三'
    const timeline: any[] = []

    if (booking.type === 'vip_lounge') {
      timeline.push(
        { stage: '申请提交', status: 'done', time: createdAt, operator: memberName, remark: '' },
        { stage: '系统核验', status: 'done', time: createdAt, operator: '系统', remark: '身份核验通过，权益有效' },
      )
      if (booking.status === 'pending') {
        timeline.push(
          { stage: '服务商确认', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '预约完成', status: 'pending', time: null, operator: '', remark: '' },
        )
      } else if (booking.status === 'confirmed' || booking.status === 'completed') {
        timeline.push(
          { stage: '服务商确认', status: 'done', time: createdAt, operator: '服务商', remark: '贵宾厅已确认预留席位' },
          { stage: '预约完成', status: 'done', time: createdAt, operator: '系统', remark: booking.status === 'completed' ? '已使用服务' : '等待使用' },
        )
      } else if (booking.status === 'cancelled') {
        timeline.push(
          { stage: '服务商确认', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '预约取消', status: 'done', time: createdAt, operator: memberName, remark: '用户主动取消预约' },
        )
      }
    } else if (booking.type === 'train_ticket') {
      timeline.push(
        { stage: '申请提交', status: 'done', time: createdAt, operator: memberName, remark: '' },
        { stage: '系统核验', status: 'done', time: createdAt, operator: '系统', remark: '身份核验通过' },
      )
      if (booking.status === 'pending') {
        timeline.push(
          { stage: '工会审批', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '服务商确认', status: 'pending', time: null, operator: '', remark: '' },
        )
      } else if (booking.status === 'confirmed' || booking.status === 'completed') {
        timeline.push(
          { stage: '工会审批', status: 'done', time: createdAt, operator: '工会管理员', remark: '优先购票通道审批通过' },
          { stage: '出票完成', status: 'done', time: createdAt, operator: '服务商', remark: '购票成功，请凭身份证乘车' },
        )
      } else if (booking.status === 'cancelled') {
        timeline.push(
          { stage: '工会审批', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '申请取消', status: 'done', time: createdAt, operator: memberName, remark: '用户主动取消申请' },
        )
      }
    } else if (booking.type === 'health_checkup') {
      timeline.push(
        { stage: '申请提交', status: 'done', time: createdAt, operator: memberName, remark: '' },
        { stage: '系统核验', status: 'done', time: createdAt, operator: '系统', remark: '套餐名额充足' },
      )
      if (booking.status === 'pending') {
        timeline.push(
          { stage: '体检中心确认', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '预约完成', status: 'pending', time: null, operator: '', remark: '' },
        )
      } else if (booking.status === 'confirmed' || booking.status === 'completed') {
        timeline.push(
          { stage: '体检中心确认', status: 'done', time: createdAt, operator: '体检中心', remark: '预约时段已确认' },
          { stage: '预约完成', status: 'done', time: createdAt, operator: '系统', remark: booking.status === 'completed' ? '体检已完成' : '等待体检' },
        )
      } else if (booking.status === 'cancelled') {
        timeline.push(
          { stage: '体检中心确认', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '预约取消', status: 'done', time: createdAt, operator: memberName, remark: '用户主动取消' },
        )
      }
    } else if (booking.type === 'legal_consult') {
      timeline.push(
        { stage: '申请提交', status: 'done', time: createdAt, operator: memberName, remark: '' },
        { stage: '系统核验', status: 'done', time: createdAt, operator: '系统', remark: '律师时段可用' },
      )
      if (booking.status === 'pending') {
        timeline.push(
          { stage: '律师确认', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '预约完成', status: 'pending', time: null, operator: '', remark: '' },
        )
      } else if (booking.status === 'confirmed' || booking.status === 'completed') {
        timeline.push(
          { stage: '律师确认', status: 'done', time: createdAt, operator: '律师', remark: '已确认咨询安排' },
          { stage: '预约完成', status: 'done', time: createdAt, operator: '系统', remark: booking.status === 'completed' ? '咨询已完成' : '等待咨询' },
        )
      } else if (booking.status === 'cancelled') {
        timeline.push(
          { stage: '律师确认', status: 'pending', time: null, operator: '', remark: '' },
          { stage: '预约取消', status: 'done', time: createdAt, operator: memberName, remark: '用户主动取消' },
        )
      }
    }

    res.json({ success: true, data: timeline })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/vip-lounges', (_req: Request, res: Response): void => {
  res.json({ success: true, data: vipLounges })
})

router.post('/vip-lounges/book', (req: Request, res: Response): void => {
  try {
    const { memberId, loungeId, bookingDate, bookingTime } = req.body
    if (!memberId || !loungeId || !bookingDate) {
      res.status(400).json({ success: false, message: '请填写完整的预约信息' })
      return
    }

    const lounge = vipLounges.find(l => l.id === loungeId)
    if (!lounge) {
      res.status(404).json({ success: false, message: '贵宾厅不存在' })
      return
    }

    const id = `bk-${randomUUID().slice(0, 8)}`
    const resourceName = lounge.name || `贵宾厅预约 - ${loungeId}`
    db.prepare('INSERT INTO booking (id, member_id, type, resource_id, resource_name, booking_date, booking_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, memberId, 'vip_lounge', loungeId, resourceName, bookingDate, bookingTime || null, 'confirmed')

    res.json({ success: true, data: { id, loungeName: lounge.name }, message: '贵宾厅预约成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/train/requests', (req: Request, res: Response): void => {
  try {
    const { memberId } = req.query
    let sql = "SELECT * FROM booking WHERE type = 'train_ticket'"
    const params: any[] = []

    if (memberId) {
      sql += ' AND member_id = ?'
      params.push(memberId)
    }
    sql += ' ORDER BY created_at DESC'

    const bookings = db.prepare(sql).all(...params) as any[]
    const data = bookings.map(b => ({
      id: b.id,
      memberId: b.member_id,
      trainInfo: b.resource_name,
      resourceId: b.resource_id,
      travelDate: b.booking_date,
      status: b.status,
      createdAt: b.created_at,
    }))

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/train/request', (req: Request, res: Response): void => {
  try {
    const { memberId, fromStation, toStation, travelDate } = req.body
    if (!memberId || !fromStation || !toStation || !travelDate) {
      res.status(400).json({ success: false, message: '请填写完整的购票信息' })
      return
    }

    const id = `bk-${randomUUID().slice(0, 8)}`
    const resourceId = `train-${randomUUID()}`
    const resourceName = `${fromStation}→${toStation}`
    db.prepare('INSERT INTO booking (id, member_id, type, resource_id, resource_name, booking_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, memberId, 'train_ticket', resourceId, resourceName, travelDate, 'pending')

    res.json({ success: true, data: { id }, message: '购票申请已提交' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/train/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const booking = db.prepare("SELECT * FROM booking WHERE id = ? AND type = 'train_ticket'").get(id) as any
    if (!booking) {
      res.status(404).json({ success: false, message: '购票申请不存在' })
      return
    }

    db.prepare("UPDATE booking SET status = 'confirmed' WHERE id = ?").run(id)
    res.json({ success: true, message: '购票申请已通过' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

const healthPackages = [
  { id: 'hpkg-1', providerName: 'XX健康体检中心', name: '基础健康体检套餐', originalPrice: 680, groupPrice: 399, items: ['血常规', '尿常规', '肝功能', '肾功能', '心电图', '胸透'], enrolledCount: 45, maxCount: 100 },
  { id: 'hpkg-2', providerName: 'XX健康体检中心', name: '女性关爱体检套餐', originalPrice: 1280, groupPrice: 799, items: ['血常规', '尿常规', '肝功能', '乳腺超声', '妇科检查', '甲状腺功能'], enrolledCount: 28, maxCount: 50 },
  { id: 'hpkg-3', providerName: 'XX健康体检中心', name: '中老年深度体检套餐', originalPrice: 2580, groupPrice: 1599, items: ['血常规', '肿瘤标志物', '心脏彩超', '颈动脉超声', '骨密度', 'CT'], enrolledCount: 12, maxCount: 30 },
  { id: 'hpkg-4', providerName: 'YY健康管理公司', name: '职场精英体检套餐', originalPrice: 980, groupPrice: 599, items: ['血常规', '肝功能', '颈椎X光', '眼底检查', '心理评估'], enrolledCount: 60, maxCount: 80 },
]

router.get('/health-packages', (_req: Request, res: Response): void => {
  res.json({ success: true, data: healthPackages })
})

router.post('/health-packages/:id/enroll', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { memberId, bookingDate, bookingTime } = req.body
    if (!memberId || !bookingDate) {
      res.status(400).json({ success: false, message: '请填写完整的报名信息' })
      return
    }

    const pkg = healthPackages.find(p => p.id === id)
    if (!pkg) {
      res.status(404).json({ success: false, message: '体检套餐不存在' })
      return
    }
    if (pkg.enrolledCount >= pkg.maxCount) {
      res.status(400).json({ success: false, message: '报名人数已满' })
      return
    }

    const bkId = `bk-${randomUUID().slice(0, 8)}`
    db.prepare('INSERT INTO booking (id, member_id, type, resource_id, resource_name, booking_date, booking_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(bkId, memberId, 'health_checkup', id, pkg.name, bookingDate, bookingTime || '09:00', 'pending')

    res.json({ success: true, data: { id: bkId }, message: '体检报名成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

const lawyers = [
  { id: 'lawyer-1', name: '李建国', specialty: '劳动纠纷', experience: 15, rating: 4.9, firm: '正义律师事务所', availableSlots: ['2025-06-15 14:00', '2025-06-16 10:00', '2025-06-18 15:00'] },
  { id: 'lawyer-2', name: '王芳', specialty: '工伤赔偿', experience: 10, rating: 4.7, firm: '正义律师事务所', availableSlots: ['2025-06-15 10:00', '2025-06-17 14:00'] },
  { id: 'lawyer-3', name: '张伟', specialty: '合同纠纷', experience: 12, rating: 4.6, firm: '正义律师事务所', availableSlots: ['2025-06-16 14:00', '2025-06-19 10:00'] },
  { id: 'lawyer-4', name: '刘洋', specialty: '社保权益', experience: 8, rating: 4.5, firm: '正义律师事务所', availableSlots: ['2025-06-15 16:00', '2025-06-18 10:00', '2025-06-20 14:00'] },
]

router.get('/lawyers', (_req: Request, res: Response): void => {
  res.json({ success: true, data: lawyers })
})

router.post('/lawyers/:id/book', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { memberId, bookingDate, bookingTime } = req.body
    if (!memberId || !bookingDate || !bookingTime) {
      res.status(400).json({ success: false, message: '请填写完整的预约信息' })
      return
    }

    const lawyer = lawyers.find(l => l.id === id)
    if (!lawyer) {
      res.status(404).json({ success: false, message: '律师不存在' })
      return
    }

    const bkId = `bk-${randomUUID().slice(0, 8)}`
    db.prepare('INSERT INTO booking (id, member_id, type, resource_id, resource_name, booking_date, booking_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(bkId, memberId, 'legal_consult', id, `${lawyer.name}-${lawyer.specialty}`, bookingDate, bookingTime, 'pending')

    res.json({ success: true, data: { id: bkId, lawyerName: lawyer.name }, message: '法律咨询预约成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

export default router
