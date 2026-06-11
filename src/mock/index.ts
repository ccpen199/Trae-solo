import dayjs from 'dayjs'
import type {
  MonitorData,
  AlertEvent,
  RoutePlan,
  VideoReviewItem,
  ClaimRequest,
  VehicleInfo,
  DashboardStats,
  ApiEndpoint,
  AddressInfo,
  CargoItem,
  SdkDownloadItem,
  FaqItem,
  ScenarioOption,
  ValueAddedService,
  ProcessStep
} from '@/types'

export const mockAddresses: Record<'sender' | 'receiver', AddressInfo> = {
  sender: {
    name: '张伟',
    phone: '138****6688',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: '科技园南区深南大道10000号德邦物流中心',
    fullAddress: '广东省深圳市南山区科技园南区深南大道10000号德邦物流中心',
    latitude: 22.5431,
    longitude: 113.9545
  },
  receiver: {
    name: '李明',
    phone: '139****8899',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '建国门外大街1号国贸大厦B座',
    fullAddress: '北京市北京市朝阳区建国门外大街1号国贸大厦B座',
    latitude: 39.9087,
    longitude: 116.4571
  }
}

export const mockCargoItems: CargoItem[] = [
  {
    id: 'cargo001',
    name: '精密数控机床',
    length: 320,
    width: 180,
    height: 220,
    actualWeight: 1850,
    volumeWeight: 2112,
    chargeWeight: 2112,
    quantity: 1,
    packaging: 'wooden_box',
    value: 280000,
    isOversize: true,
    isOverweight: true
  }
]

export function generateMonitorData(hours: number = 24): MonitorData[] {
  const data: MonitorData[] = []
  const now = dayjs()
  let lat = 22.5431
  let lng = 113.9545
  const targetLat = 39.9087
  const targetLng = 116.4571

  for (let i = hours; i >= 0; i--) {
    const progress = 1 - i / hours
    lat = 22.5431 + (targetLat - 22.5431) * progress + (Math.random() - 0.5) * 0.1
    lng = 113.9545 + (targetLng - 113.9545) * progress + (Math.random() - 0.5) * 0.1

    const isNight = now.subtract(i, 'hour').hour() < 6 || now.subtract(i, 'hour').hour() > 20
    const temp = (isNight ? 8 : 22) + (Math.random() - 0.5) * (i % 5 === 0 ? 15 : 4)
    const humidity = 55 + (Math.random() - 0.5) * (i % 7 === 0 ? 30 : 10)
    const vibration = i % 3 === 0 ? 3 + Math.random() * 5 : 0.5 + Math.random() * 1.5

    data.push({
      timestamp: now.subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      temperature: Number(temp.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
      vibration: Number(vibration.toFixed(2)),
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      speed: Number((Math.random() * 80 + 20).toFixed(0)),
      location: progress < 0.2 ? '广东省境内' : progress < 0.5 ? '湖南省境内' : progress < 0.8 ? '河南省境内' : '河北省境内'
    })
  }
  return data
}

export const mockAlerts: AlertEvent[] = [
  {
    id: 'alert001',
    waybillNo: 'DB2026061100001',
    type: 'temperature',
    level: 'warning',
    value: 38.5,
    threshold: 40,
    unit: '℃',
    timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    location: '河南省郑州市G4京港澳高速',
    message: '温度接近上限阈值，请关注制冷系统状态',
    acknowledged: false
  },
  {
    id: 'alert002',
    waybillNo: 'DB2026061100001',
    type: 'vibration',
    level: 'critical',
    value: 7.2,
    threshold: 5,
    unit: 'g',
    timestamp: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    location: '湖南省长沙市G5513长张高速',
    message: '震动加速度严重超标，疑似货物颠簸，请减速或检查路面情况',
    acknowledged: true,
    acknowledgedBy: '调度员王芳',
    acknowledgedAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'alert003',
    waybillNo: 'DB2026061100002',
    type: 'humidity',
    level: 'warning',
    value: 85,
    threshold: 80,
    unit: '%RH',
    timestamp: dayjs().subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    location: '湖北省武汉市',
    message: '湿度超标，建议开启除湿设备',
    acknowledged: false
  }
]

export const mockRoutePlans: RoutePlan[] = [
  {
    id: 'route001',
    name: '推荐路线 · 京港澳高速',
    distance: 2158,
    duration: 1560,
    tollCost: 980,
    fuelCost: 2580,
    totalCost: 3560,
    heightRiskCount: 2,
    weightRiskCount: 0,
    restrictionCount: 3,
    riskLevel: 'low',
    waypoints: [
      { name: '深圳起点', latitude: 22.5431, longitude: 113.9545, type: 'start' },
      { name: '广州北三环限高4.2m', latitude: 23.4567, longitude: 113.6543, type: 'restriction', restriction: { type: 'height', value: 4.2, unit: 'm' } },
      { name: '长沙服务区', latitude: 28.2282, longitude: 112.9388, type: 'checkpoint' },
      { name: '郑州黄河大桥限重49t', latitude: 34.8897, longitude: 113.6468, type: 'restriction', restriction: { type: 'weight', value: 49, unit: 't' } },
      { name: '北京终点', latitude: 39.9087, longitude: 116.4571, type: 'end' }
    ]
  },
  {
    id: 'route002',
    name: '备选路线 · 大广高速',
    distance: 2246,
    duration: 1680,
    tollCost: 1050,
    fuelCost: 2680,
    totalCost: 3730,
    heightRiskCount: 0,
    weightRiskCount: 1,
    restrictionCount: 1,
    riskLevel: 'low',
    waypoints: [
      { name: '深圳起点', latitude: 22.5431, longitude: 113.9545, type: 'start' },
      { name: '赣州枢纽', latitude: 25.8311, longitude: 114.9339, type: 'checkpoint' },
      { name: '北京终点', latitude: 39.9087, longitude: 116.4571, type: 'end' }
    ]
  },
  {
    id: 'route003',
    name: '备选路线 · 沪蓉高速转京港澳',
    distance: 2320,
    duration: 1740,
    tollCost: 1120,
    fuelCost: 2760,
    totalCost: 3880,
    heightRiskCount: 3,
    weightRiskCount: 2,
    restrictionCount: 5,
    riskLevel: 'medium',
    waypoints: [
      { name: '深圳起点', latitude: 22.5431, longitude: 113.9545, type: 'start' },
      { name: '上海虹桥', latitude: 31.1933, longitude: 121.3331, type: 'checkpoint' },
      { name: '南京四桥限高4.5m', latitude: 32.1735, longitude: 118.9405, type: 'restriction', restriction: { type: 'height', value: 4.5, unit: 'm' } },
      { name: '北京终点', latitude: 39.9087, longitude: 116.4571, type: 'end' }
    ]
  }
]

export const mockVideoReviews: VideoReviewItem[] = [
  {
    id: 'video001',
    waybillNo: 'DB2026061100001',
    vehiclePlate: '粤B·A8888',
    driverName: '刘强',
    operationType: 'loading',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 285,
    uploadedAt: dayjs().subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    status: 'pending',
    aiScore: 92,
    tags: ['大件货物', '木箱包装']
  },
  {
    id: 'video002',
    waybillNo: 'DB2026061100002',
    vehiclePlate: '京A·F6666',
    driverName: '陈刚',
    operationType: 'unloading',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 196,
    uploadedAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    status: 'approved',
    aiScore: 88,
    reviewer: '审核员李娜',
    reviewedAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    reviewComment: '装卸规范，包装完好',
    tags: ['托盘', '叉车作业']
  },
  {
    id: 'video003',
    waybillNo: 'DB2026061000008',
    vehiclePlate: '沪B·D9999',
    driverName: '赵磊',
    operationType: 'loading',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 342,
    uploadedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    status: 'rejected',
    aiScore: 56,
    reviewer: '审核员王磊',
    reviewedAt: dayjs().subtract(20, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    reviewComment: '发现未使用指定吊装设备，货物倾斜风险，请重录',
    tags: ['违规操作', '吊装不规范']
  }
]

export const mockClaims: ClaimRequest[] = [
  {
    id: 'claim001',
    waybillNo: 'DB2026061100001',
    damageType: '外包装破损',
    damageDescription: '木箱右下角有明显裂痕，内部设备疑似受到冲击',
    damagePhotos: [],
    repairInvoices: [],
    claimAmount: 15800,
    status: 'submitted',
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    ocrResult: {
      waybillNo: 'DB2026061100001',
      senderName: '张伟',
      senderPhone: '138****6688',
      receiverName: '李明',
      receiverPhone: '139****8899',
      cargoName: '精密数控机床',
      cargoQuantity: 1,
      declaredValue: 280000,
      freight: 5280,
      confidence: 0.96
    }
  }
]

export const mockVehicles: VehicleInfo[] = [
  {
    plateNo: '粤B·A8888',
    vehicleType: '9.6m厢式货车',
    driverName: '刘强',
    driverPhone: '138****1111',
    maxWeight: 18,
    height: 4.0,
    length: 9.6,
    gpsDeviceId: 'GPS-SZ-00888',
    status: 'running',
    currentLocation: '河南省郑州市G4京港澳高速',
    currentSpeed: 72,
    lastUpdateTime: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    onlineStatus: 'online',
    transportPlatformConnected: true
  },
  {
    plateNo: '京A·F6666',
    vehicleType: '13m平板挂车',
    driverName: '陈刚',
    driverPhone: '139****2222',
    maxWeight: 32,
    height: 4.2,
    length: 13.0,
    gpsDeviceId: 'GPS-BJ-00666',
    status: 'idle',
    currentLocation: '北京市朝阳区德邦物流园',
    lastUpdateTime: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    onlineStatus: 'online',
    transportPlatformConnected: true
  },
  {
    plateNo: '沪B·D9999',
    vehicleType: '17.5m低平板',
    driverName: '赵磊',
    driverPhone: '137****3333',
    maxWeight: 40,
    height: 4.4,
    length: 17.5,
    gpsDeviceId: 'GPS-SH-00999',
    status: 'running',
    currentLocation: '江苏省苏州市G2京沪高速',
    currentSpeed: 65,
    lastUpdateTime: dayjs().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    onlineStatus: 'online',
    transportPlatformConnected: true
  },
  {
    plateNo: '粤B·C5555',
    vehicleType: '冷藏车',
    driverName: '孙明',
    driverPhone: '136****4444',
    maxWeight: 15,
    height: 3.8,
    length: 7.6,
    gpsDeviceId: 'GPS-SZ-00555',
    status: 'offline',
    lastUpdateTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    onlineStatus: 'offline',
    transportPlatformConnected: false
  }
]

export const mockDashboardStats: DashboardStats = {
  todayOrders: 128,
  todayRevenue: 685420,
  activeVehicles: 42,
  pendingAlerts: 7,
  weeklyOrderTrend: Array.from({ length: 7 }, (_, i) => ({
    date: dayjs().subtract(6 - i, 'day').format('MM/DD'),
    count: 90 + Math.floor(Math.random() * 60),
    revenue: 450000 + Math.floor(Math.random() * 300000)
  })),
  serviceDistribution: [
    { name: '标准大件', value: 45 },
    { name: '精密设备', value: 22 },
    { name: '冷链运输', value: 15 },
    { name: '搬家服务', value: 18 }
  ],
  alertDistribution: [
    { type: '温度告警', count: 3, level: 'warning' },
    { type: '湿度告警', count: 2, level: 'warning' },
    { type: '震动告警', count: 1, level: 'critical' },
    { type: '地理围栏', count: 1, level: 'warning' }
  ]
}

export const mockApiEndpoints: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/orders',
    name: '创建运单',
    category: '订单管理',
    description: '企业客户通过此接口批量或单条创建大件物流运单，系统自动计算体积重和运费',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'partnerOrderNo', type: 'string', required: true, description: '客户方订单号', in: 'body', example: 'ERP-20260611-0001' },
      { name: 'sender', type: 'object', required: true, description: '发货人信息', in: 'body' },
      { name: 'receiver', type: 'object', required: true, description: '收货人信息', in: 'body' },
      { name: 'cargoList', type: 'array', required: true, description: '货物列表', in: 'body' },
      { name: 'services', type: 'object', required: false, description: '增值服务选项', in: 'body' }
    ],
    requestExample: {
      partnerOrderNo: 'ERP-20260611-0001',
      sender: { name: '张伟', phone: '13800000000', address: '广东省深圳市南山区科技园' },
      receiver: { name: '李明', phone: '13900000000', address: '北京市朝阳区国贸大厦' },
      cargoList: [{ name: '数控机床', length: 320, width: 180, height: 220, actualWeight: 1850, quantity: 1, packaging: 'wooden_box' }]
    },
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        waybillNo: 'DB2026061100001',
        totalFreight: 5280.00,
        estimatedDays: 4,
        status: 'created'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/orders/{waybillNo}',
    name: '查询运单详情',
    category: '订单管理',
    description: '根据运单号查询运单的详细信息，包括货物状态、当前位置、预计到达时间等',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'waybillNo', type: 'string', required: true, description: '德邦运单号', in: 'path', example: 'DB2026061100001' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        waybillNo: 'DB2026061100001',
        status: 'in_transit',
        statusText: '运输中',
        currentLocation: '河南省郑州市G4京港澳高速',
        estimatedArrival: '2026-06-13 18:00:00',
        progress: 62,
        sender: { name: '张伟', phone: '138****0000' },
        receiver: { name: '李明', phone: '139****0000' },
        totalFreight: 5280.00
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/v1/orders/{waybillNo}',
    name: '更新运单信息',
    category: '订单管理',
    description: '更新运单的收货地址、联系人等信息，运单已发货后部分字段不可修改',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'waybillNo', type: 'string', required: true, description: '德邦运单号', in: 'path' },
      { name: 'receiver', type: 'object', required: false, description: '收货人信息', in: 'body' },
      { name: 'remark', type: 'string', required: false, description: '备注说明', in: 'body' }
    ],
    requestExample: {
      receiver: { name: '李明', phone: '13900000000', address: '北京市朝阳区建国门外大街2号' },
      remark: '请工作日上午送达'
    },
    responseExample: {
      code: 200,
      message: '更新成功',
      data: { waybillNo: 'DB2026061100001', updated: true }
    }
  },
  {
    method: 'DELETE',
    path: '/api/v1/orders/{waybillNo}',
    name: '取消运单',
    category: '订单管理',
    description: '取消尚未发货的运单，已发货的运单需联系客服处理',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'waybillNo', type: 'string', required: true, description: '德邦运单号', in: 'path' },
      { name: 'cancelReason', type: 'string', required: false, description: '取消原因', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: '取消成功',
      data: { waybillNo: 'DB2026061100001', status: 'cancelled' }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/orders',
    name: '运单列表查询',
    category: '订单管理',
    description: '分页查询企业名下所有运单，支持按状态、时间范围等条件筛选',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'page', type: 'integer', required: false, description: '页码，默认1', in: 'query', example: 1 },
      { name: 'pageSize', type: 'integer', required: false, description: '每页数量，默认20', in: 'query', example: 20 },
      { name: 'status', type: 'string', required: false, description: '运单状态筛选', in: 'query' },
      { name: 'startDate', type: 'string', required: false, description: '开始日期 YYYY-MM-DD', in: 'query' },
      { name: 'endDate', type: 'string', required: false, description: '结束日期 YYYY-MM-DD', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        total: 128,
        page: 1,
        pageSize: 20,
        list: [
          { waybillNo: 'DB2026061100001', status: 'in_transit', createTime: '2026-06-11 10:30:00' },
          { waybillNo: 'DB2026061100002', status: 'delivered', createTime: '2026-06-11 09:15:00' }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/tracking/{waybillNo}/monitor',
    name: '获取运输监控数据',
    category: '运输监控',
    description: '获取指定运单的温湿度、震动、GPS等实时及历史监控数据',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'waybillNo', type: 'string', required: true, description: '运单号', in: 'path', example: 'DB2026061100001' },
      { name: 'startTime', type: 'string', required: false, description: '开始时间 ISO8601', in: 'query' },
      { name: 'endTime', type: 'string', required: false, description: '结束时间 ISO8601', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        latest: { temperature: 22.5, humidity: 55, vibration: 1.2, latitude: 34.7466, longitude: 113.6254, speed: 72 },
        alerts: [{ id: 'alert001', type: 'vibration', level: 'critical', timestamp: '2026-06-11 10:00:00' }],
        history: [
          { timestamp: '2026-06-11 14:00:00', temperature: 22.3, humidity: 54, vibration: 0.8 },
          { timestamp: '2026-06-11 15:00:00', temperature: 22.5, humidity: 55, vibration: 1.2 }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/tracking/{waybillNo}/route',
    name: '获取运输轨迹',
    category: '运输监控',
    description: '获取运单的完整GPS轨迹数据，用于地图展示运输路径',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'waybillNo', type: 'string', required: true, description: '运单号', in: 'path' },
      { name: 'interval', type: 'string', required: false, description: '采样间隔：5min/15min/1h', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        waybillNo: 'DB2026061100001',
        points: [
          { timestamp: '2026-06-11 08:00:00', latitude: 22.5431, longitude: 113.9545, location: '深圳市德邦物流园' },
          { timestamp: '2026-06-11 12:00:00', latitude: 28.2282, longitude: 112.9388, location: '长沙市' },
          { timestamp: '2026-06-11 16:00:00', latitude: 34.7466, longitude: 113.6254, location: '郑州市' }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/alerts',
    name: '告警事件列表',
    category: '运输监控',
    description: '查询企业运单的告警事件，支持按类型、级别、时间筛选',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'type', type: 'string', required: false, description: '告警类型：temperature/humidity/vibration/geo', in: 'query' },
      { name: 'level', type: 'string', required: false, description: '告警级别：warning/critical', in: 'query' },
      { name: 'page', type: 'integer', required: false, description: '页码', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        total: 7,
        list: [
          { id: 'alert001', waybillNo: 'DB2026061100001', type: 'vibration', level: 'critical', message: '震动加速度超标', timestamp: '2026-06-11 10:00:00' },
          { id: 'alert002', waybillNo: 'DB2026061100001', type: 'temperature', level: 'warning', message: '温度接近上限', timestamp: '2026-06-11 08:00:00' }
        ]
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/webhook/subscribe',
    name: '订阅状态回调',
    category: '运输监控',
    description: '配置运单状态变更的Webhook回调地址，实时推送运输进展',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'callbackUrl', type: 'string', required: true, description: '回调地址URL', in: 'body', example: 'https://api.example.com/webhook/debang' },
      { name: 'events', type: 'array', required: true, description: '订阅事件类型', in: 'body' },
      { name: 'secret', type: 'string', required: true, description: '签名密钥', in: 'body' }
    ],
    requestExample: {
      callbackUrl: 'https://api.example.com/webhook/debang',
      events: ['order_created', 'in_transit', 'delivered', 'alert_triggered'],
      secret: 'your_sign_secret_key'
    },
    responseExample: {
      code: 200,
      message: '订阅成功',
      data: { subscriptionId: 'SUB20260611001', status: 'active' }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/claims',
    name: '提交理赔申请',
    category: '理赔服务',
    description: '在线提交破损理赔申请，支持结构化材料上传',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'waybillNo', type: 'string', required: true, description: '运单号', in: 'body', example: 'DB2026061100001' },
      { name: 'damageType', type: 'string', required: true, description: '破损类型：外包装破损/货物损坏/丢失', in: 'body' },
      { name: 'damageDescription', type: 'string', required: true, description: '破损详情描述', in: 'body' },
      { name: 'damagePhotos', type: 'array', required: true, description: '破损照片URL列表', in: 'body' },
      { name: 'claimAmount', type: 'number', required: true, description: '索赔金额（元）', in: 'body', example: 15800 }
    ],
    requestExample: {
      waybillNo: 'DB2026061100001',
      damageType: '外包装破损',
      damageDescription: '木箱右下角有明显裂痕，疑似装卸时受到撞击',
      damagePhotos: ['https://cdn.example.com/photo1.jpg', 'https://cdn.example.com/photo2.jpg'],
      claimAmount: 15800
    },
    responseExample: {
      code: 200,
      message: '提交成功',
      data: { claimId: 'CLM20260611001', status: 'submitted', estimatedDays: 3 }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/claims/{claimId}',
    name: '查询理赔进度',
    category: '理赔服务',
    description: '根据理赔单号查询理赔处理进度和当前状态',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'claimId', type: 'string', required: true, description: '理赔单号', in: 'path', example: 'CLM20260611001' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        claimId: 'CLM20260611001',
        waybillNo: 'DB2026061100001',
        status: 'reviewing',
        statusText: '审核中',
        claimAmount: 15800,
        approvedAmount: null,
        currentStep: 2,
        totalSteps: 5,
        timeline: [
          { time: '2026-06-11 09:00:00', action: '已提交申请', operator: '客户' },
          { time: '2026-06-11 14:30:00', action: '材料审核中', operator: '理赔专员' }
        ]
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/v1/claims/{claimId}/materials',
    name: '补充理赔材料',
    category: '理赔服务',
    description: '补充或替换理赔申请的证明材料，如维修发票、检测报告等',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'claimId', type: 'string', required: true, description: '理赔单号', in: 'path' },
      { name: 'repairInvoices', type: 'array', required: false, description: '维修发票', in: 'body' },
      { name: 'inspectionReports', type: 'array', required: false, description: '检测报告', in: 'body' }
    ],
    requestExample: {
      repairInvoices: [{ invoiceNo: 'INV20260611001', amount: 12000, imageUrl: 'https://cdn.example.com/invoice.jpg' }]
    },
    responseExample: {
      code: 200,
      message: '材料补充成功',
      data: { claimId: 'CLM20260611001', updated: true }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/vehicles',
    name: '获取车辆列表',
    category: '车辆管理',
    description: '获取企业名下全部或指定车辆的实时状态及位置信息（对接交通运输部平台数据）',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'status', type: 'string', required: false, description: '车辆状态：running/idle/offline/maintenance', in: 'query' },
      { name: 'page', type: 'integer', required: false, description: '页码', in: 'query' },
      { name: 'pageSize', type: 'integer', required: false, description: '每页数量', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        total: 42,
        list: [
          {
            plateNo: '粤B·A8888',
            vehicleType: '9.6m厢式货车',
            driverName: '刘强',
            status: 'running',
            currentLocation: '河南省郑州市G4京港澳高速',
            currentSpeed: 72,
            lastUpdateTime: '2026-06-11 15:42:18',
            transportPlatformConnected: true
          }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/vehicles/{plateNo}',
    name: '获取车辆详情',
    category: '车辆管理',
    description: '获取单台车辆的详细信息，包括基本参数、行驶证信息、保险状态等',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'plateNo', type: 'string', required: true, description: '车牌号', in: 'path', example: '粤B·A8888' }
    ],
    responseExample: {
      code: 200,
      message: 'success',
      data: {
        plateNo: '粤B·A8888',
        vehicleType: '9.6m厢式货车',
        driverName: '刘强',
        driverPhone: '138****1111',
        maxWeight: 18,
        height: 4.0,
        length: 9.6,
        gpsDeviceId: 'GPS-SZ-00888',
        status: 'running',
        currentLocation: '河南省郑州市G4京港澳高速',
        currentSpeed: 72,
        lastUpdateTime: '2026-06-11 15:42:18',
        onlineStatus: 'online',
        transportPlatformConnected: true,
        insuranceExpireDate: '2027-03-15',
        annualInspectionExpireDate: '2026-12-01'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/vehicles',
    name: '注册车辆',
    category: '车辆管理',
    description: '注册新车辆到企业名下，需提供行驶证和车辆基本信息',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'plateNo', type: 'string', required: true, description: '车牌号', in: 'body', example: '粤B·B7777' },
      { name: 'vehicleType', type: 'string', required: true, description: '车辆类型', in: 'body' },
      { name: 'maxWeight', type: 'number', required: true, description: '最大载重（吨）', in: 'body' },
      { name: 'length', type: 'number', required: true, description: '车长（米）', in: 'body' },
      { name: 'driverName', type: 'string', required: true, description: '驾驶员姓名', in: 'body' },
      { name: 'driverPhone', type: 'string', required: true, description: '驾驶员电话', in: 'body' }
    ],
    requestExample: {
      plateNo: '粤B·B7777',
      vehicleType: '6.8m厢式货车',
      maxWeight: 10,
      length: 6.8,
      driverName: '周师傅',
      driverPhone: '13800007777'
    },
    responseExample: {
      code: 200,
      message: '注册成功',
      data: { plateNo: '粤B·B7777', gpsDeviceId: 'GPS-SZ-00777', status: 'pending_activation' }
    }
  },
  {
    method: 'DELETE',
    path: '/api/v1/vehicles/{plateNo}',
    name: '注销车辆',
    category: '车辆管理',
    description: '从企业名下注销车辆，注销后不再产生监控数据',
    params: [
      { name: 'Authorization', type: 'string', required: true, description: 'Bearer {access_token}', in: 'header' },
      { name: 'plateNo', type: 'string', required: true, description: '车牌号', in: 'path' },
      { name: 'reason', type: 'string', required: false, description: '注销原因', in: 'query' }
    ],
    responseExample: {
      code: 200,
      message: '注销成功',
      data: { plateNo: '粤B·B7777', status: 'cancelled' }
    }
  }
]

export const mockSdkDownloads: SdkDownloadItem[] = [
  { language: 'Java', version: '2.1.0', size: '3.2 MB', updatedAt: '2026-05-20', description: '适用于Java 8+，支持Spring Boot集成' },
  { language: 'Python', version: '1.8.2', size: '1.5 MB', updatedAt: '2026-06-01', description: '适用于Python 3.7+，支持异步调用' },
  { language: 'Node.js', version: '2.0.1', size: '856 KB', updatedAt: '2026-05-28', description: '适用于Node.js 14+，支持TypeScript' },
  { language: 'PHP', version: '1.6.0', size: '1.1 MB', updatedAt: '2026-04-15', description: '适用于PHP 7.2+，支持Composer安装' }
]

export const mockFaqList: FaqItem[] = [
  {
    category: '申请流程',
    question: 'API对接申请需要多长时间审核？',
    answer: '一般情况下，企业资质审核需要1-3个工作日。审核通过后，系统会自动向您的注册邮箱发送AppKey和AppSecret，并开放沙箱环境用于联调测试。如资料不完整，审核专员会通过电话或邮件联系您补充材料。'
  },
  {
    category: '申请流程',
    question: '对接申请被驳回怎么办？',
    answer: '申请被驳回后，您可以登录企业开放平台查看驳回原因，根据提示补充或修改相关资料后重新提交。常见驳回原因包括：营业执照不清晰、企业信息填写有误、联系电话无法接通等。如有疑问可拨打客服热线400-XXX-XXXX。'
  },
  {
    category: '接口使用',
    question: 'API的调用频率限制是多少？',
    answer: '基础版账户默认QPS限制为50次/秒，日调用量上限10万次。如您需要更高配额，可在"增值服务"中申请升级套餐，或联系客户经理定制专属方案。所有接口均支持批量调用以减少请求次数。'
  },
  {
    category: '接口使用',
    question: '如何保障API调用的安全性？',
    answer: '我们采用多重安全机制：1) 所有接口必须通过HTTPS访问；2) 使用OAuth 2.0进行身份认证，Token有效期2小时；3) 重要操作接口需要对请求参数进行签名验证；4) 支持配置IP白名单；5) 每次调用都有详细的审计日志可追溯。'
  },
  {
    category: '费用计费',
    question: 'API调用如何收费？',
    answer: '企业开放平台采用阶梯定价模式：月调用量10万次以内免费，10万-100万次按0.01元/次计费，100万次以上享受阶梯优惠。增值服务（如运单推送、状态回调、短信通知）单独计费。详情请参考"价格方案"页面或联系销售顾问。'
  },
  {
    category: '费用计费',
    question: '是否提供免费测试额度？',
    answer: '是的，新申请企业可获得1个月的免费试用期，包含30万次免费调用额度和所有增值服务体验。试用期结束后，您可以根据实际需求选择合适的套餐，或继续使用免费版（10万次/月）。'
  },
  {
    category: '技术支持',
    question: '联调测试遇到问题如何获取帮助？',
    answer: '我们提供多种技术支持渠道：1) 在线文档和常见问题FAQ；2) 开发者社区论坛；3) 企业专属技术支持群（钉钉/企业微信）；4) 7x24小时技术支持热线。铂金版及以上客户还可享受专属技术顾问一对一服务。'
  },
  {
    category: '技术支持',
    question: '是否支持私有化部署？',
    answer: '支持。对于有特殊数据安全或合规要求的大型企业客户，我们提供完整的私有化部署方案，包括API网关、订单处理引擎、监控系统等全部组件的独立部署。详情请联系您的客户经理或拨打销售热线。'
  }
]

export const mockScenarioOptions: ScenarioOption[] = [
  { id: 'ecommerce', name: '电商平台', icon: 'ShoppingCart', description: 'B2C/B2B电商平台集成，订单自动流转' },
  { id: 'erp', name: 'ERP系统', icon: 'LayoutGrid', description: '与SAP/用友/金蝶等ERP系统无缝对接' },
  { id: 'wms', name: 'WMS系统', icon: 'Warehouse', description: '仓储管理系统对接，库存与物流联动' },
  { id: 'custom', name: '自建系统', icon: 'Code2', description: '企业自研业务系统深度定制集成' },
  { id: 'other', name: '其他场景', icon: 'MoreHorizontal', description: '其他业务场景，请在备注中说明' }
]

export const mockValueAddedServices: ValueAddedService[] = [
  { id: 'push', name: '运单推送', price: '￥0.02/次', description: '主动推送运单创建与状态变更至您的系统' },
  { id: 'callback', name: '状态回调', price: '￥0.01/次', description: '运单签收、异常等关键节点实时回调通知' },
  { id: 'sms', name: '短信通知', price: '￥0.05/条', description: '收发件人签收短信提醒，可自定义模板' },
  { id: 'vip', name: '专属客服', price: '￥2,000/月', description: '7x24小时专属技术支持经理，SLA 99.99%' }
]

export const mockApplyProcess: ProcessStep[] = [
  { title: '提交申请', description: '填写企业信息并上传资质材料', icon: 'FileText' },
  { title: '资质审核', description: '德邦审核企业资质与经营范围', duration: '1-3工作日', icon: 'ShieldCheck' },
  { title: '获取密钥', description: '审核通过后获取AppKey和Secret', icon: 'KeyRound' },
  { title: '联调测试', description: '沙箱环境完成接口联调测试', duration: '约1周', icon: 'TestTubeDiagonal' },
  { title: '正式上线', description: '生产环境开通，正式接入使用', icon: 'Rocket' }
]
