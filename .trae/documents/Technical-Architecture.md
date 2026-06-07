## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层 (Frontend - Port 49074)"
        FA["React 18 + Vite"]
        FB["React Router 路由"]
        FC["Three.js / R3F (VR)"]
        FD["TailwindCSS 3 样式"]
        FE["Socket.IO Client (IM)"]
        FF["Axios API Client"]
    end

    subgraph "后端层 (Backend - Port 59074)"
        BA["Node.js + Express 4"]
        BB["RESTful API 控制器"]
        BC["Socket.IO Server (IM实时)"]
        BD["JWT 认证中间件"]
        BE["业务服务层"]
        BF["数据访问层 (DAL)"]
    end

    subgraph "数据层 (Data)"
        DA["SQLite 数据库 (data/app.sqlite)"]
        DB["数据库表: users, properties, orders, messages, etc."]
    end

    subgraph "外部服务 (External)"
        EA["ERP/销控系统 Webhook"]
        EB["CA认证接口 (Mock)"]
        EC["银行贷款预审接口 (Mock)"]
        ED["区块链存证 (Mock)"]
    end

    FA --> FB
    FA --> FC
    FA --> FD
    FA --> FE
    FA --> FF

    FF --> BA
    FE --> BC
    BA --> BB
    BA --> BD
    BB --> BE
    BE --> BF
    BF --> DA
    DA --> DB

    BB --> EA
    BE --> EB
    BE --> EC
    BE --> ED
```

## 2. 技术描述

- **前端**: React@18.2 + react-router-dom@6 + tailwindcss@3.4 + vite@5.2
- **初始化工具**: npm create vite@latest
- **后端**: Node.js + Express@4.19 + better-sqlite3@11 + socket.io@4.7
- **数据库**: SQLite (data/app.sqlite)，使用 better-sqlite3 同步驱动
- **3D/VR**: three@0.165 + @react-three/fiber@8.16 + @react-three/drei@9.108
- **认证**: jsonwebtoken@9.0 + bcryptjs@2.4
- **图表**: recharts@2.12 (管理后台数据看板)
- **实时通信**: socket.io@4.7 (IM系统)

## 3. 路由定义

| 路由路径 | 页面名称 | 权限要求 |
|---------|----------|----------|
| / | 房源大厅首页 | 公开 |
| /properties | 房源列表页 | 公开 |
| /properties/:id | 房源详情页 | 公开 |
| /vr/:id | VR浏览页 | 公开/登录 |
| /im | IM咨询中心 | 登录用户 |
| /purchase/flow/:propertyId | 购房流程页 | 登录用户 |
| /purchase/eligibility | 限购资格核验 | 登录用户 |
| /purchase/subscribe | 电子认购 | 登录用户 |
| /purchase/sign | 线上签约 | 登录用户 |
| /purchase/loan | 贷款预审 | 登录用户 |
| /admin | 管理后台首页 | 管理员 |
| /admin/properties | 楼盘配置 | 管理员 |
| /admin/dashboard | 销售看板 | 管理员 |
| /admin/tickets | 工单处理 | 管理员 |
| /admin/commission | 分佣管理 | 管理员 |
| /login | 登录页 | 公开 |
| /register | 注册页 | 公开 |

## 4. API 定义

```typescript
// 通用响应结构
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 房源相关
interface Property {
  id: number;
  projectName: string;
  city: string;
  district: string;
  address: string;
  status: 'available' | 'locked' | 'sold' | 'offline';
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  orientation: string;
  decoration: string;
  discount: number;
  promotion: string;
  vrShowroomUrl: string;
  vrSalesOfficeUrl: string;
  vrPanoramaUrl: string;
  vrStreetViewUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 用户相关
interface User {
  id: number;
  phone: string;
  name: string;
  role: 'customer' | 'agent' | 'advisor' | 'admin';
  city: string;
  tags: string[];
  createdAt: string;
}

// IM消息
interface ChatMessage {
  id: number;
  sessionId: string;
  senderId: number;
  receiverId: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'sop';
  timestamp: string;
  isRead: boolean;
}

// 购房订单
interface PurchaseOrder {
  id: number;
  orderNo: string;
  propertyId: number;
  userId: number;
  advisorId: number;
  status: 'eligibility_pending' | 'eligibility_pass' | 'subscribed' | 'signed' | 'fund_supervised' | 'loan_pending' | 'completed';
  amount: number;
  caVerified: boolean;
  blockchainHash: string;
  createdAt: string;
}

// API Endpoints
// GET    /api/health                           健康检查
// GET    /api/properties                       房源列表
// GET    /api/properties/:id                   房源详情
// GET    /api/properties/:id/price             一房一价表
// POST   /api/auth/login                       登录
// POST   /api/auth/register                    注册
// GET    /api/user/profile                     用户信息
// POST   /api/purchase/eligibility-check       限购资格核验
// POST   /api/purchase/subscribe               发起电子认购
// POST   /api/purchase/sign                    线上签约
// POST   /api/purchase/loan-preapproval        贷款预审
// GET    /api/admin/dashboard/stats            销售看板数据
// GET    /api/admin/tickets                    工单列表
// POST   /api/admin/tickets/:id/process        处理工单
// GET    /api/im/sessions                      会话列表
// GET    /api/im/messages/:sessionId           消息列表
// POST   /api/im/send                          发送消息
// GET    /api/im/sop-templates                 SOP话术库
```

## 5. 服务器架构图

```mermaid
graph TB
    subgraph "HTTP 请求层"
        A["CORS 中间件"]
        B["请求日志中间件"]
        C["JWT 认证中间件"]
    end

    subgraph "控制器层 (Controllers)"
        D["PropertyController (房源)"]
        E["AuthController (认证)"]
        F["PurchaseController (购房)"]
        G["IMController (聊天)"]
        H["AdminController (管理)"]
    end

    subgraph "服务层 (Services)"
        I["PropertyService"]
        J["AuthService"]
        K["PurchaseService"]
        L["IMService"]
        M["AdminService"]
        N["SyncService (ERP同步)"]
    end

    subgraph "数据访问层 (Repositories)"
        O["PropertyRepository"]
        P["UserRepository"]
        Q["OrderRepository"]
        R["MessageRepository"]
        S["TicketRepository"]
    end

    subgraph "数据库"
        T["SQLite (better-sqlite3)"]
    end

    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H

    D --> I
    E --> J
    F --> K
    G --> L
    H --> M

    I --> O
    J --> P
    K --> Q
    L --> R
    M --> S
    N --> O

    O --> T
    P --> T
    Q --> T
    R --> T
    S --> T
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "发起"
    USERS ||--o{ MESSAGES : "发送"
    USERS ||--o{ CUSTOMER_TAGS : "被打标"
    PROPERTIES ||--o{ PRICE_SCHEDULE : "包含"
    PROPERTIES ||--o{ ORDERS : "被购买"
    PROPERTIES ||--o{ PROMOTIONS : "参与"
    ORDERS ||--|| BLOCKCHAIN_RECORDS : "存证"
    CHAT_SESSIONS ||--o{ MESSAGES : "包含"
    USERS ||--o{ CHAT_SESSIONS : "参与"
    SOP_TEMPLATES ||--o{ MESSAGES : "被使用"
    TICKETS ||--|| PROPERTIES : "关联"
    COMMISSION_RULES ||--o{ COMMISSION_SETTLEMENTS : "应用"
    USERS ||--o{ COMMISSION_SETTLEMENTS : "获得"
    ELIGIBILITY_CHECKS ||--|| ORDERS : "对应"

    USERS {
        int id PK
        string phone
        string name
        string password_hash
        string role
        string city
        string tags
        datetime created_at
    }

    PROPERTIES {
        int id PK
        string project_name
        string city
        string district
        string address
        string status
        decimal price
        float area
        int bedrooms
        int bathrooms
        string floor
        string orientation
        string decoration
        decimal discount
        string promotion
        string vr_showroom_url
        string vr_sales_office_url
        string vr_panorama_url
        string vr_street_view_url
        datetime created_at
        datetime updated_at
    }

    PRICE_SCHEDULE {
        int id PK
        int property_id FK
        string unit_no
        decimal original_price
        decimal current_price
        string status
    }

    ORDERS {
        int id PK
        string order_no
        int property_id FK
        int user_id FK
        int advisor_id FK
        string status
        decimal amount
        boolean ca_verified
        string blockchain_hash
        datetime created_at
    }

    MESSAGES {
        int id PK
        string session_id
        int sender_id FK
        int receiver_id FK
        string content
        string type
        datetime timestamp
        boolean is_read
    }

    CHAT_SESSIONS {
        string id PK
        int customer_id FK
        int advisor_id FK
        int property_id FK
        datetime last_message_at
    }

    SOP_TEMPLATES {
        int id PK
        string category
        string title
        string content
        string scenario
    }

    TICKETS {
        int id PK
        int property_id FK
        string type
        string risk_level
        string ai_analysis
        string status
        int handler_id FK
        datetime created_at
    }

    COMMISSION_RULES {
        int id PK
        string city
        decimal base_rate
        decimal bonus_rate
        string conditions
    }

    BLOCKCHAIN_RECORDS {
        int id PK
        int order_id FK
        string hash
        string block_number
        datetime timestamp
    }

    ELIGIBILITY_CHECKS {
        int id PK
        int user_id FK
        int property_id FK
        string city_policy
        string id_number
        string hukou_status
        int house_count
        boolean passed
        string result
        datetime checked_at
    }

    PROMOTIONS {
        int id PK
        int property_id FK
        string type
        string name
        decimal discount_value
        datetime start_time
        datetime end_time
    }
```

### 6.2 数据定义语言 (DDL)

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    city VARCHAR(50),
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 房源表
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    price DECIMAL(15,2) NOT NULL,
    area FLOAT NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    floor VARCHAR(20),
    orientation VARCHAR(20),
    decoration VARCHAR(50),
    discount DECIMAL(5,2) DEFAULT 100,
    promotion TEXT,
    vr_showroom_url TEXT,
    vr_sales_office_url TEXT,
    vr_panorama_url TEXT,
    vr_street_view_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 一房一价表
CREATE TABLE IF NOT EXISTS price_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    unit_no VARCHAR(20) NOT NULL,
    original_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    property_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    advisor_id INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'eligibility_pending',
    amount DECIMAL(15,2) NOT NULL,
    ca_verified BOOLEAN DEFAULT 0,
    blockchain_hash VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    advisor_id INTEGER NOT NULL,
    property_id INTEGER,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (advisor_id) REFERENCES users(id)
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(50) NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- SOP话术表
CREATE TABLE IF NOT EXISTS sop_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    scenario VARCHAR(50)
);

-- 工单打
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20),
    ai_analysis TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    handler_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 分佣规则表
CREATE TABLE IF NOT EXISTS commission_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city VARCHAR(50) NOT NULL,
    base_rate DECIMAL(5,4) NOT NULL,
    bonus_rate DECIMAL(5,4) DEFAULT 0,
    conditions TEXT
);

-- 区块链存证表
CREATE TABLE IF NOT EXISTS blockchain_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    hash VARCHAR(255) NOT NULL,
    block_number VARCHAR(50),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 资格核验表
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    city_policy TEXT,
    id_number VARCHAR(50),
    hukou_status VARCHAR(50),
    house_count INTEGER DEFAULT 0,
    passed BOOLEAN,
    result TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 优惠活动表
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
```
