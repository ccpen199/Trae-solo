import { Router } from 'express'

const router = Router()

interface StatementDetail {
  orderNo: string
  waybillNo: string
  serviceType: string
  cargoDescription: string
  weight: number
  volume: number
  origin: string
  destination: string
  shipmentDate: string
  deliveryDate: string
  quotedAmount: number
  actualAmount: number
  difference: number
  status: string
}

interface Statement {
  id: string
  statementNo: string
  customerName: string
  customerId: string
  orderCount: number
  totalAmount: number
  confirmedAmount: number
  difference: number
  status: 'unconfirmed' | 'confirmed' | 'rejected'
  month: string
  rejectReason?: string
  createdAt: string
  confirmedAt?: string
  details?: StatementDetail[]
}

interface AuditLog {
  id: string
  operator: string
  action: string
  target: string
  ip: string
  timestamp: string
  detail: string
}

const statementDetails: Record<string, StatementDetail[]> = {
  'stmt-001': [
    { orderNo: 'ORD-20260501-001', waybillNo: 'DB202605011200001234', serviceType: '精准卡航', cargoDescription: '精密数控机床', weight: 2112, volume: 12.6, origin: '广东省深圳市', destination: '北京市朝阳区', shipmentDate: '2026-05-02', deliveryDate: '2026-05-06', quotedAmount: 5280.00, actualAmount: 5280.00, difference: 0, status: 'delivered' },
    { orderNo: 'ORD-20260505-002', waybillNo: 'DB202605051030005678', serviceType: '精准汽运', cargoDescription: '工业机器人', weight: 1850, volume: 15.2, origin: '广东省广州市', destination: '上海市浦东新区', shipmentDate: '2026-05-06', deliveryDate: '2026-05-09', quotedAmount: 4625.00, actualAmount: 4700.00, difference: 75, status: 'delivered' },
    { orderNo: 'ORD-20260510-003', waybillNo: 'DB202605101420009012', serviceType: '精准卡航', cargoDescription: '大型发电机组', weight: 3200, volume: 28.8, origin: '上海市', destination: '重庆市渝北区', shipmentDate: '2026-05-11', deliveryDate: '2026-05-15', quotedAmount: 8000.00, actualAmount: 8000.00, difference: 0, status: 'delivered' }
  ],
  'stmt-002': [
    { orderNo: 'ORD-20260503-004', waybillNo: 'DB202605030915003456', serviceType: '精准卡航', cargoDescription: '医疗设备', weight: 850, volume: 6.8, origin: '江苏省苏州市', destination: '四川省成都市', shipmentDate: '2026-05-04', deliveryDate: '2026-05-08', quotedAmount: 3825.00, actualAmount: 3825.00, difference: 0, status: 'delivered' },
    { orderNo: 'ORD-20260508-005', waybillNo: 'DB202605081645007890', serviceType: '精准汽运', cargoDescription: '建筑钢结构', weight: 5600, volume: 42.5, origin: '浙江省杭州市', destination: '陕西省西安市', shipmentDate: '2026-05-09', deliveryDate: '2026-05-13', quotedAmount: 14000.00, actualAmount: 14200.00, difference: 200, status: 'delivered' }
  ],
  'stmt-003': [
    { orderNo: 'ORD-20260512-006', waybillNo: 'DB202605121100002345', serviceType: '精准卡航', cargoDescription: '半导体设备', weight: 1200, volume: 8.5, origin: '北京市', destination: '广东省东莞市', shipmentDate: '2026-05-13', deliveryDate: '2026-05-17', quotedAmount: 6600.00, actualAmount: 6600.00, difference: 0, status: 'delivered' }
  ],
  'stmt-004': [
    { orderNo: 'ORD-20260515-007', waybillNo: 'DB202605151330006789', serviceType: '精准汽运', cargoDescription: '化工原料罐', weight: 4200, volume: 35.0, origin: '山东省青岛市', destination: '湖北省武汉市', shipmentDate: '2026-05-16', deliveryDate: '2026-05-19', quotedAmount: 10500.00, actualAmount: 10500.00, difference: 0, status: 'delivered' },
    { orderNo: 'ORD-20260520-008', waybillNo: 'DB202605200845001234', serviceType: '精准卡航', cargoDescription: '风力发电机组件', weight: 6800, volume: 58.2, origin: '天津市', destination: '新疆乌鲁木齐', shipmentDate: '2026-05-21', deliveryDate: '2026-05-28', quotedAmount: 23800.00, actualAmount: 24500.00, difference: 700, status: 'delivered' }
  ],
  'stmt-005': [
    { orderNo: 'ORD-20260522-009', waybillNo: 'DB202605221520004567', serviceType: '精准卡航', cargoDescription: '数控机床', weight: 1950, volume: 14.3, origin: '辽宁省沈阳市', destination: '江苏省南京市', shipmentDate: '2026-05-23', deliveryDate: '2026-05-26', quotedAmount: 5850.00, actualAmount: 5850.00, difference: 0, status: 'delivered' },
    { orderNo: 'ORD-20260525-010', waybillNo: 'DB202605251010008901', serviceType: '精准汽运', cargoDescription: '重型机械配件', weight: 2800, volume: 22.1, origin: '河南省郑州市', destination: '湖南省长沙市', shipmentDate: '2026-05-26', deliveryDate: '2026-05-29', quotedAmount: 7000.00, actualAmount: 7150.00, difference: 150, status: 'delivered' },
    { orderNo: 'ORD-20260528-011', waybillNo: 'DB202605281400002345', serviceType: '精准卡航', cargoDescription: '电梯部件', weight: 3500, volume: 25.6, origin: '上海市', destination: '福建省厦门市', shipmentDate: '2026-05-29', deliveryDate: '2026-06-02', quotedAmount: 9625.00, actualAmount: 9625.00, difference: 0, status: 'in_transit' }
  ],
  'stmt-006': [
    { orderNo: 'ORD-20260530-012', waybillNo: 'DB202605300930006789', serviceType: '精准卡航', cargoDescription: '航空航天零部件', weight: 750, volume: 5.2, origin: '陕西省西安市', destination: '天津市', shipmentDate: '2026-05-31', deliveryDate: '2026-06-03', quotedAmount: 4125.00, actualAmount: 4125.00, difference: 0, status: 'in_transit' }
  ]
}

const statements: Statement[] = [
  {
    id: 'stmt-001',
    statementNo: 'DZ-2026-05-0001',
    customerName: '深圳华为技术有限公司',
    customerId: 'CUS-001',
    orderCount: 3,
    totalAmount: 17980.00,
    confirmedAmount: 17980.00,
    difference: 75.00,
    status: 'confirmed',
    month: '2026-05',
    createdAt: '2026-06-01 09:00:00',
    confirmedAt: '2026-06-03 14:30:00',
    details: statementDetails['stmt-001']
  },
  {
    id: 'stmt-002',
    statementNo: 'DZ-2026-05-0002',
    customerName: '上海汽车集团股份有限公司',
    customerId: 'CUS-002',
    orderCount: 2,
    totalAmount: 17825.00,
    confirmedAmount: 17825.00,
    difference: 200.00,
    status: 'confirmed',
    month: '2026-05',
    createdAt: '2026-06-01 09:15:00',
    confirmedAt: '2026-06-04 10:20:00',
    details: statementDetails['stmt-002']
  },
  {
    id: 'stmt-003',
    statementNo: 'DZ-2026-05-0003',
    customerName: '北京小米科技有限责任公司',
    customerId: 'CUS-003',
    orderCount: 1,
    totalAmount: 6600.00,
    confirmedAmount: 6600.00,
    difference: 0.00,
    status: 'confirmed',
    month: '2026-05',
    createdAt: '2026-06-01 09:30:00',
    confirmedAt: '2026-06-02 16:45:00',
    details: statementDetails['stmt-003']
  },
  {
    id: 'stmt-004',
    statementNo: 'DZ-2026-05-0004',
    customerName: '杭州阿里巴巴集团',
    customerId: 'CUS-004',
    orderCount: 2,
    totalAmount: 34300.00,
    confirmedAmount: 0.00,
    difference: 700.00,
    status: 'unconfirmed',
    month: '2026-05',
    createdAt: '2026-06-01 10:00:00',
    details: statementDetails['stmt-004']
  },
  {
    id: 'stmt-005',
    statementNo: 'DZ-2026-05-0005',
    customerName: '广州美的集团股份有限公司',
    customerId: 'CUS-005',
    orderCount: 3,
    totalAmount: 22600.00,
    confirmedAmount: 0.00,
    difference: 150.00,
    status: 'unconfirmed',
    month: '2026-05',
    createdAt: '2026-06-01 10:30:00',
    details: statementDetails['stmt-005']
  },
  {
    id: 'stmt-006',
    statementNo: 'DZ-2026-05-0006',
    customerName: '成都中航工业集团',
    customerId: 'CUS-006',
    orderCount: 1,
    totalAmount: 4125.00,
    confirmedAmount: 0.00,
    difference: 0.00,
    status: 'rejected',
    month: '2026-05',
    rejectReason: '运单状态显示在途，尚未完成配送，请确认后重新发起对账',
    createdAt: '2026-06-01 11:00:00',
    details: statementDetails['stmt-006']
  }
]

const auditLogs: AuditLog[] = [
  {
    id: 'log-001',
    operator: '张财务',
    action: '生成对账单',
    target: 'DZ-2026-05-0001',
    ip: '192.168.1.101',
    timestamp: '2026-06-01 09:00:00',
    detail: '批量生成2026年5月对账单，共6笔'
  },
  {
    id: 'log-002',
    operator: '李经理',
    action: '确认对账',
    target: 'DZ-2026-05-0001',
    ip: '192.168.1.102',
    timestamp: '2026-06-03 14:30:00',
    detail: '确认对账单 DZ-2026-05-0001，金额17,980.00元'
  },
  {
    id: 'log-003',
    operator: '王会计',
    action: '确认对账',
    target: 'DZ-2026-05-0003',
    ip: '192.168.1.103',
    timestamp: '2026-06-02 16:45:00',
    detail: '确认对账单 DZ-2026-05-0003，金额6,600.00元'
  },
  {
    id: 'log-004',
    operator: '赵审核',
    action: '驳回对账',
    target: 'DZ-2026-05-0006',
    ip: '192.168.1.104',
    timestamp: '2026-06-05 11:20:00',
    detail: '驳回对账单 DZ-2026-05-0006，原因：运单状态显示在途，尚未完成配送'
  },
  {
    id: 'log-005',
    operator: '陈主管',
    action: '确认对账',
    target: 'DZ-2026-05-0002',
    ip: '192.168.1.105',
    timestamp: '2026-06-04 10:20:00',
    detail: '确认对账单 DZ-2026-05-0002，金额17,825.00元'
  },
  {
    id: 'log-006',
    operator: '刘运营',
    action: '导出对账单',
    target: '2026-05',
    ip: '192.168.1.106',
    timestamp: '2026-06-06 09:15:00',
    detail: '导出2026年5月全部对账单，共6笔，合计103,430.00元'
  },
  {
    id: 'log-007',
    operator: '张财务',
    action: '修改对账单',
    target: 'DZ-2026-05-0004',
    ip: '192.168.1.101',
    timestamp: '2026-06-06 10:30:00',
    detail: '调整对账单 DZ-2026-05-0004 的差异金额，从750元更正为700元'
  },
  {
    id: 'log-008',
    operator: '系统管理员',
    action: '数据同步',
    target: 'TMS系统',
    ip: '10.0.0.1',
    timestamp: '2026-06-06 00:00:00',
    detail: '夜间自动同步TMS系统运单数据，共同步156笔运单'
  }
]

router.get('/statements', (req, res) => {
  const { status, month, customerId } = req.query

  let filteredStatements = [...statements]

  if (status) {
    filteredStatements = filteredStatements.filter(s => s.status === status)
  }

  if (month) {
    filteredStatements = filteredStatements.filter(s => s.month === month)
  }

  if (customerId) {
    filteredStatements = filteredStatements.filter(s => s.customerId === customerId)
  }

  const totalAmount = filteredStatements.reduce((sum, s) => sum + s.totalAmount, 0)
  const confirmedAmount = filteredStatements.reduce((sum, s) => sum + s.confirmedAmount, 0)
  const totalDifference = filteredStatements.reduce((sum, s) => sum + s.difference, 0)

  res.json({
    code: 200,
    data: {
      total: filteredStatements.length,
      unconfirmed: filteredStatements.filter(s => s.status === 'unconfirmed').length,
      confirmed: filteredStatements.filter(s => s.status === 'confirmed').length,
      rejected: filteredStatements.filter(s => s.status === 'rejected').length,
      totalAmount: Number(totalAmount.toFixed(2)),
      confirmedAmount: Number(confirmedAmount.toFixed(2)),
      totalDifference: Number(totalDifference.toFixed(2)),
      list: filteredStatements.map(s => {
        const { details, ...rest } = s
        return rest
      })
    }
  })
})

router.get('/statements/:id', (req, res) => {
  const { id } = req.params
  const statement = statements.find(s => s.id === id)

  if (!statement) {
    return res.status(404).json({ code: 404, message: '对账单不存在' })
  }

  res.json({
    code: 200,
    data: statement
  })
})

router.put('/statements/:id/confirm', (req, res) => {
  const { id } = req.params
  const { operator } = req.body

  const statement = statements.find(s => s.id === id)
  if (!statement) {
    return res.status(404).json({ code: 404, message: '对账单不存在' })
  }

  if (statement.status === 'confirmed') {
    return res.status(400).json({ code: 400, message: '该对账单已确认，请勿重复操作' })
  }

  statement.status = 'confirmed'
  statement.confirmedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
  statement.confirmedAmount = statement.totalAmount

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    operator: operator || '系统管理员',
    action: '确认对账',
    target: statement.statementNo,
    ip: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    detail: `确认对账单 ${statement.statementNo}，金额${statement.totalAmount.toLocaleString()}元`
  })

  res.json({
    code: 200,
    data: {
      id: statement.id,
      statementNo: statement.statementNo,
      status: 'confirmed',
      confirmedAt: statement.confirmedAt,
      confirmedAmount: statement.confirmedAmount,
      operator: operator || '系统管理员'
    },
    message: '对账确认成功'
  })
})

router.put('/statements/:id/reject', (req, res) => {
  const { id } = req.params
  const { reason, operator } = req.body

  if (!reason || !reason.trim()) {
    return res.status(400).json({ code: 400, message: '请填写驳回原因' })
  }

  const statement = statements.find(s => s.id === id)
  if (!statement) {
    return res.status(404).json({ code: 404, message: '对账单不存在' })
  }

  if (statement.status === 'confirmed') {
    return res.status(400).json({ code: 400, message: '该对账单已确认，无法驳回' })
  }

  statement.status = 'rejected'
  statement.rejectReason = reason.trim()

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    operator: operator || '系统管理员',
    action: '驳回对账',
    target: statement.statementNo,
    ip: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    detail: `驳回对账单 ${statement.statementNo}，原因：${reason}`
  })

  res.json({
    code: 200,
    data: {
      id: statement.id,
      statementNo: statement.statementNo,
      status: 'rejected',
      rejectReason: statement.rejectReason,
      operator: operator || '系统管理员'
    },
    message: '对账已驳回'
  })
})

router.get('/logs', (_req, res) => {
  res.json({
    code: 200,
    data: {
      total: auditLogs.length,
      list: auditLogs
    }
  })
})

export { router as auditingRouter }
