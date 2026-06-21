## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A1["React 18 + TypeScript"]
        A2["Tailwind CSS 3"]
        A3["Zustand 状态管理"]
        A4["React Router DOM"]
        A5["Recharts 图表库"]
        A6["Lucide React 图标"]
    end

    subgraph "后端层"
        B1["Express.js 4"]
        B2["RESTful API"]
        B3["JWT 认证中间件"]
        B4["数据校验层"]
        B5["业务逻辑层"]
    end

    subgraph "数据层"
        C1["SQLite 数据库"]
        C2["Mock 数据服务"]
        C3["文件存储（本地）"]
    end

    subgraph "外部服务"
        D1["无外部依赖"]
    end

    A1 --> B1
    B1 --> C1
    B1 --> C2
    B1 --> C3
```

## 2. 技术描述

- **前端**：React@18 + TypeScript + Tailwind CSS@3 + Vite
- **初始化工具**：vite-init
- **状态管理**：Zustand
- **路由管理**：React Router DOM
- **图表可视化**：Recharts
- **图标库**：Lucide React
- **后端**：Express@4 + TypeScript
- **数据库**：SQLite（开发阶段使用Mock数据）
- **认证方式**：JWT Token
- **包管理器**：pnpm

## 3. 路由定义

| 路由 | 页面 | 权限要求 |
|------|------|----------|
| / | 行情看板首页 | 公开 |
| /market | 实时行情看板 | 登录用户 |
| /market/heatmap | 区域价差热力图 | 登录用户 |
| /market/trend | 历史走势对比 | 登录用户 |
| /market/alert | 价格预警订阅 | 登录用户 |
| /supplies | 货源列表 | 公开 |
| /supplies/publish | 货源发布 | 货源方 |
| /supplies/:id | 货源详情 | 公开 |
| /stations | 回收站列表 | 公开 |
| /stations/:id | 回收站数字名片 | 公开 |
| /alliance | 联盟管理首页 | 联盟成员 |
| /alliance/structure | 组织架构管理 | 盟主/分盟主 |
| /alliance/tasks | 任务派发中心 | 盟主/分盟主 |
| /alliance/settlement | 结算分账 | 盟主/分盟主/站点 |
| /dashboard | 数据看板 | 运营方/采购方 |
| /dashboard/supply-demand | 供需波动分析 | 运营方/采购方 |
| /dashboard/funnel | 转化漏斗分析 | 运营方/采购方 |
| /profile | 个人中心 | 登录用户 |
| /messages | 消息中心 | 登录用户 |
| /login | 登录页 | 公开 |
| /register | 注册页 | 公开 |

## 4. API 定义

### 4.1 认证接口

```typescript
// 用户登录
POST /api/auth/login
Request: { phone: string; password: string; role: 'supplier' | 'buyer' | 'operator' }
Response: { token: string; user: User }

// 用户注册
POST /api/auth/register
Request: { phone: string; password: string; role: string; companyName: string }
Response: { success: boolean; userId: string }

// 获取当前用户信息
GET /api/auth/me
Response: { user: User }
```

### 4.2 行情接口

```typescript
// 获取实时行情
GET /api/market/prices
Response: { 
  categories: CategoryPrice[],
  updateTime: string
}

// 获取历史走势数据
GET /api/market/history
Query: { category: string; startDate: string; endDate: string; region?: string }
Response: { data: PricePoint[] }

// 获取区域价格数据
GET /api/market/regional
Query: { category: string }
Response: { regions: RegionalPrice[] }

// 订阅价格预警
POST /api/market/alerts
Request: { category: string; threshold: number; type: 'above' | 'below'; notifyType: string[] }
Response: { alertId: string }

// 获取预警列表
GET /api/market/alerts
Response: { alerts: PriceAlert[] }
```

### 4.3 货源接口

```typescript
// 获取货源列表
GET /api/supplies
Query: { 
  category?: string; 
  minTonnage?: number; 
  maxTonnage?: number;
  minPurity?: number;
  region?: string;
  certified?: boolean;
  page?: number;
  pageSize?: number
}
Response: { list: Supply[]; total: number }

// 发布货源
POST /api/supplies
Request: {
  category: string;
  tonnage: number;
  purity: number;
  description: string;
  price: number;
  location: { province: string; city: string; address: string };
  images: string[]
}
Response: { supplyId: string }

// 获取货源详情
GET /api/supplies/:id
Response: { supply: SupplyDetail }

// 发起询价
POST /api/supplies/:id/inquiry
Request: { message: string; expectedPrice?: number }
Response: { inquiryId: string }
```

### 4.4 回收站接口

```typescript
// 获取回收站列表
GET /api/stations
Query: { region?: string; category?: string; page?: number }
Response: { list: Station[]; total: number }

// 获取回收站详情
GET /api/stations/:id
Response: { station: StationDetail }

// 更新回收站信息
PUT /api/stations/:id
Request: { 
  name: string; 
  address: string; 
  serviceRadius: number;
  certifications: Certification[]
}
Response: { success: boolean }
```

### 4.5 联盟接口

```typescript
// 获取联盟组织架构
GET /api/alliance/structure
Response: { structure: AllianceNode }

// 创建任务
POST /api/alliance/tasks
Request: { title: string; description: string; assigneeId: string; deadline: string }
Response: { taskId: string }

// 获取任务列表
GET /api/alliance/tasks
Response: { tasks: AllianceTask[] }

// 获取结算账单
GET /api/alliance/settlements
Query: { month?: string }
Response: { settlements: Settlement[] }

// 分账规则配置
POST /api/alliance/rules
Request: { role: string; percentage: number }
Response: { success: boolean }
```

### 4.6 数据看板接口

```typescript
// 获取供需波动数据
GET /api/dashboard/supply-demand
Query: { period: 'week' | 'month' | 'quarter' | 'year' }
Response: { supplyData: DataPoint[]; demandData: DataPoint[] }

// 获取转化漏斗数据
GET /api/dashboard/funnel
Query: { period: 'week' | 'month' | 'quarter' }
Response: { funnel: FunnelStep[] }

// 获取核心指标
GET /api/dashboard/metrics
Response: {
  totalTransaction: number;
  totalVolume: number;
  activeUsers: number;
  conversionRate: number;
  yoyGrowth: number;
  momGrowth: number
}
```

## 5. 服务端架构图

```mermaid
graph TD
    A["客户端请求"] --> B["Express 路由层"]
    B --> C["JWT 认证中间件"]
    C --> D["参数校验层"]
    D --> E["Controller 控制层"]
    E --> F["Service 业务逻辑层"]
    F --> G["Repository 数据访问层"]
    G --> H["SQLite 数据库"]
    F --> I["Mock 数据服务"]
    E --> J["统一响应处理"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    USER ||--o{ SUPPLY : "发布"
    USER ||--o{ INQUIRY : "发起"
    USER ||--o{ STATION : "拥有"
    USER ||--o{ PRICE_ALERT : "订阅"
    USER ||--o| ALLIANCE_MEMBER : "属于"
    ALLIANCE ||--o{ ALLIANCE_MEMBER : "包含"
    ALLIANCE ||--o{ ALLIANCE_TASK : "派发"
    ALLIANCE ||--o{ SETTLEMENT : "产生"
    SUPPLY ||--o{ INQUIRY : "收到"
    SUPPLY }o--|| CATEGORY : "属于"
    STATION ||--o{ CERTIFICATION : "拥有"
    CATEGORY ||--o{ MARKET_PRICE : "产生"

    USER {
        uuid id PK
        string phone
        string passwordHash
        string role
        string companyName
        string status
        datetime createdAt
    }

    CATEGORY {
        uuid id PK
        string name
        string code
        string unit
        string description
    }

    SUPPLY {
        uuid id PK
        uuid categoryId FK
        uuid supplierId FK
        number tonnage
        number purity
        number price
        string province
        string city
        string address
        string description
        string[] images
        boolean certified
        string status
        datetime createdAt
    }

    INQUIRY {
        uuid id PK
        uuid supplyId FK
        uuid buyerId FK
        number expectedPrice
        string message
        string status
        datetime createdAt
    }

    STATION {
        uuid id PK
        uuid ownerId FK
        string name
        string address
        number serviceRadius
        string province
        string city
        number longitude
        number latitude
    }

    CERTIFICATION {
        uuid id PK
        uuid stationId FK
        string type
        string number
        date expiryDate
        string imageUrl
        string status
    }

    PRICE_ALERT {
        uuid id PK
        uuid userId FK
        uuid categoryId FK
        number threshold
        string type
        string[] notifyChannels
        boolean enabled
    }

    MARKET_PRICE {
        uuid id PK
        uuid categoryId FK
        string region
        number price
        number change
        datetime recordedAt
    }

    ALLIANCE {
        uuid id PK
        string name
        uuid leaderId FK
        string level
        uuid parentId FK
    }

    ALLIANCE_MEMBER {
        uuid id PK
        uuid allianceId FK
        uuid userId FK
        string role
        datetime joinedAt
    }

    ALLIANCE_TASK {
        uuid id PK
        uuid allianceId FK
        uuid assignerId FK
        uuid assigneeId FK
        string title
        string description
        string status
        datetime deadline
        datetime createdAt
    }

    SETTLEMENT {
        uuid id PK
        uuid allianceId FK
        uuid userId FK
        number amount
        string period
        string status
        datetime createdAt
    }
```

### 6.2 核心数据类型定义

```typescript
interface User {
  id: string;
  phone: string;
  role: 'supplier' | 'buyer' | 'operator';
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
  unit: string;
}

interface Supply {
  id: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  tonnage: number;
  purity: number;
  price: number;
  province: string;
  city: string;
  certified: boolean;
  status: 'active' | 'sold' | 'expired';
  createdAt: string;
  images: string[];
}

interface Station {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  serviceRadius: number;
  province: string;
  city: string;
  certifications: Certification[];
}

interface Certification {
  id: string;
  type: string;
  number: string;
  expiryDate: string;
  imageUrl: string;
  status: 'valid' | 'expired' | 'pending';
}

interface MarketPrice {
  categoryId: string;
  categoryName: string;
  price: number;
  change: number;
  changePercent: number;
  region?: string;
  recordedAt: string;
}

interface PricePoint {
  date: string;
  price: number;
  category?: string;
}

interface RegionalPrice {
  region: string;
  province: string;
  price: number;
  avgPrice: number;
  diff: number;
}

interface AllianceNode {
  id: string;
  name: string;
  level: 'leader' | 'branch' | 'station';
  members: AllianceMember[];
  children: AllianceNode[];
}

interface AllianceTask {
  id: string;
  title: string;
  description: string;
  assignerName: string;
  assigneeName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string;
}

interface Settlement {
  id: string;
  userName: string;
  role: string;
  amount: number;
  period: string;
  status: 'pending' | 'paid' | 'rejected';
}

interface FunnelStep {
  name: string;
  value: number;
  conversionRate: number;
}
```
