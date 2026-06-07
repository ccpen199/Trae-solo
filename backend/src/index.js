import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(__dirname, '../.env') })

import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import db from './db.js'
import { matchLawyers } from './triage.js'
import { generateDocument, validateFormat, detectConflicts } from './documents.js'

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 58996
const HOST = process.env.API_HOST || '127.0.0.1'

app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

const audit = (action, entityType, entityId, operator, details, req) => {
  try {
    const ip = req?.ip || '127.0.0.1'
    db.prepare('INSERT INTO audit_logs (action, entity_type, entity_id, operator, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(action, entityType, entityId, operator, JSON.stringify(details), ip)
  } catch (e) {}
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/stats', (req, res) => {
  const lawyers = db.prepare('SELECT COUNT(*) as cnt FROM lawyers').get().cnt
  const consultations = db.prepare('SELECT COUNT(*) as cnt FROM consultations').get().cnt
  const contracts = db.prepare('SELECT COUNT(*) as cnt FROM contracts').get().cnt
  const docs = db.prepare('SELECT COUNT(*) as cnt FROM generated_documents').get().cnt
  res.json({ lawyers, consultations, contracts, documents: docs })
})

app.get('/api/lawyers', (req, res) => {
  const lawyers = db.prepare(`
    SELECT l.*, json_group_array(json_object('category', ls.category, 'weight', ls.weight)) as specialties_json
    FROM lawyers l
    LEFT JOIN lawyer_specialties ls ON l.id = ls.lawyer_id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).all().map(l => ({
    ...l,
    specialties: JSON.parse(l.specialties_json || '[]').filter(s => s.category)
  }))
  res.json(lawyers)
})

app.get('/api/lawyers/:id', (req, res) => {
  const lawyer = db.prepare(`
    SELECT l.*, json_group_array(json_object('category', ls.category, 'weight', ls.weight)) as specialties_json
    FROM lawyers l
    LEFT JOIN lawyer_specialties ls ON l.id = ls.lawyer_id
    WHERE l.id = ?
    GROUP BY l.id
  `).get(req.params.id)
  if (!lawyer) return res.status(404).json({ error: 'Not found' })
  lawyer.specialties = JSON.parse(lawyer.specialties_json || '[]').filter(s => s.category)
  res.json(lawyer)
})

app.post('/api/lawyers', (req, res) => {
  const { name, license_number, practice_years, specialties = [] } = req.body
  const info = db.prepare('INSERT INTO lawyers (name, license_number, license_verified, practice_years) VALUES (?, ?, 1, ?)')
    .run(name, license_number, practice_years || 0)
  const lawyerId = info.lastInsertRowid
  for (const s of specialties) {
    db.prepare('INSERT INTO lawyer_specialties (lawyer_id, category, weight) VALUES (?, ?, ?)')
      .run(lawyerId, s.category, s.weight || 1.0)
  }
  audit('CREATE', 'lawyer', lawyerId, 'admin', { name }, req)
  res.json({ id: lawyerId, name })
})

app.get('/api/consultations', (req, res) => {
  const list = db.prepare('SELECT * FROM consultations ORDER BY created_at DESC').all()
  res.json(list)
})

app.get('/api/consultations/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id)
  if (!c) return res.status(404).json({ error: 'Not found' })
  if (c.matched_lawyers) {
    try { c.matched_lawyers = JSON.parse(c.matched_lawyers) } catch (e) {}
  }
  res.json(c)
})

app.post('/api/consultations', (req, res) => {
  const { title, content, urgency, client_name, client_contact } = req.body
  const triageResult = matchLawyers(content, 3)
  const evidenceHash = crypto.createHash('sha256').update(content).digest('hex')
  
  const info = db.prepare(`
    INSERT INTO consultations (title, content, case_category, case_code, urgency, evidence_hashes, status, matched_lawyers, client_name, client_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, content,
    triageResult.analysis.primaryCategory,
    triageResult.caseCode,
    urgency || 'normal',
    evidenceHash,
    'matched',
    JSON.stringify(triageResult.matchedLawyers),
    client_name,
    client_contact
  )
  
  audit('CREATE', 'consultation', info.lastInsertRowid, 'client', { title, caseCode: triageResult.caseCode }, req)
  
  res.json({
    id: info.lastInsertRowid,
    analysis: triageResult.analysis,
    caseCode: triageResult.caseCode,
    matchedLawyers: triageResult.matchedLawyers
  })
})

app.post('/api/triage', (req, res) => {
  const { content } = req.body
  const result = matchLawyers(content, 3)
  res.json(result)
})

app.get('/api/contracts', (req, res) => {
  const list = db.prepare(`
    SELECT c.*, l.name as lawyer_name
    FROM contracts c
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    ORDER BY c.created_at DESC
  `).all()
  res.json(list)
})

app.post('/api/contracts', (req, res) => {
  const { consultation_id, lawyer_id, client_name, hourly_rate, scope } = req.body
  const sigChain = JSON.stringify([{ role: 'system', signed: true, time: new Date().toISOString() }])
  const info = db.prepare(`
    INSERT INTO contracts (consultation_id, lawyer_id, client_name, hourly_rate, scope, signature_chain, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(consultation_id, lawyer_id, client_name, hourly_rate, scope, sigChain)
  
  db.prepare('UPDATE consultations SET status = ?, selected_lawyer_id = ? WHERE id = ?')
    .run('contracted', lawyer_id, consultation_id)
  
  audit('CREATE', 'contract', info.lastInsertRowid, 'admin', { client_name, hourly_rate }, req)
  res.json({ id: info.lastInsertRowid })
})

app.get('/api/documents/templates', (req, res) => {
  const list = db.prepare('SELECT * FROM document_templates WHERE is_active = 1 ORDER BY created_at DESC').all()
  res.json(list)
})

app.post('/api/documents/generate', (req, res) => {
  const { template_id, consultation_id, data } = req.body
  const result = generateDocument(template_id, data || {})
  
  const info = db.prepare(`
    INSERT INTO generated_documents (template_id, consultation_id, content, format_validation, conflict_detection)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    template_id,
    consultation_id,
    result.content,
    JSON.stringify(result.formatValidation),
    JSON.stringify(result.conflictDetection)
  )
  
  audit('CREATE', 'document', info.lastInsertRowid, 'system', { template_id }, req)
  res.json({ id: info.lastInsertRowid, ...result })
})

app.get('/api/documents', (req, res) => {
  const list = db.prepare(`
    SELECT gd.*, dt.name as template_name
    FROM generated_documents gd
    LEFT JOIN document_templates dt ON gd.template_id = dt.id
    ORDER BY gd.created_at DESC
  `).all()
  res.json(list)
})

app.post('/api/documents/validate', (req, res) => {
  const { content, type } = req.body
  const format = validateFormat(content, type)
  const conflict = detectConflicts(content)
  res.json({ formatValidation: format, conflictDetection: conflict })
})

app.get('/api/audit', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  const offset = (page - 1) * pageSize
  
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset)
  const total = db.prepare('SELECT COUNT(*) as cnt FROM audit_logs').get().cnt
  
  res.json({ list: logs, total, page, pageSize })
})

app.get('/api/quality/lawyers', (req, res) => {
  const lawyers = db.prepare(`
    SELECT 
      id, name, win_rate, total_cases, avg_response_time, sentiment_score, review_count,
      (win_rate * 0.4 + (1 - avg_response_time/300) * 0.3 + sentiment_score * 0.3) as quality_score
    FROM lawyers
    WHERE license_verified = 1
    ORDER BY quality_score DESC
  `).all()
  res.json(lawyers)
})

app.get('/api/knowledge', (req, res) => {
  const nodes = db.prepare('SELECT * FROM knowledge_nodes ORDER BY frequency DESC LIMIT 50').all()
  if (nodes.length === 0) {
    const insert = db.prepare('INSERT INTO knowledge_nodes (title, content, category, frequency) VALUES (?, ?, ?, ?)')
    insert.run('劳动合同纠纷处理流程', '一、收集证据 二、劳动仲裁 三、法院诉讼', '劳动争议', 128)
    insert.run('离婚财产分割原则', '共同财产平均分割，个人财产归个人，照顾女方和子女', '婚姻家庭', 96)
    insert.run('交通事故赔偿项目', '医疗费、误工费、护理费、交通费、残疾赔偿金等', '交通事故', 85)
    insert.run('合同违约责任类型', '继续履行、违约金、赔偿损失、定金罚则', '合同纠纷', 72)
    insert.run('工伤认定条件', '工作时间、工作场所、工作原因', '工伤赔偿', 64)
    const all = db.prepare('SELECT * FROM knowledge_nodes ORDER BY frequency DESC LIMIT 50').all()
    return res.json(all)
  }
  res.json(nodes)
})

app.post('/api/messages', (req, res) => {
  const { consultation_id, sender_type, sender_id, content, msg_type } = req.body
  const hash = crypto.createHash('sha256').update(content + Date.now()).digest('hex')
  const encKey = crypto.randomBytes(16).toString('hex')
  
  const info = db.prepare(`
    INSERT INTO messages (consultation_id, sender_type, sender_id, content, msg_type, encryption_key, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(consultation_id, sender_type, sender_id, content, msg_type || 'text', encKey, hash)
  
  res.json({ id: info.lastInsertRowid, hash, timestamp: new Date().toISOString() })
})

app.get('/api/messages/:consultationId', (req, res) => {
  const list = db.prepare('SELECT * FROM messages WHERE consultation_id = ? ORDER BY created_at ASC').all(req.params.consultationId)
  res.json(list)
})

app.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`)
})
