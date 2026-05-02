# TMS运输调度系统规范文档

## 一、核心角色与职责

### 1.1 调度员（Dispatcher）
- 负责订单导入和运输任务生成
- 执行智能派车调度操作
- 监控在途运输状态
- 处理异常情况和调度调整

### 1.2 司机（Driver）
- 接收运单任务并确认接单
- 执行提货、出发、运输、到达操作
- 上报运输途中异常情况
- 完成电子签收和回单上传

### 1.3 客户（Customer）
- 导入或创建运输订单
- 实时查看在途运输状态
- 查看签收结果和回单
- 查看运费信息和对账

### 1.4 财务（Finance）
- 执行运费计算和审核
- 生成客户对账单
- 生成承运商结算单
- 管理发票和付款

---

## 二、核心对象模型

### 2.1 订单对象（Order）
```
Order {
  id: UUID (主键)
  order_no: String (订单编号，格式：ORD-YYYYMMDD-XXXX)
  customer_id: UUID (客户ID)
  customer_name: String
  customer_contact: String
  customer_phone: String

  // 提货信息
  pickup_address: String
  pickup_city: String
  pickup_district: String
  pickup_contact: String
  pickup_phone: String
  pickup_lat: Decimal
  pickup_lng: Decimal
  pickup_time: DateTime (期望提货时间)

  // 收货信息
  delivery_address: String
  delivery_city: String
  delivery_district: String
  delivery_contact: String
  delivery_phone: String
  delivery_lat: Decimal
  delivery_lng: Decimal

  // 货物信息
  goods_type: String (货物类型)
  goods_name: String
  weight: Decimal (吨位，单位：吨)
  volume: Decimal (体积，单位：方)
  quantity: Integer (件数)
  package_type: String (包装类型)

  // 价值信息
  declared_value: Decimal (声明价值)
  freight_prepaid: Decimal (预付运费)
  freight_collect: Decimal (到付运费)

  // 状态和时间
  status: Enum (PENDING, DISPATCHED, IN_TRANSIT, COMPLETED, CANCELLED)
  created_at: DateTime
  updated_at: DateTime
  created_by: UUID
}
```

### 2.2 运输任务对象（TransportTask）
```
TransportTask {
  id: UUID (主键)
  task_no: String (任务编号，格式：TSK-YYYYMMDD-XXXX)
  order_id: UUID (关联订单ID)

  // 路线信息
  route_id: UUID (路线ID)
  route_name: String
  estimated_distance: Decimal (预估距离，单位：公里)
  estimated_duration: Integer (预估时长，单位：分钟)

  // 调度信息
  dispatcher_id: UUID (调度员ID)
  assigned_at: DateTime

  // 状态
  status: Enum (PENDING_DISPATCH, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED)
  priority: Enum (NORMAL, URGENT)
  remark: String

  created_at: DateTime
  updated_at: DateTime
}
```

### 2.3 运单对象（Waybill）
```
Waybill {
  id: UUID (主键)
  waybill_no: String (运单号，格式：WB-XXXXXXXX)
  transport_task_id: UUID (运输任务ID)

  // 关联信息
  order_id: UUID (订单ID)
  order_no: String

  // 承运信息
  vehicle_id: UUID (车辆ID)
  vehicle_no: String (车牌号)
  driver_id: UUID (司机ID)
  driver_name: String
  driver_phone: String

  // 调度信息
  dispatcher_id: UUID (调度员ID)
  dispatched_at: DateTime

  // 路线信息
  planned_route: JSON (计划路线，包含途经点)
  actual_route: JSON (实际路线)
  total_distance: Decimal (总里程)
  actual_distance: Decimal (实际行驶里程)

  // 费用信息
  freight_amount: Decimal (运费)
  distance_fee: Decimal (里程费)
  weight_fee: Decimal (吨位费)
  additional_fees: JSON (附加费明细)
  total_freight: Decimal (总运费)

  // 状态
  status: Enum (
    CREATED,        // 运单创建
    ASSIGNED,       // 已分配司机
    ACCEPTED,       // 司机已接单
    PICKED_UP,      // 已提货
    DEPARTED,       // 已出发
    IN_TRANSIT,     // 运输中
    ARRIVED,        // 已到达
    UNLOADING,      // 卸货中
    SIGNED,         // 已签收
    COMPLETED       // 已完成
  )

  // 时间节点
  assigned_at: DateTime
  accepted_at: DateTime
  picked_up_at: DateTime
  departed_at: DateTime
  arrived_at: DateTime
  signed_at: DateTime
  completed_at: DateTime

  created_at: DateTime
  updated_at: DateTime
}
```

### 2.4 车辆对象（Vehicle）
```
Vehicle {
  id: UUID (主键)
  vehicle_no: String (车牌号)
  vehicle_type: Enum (OPEN_TRUCK, CLOSED_VAN, FLATBED, TANKER, REFRIGERATED)

  // 车辆规格
  length: Decimal (车长，单位：米)
  width: Decimal
  height: Decimal
  max_load: Decimal (最大载重，单位：吨)
  max_volume: Decimal (最大容积，单位：方)
  container_no: String (车厢号)

  // 当前状态
  status: Enum (AVAILABLE, IN_USE, MAINTENANCE, RETIRED)
  current_driver_id: UUID (当前司机ID)
  current_lat: Decimal
  current_lng: Decimal
  current_address: String
  last_location_update: DateTime

  // 运营信息
  insurance_no: String
  insurance_expire: Date
  annual_inspection: Date
  maintenance_km: Integer (保养里程)

  // 绑定信息
  owner_type: Enum (SELF, LEASED, THIRD_PARTY)
  owner_name: String
  owner_contact: String

  created_at: DateTime
  updated_at: DateTime
}
```

### 2.5 司机对象（Driver）
```
Driver {
  id: UUID (主键)
  driver_no: String (司机编号)
  name: String
  phone: String
  id_card: String
  license_no: String
  license_type: Enum (A1, A2, B1, B2, C1, C2)
  license_expire: Date

  // 绑定车辆
  vehicle_id: UUID

  // 状态
  status: Enum (AVAILABLE, ON_DUTY, OFF_DUTY, LEAVE)
  current_waybill_id: UUID (当前运单ID)

  // 位置
  current_lat: Decimal
  current_lng: Decimal
  last_location_update: DateTime

  // 绩效
  total_orders: Integer
  completion_rate: Decimal
  accident_count: Integer

  created_at: DateTime
  updated_at: DateTime
}
```

### 2.6 路线对象（Route）
```
Route {
  id: UUID (主键)
  route_no: String (路线编号)
  route_name: String
  origin_city: String
  destination_city: String
  distance: Decimal (距离，单位：公里)
  duration: Integer (时长，单位：分钟)
  toll_fee: Decimal (过路费)

  // 途经点
  waypoints: JSON [
    {
      sequence: Integer,
      city: String,
      address: String,
      lat: Decimal,
      lng: Decimal
    }
  ]

  // 费用标准
  base_fee: Decimal (起步费)
  per_km_fee: Decimal (每公里费用)
  per_ton_fee: Decimal (每吨费用)

  status: Enum (ACTIVE, INACTIVE)
  created_at: DateTime
}
```

### 2.7 轨迹对象（GpsTrack）
```
GpsTrack {
  id: UUID (主键)
  waybill_id: UUID
  vehicle_id: UUID
  driver_id: UUID

  lat: Decimal
  lng: Decimal
  address: String
  speed: Decimal (速度，单位：km/h)
  direction: Integer (方向，0-360度)
  altitude: Decimal (海拔)

  location_type: Enum (NORMAL, STOP, IDLE, ANOMALY)
  stop_duration: Integer (停车时长，单位：秒)
  engine_status: Enum (ON, OFF)

  recorded_at: DateTime (定位时间)
  received_at: DateTime (接收时间)
}
```

### 2.8 异常对象（Exception）
```
Exception {
  id: UUID (主键)
  waybill_id: UUID
  exception_no: String

  type: Enum (
    TRAFFIC_JAM,      // 堵车
    ACCIDENT,         // 事故
    VEHICLE_BREAKDOWN, // 车辆故障
    WEATHER_DELAY,    // 天气延误
    GOODS_DAMAGE,     // 货损
    DELIVERY_DELAY,   // 派送延误
    OTHER            // 其他
  )

  description: String
  report_lat: Decimal
  report_lng: Decimal
  report_address: String
  report_by: UUID (上报人)
  reported_at: DateTime

  // 处理信息
  handled_by: UUID
  handled_at: DateTime
  handling_result: String
  status: Enum (REPORTED, HANDLING, RESOLVED, CLOSED)

  images: JSON (现场照片)

  created_at: DateTime
  updated_at: DateTime
}
```

### 2.9 回单对象（Receipt）
```
Receipt {
  id: UUID (主键)
  receipt_no: String (回单号)
  waybill_id: UUID

  // 签收信息
  signed_by: String (签收人)
  signed_at: DateTime
  signed_lat: Decimal
  signed_lng: Decimal

  // 回单照片
  photos: JSON [
    {
      url: String,
      type: Enum (SIGNATURE, SEAL, PHOTO),
      uploaded_at: DateTime
    }
  ]

  // 签收备注
  remark: String
  damage_photos: JSON (货损照片)

  status: Enum (PENDING, UPLOADED, VERIFIED)
  verified_by: UUID
  verified_at: DateTime

  created_at: DateTime
}
```

### 2.10 运费对象（Freight）
```
Freight {
  id: UUID (主键)
  freight_no: String
  waybill_id: UUID
  waybill_no: String

  // 计费信息
  distance: Decimal (计费里程)
  weight: Decimal (计费吨位)
  volume: Decimal (计费体积)

  // 费用明细
  distance_fee: Decimal
  weight_fee: Decimal
  volume_fee: Decimal
  pickup_fee: Decimal (提货费)
  delivery_fee: Decimal (送货费)
  additional_fees: JSON (附加费)
  discount: Decimal (折扣)
  total_freight: Decimal (总运费)

  // 计算依据（用于解释计算结果）
  calculation_basis: JSON {
    unit_price_per_km: Decimal,
    unit_price_per_ton: Decimal,
    minimum_charge: Decimal,
    formula: String,
    adjustments: JSON
  }

  // 审核状态
  status: Enum (CALCULATED, CONFIRMED, INVOICED, PAID)
  calculated_by: UUID
  calculated_at: DateTime
  confirmed_by: UUID
  confirmed_at: DateTime

  created_at: DateTime
  updated_at: DateTime
}
```

### 2.11 对账单对象（Statement）
```
Statement {
  id: UUID (主键)
  statement_no: String (对账单号)
  statement_type: Enum (CUSTOMER, CARRIER)

  // 对象信息
  customer_id: UUID
  customer_name: String
  carrier_id: UUID
  carrier_name: String

  // 结算周期
  period_start: Date
  period_end: Date

  // 汇总信息
  total_orders: Integer
  total_distance: Decimal
  total_weight: Decimal
  subtotal: Decimal (小计)
  adjustment: Decimal (调整)
  total_amount: Decimal (总金额)

  // 对账明细
  line_items: JSON [
    {
      waybill_no: String,
      order_no: String,
      route: String,
      distance: Decimal,
      weight: Decimal,
      freight: Decimal,
      status: String
    }
  ]

  status: Enum (DRAFT, SENT, CONFIRMED, DISPUTED, SETTLED)
  due_date: Date

  created_at: DateTime
  updated_at: DateTime
}
```

---

## 三、生命周期状态

### 3.1 订单生命周期（Order Lifecycle）
```
[PENDING] → [DISPATCHED] → [IN_TRANSIT] → [COMPLETED]
                ↓
           [CANCELLED]
```

### 3.2 运输任务生命周期（Transport Task Lifecycle）
```
[PENDING_DISPATCH] → [DISPATCHED] → [IN_PROGRESS] → [COMPLETED]
                         ↓
                    [CANCELLED]
```

### 3.3 运单生命周期（Waybill Lifecycle）
```
[CREATED] → [ASSIGNED] → [ACCEPTED] → [PICKED_UP] → [DEPARTED] → [IN_TRANSIT] → [ARRIVED] → [UNLOADING] → [SIGNED] → [COMPLETED]
                                                                                    ↓
                                                                              [EXCEPTION]
```

### 3.4 车辆生命周期（Vehicle Lifecycle）
```
[AVAILABLE] ↔ [IN_USE]
      ↓
[MAINTENANCE]
      ↓
[RETIRED]
```

### 3.5 司机状态（Driver Status）
```
[AVAILABLE] → [ON_DUTY] → [AVAILABLE]
      ↓
[OFF_DUTY]
      ↓
[LEAVE]
```

---

## 四、跨角色交接

### 4.1 订单交接（Order Handoff）
```
客户 → 系统：导入订单
系统 → 调度员：订单进入待调度池
调度员 → 系统：确认派车
系统 → 司机：推送运单
```

### 4.2 运输交接（Transport Handoff）
```
调度员 → 司机：分配运单
司机 → 调度员：接单确认
司机 → 系统：提货确认
系统 → 客户：发货通知
司机 → 系统：出发确认
系统 → 客户/调度员：在途位置更新
```

### 4.3 签收交接（Sign-off Handoff）
```
司机 → 系统：到货确认
司机 → 系统：签收上传
系统 → 财务：运费计算
财务 → 客户：对账单发送
客户 → 财务：对账确认
```

---

## 五、四大核心引擎

### 5.1 智能派车引擎（Smart Dispatch Engine）

**输入参数：**
- 订单信息（提货点、收货点、重量、体积）
- 可用车辆列表
- 可用司机列表
- 路线规划

**输出结果：**
```json
{
  "recommended_vehicle_id": "UUID",
  "recommended_driver_id": "UUID",
  "route": {
    "distance": 350,
    "duration": 300,
    "waypoints": []
  },
  "estimated_pickup_time": "2024-01-15 09:00",
  "estimated_delivery_time": "2024-01-15 14:00",
  "matching_score": 0.95,
  "reasons": [
    "车辆载重8吨，适合订单货物5吨",
    "司机熟悉该路线",
    "当前位置距离提货点15公里"
  ]
}
```

**匹配算法：**
1. 载量匹配：根据货物重量和体积，筛选符合要求的车辆
2. 距离优先：选择距离提货点最近的可用车辆
3. 路线熟悉度：优先分配有过该路线经验的司机
4. 载重利用率：最大化车辆利用率

### 5.2 轨迹监控引擎（Track Monitoring Engine）

**功能特性：**
- 实时GPS位置接收（每30秒一次）
- 轨迹回放
- 异常检测（偏离路线、长时间停车、异常速度）
- 里程统计

**轨迹点数据结构：**
```json
{
  "waybill_id": "UUID",
  "lat": 31.2304,
  "lng": 121.4737,
  "speed": 45,
  "direction": 90,
  "address": "上海市嘉定区曹安公路",
  "location_type": "NORMAL",
  "recorded_at": "2024-01-15T10:30:00Z"
}
```

### 5.3 电子签收引擎（Electronic Receipt Engine）

**功能特性：**
- 电子签名采集
- 印章识别
- 回单照片上传
- 签收时间戳
- 签收位置校验

**签收凭证结构：**
```json
{
  "waybill_id": "UUID",
  "signed_by": "张三",
  "signed_at": "2024-01-15T14:30:00Z",
  "signature_image": "base64...",
  "seal_image": "base64...",
  "photos": [
    {"url": "/receipts/photo1.jpg", "type": "PHOTO"}
  ],
  "location": {
    "lat": 31.2304,
    "lng": 121.4737,
    "address": "上海市静安区某某路"
  },
  "verification": {
    "signature_valid": true,
    "seal_detected": true,
    "location_match": true
  }
}
```

### 5.4 运费计算引擎（Freight Calculation Engine）

**计费公式：**
```
总运费 = 里程费 + 吨位费 + 附加费 - 折扣

里程费 = 计费里程 × 每公里单价
吨位费 = 计费吨位 × 每吨单价
附加费 = 提货费 + 送货费 + 保价费 + 其他
```

**计算依据展示：**
```json
{
  "waybill_no": "WB-20240115-001",
  "calculation_details": {
    "distance_fee": {
      "formula": "计费里程 × 单价",
      "distance": 350,
      "unit_price": 3.5,
      "amount": 1225,
      "explanation": "根据实际行驶里程350公里，乘以协议单价3.5元/公里"
    },
    "weight_fee": {
      "formula": "计费吨位 × 单价",
      "weight": 5,
      "unit_price": 50,
      "amount": 250,
      "explanation": "货物重量5吨，乘以协议单价50元/吨"
    },
    "additional_fees": {
      "pickup_fee": {"amount": 100, "explanation": "包含提货服务费"},
      "delivery_fee": {"amount": 150, "explanation": "包含送货上门费"},
      "insurance_fee": {"amount": 50, "explanation": "按声明价值0.1%计算保价费"}
    },
    "discount": {
      "amount": -75,
      "reason": "长期客户折扣5%"
    }
  },
  "total_freight": 1750,
  "calculated_by": "system",
  "calculated_at": "2024-01-15T15:00:00Z"
}
```

---

## 六、页面与接口

### 6.1 调度员端页面

#### 6.1.1 订单管理页面
- 订单列表（支持筛选、搜索）
- 订单详情（订单信息、货物信息、费用信息）
- 订单导入（Excel导入、手动创建）
- 批量调度

**关键接口：**
```
GET    /api/orders              # 获取订单列表
POST   /api/orders               # 创建订单
GET    /api/orders/:id           # 获取订单详情
PUT    /api/orders/:id           # 更新订单
DELETE /api/orders/:id           # 删除订单
POST   /api/orders/import        # 导入订单
POST   /api/orders/:id/dispatch  # 调度订单
```

#### 6.1.2 调度中心页面
- 待调度任务列表
- 智能推荐车辆和司机
- 调度确认
- 批量调度

**关键接口：**
```
GET    /api/dispatch/tasks           # 获取待调度任务
GET    /api/dispatch/recommend        # 获取推荐车辆和司机
POST   /api/dispatch/assign           # 执行派车
POST   /api/dispatch/batch            # 批量派车
GET    /api/dispatch/history          # 调度历史
```

#### 6.1.3 监控中心页面
- 在途运单地图展示
- 实时位置追踪
- 异常告警
- 轨迹回放

**关键接口：**
```
GET    /api/monitor/waybills          # 在途运单列表
GET    /api/monitor/waybills/:id      # 运单实时位置
GET    /api/tracks/:waybill_id        # 获取轨迹
GET    /api/tracks/:waybill_id/replay # 轨迹回放
GET    /api/exceptions                # 异常列表
POST   /api/exceptions                # 上报异常
PUT    /api/exceptions/:id           # 处理异常
```

### 6.2 司机端页面

#### 6.2.1 运单列表页面
- 待接单运单
- 进行中运单
- 已完成运单

**关键接口：**
```
GET    /api/driver/waybills           # 获取司机运单
POST   /api/driver/waybills/:id/accept    # 接单
POST   /api/driver/waybills/:id/depart    # 出发
POST   /api/driver/waybills/:id/arrive    # 到达
POST   /api/driver/waybills/:id/pickup    # 提货确认
```

#### 6.2.2 运输页面
- 当前位置展示
- 导航功能
- 状态更新
- 异常上报

**关键接口：**
```
POST   /api/driver/location           # 上报位置
POST   /api/driver/exception          # 上报异常
GET    /api/driver/navigation/:waybill_id # 获取导航信息
```

#### 6.2.3 签收页面
- 签收信息填写
- 签名采集
- 照片上传

**关键接口：**
```
POST   /api/driver/waybills/:id/sign      # 签收确认
POST   /api/driver/receipts               # 上传回单
GET    /api/driver/receipts/:id           # 获取回单
```

### 6.3 客户前端页面

#### 6.3.1 我的订单页面
- 订单列表
- 订单追踪
- 订单详情

**关键接口：**
```
GET    /api/customer/orders            # 获取客户订单
GET    /api/customer/orders/:id         # 订单详情
GET    /api/customer/track/:order_id    # 追踪订单
```

#### 6.3.2 运单追踪页面
- 实时位置展示
- 运输状态时间轴
- 预计到达时间

**关键接口：**
```
GET    /api/customer/waybill/:id        # 运单详情
GET    /api/customer/waybill/:id/track  # 运单轨迹
```

#### 6.3.3 对账页面
- 对账单列表
- 对账单详情
- 确认对账

**关键接口：**
```
GET    /api/customer/statements        # 对账单列表
GET    /api/customer/statements/:id    # 对账单详情
POST   /api/customer/statements/:id/confirm # 确认对账
```

### 6.4 财务端页面

#### 6.4.1 运费结算页面
- 待结算运单
- 运费计算
- 审核确认

**关键接口：**
```
GET    /api/finance/freights                    # 运费列表
GET    /api/finance/freights/:id                # 运费详情（含计算依据）
POST   /api/finance/freights/:id/calculate     # 重新计算运费
POST   /api/finance/freights/:id/confirm        # 确认运费
```

#### 6.4.2 对账管理页面
- 创建对账单
- 对账单列表
- 对账确认
- 导出对账单

**关键接口：**
```
GET    /api/finance/statements                  # 对账单列表
POST   /api/finance/statements                  # 创建对账单
GET    /api/finance/statements/:id              # 对账单详情
PUT    /api/finance/statements/:id              # 更新对账单
POST   /api/finance/statements/:id/send         # 发送对账单
POST   /api/finance/statements/:id/settle      # 结算对账单
GET    /api/finance/statements/:id/export      # 导出对账单
```

#### 6.4.3 运营报表页面
- 运输时效统计
- 异常率统计
- 运费成本统计
- 签收率统计

**关键接口：**
```
GET    /api/finance/reports/timely          # 时效统计
GET    /api/finance/reports/exception       # 异常统计
GET    /api/finance/reports/cost             # 成本统计
GET    /api/finance/reports/signing         # 签收率统计
GET    /api/finance/reports/comprehensive   # 综合报表
```

---

## 七、技术架构

### 7.1 前端技术栈
- **框架**：Vue 3 + Composition API
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **UI框架**：Element Plus
- **地图**：高德地图/百度地图
- **HTTP**：Axios
- **构建工具**：Vite

### 7.2 后端技术栈
- **框架**：Node.js + Express / NestJS
- **数据库**：SQLite（本地开发）/ PostgreSQL（生产）
- **ORM**：Prisma / Sequelize
- **实时通信**：Socket.IO
- **任务队列**：Bull（可选）
- **缓存**：Redis（可选）

### 7.3 端口规划
- **前端开发服务器**：5173
- **后端API**：13089（少见端口）
- **Socket服务**：13090
- **Mock服务**：13091

### 7.4 数据库设计原则
1. 主对象与明细对象分离
2. 状态变更记录审计日志
3. 费用计算保留计算依据
4. 轨迹数据与运单分离存储

---

## 八、数据流图

### 8.1 订单到运单的数据流
```
客户导入订单
    ↓
系统生成运输任务（待调度状态）
    ↓
调度员执行智能派车
    ↓
系统生成运单，推送至司机
    ↓
司机接单 → 提货 → 出发 → 运输 → 到达 → 签收
    ↓
系统标记运输完成
    ↓
运费计算引擎自动计算
    ↓
生成对账单
    ↓
结算完成
```

### 8.2 位置数据流
```
司机GPS → 后端接收 → 轨迹存储 → 实时推送 → 前端展示
                        ↓
                  里程统计 ← 轨迹分析
                        ↓
                  运费计算引擎
```

---

## 九、安全与审计

### 9.1 操作审计
- 所有状态变更记录操作日志
- 记录操作人、操作时间、操作内容
- 支持追溯和查询

### 9.2 数据安全
- 敏感数据加密存储
- 签名和签收图片持久化存储
- 数据备份和恢复机制

### 9.3 权限控制
- 角色基础权限控制
- 数据范围权限控制
- API访问权限验证
