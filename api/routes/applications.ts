import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const STEPS = [
  { step: 0, name: '选择事项', progress: 0 },
  { step: 1, name: '材料上传', progress: 20 },
  { step: 2, name: 'OCR识别', progress: 40 },
  { step: 3, name: '电子签名', progress: 60 },
  { step: 4, name: '提交确认', progress: 80 },
  { step: 5, name: '进度跟踪', progress: 100 },
]

const MATERIAL_TEMPLATES: Record<string, { name: string; required: boolean }[]> = {
  '社保卡申领': [
    { name: '身份证正反面', required: true },
    { name: '近期一寸免冠照片', required: true },
    { name: '户口本（可选）', required: false },
  ],
  '居住证办理': [
    { name: '身份证正反面', required: true },
    { name: '房屋租赁合同', required: true },
    { name: '就业证明', required: true },
    { name: '近期一寸免冠照片', required: true },
  ],
  '身份证补换': [
    { name: '户口本', required: true },
    { name: '原身份证（如有）', required: false },
    { name: '近期一寸免冠照片', required: true },
  ],
  '户口迁移': [
    { name: '身份证正反面', required: true },
    { name: '户口本', required: true },
    { name: '迁移原因证明', required: true },
    { name: '房产证/租房合同', required: true },
  ],
  '出生登记': [
    { name: '出生医学证明', required: true },
    { name: '父母结婚证', required: true },
    { name: '父母身份证', required: true },
    { name: '户口本', required: true },
  ],
  '公积金提取': [
    { name: '身份证正反面', required: true },
    { name: '购房合同/租房合同', required: true },
    { name: '收入证明', required: false },
  ],
  '不动产登记': [
    { name: '身份证正反面', required: true },
    { name: '购房合同', required: true },
    { name: '房屋所有权证', required: true },
    { name: '完税证明', required: true },
  ],
}

const DEPARTMENT_MAP: Record<string, string> = {
  '社保卡申领': '人力资源和社会保障局',
  '居住证办理': '公安局',
  '身份证补换': '公安局',
  '户口迁移': '公安局',
  '出生登记': '公安局',
  '公积金提取': '住房公积金管理中心',
  '不动产登记': '自然资源和规划局',
}

function generateReceiptNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `SL${year}${month}${day}${random}`
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function initProgressSteps(applicationId: number, startStep: number = 0) {
  const insertProgress = db.prepare(
    'INSERT INTO application_progress (application_id, step, step_name, status, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
  )
  for (let i = startStep; i < STEPS.length; i++) {
    const status = i === startStep ? 'in_progress' : 'pending'
    insertProgress.run(applicationId, i, STEPS[i].name, status)
  }
  if (startStep > 0) {
    for (let i = 0; i < startStep; i++) {
      db.prepare(
        'UPDATE application_progress SET status = "completed", completed_at = datetime("now") WHERE application_id = ? AND step = ?'
      ).run(applicationId, i)
    }
  }
}

function updateProgressStep(applicationId: number, step: number, handler?: string, remark?: string) {
  db.prepare(
    'UPDATE application_progress SET status = "completed", completed_at = datetime("now"), handler = ?, remark = ? WHERE application_id = ? AND step = ?'
  ).run(handler || '系统', remark || '', applicationId, step)

  if (step + 1 < STEPS.length) {
    db.prepare(
      'UPDATE application_progress SET status = "in_progress" WHERE application_id = ? AND step = ?'
    ).run(applicationId, step + 1)
  }

  const progress = STEPS[step + 1]?.progress || 100
  const status = step + 1 >= STEPS.length ? 'completed' : 'processing'

  db.prepare(
    'UPDATE applications SET current_step = ?, progress = ?, status = ?, updated_at = datetime("now") WHERE id = ?'
  ).run(step + 1, progress, status, applicationId)
}

function parseMaterials(materialsStr: string) {
  try {
    return JSON.parse(materialsStr)
  } catch {
    return []
  }
}

function parseJsonField(str: string | null | undefined) {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const applications = db.prepare(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM application_materials am WHERE am.application_id = a.id AND am.status = 'verified') as verified_materials,
             (SELECT COUNT(*) FROM application_materials am WHERE am.application_id = a.id) as total_materials
      FROM applications a 
      WHERE a.user_id = ? 
      ORDER BY a.created_at DESC
    `).all(userId)

    const result = (applications as any[]).map((app) => ({
      ...app,
      materials: parseMaterials(app.materials),
      ocr_data: parseJsonField(app.ocr_data),
      verified_materials: app.verified_materials || 0,
      total_materials: app.total_materials || 0,
    }))

    res.json({ code: 0, message: 'success', data: result })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { item_name, department, materials, ocr_data, signature_data, current_step } = req.body

    if (!item_name) {
      res.json({ code: -1, message: '请提供事项名称' })
      return
    }

    const dept = department || DEPARTMENT_MAP[item_name] || '相关部门'
    const step = current_step || 0

    const result = db.prepare(`
      INSERT INTO applications (user_id, item_name, department, materials, ocr_data, signature_data, current_step, progress, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      item_name,
      dept,
      JSON.stringify(materials || []),
      ocr_data ? JSON.stringify(ocr_data) : null,
      signature_data || null,
      step,
      STEPS[step]?.progress || 0,
      step === 0 ? 'draft' : 'processing'
    )

    const applicationId = Number(result.lastInsertRowid)
    initProgressSteps(applicationId, step)

    const template = MATERIAL_TEMPLATES[item_name] || []
    const insertMaterial = db.prepare(`
      INSERT INTO application_materials (application_id, name, required, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime("now"))
    `)
    for (const mat of template) {
      insertMaterial.run(applicationId, mat.name, mat.required ? 1 : 0)
    }

    res.json({ code: 0, message: 'success', data: { id: applicationId } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const application = db.prepare(`
      SELECT * FROM applications WHERE id = ? AND user_id = ?
    `).get(id, userId) as any

    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    const progress = db.prepare(`
      SELECT * FROM application_progress WHERE application_id = ? ORDER BY step
    `).all(id)

    const materials = db.prepare(`
      SELECT * FROM application_materials WHERE application_id = ? ORDER BY id
    `).all(id)

    const ocrRecords = db.prepare(`
      SELECT * FROM ocr_records WHERE application_id = ? ORDER BY created_at DESC
    `).all(id)

    const signatures = db.prepare(`
      SELECT * FROM signatures WHERE application_id = ? ORDER BY created_at DESC
    `).all(id)

    res.json({
      code: 0,
      message: 'success',
      data: {
        ...application,
        materials: parseMaterials(application.materials),
        ocr_data: parseJsonField(application.ocr_data),
        progress,
        materials_detail: materials,
        ocr_records: ocrRecords.map((r: any) => ({
          ...r,
          result: parseJsonField(r.result),
          edited_result: parseJsonField(r.edited_result),
        })),
        signatures,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { materials, ocr_data, signature_data, current_step, status } = req.body

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    const fields: string[] = []
    const values: any[] = []

    if (materials !== undefined) {
      fields.push('materials = ?')
      values.push(JSON.stringify(materials))
    }
    if (ocr_data !== undefined) {
      fields.push('ocr_data = ?')
      values.push(JSON.stringify(ocr_data))
    }
    if (signature_data !== undefined) {
      fields.push('signature_data = ?')
      values.push(signature_data)
    }
    if (current_step !== undefined) {
      fields.push('current_step = ?')
      values.push(current_step)
      fields.push('progress = ?')
      values.push(STEPS[current_step]?.progress || 0)
    }
    if (status !== undefined) {
      fields.push('status = ?')
      values.push(status)
    }

    if (fields.length === 0) {
      res.json({ code: -1, message: '没有需要更新的字段' })
      return
    }

    fields.push('updated_at = datetime("now")')
    values.push(id, userId)

    db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values)

    res.json({ code: 0, message: '更新成功' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/ocr', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { application_id, material_id, file_name, file_data } = req.body

    if (!file_name) {
      res.json({ code: -1, message: '请提供文件名' })
      return
    }

    if (application_id) {
      const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(application_id, userId)
      if (!application) {
        res.json({ code: -1, message: '申请不存在' })
        return
      }
    }

    const mockOcrResult = {
      身份证号: '3201' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
      姓名: ['张三', '李四', '王五', '赵六', '陈七'][Math.floor(Math.random() * 5)],
      性别: ['男', '女'][Math.floor(Math.random() * 2)],
      民族: '汉',
      出生日期: '199' + Math.floor(Math.random() * 10) + '-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
      住址: '江苏省南京市玄武区中山路' + Math.floor(Math.random() * 1000) + '号',
      有效期: '2020-2040',
      签发机关: '南京市公安局玄武分局',
    }

    const confidence = 0.85 + Math.random() * 0.14

    const result = db.prepare(`
      INSERT INTO ocr_records (application_id, material_id, file_name, result, confidence, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'completed', datetime("now"))
    `).run(
      application_id || null,
      material_id || null,
      file_name,
      JSON.stringify(mockOcrResult),
      confidence
    )

    if (material_id) {
      db.prepare(`
        UPDATE application_materials 
        SET ocr_data = ?, status = 'uploaded', uploaded_at = datetime("now") 
        WHERE id = ?
      `).run(JSON.stringify(mockOcrResult), material_id)
    }

    if (application_id) {
      updateProgressStep(application_id, 2, 'OCR系统', '识别完成')
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        id: Number(result.lastInsertRowid),
        result: mockOcrResult,
        confidence,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/ocr/:id/edit', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { edited_result } = req.body

    if (!edited_result) {
      res.json({ code: -1, message: '请提供编辑后的结果' })
      return
    }

    const record = db.prepare('SELECT * FROM ocr_records WHERE id = ?').get(id) as any
    if (!record) {
      res.json({ code: -1, message: 'OCR记录不存在' })
      return
    }

    if (record.application_id) {
      const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(record.application_id, userId)
      if (!application) {
        res.json({ code: -1, message: '无权限操作' })
        return
      }
    }

    db.prepare(`
      UPDATE ocr_records SET edited_result = ?, status = 'edited' WHERE id = ?
    `).run(JSON.stringify(edited_result), id)

    if (record.material_id) {
      db.prepare(`
        UPDATE application_materials SET ocr_data = ? WHERE id = ?
      `).run(JSON.stringify(edited_result), record.material_id)
    }

    res.json({ code: 0, message: '编辑成功' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/signature', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { application_id, signature_data } = req.body

    if (!application_id || !signature_data) {
      res.json({ code: -1, message: '请提供申请ID和签名数据' })
      return
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(application_id, userId) as any
    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    const result = db.prepare(`
      INSERT INTO signatures (application_id, signature_data, created_at)
      VALUES (?, ?, datetime("now"))
    `).run(application_id, signature_data)

    db.prepare(`
      UPDATE applications SET signature_data = ?, updated_at = datetime("now") WHERE id = ?
    `).run(signature_data, application_id)

    res.json({
      code: 0,
      message: 'success',
      data: { id: Number(result.lastInsertRowid) },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/signature/:id/confirm', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const signature = db.prepare('SELECT * FROM signatures WHERE id = ?').get(id) as any
    if (!signature) {
      res.json({ code: -1, message: '签名记录不存在' })
      return
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(signature.application_id, userId)
    if (!application) {
      res.json({ code: -1, message: '无权限操作' })
      return
    }

    db.prepare(`
      UPDATE signatures SET confirmed = 1, confirmed_at = datetime("now") WHERE id = ?
    `).run(id)

    updateProgressStep(signature.application_id, 3, userId, '签名已确认')

    res.json({ code: 0, message: '签名确认成功' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/submit', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { application_id } = req.body

    if (!application_id) {
      res.json({ code: -1, message: '请提供申请ID' })
      return
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(application_id, userId) as any
    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    const materials = db.prepare('SELECT * FROM application_materials WHERE application_id = ?').all(application_id) as any[]
    const requiredMaterials = materials.filter((m) => m.required === 1)
    const missingMaterials = requiredMaterials.filter((m) => m.status !== 'uploaded' && m.status !== 'verified')

    if (missingMaterials.length > 0) {
      res.json({
        code: -1,
        message: `还有 ${missingMaterials.length} 个必填材料未上传：${missingMaterials.map((m) => m.name).join('、')}`,
      })
      return
    }

    const signature = db.prepare('SELECT * FROM signatures WHERE application_id = ? AND confirmed = 1').get(application_id)
    if (!signature) {
      res.json({ code: -1, message: '请先完成电子签名并确认' })
      return
    }

    const receiptNumber = generateReceiptNumber()
    const estimatedCompletion = addDays(new Date().toISOString(), 15)

    db.prepare(`
      UPDATE applications 
      SET status = 'submitted', 
          current_step = 4, 
          progress = 80,
          receipt_number = ?,
          estimated_completion = ?,
          updated_at = datetime("now")
      WHERE id = ?
    `).run(receiptNumber, estimatedCompletion, application_id)

    updateProgressStep(application_id, 4, '系统', '申请已提交，等待审核')

    res.json({
      code: 0,
      message: '提交成功',
      data: {
        receipt_number: receiptNumber,
        estimated_completion: estimatedCompletion,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/:id/receipt', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const application = db.prepare(`
      SELECT a.*, u.name as user_name, u.phone as user_phone
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(id, userId) as any

    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    if (!application.receipt_number) {
      res.json({ code: -1, message: '申请尚未提交，无法生成回执单' })
      return
    }

    const materials = db.prepare(`
      SELECT * FROM application_materials WHERE application_id = ? ORDER BY id
    `).all(id)

    const progress = db.prepare(`
      SELECT * FROM application_progress WHERE application_id = ? ORDER BY step
    `).all(id)

    const receipt = {
      receipt_number: application.receipt_number,
      item_name: application.item_name,
      department: application.department,
      applicant_name: application.user_name,
      applicant_phone: application.user_phone,
      submit_time: application.created_at,
      estimated_completion: application.estimated_completion,
      materials,
      progress,
      status: application.status,
      current_step: application.current_step,
      progress_percent: application.progress,
      tips: [
        '请妥善保管此回执单，以备查询',
        '预计15个工作日内完成办理',
        '如有疑问，请拨打服务热线：12345',
      ],
    }

    res.json({ code: 0, message: 'success', data: receipt })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/:id/progress', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    const progress = db.prepare(`
      SELECT * FROM application_progress WHERE application_id = ? ORDER BY step
    `).all(id)

    const handlers: Record<string, string> = {
      '0': '申请人',
      '1': '申请人',
      '2': 'OCR系统',
      '3': '申请人',
      '4': '系统',
      '5': '审核人员',
    }

    const enrichedProgress = progress.map((p: any, index: number) => ({
      ...p,
      handler: p.handler || handlers[index] || '系统',
      step_info: STEPS[p.step] || { step: p.step, name: p.step_name, progress: (p.step / STEPS.length) * 100 },
    }))

    res.json({
      code: 0,
      message: 'success',
      data: {
        application: {
          id: application.id,
          item_name: application.item_name,
          status: application.status,
          current_step: application.current_step,
          progress: application.progress,
          estimated_completion: application.estimated_completion,
          receipt_number: application.receipt_number,
          created_at: application.created_at,
        },
        progress: enrichedProgress,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/:id/materials', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { materials } = req.body

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, userId)
    if (!application) {
      res.json({ code: -1, message: '申请不存在' })
      return
    }

    const insertMaterial = db.prepare(`
      INSERT INTO application_materials (application_id, name, file_name, file_size, status, required, uploaded_at)
      VALUES (?, ?, ?, ?, 'uploaded', ?, datetime("now"))
    `)

    const materialIds: number[] = []
    for (const mat of materials || []) {
      const result = insertMaterial.run(id, mat.name, mat.file_name, mat.file_size || 0, mat.required ? 1 : 0)
      materialIds.push(Number(result.lastInsertRowid))
    }

    updateProgressStep(Number(id), 1, '申请人', '材料已上传')

    res.json({ code: 0, message: '材料上传成功', data: { material_ids: materialIds } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/materials/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { file_name, file_size, status, remark } = req.body

    const material = db.prepare('SELECT * FROM application_materials WHERE id = ?').get(id) as any
    if (!material) {
      res.json({ code: -1, message: '材料记录不存在' })
      return
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(material.application_id, userId)
    if (!application) {
      res.json({ code: -1, message: '无权限操作' })
      return
    }

    const fields: string[] = []
    const values: any[] = []

    if (file_name !== undefined) {
      fields.push('file_name = ?')
      values.push(file_name)
    }
    if (file_size !== undefined) {
      fields.push('file_size = ?')
      values.push(file_size)
    }
    if (status !== undefined) {
      fields.push('status = ?')
      values.push(status)
      if (status === 'uploaded') {
        fields.push('uploaded_at = datetime("now")')
      }
    }
    if (remark !== undefined) {
      fields.push('remark = ?')
      values.push(remark)
    }

    if (fields.length === 0) {
      res.json({ code: -1, message: '没有需要更新的字段' })
      return
    }

    values.push(id)
    db.prepare(`UPDATE application_materials SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    res.json({ code: 0, message: '更新成功' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.delete('/materials/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const material = db.prepare('SELECT * FROM application_materials WHERE id = ?').get(id) as any
    if (!material) {
      res.json({ code: -1, message: '材料记录不存在' })
      return
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(material.application_id, userId)
    if (!application) {
      res.json({ code: -1, message: '无权限操作' })
      return
    }

    db.prepare('DELETE FROM application_materials WHERE id = ?').run(id)

    res.json({ code: 0, message: '删除成功' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/templates/:itemName', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { itemName } = req.params
    const decodedItemName = decodeURIComponent(itemName)
    const template = MATERIAL_TEMPLATES[decodedItemName] || []
    const department = DEPARTMENT_MAP[decodedItemName] || '相关部门'

    res.json({
      code: 0,
      message: 'success',
      data: {
        materials: template,
        department,
        estimated_days: 15,
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
