# 省级 ETC 角色工作台 - 技术架构文档

## 1. 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | React 18 + TypeScript + Vite | 现代化前端开发，热更新、构建快 |
| 状态管理 | Zustand | 轻量级全局状态管理，支持持久化 |
| 路由 | React Router 6 | 支持嵌套路由、路由守卫 |
| UI 组件 | Tailwind CSS 3 + Lucide Icons | 自定义暗色主题、开箱即用图标 |
| 图表 | Recharts | 通行趋势、费用分析、升级进度可视化 |
| HTTP 客户端 | Axios | 统一 API 封装、自动携带 Token、错误处理 |
| 后端框架 | Express 4 + TypeScript (ESM) | 轻量级 Node.js Web 框架 |
| 数据库 | SQLite 3 (better-sqlite3) | 本地文件数据库，无需额外服务，同步 API |
| 认证 | JWT (jsonwebtoken) + bcryptjs | 无状态 Token 认证，密码哈希 |
| 代码风格 | ESLint + Prettier | 统一代码规范 |

---

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                            前端 (Vite + React)                        │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│   车主工作台    │   车队工作台    │   运营工作台    │   运维/管理员    │
├─────────────────┴─────────────────┴─────────────────┴─────────────────┤
│              Zustand 状态管理 + Axios API 封装 + 路由守卫              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP/JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        后端 (Express + TypeScript)                    │
├───────────────┬───────────────┬───────────────┬───────────────────────┤
│  认证中间件   │  权限中间件   │  审计中间件   │     JWT Token          │
├───────────────┴───────────────┴───────────────┴───────────────────────┤
│  /api/auth    │  /api/users  │  /api/vehicles │ /api/obu/devices     │
│  /api/tolls   │ /api/monthly │  /api/appeals  │ /api/obu/upgrades    │
│ /api/fleets   │ /api/accounts│  /api/audit    │ /api/dashboard       │
├─────────────────────────────────────────────────────────────────────┤
│                   Service 层 (业务逻辑)                                │
├─────────────────────────────────────────────────────────────────────┤
│                   Repository 层 (数据访问)                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
                ┌──────────────────────────────────┐
                │     SQLite (data/app.sqlite)     │
                │  15 张业务表 + 索引 + 外键约束   │
                └──────────────────────────────────┘
```

---

## 3. 数据库设计 (ER 图)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │1─────*│   vehicles   │1─────1│  obu_devices │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ username     │       │ plate_no     │       │ serial_no    │
│ password_hash│       │ owner_id (FK)│       │ vehicle_id(FK)│
│ role         │       │ fleet_id (FK)│       │ model        │
│ name         │       │ obu_id (FK)  │       │ firmware_ver │
│ phone        │       │ vehicle_type │       │ batch_no     │
│ id_card      │       │ color        │       │ status       │
│ fleet_id (FK)│       │ frame_no     │       │ activate_at  │
│ created_at   │       │ engine_no    │       │ created_at   │
└──────────────┘       └──────────────┘       └──────────────┘
        │                      │
        │ 1                    │ 1
        ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    fleets    │       │ toll_records │*─────1│ monthly_bills│
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ name         │       │ vehicle_id(FK)│       │ user_id (FK) │
│ type         │       │ gantry_id    │       │ fleet_id (FK)│
│ contact      │       │ station_id   │       │ bill_month   │
│ created_at   │       │ pass_time    │       │ vehicle_count│
└──────────────┘       │ fee          │       │ total_amount │
        │              │ toll_type    │       │ discount_amt │
        │ 1            │ status       │       │ paid_amount  │
        ▼              │ trace_id     │       │ status       │
┌──────────────┐       │ created_at   │       │ created_at   │
│ etc_accounts │       └──────────────┘       └──────────────┘
├──────────────┤              │ 1                      │
│ id (PK)      │              ▼                        ▼
│ user_id (FK) │       ┌──────────────┐       ┌──────────────┐
│ balance      │       │ toll_traces  │       │   appeals    │
│ frozen_amt   │       ├──────────────┤       ├──────────────┤
│ status       │       │ id (PK)      │       │ id (PK)      │
│ created_at   │       │ trace_no     │       │ toll_id (FK) │
└──────────────┘       │ vehicle_id(FK)│       │ user_id (FK) │
        │              │ start_gantry │       │ type         │
        │ 1            │ end_gantry   │       │ reason       │
        ▼              │ start_time   │       │ status       │
┌──────────────┐       │ end_time     │       │ audit_by (FK)│
│  obu_upgrade │       │ distance     │       │ audit_result │
│    _tasks    │       │ total_fee    │       │ refund_amt   │
├──────────────┤       │ created_at   │       │ created_at   │
│ id (PK)      │       └──────────────┘       └──────────────┘
│ name         │
│ firmware_ver │              ┌──────────────┐
│ device_ids   │              │ obu_upgrade  │
│ status       │              │   _logs      │
│ progress     │              ├──────────────┤
│ start_at     │              │ id (PK)      │
│ end_at       │              │ task_id (FK) │
│ created_by   │              │ obu_id (FK)  │
│ created_at   │              │ status       │
└──────────────┘              │ error_msg    │
        │ 1                   │ created_at   │
        ▼                     └──────────────┘
┌──────────────┐
│ audit_logs   │
├──────────────┤
│ id (PK)      │
│ user_id (FK) │
│ role         │
│ ip_address   │
│ module       │
│ action       │
│ content      │
│ created_at   │
└──────────────┘
```

---

## 4. 数据库表 DDL

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'operation', 'maintenance', 'fleet_admin', 'owner')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_card TEXT,
  fleet_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled', 'pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL
);

-- 车队表
CREATE TABLE fleets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('enterprise', 'logistics', 'taxi', 'other')),
  contact TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 车辆表
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_no TEXT NOT NULL UNIQUE,
  owner_id INTEGER NOT NULL,
  fleet_id INTEGER,
  obu_id INTEGER UNIQUE,
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('passenger', 'truck')),
  vehicle_class TEXT NOT NULL CHECK(vehicle_class IN ('1', '2', '3', '4', '5', '6')),
  color TEXT,
  frame_no TEXT,
  engine_no TEXT,
  register_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'sold')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL,
  FOREIGN KEY (obu_id) REFERENCES obu_devices(id) ON DELETE SET NULL
);

-- OBU 设备表
CREATE TABLE obu_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_no TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  firmware_version TEXT NOT NULL,
  batch_no TEXT,
  purchase_date TEXT,
  status TEXT NOT NULL DEFAULT 'inventory' CHECK(status IN ('inventory', 'activated', 'deactivated', 'scrapped')),
  vehicle_id INTEGER UNIQUE,
  activated_at TEXT,
  deactivated_at TEXT,
  scrapped_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- 通行记录表
CREATE TABLE toll_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  obu_id INTEGER,
  trace_id TEXT,
  gantry_id TEXT,
  station_id TEXT,
  pass_time TEXT NOT NULL,
  fee REAL NOT NULL DEFAULT 0,
  base_fee REAL NOT NULL DEFAULT 0,
  bridge_fee REAL NOT NULL DEFAULT 0,
  tunnel_fee REAL NOT NULL DEFAULT 0,
  surcharge REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  toll_type TEXT NOT NULL CHECK(toll_type IN ('gantry', 'station_entrance', 'station_exit')),
  vehicle_class TEXT,
  trade_status TEXT NOT NULL DEFAULT 'success' CHECK(trade_status IN ('success', 'failed', 'pending', 'reversed')),
  trade_serial_no TEXT,
  is_abnormal INTEGER NOT NULL DEFAULT 0,
  abnormal_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (obu_id) REFERENCES obu_devices(id) ON DELETE SET NULL,
  INDEX idx_toll_vehicle (vehicle_id),
  INDEX idx_toll_time (pass_time),
  INDEX idx_toll_trace (trace_id)
);

-- 通行轨迹表
CREATE TABLE toll_traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_no TEXT NOT NULL UNIQUE,
  vehicle_id INTEGER NOT NULL,
  start_gantry TEXT,
  end_gantry TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  distance REAL NOT NULL DEFAULT 0,
  total_fee REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_trace_vehicle (vehicle_id)
);

-- 月结单表
CREATE TABLE monthly_bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_month TEXT NOT NULL,
  user_id INTEGER,
  fleet_id INTEGER,
  vehicle_count INTEGER NOT NULL DEFAULT 0,
  pass_count INTEGER NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'partial', 'waived')),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL,
  INDEX idx_bill_month (bill_month)
);

-- 申诉工单表
CREATE TABLE appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  toll_record_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('path_error', 'fee_error', 'plate_mismatch', 'duplicate', 'device_error', 'other')),
  reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'approved', 'rejected', 'closed')),
  audit_by INTEGER,
  audit_result TEXT,
  refund_amount REAL NOT NULL DEFAULT 0,
  refund_transfer_no TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  audited_at TEXT,
  FOREIGN KEY (toll_record_id) REFERENCES toll_records(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ETC 账户表
CREATE TABLE etc_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  balance REAL NOT NULL DEFAULT 0,
  frozen_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'frozen', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OBU 升级任务表
CREATE TABLE obu_upgrade_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  firmware_version TEXT NOT NULL,
  firmware_url TEXT,
  target_device_ids TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'paused', 'completed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0,
  schedule_type TEXT NOT NULL DEFAULT 'immediate' CHECK(schedule_type IN ('immediate', 'scheduled')),
  scheduled_at TEXT,
  start_at TEXT,
  end_at TEXT,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- OBU 升级日志表
CREATE TABLE obu_upgrade_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  obu_id INTEGER NOT NULL,
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'success', 'failed')),
  error_message TEXT,
  start_at TEXT,
  end_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES obu_upgrade_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (obu_id) REFERENCES obu_devices(id) ON DELETE CASCADE
);

-- 审计日志表
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_role TEXT,
  ip_address TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_time (created_at),
  INDEX idx_audit_user (user_id)
);
```

---

## 5. API 路由定义

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 公开 |
| GET | /api/auth/me | 获取当前用户 | 已认证 |
| POST | /api/auth/logout | 登出 | 已认证 |
| --- | --- | --- | --- |
| GET | /api/dashboard/stats | 获取工作台统计（按角色差异化） | 已认证 |
| GET | /api/dashboard/trend | 通行趋势数据 | 已认证 |
| --- | --- | --- | --- |
| GET | /api/users | 用户列表 | admin/operation/fleet_admin |
| POST | /api/users | 创建用户 | admin/operation |
| GET | /api/users/:id | 用户详情 | 已认证（权限内） |
| PUT | /api/users/:id | 更新用户 | admin/operation |
| DELETE | /api/users/:id | 删除用户 | admin |
| --- | --- | --- | --- |
| GET | /api/fleets | 车队列表 | admin/operation/fleet_admin |
| POST | /api/fleets | 创建车队 | admin/operation |
| GET | /api/fleets/:id | 车队详情 | 已认证（权限内） |
| PUT | /api/fleets/:id | 更新车队 | admin/operation |
| GET | /api/fleets/:id/vehicles | 车队车辆列表 | 已认证（权限内） |
| --- | --- | --- | --- |
| GET | /api/vehicles | 车辆列表 | 已认证（权限内） |
| POST | /api/vehicles | 创建车辆 | admin/operation/fleet_admin/owner |
| GET | /api/vehicles/:id | 车辆详情 | 已认证（权限内） |
| PUT | /api/vehicles/:id | 更新车辆 | admin/operation/fleet_admin/owner |
| GET | /api/vehicles/:id/tolls | 车辆通行记录 | 已认证（权限内） |
| --- | --- | --- | --- |
| GET | /api/obu/devices | OBU 设备列表 | 已认证（权限内） |
| POST | /api/obu/devices | 创建设备 | admin/maintenance |
| GET | /api/obu/devices/:id | 设备详情 | 已认证（权限内） |
| PUT | /api/obu/devices/:id | 更新设备 | admin/maintenance |
| POST | /api/obu/devices/:id/activate | 激活设备 | admin/maintenance |
| POST | /api/obu/devices/batch-activate | 批量激活 | admin/maintenance |
| POST | /api/obu/devices/:id/upgrade | 单台升级 | admin/maintenance |
| GET | /api/obu/devices/:id/lifecycle | 设备生命周期审计 | admin/maintenance |
| --- | --- | --- | --- |
| GET | /api/obu/upgrades | 升级任务列表 | admin/maintenance/operation/fleet_admin |
| POST | /api/obu/upgrades | 创建升级任务 | admin/maintenance |
| GET | /api/obu/upgrades/:id | 任务详情 | admin/maintenance/operation/fleet_admin |
| POST | /api/obu/upgrades/:id/start | 开始任务 | admin/maintenance |
| POST | /api/obu/upgrades/:id/pause | 暂停任务 | admin/maintenance |
| GET | /api/obu/upgrades/:id/logs | 升级日志 | admin/maintenance |
| --- | --- | --- | --- |
| GET | /api/tolls | 通行记录列表 | 已认证（权限内） |
| GET | /api/tolls/:id | 通行记录详情（含轨迹+费用拆分） | 已认证（权限内） |
| POST | /api/tolls/export | 导出通行记录 | admin/operation/fleet_admin |
| GET | /api/tolls/:id/trace | 通行轨迹详情 | 已认证（权限内） |
| --- | --- | --- | --- |
| GET | /api/monthly-bills | 月结单列表 | 已认证（权限内） |
| GET | /api/monthly-bills/:id | 月结单详情（含费用明细） | 已认证（权限内） |
| --- | --- | --- | --- |
| GET | /api/appeals | 申诉工单列表 | 已认证（权限内） |
| POST | /api/appeals | 提交申诉 | fleet_admin/owner |
| GET | /api/appeals/:id | 申诉详情 | 已认证（权限内） |
| PUT | /api/appeals/:id | 审核申诉 | admin/operation |
| --- | --- | --- | --- |
| GET | /api/accounts | ETC 账户列表 | admin/operation |
| GET | /api/accounts/me | 我的账户 | 已认证 |
| POST | /api/accounts/recharge | 充值 | fleet_admin/owner |
| GET | /api/accounts/:id/transactions | 交易明细 | 已认证（权限内） |
| --- | --- | --- | --- |
| GET | /api/audit-logs | 审计日志 | admin/maintenance/operation |
| GET | /api/health | 健康检查 | 公开 |

---

## 6. 前端路由定义

| 路径 | 页面 | 权限 |
|------|------|------|
| /login | 登录页 | 公开 |
| / | 重定向到 /dashboard | - |
| /dashboard | 工作台（按角色差异化） | 已认证 |
| /users | 用户管理 | admin/operation/fleet_admin |
| /users/:id | 用户详情 | 已认证（权限内） |
| /fleets | 车队管理 | admin/operation/fleet_admin |
| /vehicles | 车辆管理 | 已认证（权限内） |
| /vehicles/:id | 车辆详情 | 已认证（权限内） |
| /obu/devices | OBU 设备管理 | 已认证（权限内） |
| /obu/devices/:id | OBU 设备详情 | 已认证（权限内） |
| /obu/upgrades | OBU 升级任务 | admin/maintenance/operation/fleet_admin |
| /obu/upgrades/:id | 升级任务详情 | admin/maintenance/operation/fleet_admin |
| /tolls | 通行记录查询 | 已认证（权限内） |
| /tolls/:id | 通行记录详情 | 已认证（权限内） |
| /monthly-bills | 月结单管理 | 已认证（权限内） |
| /monthly-bills/:id | 月结单详情 | 已认证（权限内） |
| /appeals | 申诉工单 | 已认证（权限内） |
| /appeals/:id | 申诉详情 | 已认证（权限内） |
| /accounts | ETC 账户 | admin/operation |
| /accounts/me | 我的账户 | 已认证 |
| /audit-logs | 审计日志 | admin/maintenance/operation |

---

## 7. 后端架构分层

```
api/
├── server.ts              # 服务器入口，绑定 127.0.0.1:PORT
├── app.ts                 # Express 主应用，CORS、路由挂载
├── db.ts                  # better-sqlite3 实例
├── types.ts               # TypeScript 类型定义
├── middleware.ts          # JWT 认证、权限、审计中间件
├── migrations.ts          # 数据库迁移脚本
├── seed.ts                # 初始化测试数据
├── audit.ts               # 审计日志工具函数
└── routes/
    ├── auth.ts            # 认证接口
    ├── dashboard.ts       # 工作台接口
    ├── users.ts           # 用户管理接口
    ├── fleets.ts          # 车队管理接口
    ├── vehicles.ts        # 车辆管理接口
    ├── obu-devices.ts     # OBU 设备接口
    ├── obu-upgrades.ts    # OBU 升级接口
    ├── tolls.ts           # 通行记录接口
    ├── monthly-bills.ts   # 月结单接口
    ├── appeals.ts         # 申诉接口
    ├── accounts.ts        # ETC 账户接口
    └── audit.ts           # 审计日志接口
```

---

## 8. 前端目录结构

```
src/
├── main.tsx               # 应用入口
├── App.tsx                # 路由配置
├── types.ts               # 类型定义
├── index.css              # 全局样式 + Tailwind
├── lib/
│   ├── api.ts             # Axios 实例封装
│   └── utils.ts           # 工具函数（日期、金额格式化、脱敏）
├── store/
│   └── auth.ts            # Zustand 认证状态
├── components/
│   ├── Layout.tsx         # 侧边栏布局
│   ├── PageHeader.tsx     # 页面头部
│   ├── Pagination.tsx     # 分页组件
│   ├── Modal.tsx          # 模态框
│   ├── Badges.tsx         # 状态标签
│   ├── ProtectedRoute.tsx # 路由守卫
│   └── Table.tsx          # 通用表格组件
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── UserList.tsx
    ├── UserDetail.tsx
    ├── FleetList.tsx
    ├── VehicleList.tsx
    ├── VehicleDetail.tsx
    ├── ObuDeviceList.tsx
    ├── ObuDeviceDetail.tsx
    ├── ObuUpgradeList.tsx
    ├── ObuUpgradeDetail.tsx
    ├── TollList.tsx
    ├── TollDetail.tsx
    ├── MonthlyBillList.tsx
    ├── MonthlyBillDetail.tsx
    ├── AppealList.tsx
    ├── AppealDetail.tsx
    ├── AccountList.tsx
    ├── AccountMine.tsx
    └── AuditLogs.tsx
```

---

## 9. 权限控制策略

### 9.1 数据范围过滤
- **admin**：所有数据，不受限制
- **operation**：所有业务数据，不可管理系统设置
- **maintenance**：仅 OBU 设备、升级任务、运维相关审计日志
- **fleet_admin**：仅所属车队的车辆、通行记录、月结单、申诉
- **owner**：仅本人名下车辆、通行记录、月结单、申诉

### 9.2 后端中间件实现
```typescript
// 认证中间件：验证 JWT Token
const authenticate = (req, res, next) => { /* ... */ }

// 角色中间件：限制可访问的角色
const requireRoles = (...roles) => (req, res, next) => { /* ... */ }

// 数据范围中间件：自动注入 fleet_id/owner_id 过滤条件
const scopeToOwn = (req, res, next) => {
  if (req.user.role === 'fleet_admin') {
    req.query.fleet_id = req.user.fleet_id;
  } else if (req.user.role === 'owner') {
    req.query.owner_id = req.user.id;
  }
  next();
}
```

---

## 10. 部署与运维

### 10.1 端口配置
- 前端端口：`FRONTEND_PORT=50054`（may-89054 → tail4=9054 → 41000+9054=50054）
- 后端端口：`BACKEND_PORT=60054`（51000+9054=60054）
- 所有服务只监听 `127.0.0.1`

### 10.2 启动命令
```bash
# 开发模式
npm run client:dev    # 前端，支持 HMR
npm run server:dev    # 后端，nodemon 热重载

# 后台启动（关闭终端不影响）
npm run server:start > backend.log 2>&1 &
npx vite --strictPort --host 127.0.0.1 > frontend.log 2>&1 &
```

### 10.3 验收检查命令
```bash
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=50054
BACKEND_PORT=60054

# 检查端口监听
lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN
lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN

# 检查进程状态
ps -o pid=,ppid=,stat=,cwd=,command= -p $frontend_pid
ps -o pid=,ppid=,stat=,cwd=,command= -p $backend_pid

# 健康检查
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
```

### 10.4 初始测试账号
| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 系统管理员 |
| operation | oper123 | 运营 |
| maintenance | maint123 | 运维 |
| fleet_admin | fleet123 | 车队管理员 |
| owner | owner123 | 车主 |

---

## 11. 初始化数据策略

### 11.1 Seed 数据规模
- 5 个测试用户（覆盖所有角色）
- 3 个车队（企业、物流、出租车）
- 50 辆车（分布在不同车队和个人车主）
- 50 台 OBU 设备（覆盖库存/已激活/已停用状态）
- 2000 条通行记录（最近 3 个月）
- 15 条月结单（最近 3 个月，按用户和车队）
- 30 条申诉工单（覆盖各种状态和类型）
- 5 个升级任务（覆盖各种状态）
- 100 条审计日志
