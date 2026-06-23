## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["enterprise-web<br/>(寄件人端)"]
        B["admin-web<br/>(管理后台)"]
    end
    
    subgraph "网关层"
        C["API Gateway<br/>(HTTPS + Token认证)"]
    end
    
    subgraph "服务层"
        D["订单服务"]
        E["智能路由引擎"]
        F["面单防伪服务"]
        G["异常预警服务"]
        H["轨迹追踪服务"]
        I["账单服务"]
        J["碳足迹计算服务"]
        K["运能监控服务"]
    end
    
    subgraph "数据层"
        L["SQLite 主数据库"]
        M["Redis 缓存"]
        N["文件存储<br/>(分拣影像/面单)"]
    end
    
    subgraph "安全层"
        O["TLS/SSL 传输加密"]
        P["接口签名校验"]
        Q["敏感数据脱敏"]
    end
    
    A --> C
    B --> C
    C --> D & E & F & G & H & I & J & K
    D & E & F & G & H & I & J & K --> L & M & N
    C --> O & P & Q
```

## 2. 技术描述

### 2.1 前端技术栈
- **框架**: React@18.2 + TypeScript@5
- **构建工具**: Vite@5
- **UI 组件库**: Ant Design@5
- **路由**: React Router@6
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **3D 地图**: three.js + @react-three/fiber + @react-three/drei
- **图表**: ECharts@5
- **Excel 处理**: xlsx
- **日期处理**: dayjs
- **图标**: @ant-design/icons

### 2.2 后端技术栈
- **框架**: Express@4
- **语言**: TypeScript@5
- **数据库**: SQLite3 (现有 ems.db)
- **缓存**: Redis
- **认证**: JWT
- **API 文档**: Swagger/OpenAPI
- **加密**: crypto-js (符合邮政业安全规范)

### 2.3 安全规范
- 全链路 HTTPS/TLS 1.3 加密传输
- 接口请求签名校验（HMAC-SHA256）
- 敏感数据加密存储（手机号、地址等）
- 访问频率限制
- SQL 注入防护
- XSS/CSRF 防护

## 3. 路由定义

### 3.1 enterprise-web (寄件人端)
| 路由 | 页面 | 用途 |
|------|------|------|
| / | Dashboard | 首页工作台 |
| /orders | Orders | 订单列表 |
| /orders/create | OrderCreate | 多场景下单 |
| /orders/:id/track | TrackDetail | 3D轨迹追踪 |
| /bills | Bills | 月结账单列表 |
| /bills/:id | BillDetail | 账单详情 |
| /carbon | CarbonFootprint | 碳足迹统计 |

### 3.2 admin-web (管理后台)
| 路由 | 页面 | 用途 |
|------|------|------|
| / | Dashboard | 运能看板 |
| /exceptions | ExceptionCenter | 异常预警中枢 |
| /routing | RoutingConfig | 智能路由配置 |
| /waybill | WaybillSecurity | 面单防伪管理 |
| /hubs | HubMonitor | 分拣中心监控 |

## 4. API 定义

### 4.1 TypeScript 类型定义

```typescript
// 订单类型
interface Order {
  id: string;
  waybillNo: string;
  sender: {
    name: string;
    phone: string;
    address: string;
  };
  recipient: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  goods: {
    name: string;
    weight: number;
    type: 'normal' | 'cold' | 'fragile';
  };
  routing: {
    routeType: 'air' | 'land' | 'cold';
    estimatedTime: number;
    hubs: string[];
  };
  status: 'pending' | 'collected' | 'sorting' | 'transit' | 'delivering' | 'signed' | 'exception';
  department?: string;
  project?: string;
  totalFee: number;
  createdAt: string;
  qrCode: string;
  blockchainHash: string;
}

// 轨迹节点
interface TrackNode {
  id: string;
  orderId: string;
  hubName: string;
  location: { lat: number; lng: number };
  status: string;
  timestamp: string;
  operator: string;
  imageUrl?: string;
}

// 账单
interface Bill {
  id: string;
  enterpriseName: string;
  month: string;
  totalOrders: number;
  totalWeight: number;
  totalFee: number;
  paidAmount: number;
  status: 'draft' | 'confirmed' | 'paid' | 'overdue';
  details: BillDetail[];
  orders: Order[];
}

interface BillDetail {
  id: string;
  dimension: 'department' | 'project' | 'recipient_city';
  department?: string;
  project?: string;
  recipientCity?: string;
  orderCount: number;
  totalWeight: number;
  totalFee: number;
}

// 碳足迹
interface CarbonRecord {
  id: string;
  orderId: string;
  packaging: {
    carton: number;
    tape: number;
    filler: number;
  };
  carbonEmission: number;
  carbonReduction: number;
  greenLevel: 'A' | 'B' | 'C';
}

// 运能数据
interface HubCapacity {
  hubId: string;
  hubName: string;
  throughput: number;
  maxCapacity: number;
  vehiclesInTransit: number;
  exceptionCount: number;
  warningLevel: 'normal' | 'warning' | 'danger';
}

// 异常件
interface ExceptionOrder {
  id: string;
  orderId: string;
  waybillNo: string;
  type: 'delay' | 'damage' | 'lost' | 'address_error';
  description: string;
  status: 'pending' | 'processing' | 'resolved';
  createdAt: string;
  handledBy?: string;
  handledAt?: string;
}
```

### 4.2 接口列表

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录获取 token | 否 |
| POST | `/api/orders` | 创建订单 | 是 |
| POST | `/api/orders/batch` | 批量导入订单 | 是 |
| GET | `/api/orders` | 订单列表 | 是 |
| GET | `/api/orders/:id` | 订单详情 | 是 |
| GET | `/api/orders/:id/track` | 轨迹详情 | 是 |
| POST | `/api/orders/:id/print` | 打印面单 | 是 |
| GET | `/api/bills` | 账单列表 | 是 |
| GET | `/api/bills/:id` | 账单详情 | 是 |
| POST | `/api/bills/generate` | 生成账单 | 是 |
| GET | `/api/bills/:id/export` | 导出账单 | 是 |
| GET | `/api/carbon` | 碳足迹统计 | 是 |
| GET | `/api/dashboard/capacity` | 运能看板数据 | 是 |
| GET | `/api/exceptions` | 异常件列表 | 是 |
| POST | `/api/exceptions/:id/handle` | 处理异常件 | 是 |
| GET | `/api/routing/config` | 路由配置 | 是 |
| POST | `/api/routing/match` | 智能路由匹配 | 是 |

## 5. 服务端架构图

```mermaid
graph TD
    subgraph "Controller 控制层"
        A1["AuthController"]
        A2["OrderController"]
        A3["TrackController"]
        A4["BillController"]
        A5["CarbonController"]
        A6["DashboardController"]
        A7["ExceptionController"]
        A8["RoutingController"]
    end
    
    subgraph "Service 服务层"
        B1["AuthService"]
        B2["OrderService"]
        B3["TrackService"]
        B4["BillService"]
        B5["CarbonService"]
        B6["RoutingEngineService"]
        B7["SecurityService"]
        B8["NotificationService"]
    end
    
    subgraph "Repository 数据层"
        C1["UserRepository"]
        C2["OrderRepository"]
        C3["TrackRepository"]
        C4["BillRepository"]
        C5["CarbonRepository"]
        C6["HubRepository"]
        C7["ExceptionRepository"]
    end
    
    subgraph "数据库"
        D1["SQLite<br/>(ems.db)"]
        D2["Redis Cache"]
    end
    
    A1 --> B1
    A2 --> B2 & B6
    A3 --> B3
    A4 --> B4
    A5 --> B5
    A6 --> B6
    A7 --> B8
    A8 --> B6
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    B4 --> C4
    B5 --> C5
    B6 --> C6
    B7 --> C1 & C2
    B8 --> C7
    
    C1 & C2 & C3 & C4 & C5 & C6 & C7 --> D1
    B1 & B2 & B3 & B4 & B5 & B6 --> D2
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    USER ||--o{ ORDER : creates
    ORDER ||--o{ TRACK_NODE : has
    ORDER ||--|| CARBON_RECORD : has
    ORDER ||--o| BILL_DETAIL : belongs_to
    BILL ||--o{ BILL_DETAIL : contains
    BILL ||--o{ ORDER : contains
    HUB ||--o{ TRACK_NODE : processes
    ORDER ||--o| EXCEPTION_ORDER : may_have
    ROUTING_RULE ||--o{ ORDER : matches

    USER {
        string id PK
        string username
        string password_hash
        string role
        string enterprise_name
        string phone
        datetime created_at
    }

    ORDER {
        string id PK
        string waybill_no
        string sender_name
        string sender_phone
        string sender_address
        string recipient_name
        string recipient_phone
        string recipient_address
        string recipient_city
        string goods_name
        float weight
        string goods_type
        string route_type
        int estimated_hours
        string status
        string department
        string project
        float total_fee
        string qr_code
        string blockchain_hash
        datetime created_at
        string user_id FK
    }

    TRACK_NODE {
        string id PK
        string order_id FK
        string hub_name
        float lat
        float lng
        string status
        string operator
        string image_url
        datetime timestamp
    }

    BILL {
        string id PK
        string enterprise_name
        string month
        int total_orders
        float total_weight
        float total_fee
        float paid_amount
        string status
        datetime created_at
    }

    BILL_DETAIL {
        string id PK
        string bill_id FK
        string dimension
        string department
        string project
        string recipient_city
        int order_count
        float total_weight
        float total_fee
    }

    CARBON_RECORD {
        string id PK
        string order_id FK
        float carton_usage
        float tape_usage
        float filler_usage
        float carbon_emission
        float carbon_reduction
        string green_level
    }

    HUB {
        string id PK
        string name
        string location
        int max_capacity
        int current_throughput
        int vehicles_in_transit
    }

    EXCEPTION_ORDER {
        string id PK
        string order_id FK
        string type
        string description
        string status
        string handled_by
        datetime handled_at
        datetime created_at
    }

    ROUTING_RULE {
        string id PK
        int min_weight
        int max_weight
        string destination
        int max_hours
        string route_type
        int priority
    }
```

### 6.2 DDL 语句

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('sender', 'courier', 'sorter', 'recipient', 'admin')),
  enterprise_name TEXT,
  phone TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  waybill_no TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL,
  goods_name TEXT NOT NULL,
  weight REAL NOT NULL,
  goods_type TEXT NOT NULL CHECK(goods_type IN ('normal', 'cold', 'fragile')),
  route_type TEXT CHECK(route_type IN ('air', 'land', 'cold')),
  estimated_hours INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  department TEXT,
  project TEXT,
  total_fee REAL NOT NULL DEFAULT 0,
  qr_code TEXT,
  blockchain_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  bill_id TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(bill_id) REFERENCES bills(id)
);

-- 轨迹节点表
CREATE TABLE IF NOT EXISTS track_nodes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  hub_name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status TEXT NOT NULL,
  operator TEXT,
  image_url TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

-- 账单表
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  enterprise_name TEXT NOT NULL,
  month TEXT NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_weight REAL NOT NULL DEFAULT 0,
  total_fee REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'paid', 'overdue')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 账单明细表
CREATE TABLE IF NOT EXISTS bill_details (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK(dimension IN ('department', 'project', 'recipient_city')),
  department TEXT,
  project TEXT,
  recipient_city TEXT,
  order_count INTEGER NOT NULL,
  total_weight REAL NOT NULL,
  total_fee REAL NOT NULL,
  FOREIGN KEY(bill_id) REFERENCES bills(id)
);

-- 碳足迹表
CREATE TABLE IF NOT EXISTS carbon_records (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  carton_usage REAL NOT NULL DEFAULT 0,
  tape_usage REAL NOT NULL DEFAULT 0,
  filler_usage REAL NOT NULL DEFAULT 0,
  carbon_emission REAL NOT NULL,
  carbon_reduction REAL NOT NULL,
  green_level TEXT NOT NULL CHECK(green_level IN ('A', 'B', 'C')),
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

-- 分拣中心表
CREATE TABLE IF NOT EXISTS hubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  current_throughput INTEGER NOT NULL DEFAULT 0,
  vehicles_in_transit INTEGER NOT NULL DEFAULT 0,
  lat REAL NOT NULL,
  lng REAL NOT NULL
);

-- 异常件表
CREATE TABLE IF NOT EXISTS exception_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('delay', 'damage', 'lost', 'address_error')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved')),
  handled_by TEXT,
  handled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

-- 路由规则表
CREATE TABLE IF NOT EXISTS routing_rules (
  id TEXT PRIMARY KEY,
  min_weight INTEGER NOT NULL DEFAULT 0,
  max_weight INTEGER NOT NULL,
  destination TEXT,
  max_hours INTEGER,
  route_type TEXT NOT NULL CHECK(route_type IN ('air', 'land', 'cold')),
  priority INTEGER NOT NULL DEFAULT 1
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_waybill_no ON orders(waybill_no);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_track_nodes_order_id ON track_nodes(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_month ON bills(month);
CREATE INDEX IF NOT EXISTS idx_exception_orders_status ON exception_orders(status);
```
