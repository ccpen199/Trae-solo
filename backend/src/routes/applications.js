const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { db } = require('../database')
const router = express.Router()

const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

router.get('/', (req, res) => {
  const stmt = db.prepare(`
    SELECT a.*, p.project_unit, p.purpose, p.indicator_no, p.available_balance
    FROM applications a
    LEFT JOIN projects p ON a.project_id = p.id
    ORDER BY a.created_at DESC
  `)
  const applications = stmt.all()
  res.json(applications)
})

router.get('/:id', (req, res) => {
  const stmt = db.prepare(`
    SELECT a.*, p.project_unit, p.purpose, p.indicator_no
    FROM applications a
    LEFT JOIN projects p ON a.project_id = p.id
    WHERE a.id = ?
  `)
  const application = stmt.get(req.params.id)
  if (!application) {
    return res.status(404).json({ error: '申请不存在' })
  }
  
  const attachStmt = db.prepare('SELECT * FROM attachments WHERE application_id = ?')
  application.attachments = attachStmt.all(req.params.id)
  
  const auditStmt = db.prepare('SELECT * FROM audit_records WHERE application_id = ? ORDER BY created_at ASC')
  application.auditHistory = auditStmt.all(req.params.id)
  
  res.json(application)
})

router.post('/', upload.array('attachments', 10), (req, res) => {
  const { project_id, applicant, amount, description } = req.body
  
  if (!project_id || !applicant || !amount) {
    return res.status(400).json({ error: '缺少必填字段' })
  }

  const projectStmt = db.prepare('SELECT * FROM projects WHERE id = ?')
  const project = projectStmt.get(project_id)
  
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }

  if (parseFloat(amount) > parseFloat(project.available_balance)) {
    return res.status(400).json({ 
      error: '申请金额超过可用余额',
      available_balance: project.available_balance,
      requested: amount
    })
  }

  const requiredTypes = ['contract', 'acceptance', 'invoice', 'request']
  let uploadedTypes = []
  if (req.body.attachmentTypes) {
    try {
      uploadedTypes = typeof req.body.attachmentTypes === 'string' 
        ? JSON.parse(req.body.attachmentTypes) 
        : req.body.attachmentTypes
    } catch (e) {
      uploadedTypes = []
    }
  }
  const missingTypes = requiredTypes.filter(t => !uploadedTypes.includes(t))
  
  let status = 'pending'
  let current_stage = 'business'
  
  if (missingTypes.length > 0) {
    status = 'correction'
    current_stage = 'correction'
  }

  const insert = db.prepare(`
    INSERT INTO applications (project_id, applicant, amount, description, status, current_stage)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  const result = insert.run(project_id, applicant, amount, description, status, current_stage)
  const applicationId = result.lastInsertRowid

  if (req.files && req.files.length > 0) {
    let types = []
    try {
      types = typeof req.body.attachmentTypes === 'string' 
        ? JSON.parse(req.body.attachmentTypes) 
        : (req.body.attachmentTypes || [])
    } catch (e) {
      types = []
    }
    const attachInsert = db.prepare(`
      INSERT INTO attachments (application_id, type, filename, original_name, file_path, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    req.files.forEach((file, index) => {
      attachInsert.run(
        applicationId,
        types[index] || 'other',
        file.filename,
        file.originalname,
        file.path,
        file.size
      )
    })
  }

  res.json({ 
    id: applicationId, 
    status: status,
    missing_attachments: missingTypes,
    message: status === 'correction' ? '材料不完整，请补正' : '申请已提交'
  })
})

router.put('/:id/attachments', upload.array('attachments', 10), (req, res) => {
  const applicationId = req.params.id
  
  const appStmt = db.prepare('SELECT * FROM applications WHERE id = ?')
  const application = appStmt.get(applicationId)
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' })
  }

  if (req.files && req.files.length > 0) {
    let types = []
    try {
      types = typeof req.body.attachmentTypes === 'string' 
        ? JSON.parse(req.body.attachmentTypes) 
        : (req.body.attachmentTypes || [])
    } catch (e) {
      types = []
    }
    const attachInsert = db.prepare(`
      INSERT INTO attachments (application_id, type, filename, original_name, file_path, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    req.files.forEach((file, index) => {
      attachInsert.run(
        applicationId,
        types[index] || 'other',
        file.filename,
        file.originalname,
        file.path,
        file.size
      )
    })
  }

  const currentAttachStmt = db.prepare('SELECT type FROM attachments WHERE application_id = ?')
  const currentTypes = currentAttachStmt.all(applicationId).map(a => a.type)
  
  const requiredTypes = ['contract', 'acceptance', 'invoice', 'request']
  const missingTypes = requiredTypes.filter(t => !currentTypes.includes(t))
  
  if (missingTypes.length === 0 && application.status === 'correction') {
    const update = db.prepare(`
      UPDATE applications SET status = 'pending', current_stage = 'business', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    update.run(applicationId)
    
    res.json({ 
      message: '材料已补全，进入审核流程',
      status: 'pending'
    })
  } else {
    res.json({ 
      message: '附件已上传',
      missing_attachments: missingTypes
    })
  }
})

module.exports = router
