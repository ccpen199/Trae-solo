# 物联网自助洗衣云管理平台 - 架构设计

## 技术栈
- **前端**: Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router
- **后端**: Node.js + Express + TypeScript + better-sqlite3
- **数据库**: SQLite (data/app.sqlite)
- **认证**: JWT (JSON Web Token)

## 项目结构
```
may-88935/
├── .env                      # 环境配置
├── backend/                  # 后端 API 服务
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # 入口文件
│   │   ├── config.ts         # 配置加载
│   │   ├── database.ts       # SQLite 连接
│   │   ├── middleware/       # 中间件 (auth, cors, etc.)
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # API 路由
│   │   ├── services/         # 业务逻辑
│   │   └── utils/            # 工具函数
│   └── data/
│       └── app.sqlite        # SQLite 数据库
├── frontend/                 # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── router/
│       ├── stores/
│       ├── api/
│       ├── views/
│       │   ├── user/         # 用户端页面
│       │   └── admin/        # 管理后台页面
│       └── components/
└── scripts/                  # 启动和运维脚本
```

## 数据库表结构

### 1. 用户表 (users)
- id, phone, password_hash, nickname, avatar, role (user/property/admin/manufacturer)
- balance, campus_card_id, created_at, updated_at

### 2. 设备表 (devices)
- id, device_no, qr_code, name, type (washer/dryer)
- status (idle/running/paused/fault/offline), lock_status
- location, address, lat, lng, property_id, manufacturer_id
- firmware_version, nb_iot_ip, wifi_mac, last_online
- power_consumption, water_consumption, created_at

### 3. 设备状态上报表 (device_reports)
- id, device_id, status, fault_code, door_lock
- power_usage, water_usage, temperature, remain_time
- reported_at, created_at

### 4. 订单表 (orders)
- id, order_no, user_id, device_id, program_id
- start_time, end_time, actual_duration, total_cost
- pay_amount, pay_method (wechat/alipay/campus_card/balance)
- pay_status, order_status, energy_data
- created_at, updated_at

### 5. 洗衣程序表 (programs)
- id, name, duration_minutes, price, description, device_type

### 6. 支付记录表 (payments)
- id, order_id, user_id, amount, method, transaction_no, status, paid_at

### 7. 物业表 (properties)
- id, name, contact, phone, address, created_at

### 8. 厂商表 (manufacturers)
- id, name, contact, phone, created_at

### 9. 故障工單表 (work_orders)
- id, device_id, fault_code, description, reporter_id
- handler_id, property_order_no, status, priority
- created_at, resolved_at

### 10. 告警表 (alerts)
- id, device_id, type (timeout_uncollected/water_sensor_failure/door_not_locked/overheat)
- level (info/warning/critical), status, message, triggered_at, resolved_at

### 11. 能耗统计表 (energy_stats)
- id, device_id, date, total_power, total_water, total_runs, total_revenue

### 12. 结算账单表 (settlement_bills)
- id, property_id, period_start, period_end, total_runs, total_revenue
- settlement_amount, settlement_type (per_use/monthly/revenue_share), status, paid_at

### 13. 固件升级表 (firmware_upgrades)
- id, version, file_path, device_type, description, status, created_at

### 14. UI 品牌配置表 (brand_configs)
- id, property_id, primary_color, logo_url, app_name, welcome_text, created_at

## API 接口设计

### 用户端 API
- POST /api/auth/login - 登录
- POST /api/auth/register - 注册
- GET /api/devices - 获取附近设备列表（按位置）
- GET /api/devices/:id - 获取设备详情
- GET /api/devices/:id/status - 实时状态
- POST /api/orders/scan - 扫码创建订单
- POST /api/orders/:id/start - 启动设备
- POST /api/orders/:id/pause - 暂停
- POST /api/orders/:id/continue - 续洗
- POST /api/orders/:id/pay - 支付
- GET /api/orders/:id - 订单详情
- GET /api/orders - 我的订单
- POST /api/orders/:id/feedback - 问题反馈

### 设备端 API (MQTT/HTTP)
- POST /api/device/report - 状态上报
- GET /api/device/:id/command - 获取指令
- POST /api/device/:id/firmware/check - 固件检查
- POST /api/device/:id/firmware/upgrade - 固件升级

### 管理后台 API
- GET /api/admin/devices/gis - GIS 热力图数据
- GET /api/admin/devices - 设备列表（分页、筛选）
- POST /api/admin/devices - 创建设备
- PUT /api/admin/devices/:id - 更新设备
- POST /api/admin/firmware/upload - 上传固件
- POST /api/admin/firmware/push - 推送升级
- GET /api/admin/work-orders - 工单列表
- POST /api/admin/work-orders/:id/assign - 派单
- GET /api/admin/reports/energy - 能耗分摊报表
- GET /api/admin/reports/settlement - 结算账单
- GET /api/admin/alerts - 告警列表
- POST /api/admin/alerts/:id/resolve - 处理告警
- GET /api/admin/brand-config - 获取品牌配置
- PUT /api/admin/brand-config - 更新品牌配置
