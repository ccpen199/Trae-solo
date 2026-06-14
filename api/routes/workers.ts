import { Router, type Request, type Response } from 'express'
import { workers, workerCerts, workerScores } from '../../src/mock/data.js'
import type { Worker, WorkerCert, WorkerScore } from '../../src/types/index.js'

const router = Router()

let nextWorkerId = 100
let nextCertId = 100

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, skill } = req.query

  let filtered = [...workers]

  if (status) {
    filtered = filtered.filter(w => w.status === status)
  }
  if (skill) {
    filtered = filtered.filter(w => w.skills.includes(skill as string))
  }

  const withScores = filtered.map(w => {
    const score = workerScores.find(s => s.worker_id === w.id)
    return { ...w, score: score || null }
  })

  res.status(200).json({
    success: true,
    data: withScores,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const worker = workers.find(w => w.id === id)

  if (!worker) {
    res.status(404).json({
      success: false,
      error: '阿姨不存在',
    })
    return
  }

  const cert = workerCerts.find(c => c.worker_id === id)
  const score = workerScores.find(s => s.worker_id === id)

  res.status(200).json({
    success: true,
    data: {
      ...worker,
      cert: cert || null,
      score: score || null,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { phone, real_name, skills, age, experience_years } = req.body

  if (!phone || !real_name) {
    res.status(400).json({
      success: false,
      error: '手机号和姓名不能为空',
    })
    return
  }

  const existing = workers.find(w => w.phone === phone)
  if (existing) {
    res.status(409).json({
      success: false,
      error: '该手机号已注册',
    })
    return
  }

  const newWorker: Worker = {
    id: nextWorkerId++,
    phone,
    real_name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${real_name}`,
    status: 'pending',
    skills: skills || [],
    age: age || 30,
    experience_years: experience_years || 0,
  }

  workers.push(newWorker)

  workerScores.push({
    id: nextWorkerId,
    worker_id: newWorker.id,
    overall_score: 0,
    punctuality_rate: 0,
    satisfaction_rate: 0,
    complaint_rate: 0,
    total_orders: 0,
    trend: [],
  })

  res.status(201).json({
    success: true,
    data: newWorker,
  })
})

router.get('/:id/certs', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const cert = workerCerts.find(c => c.worker_id === id)

  if (!cert) {
    res.status(404).json({
      success: false,
      error: '证件信息不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: cert,
  })
})

router.post('/:id/certs', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const worker = workers.find(w => w.id === id)

  if (!worker) {
    res.status(404).json({
      success: false,
      error: '阿姨不存在',
    })
    return
  }

  const { id_card_url, health_cert_url, crime_record_url } = req.body

  if (!id_card_url || !health_cert_url || !crime_record_url) {
    res.status(400).json({
      success: false,
      error: '三证照片都需要上传',
    })
    return
  }

  const existing = workerCerts.findIndex(c => c.worker_id === id)

  const ocrResult = `${worker.real_name}，身份证号11010519800101${Math.floor(1000 + Math.random() * 9000)}，健康证有效期至2027-06-30，无犯罪记录`

  const certData: WorkerCert = {
    id: existing >= 0 ? workerCerts[existing].id : nextCertId++,
    worker_id: id,
    id_card_url,
    health_cert_url,
    crime_record_url,
    ocr_result: ocrResult,
    verify_status: 'ocr_done',
    submitted_at: new Date().toISOString(),
  }

  if (existing >= 0) {
    workerCerts[existing] = certData
  } else {
    workerCerts.push(certData)
  }

  res.status(200).json({
    success: true,
    data: certData,
  })
})

router.post('/:id/certs/ocr', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const cert = workerCerts.find(c => c.worker_id === id)

  if (!cert) {
    res.status(404).json({
      success: false,
      error: '证件信息不存在，请先上传证件',
    })
    return
  }

  cert.verify_status = 'ocr_done'

  res.status(200).json({
    success: true,
    data: {
      ocr_result: cert.ocr_result,
      verify_status: cert.verify_status,
    },
  })
})

router.patch('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const worker = workers.find(w => w.id === id)

  if (!worker) {
    res.status(404).json({
      success: false,
      error: '阿姨不存在',
    })
    return
  }

  const { status } = req.body as { status: 'verified' | 'rejected' | 'blacklisted' }

  if (!status || !['verified', 'rejected', 'blacklisted'].includes(status)) {
    res.status(400).json({
      success: false,
      error: '无效的审核状态',
    })
    return
  }

  worker.status = status
  if (status === 'verified') {
    worker.verified_at = new Date().toISOString()
  }

  const cert = workerCerts.find(c => c.worker_id === id)
  if (cert) {
    cert.verify_status = status === 'verified' ? 'approved' : 'rejected'
  }

  res.status(200).json({
    success: true,
    data: worker,
  })
})

router.get('/:id/score', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const score = workerScores.find(s => s.worker_id === id)

  if (!score) {
    res.status(404).json({
      success: false,
      error: '评分数据不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: score,
  })
})

router.patch('/:id/score', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  let score = workerScores.find(s => s.worker_id === id)

  if (!score) {
    score = {
      id: nextWorkerId++,
      worker_id: id,
      overall_score: 0,
      punctuality_rate: 0,
      satisfaction_rate: 0,
      complaint_rate: 0,
      total_orders: 0,
      trend: [],
    }
    workerScores.push(score)
  }

  const { overall_score, punctuality_rate, satisfaction_rate, complaint_rate } = req.body as Partial<WorkerScore>

  if (overall_score !== undefined) score.overall_score = overall_score
  if (punctuality_rate !== undefined) score.punctuality_rate = punctuality_rate
  if (satisfaction_rate !== undefined) score.satisfaction_rate = satisfaction_rate
  if (complaint_rate !== undefined) score.complaint_rate = complaint_rate

  res.status(200).json({
    success: true,
    data: score,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const worker = workers.find(w => w.id === id)

  if (!worker) {
    res.status(404).json({
      success: false,
      error: '阿姨不存在',
    })
    return
  }

  const { real_name, skills, age, experience_years } = req.body

  if (real_name) worker.real_name = real_name
  if (skills) worker.skills = skills
  if (age) worker.age = age
  if (experience_years !== undefined) worker.experience_years = experience_years

  res.status(200).json({
    success: true,
    data: worker,
  })
})

export default router
