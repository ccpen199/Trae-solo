import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

interface Partner {
  nameZh: string
  nameIt: string
  type: string
}

interface Attachment {
  id: string
  nameZh: string
  nameIt: string
  url: string
  fileType?: string
}

interface Project {
  id: string
  titleZh: string
  titleIt: string
  category: string
  stage: string
  partners: Partner[]
  contactPerson: string
  contactEmail: string
  descriptionZh: string
  descriptionIt: string
  progress: number
  createdAt: string
  updatedAt: string
  attachments?: Attachment[]
}

const formatProject = (row: any): Project => {
  return {
    id: row.id,
    titleZh: row.title_zh,
    titleIt: row.title_it,
    category: row.category,
    stage: row.stage,
    partners: row.partners_json ? JSON.parse(row.partners_json) : [],
    contactPerson: row.contact_person || '',
    contactEmail: row.contact_email || '',
    descriptionZh: row.description_zh || '',
    descriptionIt: row.description_it || '',
    progress: row.progress || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const { category, stage, keyword } = req.query

  let sql = 'SELECT * FROM projects WHERE 1=1'
  const params: any[] = []

  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  if (stage) {
    sql += ' AND stage = ?'
    params.push(stage)
  }
  if (keyword) {
    sql += ' AND (title_zh LIKE ? OR title_it LIKE ? OR description_zh LIKE ? OR description_it LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw, kw)
  }

  sql += ' ORDER BY updated_at DESC'

  const rows = db.prepare(sql).all(...params) as any[]
  const projects = rows.map(formatProject)

  res.json({
    success: true,
    data: projects,
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({
      success: false,
      error: 'Project not found',
    })
    return
  }

  const project = formatProject(row)

  const attachmentRows = db
    .prepare('SELECT * FROM attachments WHERE project_id = ? ORDER BY created_at')
    .all(id) as any[]

  project.attachments = attachmentRows.map((att) => ({
    id: att.id,
    nameZh: att.name_zh,
    nameIt: att.name_it,
    url: att.url,
    fileType: att.file_type,
  }))

  res.json({
    success: true,
    data: project,
  })
})

router.post('/', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    })
    return
  }

  const {
    titleZh,
    titleIt,
    category,
    stage,
    partners,
    contactPerson,
    contactEmail,
    descriptionZh,
    descriptionIt,
  } = req.body

  if (!titleZh || !titleIt || !category || !stage) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields',
    })
    return
  }

  const id = `proj_${Date.now()}`
  const now = new Date().toISOString()
  const partnersJson = partners ? JSON.stringify(partners) : null

  db.prepare(
    `INSERT INTO projects (id, title_zh, title_it, category, stage, partners_json, contact_person, contact_email, description_zh, description_it, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    titleZh,
    titleIt,
    category,
    stage,
    partnersJson,
    contactPerson || null,
    contactEmail || null,
    descriptionZh || null,
    descriptionIt || null,
    now,
    now,
  )

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
  const project = formatProject(row)

  res.status(201).json({
    success: true,
    data: project,
  })
})

export default router
