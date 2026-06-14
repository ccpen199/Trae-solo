import { Router, type Request, type Response } from 'express'
import { getDatabase } from '../lib/database.js'

const router = Router()

interface ServiceOutletRow {
  id: number
  outlet_code: string
  name: string
  address: string
  district?: string
  phone?: string
  work_hours?: string
  latitude?: number
  longitude?: number
  services?: string
  sort_order?: number
  status: string
  created_at: string
}

function buildVRConfig(outletId: number, outlet: ServiceOutletRow) {
  const windowDescriptions: Record<number, Array<{ code: string; name: string; description: string; waitCount?: number; avgWait?: string }>> = {
    1: [
      { code: 'A01', name: '综合受理窗口', description: '综合业务受理、咨询引导', waitCount: 3, avgWait: '约15分钟' },
      { code: 'A02', name: '社保经办窗口', description: '参保登记、缴费申报、关系转移', waitCount: 5, avgWait: '约25分钟' },
      { code: 'A03', name: '社保卡服务窗口', description: '社保卡申领、挂失、解挂、补换', waitCount: 2, avgWait: '约10分钟' },
      { code: 'A04', name: '就业服务窗口', description: '失业登记、职业介绍、就业援助', waitCount: 4, avgWait: '约20分钟' },
      { code: 'A05', name: '人才服务窗口', description: '人才引进、档案管理、职称评定', waitCount: 1, avgWait: '约8分钟' },
    ],
    2: [
      { code: 'B01', name: '综合受理窗口', description: '综合业务受理', waitCount: 2 },
      { code: 'B02', name: '社保经办窗口', description: '社保业务办理', waitCount: 4 },
      { code: 'B03', name: '技能培训窗口', description: '培训报名、证书办理', waitCount: 1 },
    ],
    3: [
      { code: 'C01', name: '社区综合窗口', description: '业务受理、便民服务' },
      { code: 'C02', name: '失业登记窗口', description: '失业登记、补贴申请' },
    ],
    4: [
      { code: 'D01', name: '人才综合窗口', description: '人才引进、人才补贴' },
      { code: 'D02', name: '创业服务窗口', description: '创业担保、创业扶持' },
      { code: 'D03', name: '社保经办窗口', description: '社保业务办理' },
    ],
    5: [
      { code: 'E01', name: '鉴定报名窗口', description: '技能鉴定报名、咨询' },
      { code: 'E02', name: '证书发放窗口', description: '证书打印、发放、补办' },
    ],
  }

  const windows = windowDescriptions[outletId] || [
    { code: 'G01', name: '综合受理窗口', description: '综合业务办理' },
  ]

  return {
    outletId,
    outletCode: outlet.outlet_code,
    outletName: outlet.name,
    panoramaUrl: `https://cdn.example.com/vr/outlets/${outlet.outlet_code}/panorama.jpg?v=${Date.now()}`,
    initialView: {
      heading: 0,
      pitch: 0,
      fov: 90,
    },
    hotspots: [
      {
        id: 'entrance',
        name: '入口',
        type: 'navigate',
        position: { heading: 0, pitch: 0 },
        target: 'hall',
        description: '服务大厅入口',
      },
      {
        id: 'hall',
        name: '服务大厅',
        type: 'info',
        position: { heading: 45, pitch: -5 },
        description: '综合服务大厅，提供自助取号、等候休息等设施',
      },
      {
        id: 'window_area',
        name: '窗口服务区',
        type: 'info',
        position: { heading: 180, pitch: -10 },
        description: `${windows.length}个人社业务服务窗口`,
      },
      {
        id: 'self_service',
        name: '自助服务区',
        type: 'navigate',
        position: { heading: -90, pitch: 0 },
        target: 'self',
        description: '提供自助查询机、自助打印机等设备',
      },
    ],
    windows,
    facilities: [
      { name: '自助取号机', status: 'available', location: '服务大厅入口' },
      { name: '自助查询机', status: 'available', location: '自助服务区' },
      { name: '自助打印机', status: 'available', location: '自助服务区' },
      { name: '休息等候区', status: 'available', location: '大厅中央' },
      { name: '母婴室', status: 'available', location: '大厅东侧' },
      { name: '无障碍通道', status: 'available', location: '入口西侧' },
    ],
    navigationPoints: [
      { floor: 1, name: '服务大厅', x: 50, y: 50, description: '一层综合服务大厅' },
      { floor: 1, name: '自助服务区', x: 80, y: 20, description: '一层自助服务' },
      { floor: 2, name: '办公区', x: 50, y: 50, description: '二层行政办公' },
    ],
    generatedAt: new Date().toISOString(),
  }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const district = req.query.district as string | undefined

    const db = getDatabase()
    let sql = "SELECT * FROM service_outlets WHERE status = 'active'"
    const params: unknown[] = []
    if (district) {
      sql += ' AND district = ?'
      params.push(district)
    }
    sql += ' ORDER BY sort_order ASC, created_at DESC'

    const rows = db.prepare(sql).all(...params) as ServiceOutletRow[]

    const data = rows.map((o) => ({
      id: o.id,
      outletCode: o.outlet_code,
      name: o.name,
      address: o.address,
      district: o.district,
      phone: o.phone,
      workHours: o.work_hours,
      latitude: o.latitude,
      longitude: o.longitude,
      services: o.services ? o.services.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
      sortOrder: o.sort_order,
      createdAt: o.created_at,
    }))

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        total: data.length,
        districts: Array.from(new Set(rows.map((r) => r.district).filter(Boolean))),
        items: data,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).sendJson({ code: 400, message: '无效的ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const o = db.prepare('SELECT * FROM service_outlets WHERE id = ?').get(id) as ServiceOutletRow | undefined
    if (!o) {
      res.status(404).sendJson({ code: 404, message: '网点不存在', data: null, traceId: req.traceId })
      return
    }

    res.status(200).sendJson({
      code: 0,
      message: '查询成功',
      data: {
        id: o.id,
        outletCode: o.outlet_code,
        name: o.name,
        address: o.address,
        district: o.district,
        phone: o.phone,
        workHours: o.work_hours,
        latitude: o.latitude,
        longitude: o.longitude,
        services: o.services ? o.services.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
        contactInfo: [
          { type: '咨询电话', value: o.phone || '12333' },
          { type: '投诉电话', value: '12333' },
        ],
        nearbyBusStops: [
          { name: '政务中心站', lines: ['1路', '5路', '12路'], distance: '150米' },
          { name: '文化路口站', lines: ['3路', '8路'], distance: '300米' },
        ],
        sortOrder: o.sort_order,
        status: o.status,
        createdAt: o.created_at,
      },
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

router.get('/:id/vr', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).sendJson({ code: 400, message: '无效的ID', data: null, traceId: req.traceId })
      return
    }

    const db = getDatabase()
    const o = db.prepare('SELECT * FROM service_outlets WHERE id = ?').get(id) as ServiceOutletRow | undefined
    if (!o) {
      res.status(404).sendJson({ code: 404, message: '网点不存在', data: null, traceId: req.traceId })
      return
    }

    res.status(200).sendJson({
      code: 0,
      message: 'VR全景配置获取成功',
      data: buildVRConfig(id, o),
      traceId: req.traceId,
    })
  } catch (error) {
    const err = error as Error
    res.status(500).sendJson({ code: 500, message: '查询失败：' + err.message, data: null, traceId: req.traceId })
  }
})

export default router
