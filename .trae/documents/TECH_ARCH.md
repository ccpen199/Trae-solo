# 国家邮政业实名寄递数字监管平台 - 收寄端系统 技术架构文档

## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (Frontend)"
        A["React SPA"] --> A1["路由层 (React Router)"]
        A --> A2["状态管理 (Zustand)"]
        A --> A3["UI组件库 (Tailwind + Lucide)"]
        A --> A4["业务模块组件"]
        A --> A5["离线存储 (IndexedDB)"]
    end

    subgraph "后端层 (Backend - Express)"
        B["API Gateway"] --> B1["认证中间件 (JWT)"]
        B --> B2["权限中间件 (RBAC)"]
        B --> B3["日志中间件 (Audit)"]
        B1 --> C
        B2 --> C
        B3 --> C
        C["Controller层"] --> D["Service层"]
        D --> E["数据加密层"]
        D --> F["Repository层"]
    end

    subgraph "数据层 (Data)"
        F --> G["SQLite (开发环境)"]
        E --> E1["AES-256 敏感字段加密"]
        E --> E2["SM3 哈希脱敏"]
    end

    subgraph "外部服务模拟 (External)"
        H["公安库比对 API (Mock)"]
        I["身份证OCR服务 (Mock)"]
        J["活体检测服务 (Mock)"]
        K["邮政业安全中心主库接口 (Mock)"]
    end

    D --> H
    D --> I
    D --> J
    D --> K
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript@5 + Vite@5
- **后端框架**：Express@4 + TypeScript@5
- **初始化工具**：vite-init (react-express-ts 模板)
- **样式方案**：Tailwind CSS@3 + CSS Variables
- **状态管理**：Zustand (轻量级状态管理)
- **路由方案**：React Router DOM@6
- **图标库**：Lucide React
- **数据库**：SQLite (开发环境，Mock数据)
- **图表库**：Recharts (数据可视化)
- **二维码生成**：qrcode.react
- **离线存储**：localStorage + IndexedDB (模拟离线作业)
- **HTTP客户端**：Axios
- **加密方案**：crypto-js (AES-256加密敏感字段)
- **数据校验**：Zod

## 3. 路由定义

| 路由路径 | 页面用途 | 访问角色 |
|----------|----------|----------|
| /login | 登录认证页 | 所有角色（公开） |
| /dashboard | 首页仪表盘 | 快递员、网点管理员、区域监管员、总部审计员 |
| /authentication | 实名认证页 | 快递员、网点管理员 |
| /waybill/new | 新建运单页 | 快递员 |
| /waybill/list | 运单列表页 | 所有角色 |
| /waybill/:id | 电子运单详情页 | 所有角色 |
| /exception/list | 异常件列表页 | 网点管理员、区域监管员 |
| /exception/review | 异常件人工复核页 | 网点管理员、区域监管员 |
| /admin/users | 人员权限管理页 | 区域监管员、总部审计员 |
| /admin/audit/logs | 操作日志审计页 | 区域监管员、总部审计员 |
| /admin/audit/login | 登录日志审计页 | 区域监管员、总部审计员 |
| /admin/orders | 监管指令管理页 | 所有角色 |
| /admin/statistics | 数据统计报表页 | 网点管理员、区域监管员、总部审计员 |
| /profile | 个人中心 | 所有角色 |

## 4. API 定义

### 4.1 认证相关

```typescript
// POST /api/auth/login
interface LoginRequest {
  username: string;
  password: string;
  captcha: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    realName: string;
    role: 'courier' | 'outlet_admin' | 'regional_supervisor' | 'head_auditor';
    outletId?: string;
    regionId?: string;
  };
}

// POST /api/auth/logout
interface LogoutResponse {
  success: boolean;
}
```

### 4.2 实名认证相关

```typescript
// POST /api/auth/idcard/ocr
interface OcrRequest {
  imageBase64: string;
  side: 'front' | 'back';
}

interface OcrResponse {
  name: string;
  idNumber: string;
  gender: string;
  ethnicity: string;
  birthDate: string;
  address: string;
  issuingAuthority: string;
  validPeriod: string;
  confidence: number;
}

// POST /api/auth/liveness
interface LivenessRequest {
  videoFrames: string[];
  actionSequence: string[];
}

interface LivenessResponse {
  passed: boolean;
  livenessScore: number;
  faceFeatureHash: string;
}

// POST /api/auth/verify
interface VerifyRequest {
  ocrData: OcrResponse;
  livenessToken: string;
}

interface VerifyResponse {
  verified: boolean;
  encryptedRealNameId: string;
  verifyTime: string;
  source: 'police_db' | 'local_cache';
}
```

### 4.3 运单相关

```typescript
// POST /api/waybill
interface CreateWaybillRequest {
  sender: {
    name: string;
    phone: string;
    address: string;
    realNameId?: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
  };
  items: {
    category: string;
    name: string;
    quantity: number;
    declaredValue: number;
    isProhibited: boolean;
    prohibitedNote?: string;
  }[];
  weight: number;
  volume?: number;
  freight: number;
}

interface WaybillResponse {
  id: string;
  trackingNo: string;
  regulatoryCode: string;
  qrCodeUrl: string;
  status: 'created' | 'synced' | 'pending_sync';
  createdAt: string;
  encryptedData: string;
}

// GET /api/waybill
interface ListWaybillRequest {
  page: number;
  pageSize: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

interface ListWaybillResponse {
  list: WaybillResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// POST /api/waybill/batch-sync
interface BatchSyncRequest {
  waybillIds: string[];
}

interface BatchSyncResponse {
  successCount: number;
  failedCount: number;
  failedItems: { id: string; reason: string }[];
}
```

### 4.4 异常件相关

```typescript
// GET /api/exceptions
interface ListExceptionRequest {
  page: number;
  pageSize: number;
  type?: 'id_suspicious' | 'address_ambiguous' | 'prohibited_item' | 'liveness_failed';
  status?: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  priority?: 'high' | 'medium' | 'low';
}

interface ExceptionItem {
  id: string;
  waybillId: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  handlerId?: string;
  reviewNote?: string;
}

// POST /api/exceptions/:id/review
interface ReviewExceptionRequest {
  action: 'approve' | 'reject' | 'escalate';
  note: string;
}

interface ReviewExceptionResponse {
  id: string;
  status: string;
  reviewedAt: string;
  reviewedBy: string;
}
```

### 4.5 人员权限相关

```typescript
// GET /api/users
interface ListUserRequest {
  page: number;
  pageSize: number;
  role?: string;
  outletId?: string;
  status?: 'active' | 'disabled';
}

interface User {
  id: string;
  username: string;
  realName: string;
  role: string;
  roleName: string;
  outletId?: string;
  outletName?: string;
  regionId?: string;
  status: string;
  createdAt: string;
}

// POST /api/users
interface CreateUserRequest {
  username: string;
  password: string;
  realName: string;
  role: string;
  outletId?: string;
  regionId?: string;
}

// PUT /api/users/:id/permissions
interface UpdatePermissionsRequest {
  menuPermissions: string[];
  dataScope: 'all' | 'region' | 'outlet' | 'self';
}
```

### 4.6 日志审计相关

```typescript
// GET /api/audit/logs
interface ListAuditLogRequest {
  page: number;
  pageSize: number;
  operationType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  operationType: string;
  operationDesc: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  detail: Record<string, unknown>;
}

// GET /api/audit/login-logs
interface ListLoginLogRequest {
  page: number;
  pageSize: number;
  userId?: string;
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
}

interface LoginLog {
  id: string;
  userId?: string;
  username: string;
  status: string;
  ip: string;
  location: string;
  device: string;
  createdAt: string;
  failReason?: string;
}
```

### 4.7 监管指令相关

```typescript
// GET /api/orders
interface ListRegulatoryOrderRequest {
  page: number;
  pageSize: number;
  status?: 'pending' | 'executing' | 'submitted' | 'approved' | 'rejected';
  priority?: 'urgent' | 'normal' | 'low';
  issuerId?: string;
}

interface RegulatoryOrder {
  id: string;
  title: string;
  content: string;
  priority: string;
  status: string;
  deadline: string;
  issuerId: string;
  issuerName: string;
  targetOutletIds: string[];
  createdAt: string;
  feedback?: {
    content: string;
    attachments: string[];
    submittedAt: string;
  };
}

// POST /api/orders/:id/feedback
interface OrderFeedbackRequest {
  content: string;
  attachments: string[];
}
```

### 4.8 统计相关

```typescript
// GET /api/statistics/overview
interface OverviewStatistics {
  todayShipments: number;
  todayShipmentsTrend: number;
  authPassRate: number;
  authPassRateTrend: number;
  exceptionCount: number;
  exceptionCountTrend: number;
  pendingSyncCount: number;
}

// GET /api/statistics/shipment-trend
interface ShipmentTrendResponse {
  dates: string[];
  counts: number[];
  authCounts: number[];
}

// GET /api/statistics/exception-distribution
interface ExceptionDistributionResponse {
  types: { name: string; value: number; color: string }[];
}
```

## 5. 服务端架构图

```mermaid
graph TD
    subgraph "路由层 Routes"
        R1["auth.routes.ts"]
        R2["waybill.routes.ts"]
        R3["exception.routes.ts"]
        R4["user.routes.ts"]
        R5["audit.routes.ts"]
        R6["order.routes.ts"]
        R7["statistics.routes.ts"]
    end

    subgraph "中间件层 Middleware"
        M1["auth.middleware (JWT验证)"]
        M2["permission.middleware (RBAC权限)"]
        M3["audit.middleware (操作审计)"]
        M4["validation.middleware (参数校验)"]
        M5["encryption.middleware (敏感数据加密)"]
    end

    subgraph "控制器层 Controllers"
        C1["AuthController"]
        C2["WaybillController"]
        C3["ExceptionController"]
        C4["UserController"]
        C5["AuditController"]
        C6["OrderController"]
        C7["StatisticsController"]
    end

    subgraph "服务层 Services"
        S1["AuthService"]
        S2["WaybillService"]
        S3["ExceptionService"]
        S4["UserService"]
        S5["AuditService"]
        S6["OrderService"]
        S7["StatisticsService"]
        S8["EncryptionService"]
        S9["OfflineSyncService"]
    end

    subgraph "外部服务集成"
        ES1["PoliceDBService (公安库Mock)"]
        ES2["OCRService (身份证识别Mock)"]
        ES3["LivenessService (活体检测Mock)"]
        ES4["RegulatoryCenterService (监管中心Mock)"]
    end

    subgraph "数据层 Repository"
        DR1["UserRepository"]
        DR2["WaybillRepository"]
        DR3["ExceptionRepository"]
        DR4["AuditLogRepository"]
        DR5["OrderRepository"]
    end

    subgraph "数据库 Database"
        DB["SQLite + 加密字段"]
    end

    R1 --> M1 --> M4 --> C1
    R2 --> M1 --> M2 --> M3 --> M4 --> C2
    R3 --> M1 --> M2 --> M3 --> M4 --> C3
    R4 --> M1 --> M2 --> M3 --> M4 --> C4
    R5 --> M1 --> M2 --> M3 --> M4 --> C5
    R6 --> M1 --> M2 --> M3 --> M4 --> C6
    R7 --> M1 --> M2 --> M4 --> C7

    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4
    C5 --> S5
    C6 --> S6
    C7 --> S7

    S1 --> S8 --> ES1
    S1 --> ES2
    S1 --> ES3
    S2 --> S8
    S2 --> S9
    S2 --> ES4
    S9 --> ES4

    S1 --> DR1
    S2 --> DR2
    S3 --> DR3
    S4 --> DR1
    S5 --> DR4
    S6 --> DR5
    S7 --> DR2
    S7 --> DR3

    DR1 --> DB
    DR2 --> DB
    DR3 --> DB
    DR4 --> DB
    DR5 --> DB
```

## 6. 数据模型

### 6.1 实体关系图

```mermaid
erDiagram
    USER {
        string id PK "用户ID"
        string username "用户名"
        string password_hash "密码哈希"
        string real_name "真实姓名"
        string role "角色"
        string outlet_id FK "网点ID"
        string region_id "辖区ID"
        string status "状态"
        string created_at "创建时间"
        string updated_at "更新时间"
    }

    OUTLET {
        string id PK "网点ID"
        string name "网点名称"
        string region_id "辖区ID"
        string address "地址"
        string contact_phone "联系电话"
        string created_at "创建时间"
    }

    WAYBILL {
        string id PK "运单ID"
        string tracking_no "快递单号"
        string regulatory_code "唯一监管码"
        string sender_name_enc "寄件人姓名(加密)"
        string sender_phone_enc "寄件人电话(加密)"
        string sender_address_enc "寄件人地址(加密)"
        string sender_real_name_id "寄件人实名号"
        string receiver_name_enc "收件人姓名(加密)"
        string receiver_phone_enc "收件人电话(加密)"
        string receiver_address_enc "收件人地址(加密)"
        string items_json_enc "物品信息(加密JSON)"
        float weight "重量(kg)"
        float volume "体积(m³)"
        float freight "运费"
        string status "状态"
        string courier_id FK "快递员ID"
        string outlet_id FK "网点ID"
        string qr_code "监管码二维码"
        string created_at "创建时间"
        string synced_at "同步时间"
    }

    REAL_NAME_RECORD {
        string id PK "记录ID"
        string encrypted_real_name_id "加密实名号"
        string name_hash "姓名哈希"
        string id_number_hash "身份证号哈希"
        string face_feature_hash "人脸特征哈希"
        string verified_source "核验来源"
        string verified_at "核验时间"
        string user_id FK "操作人ID"
    }

    EXCEPTION_RECORD {
        string id PK "异常ID"
        string waybill_id FK "运单ID"
        string type "异常类型"
        string status "状态"
        string priority "优先级"
        string description "异常描述"
        string handler_id FK "处理人ID"
        string review_note "复核意见"
        string created_at "创建时间"
        string reviewed_at "复核时间"
    }

    AUDIT_LOG {
        string id PK "日志ID"
        string user_id FK "用户ID"
        string operation_type "操作类型"
        string operation_desc "操作描述"
        string detail_json "详情JSON"
        string ip "IP地址"
        string user_agent "User Agent"
        string created_at "创建时间"
    }

    LOGIN_LOG {
        string id PK "ID"
        string user_id FK "用户ID"
        string username "尝试用户名"
        string status "状态"
        string ip "IP地址"
        string location "登录地点"
        string device "设备信息"
        string fail_reason "失败原因"
        string created_at "创建时间"
    }

    REGULATORY_ORDER {
        string id PK "指令ID"
        string title "标题"
        string content "内容"
        string priority "优先级"
        string status "状态"
        string deadline "截止时间"
        string issuer_id FK "下发人ID"
        string target_outlet_ids "目标网点IDs"
        string feedback_content_enc "反馈内容(加密)"
        string feedback_attachments "附件"
        string feedback_submitted_at "反馈提交时间"
        string created_at "创建时间"
    }

    USER }o--|| OUTLET : "belongs to"
    WAYBILL }o--|| USER : "handled by"
    WAYBILL }o--|| OUTLET : "belongs to"
    EXCEPTION_RECORD }o--|| WAYBILL : "related to"
    EXCEPTION_RECORD }o--o| USER : "handled by"
    AUDIT_LOG }o--|| USER : "operated by"
    LOGIN_LOG }o--o| USER : "logged by"
    REGULATORY_ORDER }o--|| USER : "issued by"
```

### 6.2 数据库初始化 SQL

```sql
-- 网点表
CREATE TABLE IF NOT EXISTS outlets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region_id TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  real_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('courier', 'outlet_admin', 'regional_supervisor', 'head_auditor')),
  outlet_id TEXT REFERENCES outlets(id),
  region_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 运单表
CREATE TABLE IF NOT EXISTS waybills (
  id TEXT PRIMARY KEY,
  tracking_no TEXT UNIQUE NOT NULL,
  regulatory_code TEXT UNIQUE NOT NULL,
  sender_name_enc TEXT NOT NULL,
  sender_phone_enc TEXT NOT NULL,
  sender_address_enc TEXT NOT NULL,
  sender_real_name_id TEXT,
  receiver_name_enc TEXT NOT NULL,
  receiver_phone_enc TEXT NOT NULL,
  receiver_address_enc TEXT NOT NULL,
  items_json_enc TEXT NOT NULL,
  weight REAL NOT NULL,
  volume REAL,
  freight REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'synced', 'pending_sync')),
  courier_id TEXT REFERENCES users(id),
  outlet_id TEXT REFERENCES outlets(id),
  qr_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

-- 实名认证记录表
CREATE TABLE IF NOT EXISTS real_name_records (
  id TEXT PRIMARY KEY,
  encrypted_real_name_id TEXT UNIQUE NOT NULL,
  name_hash TEXT NOT NULL,
  id_number_hash TEXT NOT NULL,
  face_feature_hash TEXT,
  verified_source TEXT NOT NULL,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT REFERENCES users(id)
);

-- 异常件表
CREATE TABLE IF NOT EXISTS exception_records (
  id TEXT PRIMARY KEY,
  waybill_id TEXT REFERENCES waybills(id),
  type TEXT NOT NULL CHECK (type IN ('id_suspicious', 'address_ambiguous', 'prohibited_item', 'liveness_failed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  description TEXT,
  handler_id TEXT REFERENCES users(id),
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

-- 操作审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  operation_type TEXT NOT NULL,
  operation_desc TEXT NOT NULL,
  detail_json TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  username TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  ip TEXT,
  location TEXT,
  device TEXT,
  fail_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 监管指令表
CREATE TABLE IF NOT EXISTS regulatory_orders (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'submitted', 'approved', 'rejected')),
  deadline TEXT NOT NULL,
  issuer_id TEXT REFERENCES users(id),
  target_outlet_ids TEXT NOT NULL,
  feedback_content_enc TEXT,
  feedback_attachments TEXT,
  feedback_submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_waybills_courier ON waybills(courier_id);
CREATE INDEX IF NOT EXISTS idx_waybills_outlet ON waybills(outlet_id);
CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);
CREATE INDEX IF NOT EXISTS idx_waybills_created ON waybills(created_at);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_records(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exception_records(type);
CREATE INDEX IF NOT EXISTS idx_exceptions_priority ON exception_records(priority);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_outlet ON users(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON regulatory_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON regulatory_orders(priority);
```
