import { Router, type Request, type Response } from 'express'
import { sopDocuments } from '../../src/mock/data.js'
import type { SopDocument, ServiceType } from '../../src/types/index.js'

const router = Router()

let nextSopId = 100

const serviceTypeLabelMap: Record<ServiceType, string> = {
  cleaning: '日常保洁',
  babysitting: '育婴师',
  cooking: '上门做饭',
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { service_type } = req.query

  let filtered = [...sopDocuments]

  if (service_type) {
    filtered = filtered.filter(s => s.service_type === service_type)
  }

  res.status(200).json({
    success: true,
    data: filtered,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const sop = sopDocuments.find(s => s.id === id)

  if (!sop) {
    res.status(404).json({
      success: false,
      error: 'SOP文档不存在',
    })
    return
  }

  res.status(200).json({
    success: true,
    data: sop,
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { service_type, title, content, steps } = req.body

  if (!service_type || !title || !content) {
    res.status(400).json({
      success: false,
      error: '服务类型、标题和内容不能为空',
    })
    return
  }

  const newSop: SopDocument = {
    id: nextSopId++,
    service_type: service_type as ServiceType,
    service_type_label: serviceTypeLabelMap[service_type as ServiceType] || service_type,
    title,
    content,
    version: 'v1.0',
    updated_at: new Date().toISOString(),
    steps: steps || [],
  }

  sopDocuments.push(newSop)

  res.status(201).json({
    success: true,
    data: newSop,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const sop = sopDocuments.find(s => s.id === id)

  if (!sop) {
    res.status(404).json({
      success: false,
      error: 'SOP文档不存在',
    })
    return
  }

  const { title, content, steps, service_type } = req.body

  if (title) {
    sop.title = title
    if (service_type) {
      sop.service_type = service_type
      sop.service_type_label = serviceTypeLabelMap[service_type] || service_type
    }
    if (content) sop.content = content
    if (steps) sop.steps = steps

    const versionParts = sop.version.split('.')
    const minor = parseInt(versionParts[1] || '0', 10)
    const major = parseInt(versionParts[0].slice(1) || '1', 10)
    sop.version = `v${major}.${minor + 1}`
    sop.updated_at = new Date().toISOString()
  }

  res.status(200).json({
    success: true,
    data: sop,
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10)
  const idx = sopDocuments.findIndex(s => s.id === id)

  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: 'SOP文档不存在',
    })
    return
  }

  sopDocuments.splice(idx, 1)

  res.status(200).json({
    success: true,
    message: 'SOP文档已删除',
  })
})

export default router
