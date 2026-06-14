# 高信任度同城即时交付服务平台 - 技术规范

## 1. 项目概述

### 项目名称
**FastTrust - 同城即时交付平台**

### 核心定位
高信任度同城即时交付服务平台，聚焦非标物品（宠物、生鲜、证件、药品等）与非标服务（跑腿办事、小时工、应急代办）的撮合调度。

### 目标用户
- **委托人**：需要同城配送/跑腿服务的个人或企业
- **接单人（骑手）**：提供配送和跑腿服务的个人，需通过资质审核
- **运营管理员**：平台运营方，负责城市管理、纠纷处理、骑手审核

### 核心价值
- 非标物品安全交付保障
- 动态风险定价
- 全链路溯源追踪
- 强制保险保障

## 2. 技术架构

### 技术栈
- **前端**：Vue 3 + Vite + Element Plus + Pinia
- **后端**：Node.js + Express + SQLite3
- **数据库**：SQLite（文件数据库）
- **端口配置**：
  - FRONTEND_PORT=48822
  - BACKEND_PORT=58822

### 项目结构
```
may-88822/
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── api/         # API 接口
│   │   ├── views/       # 页面视图
│   │   ├── components/  # 组件
│   │   ├── stores/      # 状态管理
│   │   └── router/      # 路由
│   └── package.json
├── backend/              # 后端应用
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── controllers/ # 控制器
│   │   ├── models/     # 数据模型
│   │   ├── middleware/  # 中间件
│   │   └── utils/       # 工具函数
│   ├── data/           # SQLite 数据库
│   └── package.json
├── SPEC.md
└── .env
```

## 3. 数据库模型

### 3.1 用户管理
#### 委托人表（users）
- id, phone, name, avatar, rating, created_at

#### 接单人表（couriers）
- id, phone, name, avatar, id_card, face_verified, service_license, license_types, credit_score, status, created_at

### 3.2 物品管理
#### 物品安全等级表（item_safety_levels）
- id, name (活体/易碎/时效敏感/普通), risk_factor, icon

#### 物品表（items）
- id, task_id, name, category, safety_level_id, features, feature_code, photos, special_requirements

### 3.3 任务管理
#### 交付任务表（tasks）
- id, client_id, courier_id, pickup_address, delivery_address, distance_km, item_id, safety_level_id, status, priority, pickup_time, delivery_deadline, base_price, dynamic_price, final_price, insurance_id, sla_minutes, created_at

#### 任务状态历史表（task_status_history）
- id, task_id, status, operator_id, operator_type, note, gps_location, photo, signature, created_at

### 3.4 定价模型
#### 时段定价表（time_pricing）
- id, time_start, time_end, price_multiplier, name

#### 动态定价规则表（dynamic_pricing_rules）
- id, rule_type, condition, price_adjustment, priority

### 3.5 保险管理
#### 保险单表（insurance_policies）
- id, task_id, policy_number, coverage_type, premium, coverage_amount, status, created_at

### 3.6 评价与溯源
#### 评价表（reviews）
- id, task_id, reviewer_id, reviewer_type, rating, comment, photos, created_at

#### GPS轨迹表（gps_tracking）
- id, task_id, courier_id, latitude, longitude, timestamp, speed, heading

### 3.7 异常处理
#### 异常工单表（exception_tickets）
- id, task_id, type, description, status, assigned_to, resolution, created_at

### 3.8 后台管理
#### 城市运营区表（city_zones）
- id, city_name, district_name, geofence (JSON), is_active

#### 禁运物品词库表（restricted_items）
- id, keyword, category, severity, is_active

#### 纠纷仲裁表（dispute_cases）
- id, task_id, complainant_id, respondent_id, reason, evidence, status, arbitrator_id, decision, created_at

#### 骑手审计日志表（courier_audit_logs）
- id, courier_id, action_type, action_detail, ip_address, created_at

## 4. 核心功能模块

### 4.1 用户端功能
#### 委托人端
- 发布交付任务（选择物品类型、地址、时间）
- 实时追踪任务进度
- 查看GPS轨迹
- 电子签名确认交付
- 服务评价

#### 接单人端
- 人脸识别+资质审核入驻
- 接单大厅
- 任务执行（接单、取货、送达）
- 交接照片上传
- GPS轨迹记录

### 4.2 核心业务逻辑
#### 动态风险定价模型
```
final_price = base_price
  * distance_factor
  * safety_level_factor
  * time_multiplier
  * courier_credit_factor
  * demand_factor
```

#### 强制保险投保
- 每单自动关联保单号
- 根据物品类型确定保险类型和保费
- 覆盖丢失、损坏、延误风险

#### 敏感物品双验证
- 身份验证：接单人身份核验
- 物品特征码：扫描物品特征码确认

#### 异常处理机制
- 异常自动检测（超时、偏离、取消）
- 自动生成客服介入工单
- 纠纷仲裁流程

### 4.3 后台管理功能
- 城市运营围栏配置
- 禁运物品词库管理
- 服务纠纷仲裁台账
- 骑手行为合规审计
- 数据统计与报表

## 5. API 接口设计

### 5.1 认证相关
- POST /api/auth/client/register - 委托人注册
- POST /api/auth/client/login - 委托人登录
- POST /api/auth/courier/register - 接单人注册
- POST /api/auth/courier/face-verify - 人脸识别验证
- POST /api/auth/courier/license-verify - 资质审核

### 5.2 任务相关
- POST /api/tasks - 创建任务
- GET /api/tasks - 获取任务列表
- GET /api/tasks/:id - 获取任务详情
- PUT /api/tasks/:id/status - 更新任务状态
- POST /api/tasks/:id/track - 上传GPS轨迹
- POST /api/tasks/:id/photo - 上传交接照片
- POST /api/tasks/:id/signature - 电子签名

### 5.3 定价相关
- POST /api/pricing/calculate - 计算动态价格
- GET /api/pricing/rules - 获取定价规则

### 5.4 保险相关
- POST /api/insurance/create - 创建保险单
- GET /api/insurance/:id - 获取保险详情

### 5.5 评价相关
- POST /api/reviews - 创建评价
- GET /api/reviews/task/:taskId - 获取任务评价

### 5.6 异常处理
- POST /api/exceptions - 创建异常工单
- GET /api/exceptions - 获取异常工单列表
- PUT /api/exceptions/:id - 更新工单状态

### 5.7 后台管理
- GET /api/admin/zones - 获取运营区列表
- POST /api/admin/zones - 创建运营区
- GET /api/admin/restricted-items - 获取禁运词库
- POST /api/admin/restricted-items - 添加禁运词
- GET /api/admin/disputes - 获取纠纷列表
- PUT /api/admin/disputes/:id - 仲裁决策
- GET /api/admin/audit-logs - 审计日志

### 5.8 系统
- GET /api/health - 健康检查

## 6. 前端页面设计

### 6.1 用户端页面
- 首页（任务发布入口）
- 任务发布页（物品信息、地址、时间）
- 任务列表页（进行中/已完成）
- 任务详情页（轨迹追踪、状态更新）
- 接单人列表页
- 评价页

### 6.2 接单人端页面
- 入驻审核页
- 接单大厅
- 我的任务
- 任务执行页
- 收入统计

### 6.3 管理后台页面
- 仪表盘
- 任务管理
- 用户管理
- 运营区配置
- 禁运词管理
- 纠纷仲裁
- 审计日志

## 7. 验收标准

### 7.1 功能完整性
- [ ] 委托人可注册登录并发布任务
- [ ] 接单人可入驻审核并接单
- [ ] 任务全生命周期管理
- [ ] 动态定价计算
- [ ] 保险单自动生成
- [ ] GPS轨迹记录
- [ ] 交接照片上传
- [ ] 电子签名确认
- [ ] 异常工单自动生成
- [ ] 完整后台管理功能

### 7.2 技术要求
- [ ] 前后端端口按规范配置
- [ ] 数据库所有操作落库
- [ ] API 接口正常响应
- [ ] 前端页面可访问
- [ ] 无语法错误和导入错误

### 7.3 进程管理
- [ ] 前后端进程独立运行
- [ ] 端口监听正常
- [ ] 进程状态正常（非停止/僵尸）
- [ ] 可通过指定端口访问

## 8. 依赖说明

### 主要依赖
- **express**: Web 框架
- **sqlite3**: SQLite 数据库
- **better-sqlite3**: SQLite 同步操作
- **jsonwebtoken**: JWT 认证
- **bcrypt**: 密码加密
- **multer**: 文件上传
- **vue**: 前端框架
- **vite**: 前端构建工具
- **element-plus**: UI 组件库
- **pinia**: 状态管理

### 无外部服务依赖
- 使用 SQLite 文件数据库，无需额外服务
- 所有功能基于 Node.js + Express + Vue 实现
