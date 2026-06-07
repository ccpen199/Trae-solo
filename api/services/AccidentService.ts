import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import type { AccidentRecord } from '../db/index.js'

export interface InvolvedParty {
  name: string
  idCard: string
  phone: string
  plateNumber?: string
  vehicleType?: string
  insuranceCompany?: string
  insurancePolicy?: string
}

export interface NegotiationMessage {
  id: string
  senderId: number
  senderName: string
  senderRole: 'reporter' | 'party' | 'insurer' | 'officer'
  content: string
  timestamp: string
  attachments?: string[]
}

export interface CreateAccidentRequest {
  reporterId: number
  accidentTime: string
  location: string
  description: string
  involvedParties: InvolvedParty[]
  evidenceFiles: string[]
}

export interface AccidentListQuery {
  reporterId?: number
  status?: string
  page?: number
  pageSize?: number
}

export interface AccidentListResult {
  list: AccidentRecord[]
  total: number
  page: number
  pageSize: number
}

export interface AddNegotiationMessageRequest {
  accidentId: number
  senderId: number
  senderName: string
  senderRole: 'reporter' | 'party' | 'insurer' | 'officer'
  content: string
  attachments?: string[]
}

export default class AccidentService {
  private db: DatabaseType

  constructor(db: DatabaseType) {
    this.db = db
  }

  async createAccident(req: CreateAccidentRequest): Promise<AccidentRecord> {
    if (req.involvedParties.length < 2) {
      throw new Error('事故至少需要涉及两方')
    }

    if (req.evidenceFiles.length === 0) {
      throw new Error('至少需要上传一张事故现场照片')
    }

    const result = this.db.prepare(`
      INSERT INTO accident_records (
        reporter_id, accident_time, location, description,
        involved_parties, evidence_files, status, negotiation_messages
      ) VALUES (?, ?, ?, ?, ?, ?, 'negotiating', '[]')
    `).run(
      req.reporterId,
      req.accidentTime,
      req.location,
      req.description,
      JSON.stringify(req.involvedParties),
      JSON.stringify(req.evidenceFiles),
    )

    const accidentId = result.lastInsertRowid as number

    const reporter = this.db.prepare('SELECT name FROM users WHERE id = ?').get(req.reporterId) as { name: string } | undefined
    if (reporter) {
      await this.addNegotiationMessage({
        accidentId,
        senderId: req.reporterId,
        senderName: reporter.name,
        senderRole: 'reporter',
        content: '事故已报案，等待各方协商处理。请所有相关方查看事故详情并确认责任划分。',
      })
    }

    return this.getDetail(accidentId)
  }

  getList(query: AccidentListQuery): AccidentListResult {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (query.reporterId !== undefined) {
      conditions.push('reporter_id = ?')
      params.push(query.reporterId)
    }

    if (query.status) {
      conditions.push('status = ?')
      params.push(query.status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const countResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM accident_records ${whereClause}
    `).get(...params) as { total: number }

    const list = this.db.prepare(`
      SELECT * FROM accident_records ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as AccidentRecord[]

    return {
      list,
      total: countResult.total,
      page,
      pageSize,
    }
  }

  getDetail(id: number): AccidentRecord {
    const accident = this.db.prepare('SELECT * FROM accident_records WHERE id = ?').get(id) as AccidentRecord | undefined

    if (!accident) {
      throw new Error('事故记录不存在')
    }

    return accident
  }

  generateLiability(id: number): {
    liability: string
    details: {
      party: InvolvedParty
      responsibility: number
      description: string
    }[]
  } {
    const accident = this.getDetail(id)
    const involvedParties = JSON.parse(accident.involved_parties) as InvolvedParty[]

    const description = accident.description.toLowerCase()
    const liabilityDetails: { party: InvolvedParty; responsibility: number; description: string }[] = []

    const violationKeywords = {
      闯红灯: ['闯红灯', '冲红灯', '红灯'],
      追尾: ['追尾', '后车', '未保持安全距离'],
      变道: ['变道', '并线', '超车'],
      逆行: ['逆行', '逆向行驶'],
      超速: ['超速', '速度过快'],
      酒驾: ['酒驾', '醉驾', '饮酒'],
      闯红灯优先: ['闯红灯', '冲红灯'],
    }

    let totalResponsibility = 0
    involvedParties.forEach((party, index) => {
      let responsibility = 0
      let reasons: string[] = []

      Object.entries(violationKeywords).forEach(([violation, keywords]) => {
        if (keywords.some(keyword => description.includes(keyword))) {
          if (index === 0) {
            responsibility += 30
            reasons.push(`涉嫌${violation}`)
          }
        }
      })

      if (responsibility === 0) {
        responsibility = index === 0 ? 50 : 50
        reasons.push('根据事故描述，双方负同等责任')
      }

      totalResponsibility += responsibility

      liabilityDetails.push({
        party,
        responsibility,
        description: reasons.join('；'),
      })
    })

    if (totalResponsibility !== 100) {
      const diff = 100 - totalResponsibility
      liabilityDetails[0].responsibility += diff
    }

    let liabilityResult = ''
    const primaryParty = liabilityDetails.find(d => d.responsibility >= 70)
    const equalParties = liabilityDetails.filter(d => d.responsibility === 50)

    if (primaryParty) {
      liabilityResult = `${primaryParty.party.name} 负主要责任（${primaryParty.responsibility}%），${liabilityDetails.filter(d => d !== primaryParty).map(d => `${d.party.name} 负次要责任（${d.responsibility}%）`).join('，')}`
    } else if (equalParties.length >= 2) {
      liabilityResult = `双方负同等责任，各承担50%责任`
    } else {
      liabilityResult = liabilityDetails.map(d => `${d.party.name} 承担 ${d.responsibility}% 责任`).join('，')
    }

    this.db.prepare(`
      UPDATE accident_records 
      SET liability_result = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(liabilityResult, id)

    return {
      liability: liabilityResult,
      details: liabilityDetails,
    }
  }

  async addNegotiationMessage(req: AddNegotiationMessageRequest): Promise<NegotiationMessage[]> {
    const accident = this.getDetail(req.accidentId)

    if (accident.status === 'closed') {
      throw new Error('该事故已结案，无法添加协商消息')
    }

    const messages = JSON.parse(accident.negotiation_messages) as NegotiationMessage[]

    const newMessage: NegotiationMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId: req.senderId,
      senderName: req.senderName,
      senderRole: req.senderRole,
      content: req.content,
      timestamp: new Date().toISOString(),
      attachments: req.attachments,
    }

    messages.push(newMessage)

    this.db.prepare(`
      UPDATE accident_records 
      SET negotiation_messages = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(messages), req.accidentId)

    return messages
  }

  getNegotiationMessages(accidentId: number): NegotiationMessage[] {
    const accident = this.getDetail(accidentId)
    return JSON.parse(accident.negotiation_messages) as NegotiationMessage[]
  }

  async confirmLiability(id: number, confirmerId: number): Promise<AccidentRecord> {
    const accident = this.getDetail(id)

    if (!accident.liability_result) {
      throw new Error('请先生成责任认定书')
    }

    if (accident.status === 'closed') {
      throw new Error('该事故已结案')
    }

    this.db.prepare(`
      UPDATE accident_records 
      SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id)

    const confirmer = this.db.prepare('SELECT name FROM users WHERE id = ?').get(confirmerId) as { name: string } | undefined
    if (confirmer) {
      await this.addNegotiationMessage({
        accidentId: id,
        senderId: confirmerId,
        senderName: confirmer.name,
        senderRole: 'officer',
        content: `责任认定已确认。${accident.liability_result}`,
      })
    }

    return this.getDetail(id)
  }

  async closeAccident(id: number, closerId: number, closeReason: string): Promise<AccidentRecord> {
    const accident = this.getDetail(id)

    if (accident.status !== 'confirmed') {
      throw new Error('只有已确认责任的事故才能结案')
    }

    this.db.prepare(`
      UPDATE accident_records 
      SET status = 'closed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id)

    const closer = this.db.prepare('SELECT name FROM users WHERE id = ?').get(closerId) as { name: string } | undefined
    if (closer) {
      await this.addNegotiationMessage({
        accidentId: id,
        senderId: closerId,
        senderName: closer.name,
        senderRole: 'officer',
        content: `事故已结案。结案原因：${closeReason}`,
      })
    }

    return this.getDetail(id)
  }

  getAccidentStats(reporterId?: number): {
    total: number
    pending: number
    negotiating: number
    confirmed: number
    closed: number
  } {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (reporterId !== undefined) {
      conditions.push('reporter_id = ?')
      params.push(reporterId)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'negotiating' THEN 1 ELSE 0 END) as negotiating,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM accident_records ${whereClause}
    `).get(...params) as {
      total: number
      pending: number
      negotiating: number
      confirmed: number
      closed: number
    }

    return {
      total: stats.total || 0,
      pending: stats.pending || 0,
      negotiating: stats.negotiating || 0,
      confirmed: stats.confirmed || 0,
      closed: stats.closed || 0,
    }
  }
}
