import type {
  Station,
  ChargingPile,
  ChargingPort,
  User,
  ChargingOrder,
  BillingDetail,
  AlertRecord,
  SettlementDetail,
  FirmwareUpgrade,
  CreditRecord,
  PricingRule,
  ProfitRule,
  SafetyConfig,
} from '@/types'

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const randFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals))

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const isoDate = (daysAgo: number, hourRange?: [number, number]) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  if (hourRange) {
    d.setHours(rand(hourRange[0], hourRange[1]), rand(0, 59), rand(0, 59))
  } else {
    d.setHours(rand(0, 23), rand(0, 59), rand(0, 59))
  }
  return d.toISOString()
}

const padId = (prefix: string, n: number, len = 4) =>
  `${prefix}${String(n).padStart(len, '0')}`

const STATION_SEED: {
  name: string
  region: string
  address: string
  lng: number
  lat: number
}[] = [
  {
    name: '南山科技园站',
    region: '南山区',
    address: '深圳市南山区科苑路15号',
    lng: 113.9348,
    lat: 22.5329,
  },
  {
    name: '福田CBD站',
    region: '福田区',
    address: '深圳市福田区深南大道1001号',
    lng: 114.0579,
    lat: 22.5431,
  },
  {
    name: '龙华民治站',
    region: '龙华区',
    address: '深圳市龙华区民治大道68号',
    lng: 114.0358,
    lat: 22.6317,
  },
  {
    name: '宝安西乡站',
    region: '宝安区',
    address: '深圳市宝安区西乡大道200号',
    lng: 113.8645,
    lat: 22.5698,
  },
  {
    name: '罗湖东门站',
    region: '罗湖区',
    address: '深圳市罗湖区东门中路12号',
    lng: 114.1312,
    lat: 22.5484,
  },
]

const PROPERTY_OWNERS = ['深圳万科物业', '中海物业管理', '碧桂园服务', '龙湖智创', '金地物业']

export const stations: Station[] = STATION_SEED.map((s, i) => ({
  station_id: padId('ST', i + 1),
  name: s.name,
  longitude: s.lng + randFloat(-0.005, 0.005, 4),
  latitude: s.lat + randFloat(-0.005, 0.005, 4),
  address: s.address,
  region: s.region,
  total_piles: 6,
  status: pick<Station['status']>(['运营中', '运营中', '运营中', '运营中', '维护中']),
  property_owner: PROPERTY_OWNERS[i % PROPERTY_OWNERS.length],
  fault_count: rand(0, 8),
}))

const PILE_MODELS = ['EVCS-A200', 'EVCS-B300', 'EVCS-C400']
const PILE_TYPES: ChargingPile['pile_type'][] = ['两轮', '三轮', '四轮']
const FIRMWARE_VERSIONS = ['v2.1.3', 'v2.2.0']
const PILE_STATUS_WEIGHTS: ChargingPile['status'][] = [
  '充电中', '充电中', '充电中', '充电中',
  '空闲', '空闲', '空闲',
  '故障', '故障',
  '离线',
]

export const chargingPiles: ChargingPile[] = stations.flatMap((st, si) => {
  return Array.from({ length: 6 }, (_, pi) => {
    const globalIdx = si * 6 + pi
    return {
      pile_id: padId('P', globalIdx + 1),
      station_id: st.station_id,
      pile_type: PILE_TYPES[pi % 3],
      model: PILE_MODELS[pi % 3],
      firmware_version: pick(FIRMWARE_VERSIONS),
      online_rate: randFloat(85, 99, 1),
      status: pick(PILE_STATUS_WEIGHTS),
      health_score: rand(60, 98),
      station_name: st.name,
      gbt_connected: Math.random() > 0.15,
      last_heartbeat: isoDate(rand(0, 0), [new Date().getHours(), new Date().getHours()]),
    }
  })
})

const MAX_POWER_MAP: Record<ChargingPile['pile_type'], [number, number]> = {
  '两轮': [200, 500],
  '三轮': [500, 1200],
  '四轮': [1000, 2000],
}

export const chargingPorts: ChargingPort[] = chargingPiles.flatMap((pile) => {
  const [minP, maxP] = MAX_POWER_MAP[pile.pile_type]
  const mp = rand(minP, maxP)
  return Array.from({ length: 4 }, (_, pi) => {
    let status: ChargingPort['status']
    let currentPower: number
    if (pile.status === '故障') {
      status = '故障'
      currentPower = 0
    } else if (pile.status === '离线') {
      status = '空闲'
      currentPower = 0
    } else if (pile.status === '充电中') {
      if (pi < 2) {
        status = '充电中'
        currentPower = randFloat(mp * 0.1, mp * 0.9, 1)
      } else {
        status = pick(['空闲', '已占用'])
        currentPower = status === '已占用' ? 0 : 0
      }
    } else {
      status = pick(['空闲', '空闲', '空闲', '已占用'])
      currentPower = 0
    }
    return {
      port_id: `${pile.pile_id}-${pi + 1}`,
      pile_id: pile.pile_id,
      port_number: pi + 1,
      status,
      max_power: mp,
      current_power: currentPower,
    }
  })
})

const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏窦章苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳丰鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅卞齐康伍余元卜顾孟平黄'.split('')
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '超', '秀英', '华', '慧', '建国', '志强', '秀兰', '玉兰', '婷', '雪', '琳', '宇', '浩', '鑫', '鹏', '飞', '磊', '博', '文', '辉', '嘉', '瑞', '思', '欣', '怡', '悦']

export const users: User[] = Array.from({ length: 50 }, (_, i) => {
  const surname = pick(SURNAMES)
  const given = pick(GIVEN_NAMES)
  let creditScore: number
  const r = Math.random()
  if (r < 0.05) creditScore = rand(10, 29)
  else if (r < 0.2) creditScore = rand(30, 69)
  else creditScore = rand(70, 100)

  let status: User['status']
  if (creditScore < 30) status = '黑名单'
  else if (creditScore < 60) status = '降权'
  else status = '正常'

  return {
    user_id: padId('U', i + 1),
    phone: `138${String(rand(10000000, 99999999))}`,
    nickname: `${surname}${given}`,
    credit_score: creditScore,
    charge_count: rand(0, 200),
    status,
    last_active: isoDate(rand(0, 30)),
  }
})

const ORDER_STATUSES: ChargingOrder['status'][] = [
  '已完成', '已完成', '已完成', '已完成', '已完成', '已完成', '已完成',
  '充电中', '充电中',
  '异常终止',
]
const START_METHODS: ChargingOrder['start_method'][] = ['扫码', '扫码', '扫码', '蓝牙', 'NFC']
const ABORT_REASONS = ['过载保护触发', '高温保护触发', '通信断连超时', '用户异常拔枪', '过充保护触发', '设备故障自动停止']
const chargingPortIds = chargingPorts.filter((p) => p.status === '充电中' || p.status === '空闲').map((p) => p.port_id)

export const chargingOrders: ChargingOrder[] = Array.from({ length: 520 }, (_, i) => {
  const status = pick(ORDER_STATUSES)
  const user = pick(users)
  const portId = pick(chargingPortIds)
  const pile = chargingPiles.find((p) => portId.startsWith(p.pile_id))!
  const station = stations.find((s) => s.station_id === pile.station_id)!
  const startMethod = pick(START_METHODS)
  const startDaysAgo = rand(0, 30)
  const startHour = rand(0, 23)
  const startMin = rand(0, 59)
  const startTime = new Date()
  startTime.setDate(startTime.getDate() - startDaysAgo)
  startTime.setHours(startHour, startMin, rand(0, 59))

  let energyKwh: number
  let endTime: Date
  if (status === '充电中') {
    energyKwh = randFloat(0.5, 8, 2)
    endTime = new Date()
  } else if (status === '异常终止') {
    energyKwh = randFloat(0.3, 6, 2)
    endTime = new Date(startTime.getTime() + rand(15, 180) * 60 * 1000)
  } else {
    energyKwh = randFloat(0.5, 15, 2)
    endTime = new Date(startTime.getTime() + rand(30, 480) * 60 * 1000)
  }

  const pricePerKwh = randFloat(1.5, 2.0, 2)
  const totalAmount = Number((energyKwh * pricePerKwh).toFixed(2))

  const abortReason = status === '异常终止' ? pick(ABORT_REASONS) : undefined
  const settlementStatus: ChargingOrder['settlement_status'] =
    status === '充电中' ? '待结算' :
    status === '异常终止' ? (Math.random() > 0.7 ? '退款中' as const : '已结算' as const) :
    (Math.random() > 0.3 ? '已结算' as const : '待结算' as const)
  const refundAmount = settlementStatus === '退款中' ? Number((totalAmount * randFloat(0.3, 1.0, 2)).toFixed(2)) : undefined

  return {
    order_id: padId('ORD', i + 1, 6),
    user_id: user.user_id,
    port_id: portId,
    pile_id: pile.pile_id,
    station_id: station.station_id,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    energy_kwh: energyKwh,
    total_amount: totalAmount,
    status,
    start_method: startMethod,
    user_nickname: user.nickname,
    pile_id_display: pile.pile_id,
    abort_reason: abortReason,
    settlement_status: settlementStatus,
    refund_amount: refundAmount,
  }
})

const ALERT_TYPES: AlertRecord['alert_type'][] = ['过载', '高温', '断连', '拔枪']
const ALERT_SEVERITIES: AlertRecord['severity'][] = ['紧急', '重要', '一般']
const ALERT_STATUSES: AlertRecord['status'][] = ['待处理', '已处理', '已处理']
const ALERT_DESCS: Record<AlertRecord['alert_type'], string[]> = {
  过载: ['充电功率超过额定值，自动降功率保护', '瞬时功率过大触发过载保护', '多端口同时充电导致总功率过载'],
  高温: ['充电桩内部温度超过阈值', '环境温度过高，设备散热异常', '电池温度异常升高，已暂停充电'],
  断连: ['设备与服务器通信中断超过30秒', '网络波动导致连接丢失', '信号弱导致设备离线'],
  拔枪: ['充电过程中检测到非正常拔枪', '充电未结束用户拔出充电枪', '充电枪被意外碰触脱落'],
}

export const alertRecords: AlertRecord[] = Array.from({ length: 110 }, (_, i) => {
  const alertType = pick(ALERT_TYPES)
  const pile = pick(chargingPiles)
  const order = pick(chargingOrders.filter((o) => o.pile_id === pile.pile_id)) ?? pick(chargingOrders)
  const severity = pick(ALERT_SEVERITIES)
  const triggeredAt = isoDate(rand(0, 7))
  return {
    alert_id: padId('ALT', i + 1, 5),
    pile_id: pile.pile_id,
    order_id: order.order_id,
    alert_type: alertType,
    severity,
    status: pick(ALERT_STATUSES),
    triggered_at: triggeredAt,
    description: pick(ALERT_DESCS[alertType]),
    snapshot_json: JSON.stringify({
      power: randFloat(100, 2500, 1),
      temp: randFloat(30, 80, 1),
      voltage: randFloat(200, 260, 1),
    }),
  }
})

const completedOrders = chargingOrders.filter((o) => o.status === '已完成')

export const settlementDetails: SettlementDetail[] = completedOrders.map((order, i) => {
  const gridRatio = randFloat(0.38, 0.42, 4)
  const propertyRatio = randFloat(0.23, 0.27, 4)
  const operatorRatio = Number((1 - gridRatio - propertyRatio).toFixed(4))
  return {
    settlement_id: padId('STL', i + 1, 6),
    order_id: order.order_id,
    total_amount: order.total_amount,
    grid_share: Number((order.total_amount * gridRatio).toFixed(2)),
    property_share: Number((order.total_amount * propertyRatio).toFixed(2)),
    operator_share: Number((order.total_amount * operatorRatio).toFixed(2)),
    grid_rule: '默认电网分成',
    property_rule: '默认物业分成',
    settled_at: new Date(new Date(order.end_time).getTime() + rand(1, 72) * 3600000).toISOString(),
  }
})

const FIRMWARE_POOL = ['v2.1.0', 'v2.1.3', 'v2.2.0', 'v2.2.1']

export const firmwareUpgrades: FirmwareUpgrade[] = Array.from({ length: 13 }, (_, i) => {
  const pile = chargingPiles[rand(0, chargingPiles.length - 1)]
  const fromIdx = rand(0, FIRMWARE_POOL.length - 2)
  const startedAt = isoDate(rand(0, 14))
  const status: FirmwareUpgrade['status'] = pick(['升级中', '成功', '成功', '成功', '失败'])
  return {
    upgrade_id: padId('FWU', i + 1, 4),
    pile_id: pile.pile_id,
    from_version: FIRMWARE_POOL[fromIdx],
    to_version: FIRMWARE_POOL[rand(fromIdx + 1, FIRMWARE_POOL.length - 1)],
    status,
    started_at: startedAt,
    completed_at: status !== '升级中'
      ? new Date(new Date(startedAt).getTime() + rand(5, 30) * 60000).toISOString()
      : '',
  }
})

const CREDIT_REASONS = [
  '正常完成充电，信用加分',
  '充电结束未拔枪，信用扣分',
  '恶意拔枪，信用扣分',
  '长期未使用，信用衰减',
  '按时缴费，信用加分',
  '逾期未缴费，信用扣分',
  '设备损坏赔偿，信用扣分',
  '优质用户奖励，信用加分',
  '频繁异常终止，信用扣分',
  '投诉成立，信用扣分',
]

export const creditRecords: CreditRecord[] = Array.from({ length: 42 }, (_, i) => {
  const reason = pick(CREDIT_REASONS)
  const isPositive = reason.includes('加分')
  return {
    record_id: padId('CR', i + 1, 5),
    user_id: pick(users).user_id,
    score_change: isPositive ? rand(1, 5) : -rand(1, 10),
    reason,
    rule_id: padId('RULE', isPositive ? rand(1, 5) : rand(6, 10)),
    created_at: isoDate(rand(0, 30)),
  }
})

export const pricingRules: PricingRule[] = [
  { period: '峰时', start_hour: 8, end_hour: 11, price: 1.2, service_fee: 0.3 },
  { period: '峰时', start_hour: 18, end_hour: 21, price: 1.2, service_fee: 0.3 },
  { period: '平时', start_hour: 7, end_hour: 8, price: 0.8, service_fee: 0.2 },
  { period: '平时', start_hour: 11, end_hour: 18, price: 0.8, service_fee: 0.2 },
  { period: '平时', start_hour: 21, end_hour: 23, price: 0.8, service_fee: 0.2 },
  { period: '谷时', start_hour: 23, end_hour: 7, price: 0.4, service_fee: 0.1 },
]

export const profitRules: ProfitRule[] = [
  {
    id: 'profit-default',
    name: '默认分成规则',
    grid_ratio: 0.4,
    property_ratio: 0.25,
    operator_ratio: 0.35,
  },
  {
    id: 'profit-tier-1',
    name: '小额订单分成',
    grid_ratio: 0.35,
    property_ratio: 0.25,
    operator_ratio: 0.4,
    min_amount: 0,
    max_amount: 10,
  },
  {
    id: 'profit-tier-2',
    name: '中额订单分成',
    grid_ratio: 0.4,
    property_ratio: 0.25,
    operator_ratio: 0.35,
    min_amount: 10,
    max_amount: 30,
  },
  {
    id: 'profit-tier-3',
    name: '大额订单分成',
    grid_ratio: 0.45,
    property_ratio: 0.25,
    operator_ratio: 0.3,
    min_amount: 30,
  },
]

export const safetyConfig: SafetyConfig = {
  max_charge_hours: 8,
  max_power_w: 2000,
  temp_threshold_c: 65,
  overload_threshold_w: 2200,
  disconnect_timeout_s: 30,
}

export const billingDetails: BillingDetail[] = completedOrders.slice(0, 200).map((order) => {
  const peakEnergy = randFloat(0, order.energy_kwh * 0.4, 2)
  const valleyEnergy = randFloat(0, order.energy_kwh * 0.3, 2)
  const flatEnergy = Number((order.energy_kwh - peakEnergy - valleyEnergy).toFixed(2))
  const peakPrice = 1.2
  const flatPrice = 0.8
  const valleyPrice = 0.4
  const totalElecFee = Number((peakEnergy * peakPrice + flatEnergy * flatPrice + valleyEnergy * valleyPrice).toFixed(2))
  const serviceFee = Number((order.total_amount - totalElecFee).toFixed(2))
  return {
    order_id: order.order_id,
    peak_energy: peakEnergy,
    flat_energy: Math.max(flatEnergy, 0),
    valley_energy: valleyEnergy,
    peak_price: peakPrice,
    flat_price: flatPrice,
    valley_price: valleyPrice,
    service_fee: serviceFee > 0 ? serviceFee : randFloat(0.1, 2, 2),
    total_electric_fee: totalElecFee,
    total_amount: order.total_amount,
  }
})
