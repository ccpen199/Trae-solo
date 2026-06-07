# 3C设备上门维修O2O服务平台 技术架构文档

## 1. 系统架构概览

### 1.1 整体架构
采用前后端分离的B/S架构，前端使用React + Vite，后端使用Node.js + Express，数据库使用SQLite。

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                     │
│  React 18 + Vite + Ant Design + ECharts + Zustand           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼────────────────────────────────────┐
│                        后端层 (Backend)                      │
│  Node.js + Express.js + Sequelize ORM + JWT                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                        数据层 (Database)                     │
│  SQLite (data/app.sqlite)                                    │
└─────────────────────────────────────────────────────────────┘
```

## 2. 端口配置

### 2.1 端口计算规则
- 项目目录: `may-89010`
- 数字部分: `89010`
- 后四位 (tail4): `89010 % 10000 = 9010`

### 2.2 默认端口
- **前端端口**: `40000 + 9010 = 49010`
- **后端端口**: `50000 + 9010 = 59010`

### 2.3 备用端口槽位
| 槽位 | 前端端口 | 后端端口 |
|------|----------|----------|
| 0 (默认) | 49010 | 59010 |
| 1 | 50010 | 60010 |
| 2 | 51010 | 61010 |
| 3 | 52010 | 62010 |
| 4 | 53010 | 63010 |
| 5 | 54010 | 64010 |

## 3. 后端架构

### 3.1 目录结构
```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── database.js  # 数据库配置
│   │   └── env.js       # 环境变量
│   ├── models/          # 数据模型
│   │   ├── Engineer.js
│   │   ├── Fault.js
│   │   ├── Order.js
│   │   ├── UsedDevice.js
│   │   └── index.js
│   ├── controllers/     # 控制器
│   │   ├── engineerController.js
│   │   ├── faultController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── routes/          # 路由
│   │   ├── engineers.js
│   │   ├── faults.js
│   │   ├── orders.js
│   │   ├── admin.js
│   │   └── index.js
│   ├── middleware/      # 中间件
│   │   ├── auth.js
│   │   └── cors.js
│   ├── services/        # 业务服务
│   │   ├── dispatchService.js
│   │   ├── diagnosisService.js
│   │   └── analyticsService.js
│   └── utils/           # 工具函数
│       ├── hash.js
│       └── logger.js
├── data/                # 数据库文件
│   └── app.sqlite
├── server.js            # 入口文件
├── package.json
└── .env
```

### 3.2 API 接口设计

#### 3.2.1 故障诊断接口
```
POST /api/faults/diagnose
Request:
{
  "text": "手机开不了机，充电没反应",
  "image": "base64...",
  "deviceType": "smartphone"
}
Response:
{
  "top3": [
    { "code": "BAT001", "name": "电池损坏", "confidence": 0.85, "estimatedCost": 200 },
    { "code": "CHG002", "name": "充电口故障", "confidence": 0.65, "estimatedCost": 150 },
    { "code": "BRD001", "name": "主板电源IC损坏", "confidence": 0.45, "estimatedCost": 500 }
  ]
}
```

#### 3.2.2 工程师调度接口
```
POST /api/dispatch/assign
Request:
{
  "orderId": "ORD20240101001",
  "userLocation": { "lat": 31.2304, "lng": 121.4737 },
  "requiredSkills": ["BAT001", "CHG002"]
}
Response:
{
  "engineers": [
    { "id": 1, "name": "张工", "distance": 1.2, "matchScore": 95, "eta": 30 }
  ]
}
```

#### 3.2.3 订单管理接口
```
GET    /api/orders              # 获取订单列表
GET    /api/orders/:id          # 获取订单详情
POST   /api/orders              # 创建订单
PUT    /api/orders/:id/status   # 更新订单状态
POST   /api/orders/:id/evidence # 上传维修凭证
```

## 4. 数据库设计

### 4.1 核心数据表

#### 4.1.1 engineers (工程师表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(50) | 姓名 |
| phone | VARCHAR(20) | 手机号 |
| id_card | VARCHAR(18) | 身份证号 |
| certificate_no | VARCHAR(50) | 证书编号 |
| certificate_level | INTEGER | 认证等级 |
| service_radius | INTEGER | 服务半径(公里) |
| success_rate | DECIMAL | 维修成功率 |
| equipment_id | VARCHAR(50) | 装备编号 |
| lat | DECIMAL | 纬度 |
| lng | DECIMAL | 经度 |
| status | INTEGER | 状态(0离线 1空闲 2忙碌) |
| created_at | DATETIME | 创建时间 |

#### 4.1.2 faults (故障库表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| code | VARCHAR(20) | 故障代码 |
| name | VARCHAR(100) | 故障名称 |
| description | TEXT | 故障描述 |
| device_type | VARCHAR(50) | 设备类型 |
| symptoms | TEXT | 症状关键词(JSON) |
| estimated_hours | DECIMAL | 预计工时 |
| estimated_cost | DECIMAL | 预估费用 |
| solution | TEXT | 维修方案 |

#### 4.1.3 orders (订单表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| order_no | VARCHAR(32) | 订单号 |
| user_name | VARCHAR(50) | 用户姓名 |
| user_phone | VARCHAR(20) | 用户电话 |
| user_address | VARCHAR(200) | 用户地址 |
| user_lat | DECIMAL | 用户纬度 |
| user_lng | DECIMAL | 用户经度 |
| device_type | VARCHAR(50) | 设备类型 |
| device_model | VARCHAR(100) | 设备型号 |
| fault_description | TEXT | 故障描述 |
| predicted_faults | TEXT | TOP3故障假设(JSON) |
| prediction_accuracy | DECIMAL | 预判准确率 |
| engineer_id | INTEGER | 指派工程师ID |
| status | INTEGER | 订单状态 |
| appointment_time | DATETIME | 预约时间 |
| arrival_time | DATETIME | 到达时间 |
| complete_time | DATETIME | 完成时间 |
| part_trace_code | VARCHAR(100) | 配件溯源码 |
| before_image_hash | VARCHAR(64) | 维修前图片哈希 |
| after_image_hash | VARCHAR(64) | 维修后图片哈希 |
| video_url | VARCHAR(200) | 录像地址 |
| rating | INTEGER | 用户评分 |
| comment | TEXT | 用户评价 |
| created_at | DATETIME | 创建时间 |

#### 4.1.4 used_devices (二手机库存表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| device_model | VARCHAR(100) | 设备型号 |
| imei | VARCHAR(15) | IMEI |
| purchase_price | DECIMAL | 收购价格 |
| appearance_rating | INTEGER | 外观评级 |
| ocr_report | TEXT | OCR质检报告 |
| valuation_params | TEXT | 估价参数(JSON) |
| refurbishment_log | TEXT | 翻新记录(JSON) |
| status | INTEGER | 状态 |
| created_at | DATETIME | 创建时间 |

#### 4.1.5 engineer_skills (工程师技能关联表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| engineer_id | INTEGER | 工程师ID |
| fault_code | VARCHAR(20) | 故障代码 |
| proficiency | INTEGER | 熟练度(1-5) |
| certified_at | DATETIME | 认证时间 |

#### 4.1.6 parts (配件库存表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| sku | VARCHAR(50) | SKU编号 |
| name | VARCHAR(100) | 配件名称 |
| compatible_models | TEXT | 兼容型号 |
| quantity | INTEGER | 库存数量 |
| price | DECIMAL | 价格 |
| is_original | BOOLEAN | 是否原厂 |
| trace_code_prefix | VARCHAR(20) | 溯源码前缀 |

## 5. 前端架构

### 5.1 目录结构
```
frontend/
├── src/
│   ├── components/      # 通用组件
│   │   ├── Layout/
│   │   ├── FaultDiagnosis/
│   │   ├── EngineerRadar/
│   │   └── HeatMap/
│   ├── pages/           # 页面组件
│   │   ├── User/
│   │   │   ├── SubmitOrder.jsx
│   │   │   └── OrderList.jsx
│   │   ├── Engineer/
│   │   │   ├── OrderManage.jsx
│   │   │   └── Profile.jsx
│   │   └── Admin/
│   │       ├── Dashboard.jsx
│   │       ├── EngineerManage.jsx
│   │       ├── FaultLibrary.jsx
│   │       └── Analytics.jsx
│   ├── store/           # 状态管理
│   │   └── useStore.js
│   ├── services/        # API服务
│   │   ├── api.js
│   │   ├── faultService.js
│   │   └── orderService.js
│   ├── utils/           # 工具函数
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── .env
```

### 5.2 核心页面
1. **用户端**
   - 故障诊断页面：文字/图片输入，显示TOP3故障
   - 提交订单页面：填写地址、选择时间
   - 订单列表页面：查看历史订单
   - 订单详情页面：实时进度、评价

2. **工程师端**
   - 订单大厅：可抢订单列表
   - 我的订单：进行中/已完成
   - 个人中心：技能管理、装备状态

3. **管理后台**
   - 数据看板：关键指标概览
   - 工程师管理：能力雷达图
   - 故障库管理：症状代码维护
   - 数据分析：区域热力图、配件预测

## 6. 核心业务流程

### 6.1 故障诊断流程
```
用户输入(文字/图片)
    ↓
关键词提取 + 相似度匹配
    ↓
故障库检索 + 置信度计算
    ↓
TOP3故障排序输出
    ↓
预估费用 + 推荐方案
```

### 6.2 工程师调度流程
```
订单创建
    ↓
获取用户位置 + 故障类型
    ↓
筛选: 技能匹配 + 在线状态
    ↓
计算: 距离 + 评分 + 历史成功率
    ↓
综合排序 → TOP3推荐
    ↓
工程师接单确认
```

## 7. 启动脚本

### 7.1 后端启动
```bash
cd backend
npm install
node server.js
```

### 7.2 前端启动
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 49010 --strictPort
```

## 8. 安全设计

### 8.1 认证机制
- JWT Token 认证
- 接口权限校验
- 操作日志记录

### 8.2 数据安全
- 敏感字段加密存储
- 图片文件SHA256哈希校验
- SQL注入防护(Sequelize ORM)

### 8.3 CORS配置
- 仅允许前端域名访问
- 限制HTTP方法
- 启用凭证支持
