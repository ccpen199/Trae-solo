## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (Frontend)"
        A1["持券人Web端 (React)"]
        A2["商户端 POS (React)"]
        A3["合作方管理端 (React)"]
        A4["平台管理后台 (React)"]
    end
    
    subgraph "API网关层 (API Gateway)"
        B1["Nginx 负载均衡"]
        B2["JWT 认证鉴权"]
        B3["请求限流/熔断"]
        B4["日志审计"]
    end
    
    subgraph "业务服务层 (Backend)"
        C1["权益聚合服务 (Node.js)"]
        C2["兑换交易服务 (Node.js)"]
        C3["智能合约引擎 (Node.js)"]
        C4["多模态核销服务 (Node.js)"]
        C5["分润结算服务 (Node.js)"]
        C6["AR地理围栏服务 (Node.js)"]
    end
    
    subgraph "区块链存证层 (Blockchain)"
        D1["Hyperledger Fabric 模拟节点"]
        D2["链码 (Chaincode)"]
        D3["哈希计算/签名验证"]
        D4["区块存储"]
    end
    
    subgraph "数据层 (Data)"
        E1["PostgreSQL (业务数据)"]
        E2["Redis (缓存/会话)"]
        E3["MongoDB (AR信息/日志)"]
    end
    
    subgraph "外部服务"
        F1["保险积分API"]
        F2["银行信用卡API"]
        F3["航空里程API"]
        F4["运营商API"]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    
    B4 --> C1
    B4 --> C2
    B4 --> C3
    B4 --> C4
    B4 --> C5
    B4 --> C6
    
    C2 --> D1
    C3 --> D1
    C6 --> D1
    
    D1 --> D2
    D2 --> D3
    D3 --> D4
    
    C1 --> E1
    C2 --> E1
    C3 --> E1
    C4 --> E1
    C5 --> E1
    
    C1 --> E2
    C2 --> E2
    C4 --> E2
    
    C6 --> E3
    
    C1 --> F1
    C1 --> F2
    C1 --> F3
    C1 --> F4
```

---

## 2. 技术选型说明

### 2.1 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router v6
- **状态管理**: Zustand
- **UI组件库**: shadcn/ui + TailwindCSS 3
- **图表可视化**: Recharts + D3.js
- **地图/AR**: Leaflet (地理围栏) + Three.js (AR效果)
- **动画**: Framer Motion
- **HTTP客户端**: Axios + React Query

### 2.2 后端技术栈
- **运行时**: Node.js 20
- **框架**: Express 4
- **类型安全**: TypeScript
- **ORM**: Prisma
- **认证**: JWT + bcrypt
- **API文档**: Swagger / OpenAPI 3.0

### 2.3 数据存储
- **关系型数据库**: PostgreSQL 16 (业务主数据)
- **缓存**: Redis 7 (会话、热点数据、分布式锁)
- **文档数据库**: MongoDB 6 (AR信息、日志、非结构化数据)

### 2.4 区块链层
- **Hyperledger Fabric 模拟实现**: 简化版链上存证，包含Merkle树、区块结构、签名验证
- **加密算法**: SHA-256哈希、ECDSA签名、AES-256加密

---

## 3. 路由定义

### 3.1 持券人端路由
| 路由 | 页面 | 权限 |
|------|------|------|
| /user/dashboard | 积分聚合仪表盘 | 持券人 |
| /user/market | 权益兑换商城 | 持券人 |
| /user/ar-community | AR互助社区 | 持券人 |
| /user/assets | 我的资产 | 持券人 |
| /user/orders | 兑换记录 | 持券人 |
| /user/profile | 个人中心 | 持券人 |

### 3.2 商户端路由
| 路由 | 页面 | 权限 |
|------|------|------|
| /merchant/pos | POS核销工作台 | 商户 |
| /merchant/vouchers | 券码管理 | 商户 |
| /merchant/transactions | 交易记录 | 商户 |
| /merchant/settlement | 结算管理 | 商户 |
| /merchant/stores | 门店管理 | 商户 |

### 3.3 合作方端路由
| 路由 | 页面 | 权限 |
|------|------|------|
| /partner/api-config | API接入配置 | 合作方 |
| /partner/keys | 对账密钥管理 | 合作方 |
| /partner/reports | 数据报表 | 合作方 |
| /partner/profit | 分润明细 | 合作方 |

### 3.4 管理后台路由
| 路由 | 页面 | 权限 |
|------|------|------|
| /admin/dashboard | 权益健康度监控 | 管理员 |
| /admin/settlement | 分润结算管理 | 管理员 |
| /admin/geofence | AR地理围栏管理 | 管理员 |
| /admin/blockchain | 区块链浏览器 | 管理员 |
| /admin/partners | 合作方管理 | 管理员 |
| /admin/merchants | 商户管理 | 管理员 |
| /admin/settings | 系统设置 | 管理员 |

---

## 4. API 接口定义

### 4.1 TypeScript 类型定义

```typescript
// 核心实体类型
interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'user' | 'merchant' | 'partner' | 'admin';
  createdAt: Date;
}

interface PointsAccount {
  id: string;
  userId: string;
  source: 'insurance' | 'bank' | 'airline' | 'telecom';
  sourceAccountId: string;
  balance: number;
  frozenBalance: number;
  expiredAt?: Date;
  lastSyncedAt: Date;
}

interface Partner {
  id: string;
  name: string;
  type: 'insurance' | 'bank' | 'airline' | 'telecom';
  apiKey: string;
  apiSecret: string;
  reconciliationKey: string;
  ipWhitelist: string[];
  profitShareRate: number;
  status: 'active' | 'inactive';
}

interface Merchant {
  id: string;
  name: string;
  businessLicense: string;
  posTerminalIds: string[];
  settlementCycle: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'inactive';
}

interface Voucher {
  id: string;
  code: string;
  type: 'coupon' | 'product' | 'service';
  value: number;
  merchantId: string;
  expiryDate: Date;
  status: 'active' | 'used' | 'expired' | 'revoked';
  blockchainHash?: string;
}

interface ExchangeOrder {
  id: string;
  userId: string;
  items: ExchangeItem[];
  totalPoints: number;
  cashAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  blockchainHash?: string;
  signatures: Signature[];
  createdAt: Date;
}

interface ExchangeItem {
  pointsAccountId: string;
  points: number;
  source: string;
}

interface BlockchainRecord {
  blockHeight: number;
  previousHash: string;
  transactionHash: string;
  timestamp: number;
  data: any;
  signatures: Signature[];
  merkleRoot: string;
}

interface Signature {
  party: string;
  publicKey: string;
  signature: string;
  signedAt: number;
}

interface ARGeofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  polygon?: { lat: number; lng: number }[];
  rules: GeofenceRule[];
  status: 'active' | 'inactive';
}

interface GeofenceRule {
  action: 'allow_post' | 'allow_view' | 'notify';
  userRole: string[];
  maxPostsPerDay: number;
}

interface ARPost {
  id: string;
  userId: string;
  geofenceId: string;
  content: string;
  mediaUrls?: string[];
  location: { lat: number; lng: number };
  blockchainHash?: string;
  createdAt: Date;
  expiresAt?: Date;
}

interface ProfitSettlement {
  id: string;
  period: string;
  partnerId: string;
  totalTransactionAmount: number;
  profitShareAmount: number;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: Date;
}

interface VerificationRecord {
  id: string;
  orderId?: string;
  voucherId?: string;
  method: 'qrcode' | 'nfc' | 'bluetooth';
  merchantId: string;
  terminalId: string;
  status: 'success' | 'failed';
  blockchainHash?: string;
  createdAt: Date;
}
```

### 4.2 主要API端点

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| POST | /api/auth/login | 用户登录 | 否 |
| GET | /api/user/points-accounts | 获取积分账户列表 | 持券人 |
| POST | /api/exchange/calculate | 计算兑换方案 | 持券人 |
| POST | /api/exchange/confirm | 确认兑换 | 持券人 |
| POST | /api/verify/qrcode | 扫码核销 | 商户 |
| POST | /api/verify/nfc | NFC核销 | 商户 |
| POST | /api/merchant/vouchers/generate | 批量生成券码 | 商户 |
| GET | /api/partner/reports/transactions | 交易报表 | 合作方 |
| GET | /api/admin/dashboard/metrics | 仪表盘指标 | 管理员 |
| GET | /api/blockchain/records | 区块链记录查询 | 管理员 |
| POST | /api/ar/posts | 发布AR互助信息 | 持券人 |
| GET | /api/ar/geofences | 获取地理围栏列表 | 管理员 |

---

## 5. 后端分层架构

```mermaid
graph TD
    subgraph "接口层 (Controllers)"
        C1["AuthController"]
        C2["UserController"]
        C3["ExchangeController"]
        C4["VerifyController"]
        C5["MerchantController"]
        C6["PartnerController"]
        C7["AdminController"]
        C8["BlockchainController"]
        C9["ARController"]
    end
    
    subgraph "服务层 (Services)"
        S1["AuthService"]
        S2["PointsService"]
        S3["ExchangeService"]
        S4["VerifyService"]
        S5["VoucherService"]
        S6["SmartContractService"]
        S7["ProfitSettlementService"]
        S8["BlockchainService"]
        S9["ARService"]
        S10["NotificationService"]
    end
    
    subgraph "数据访问层 (Repositories)"
        R1["UserRepository"]
        R2["PointsAccountRepository"]
        R3["OrderRepository"]
        R4["VoucherRepository"]
        R5["PartnerRepository"]
        R6["MerchantRepository"]
        R7["BlockchainRepository"]
        R8["ARRepository"]
        R9["SettlementRepository"]
    end
    
    subgraph "数据存储"
        D1["PostgreSQL"]
        D2["Redis"]
        D3["MongoDB"]
    end
    
    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4
    C5 --> S5
    C6 --> S7
    C7 --> S7
    C8 --> S8
    C9 --> S9
    
    S1 --> R1
    S2 --> R2
    S3 --> R3
    S3 --> S6
    S3 --> S8
    S4 --> R4
    S4 --> S8
    S5 --> R4
    S6 --> S8
    S7 --> R9
    S8 --> R7
    S9 --> R8
    S9 --> S8
    S10 --> D2
    
    R1 --> D1
    R2 --> D1
    R3 --> D1
    R4 --> D1
    R5 --> D1
    R6 --> D1
    R7 --> D1
    R8 --> D3
    R9 --> D1
```

---

## 6. 数据模型

### 6.1 ER图

```mermaid
erDiagram
    USER ||--o{ POINTS_ACCOUNT : owns
    USER ||--o{ EXCHANGE_ORDER : places
    USER ||--o{ AR_POST : creates
    POINTS_ACCOUNT }o--|| PARTNER : belongs_to
    EXCHANGE_ORDER ||--|{ EXCHANGE_ITEM : contains
    EXCHANGE_ORDER ||--o| VOUCHER : generates
    EXCHANGE_ORDER ||--|| BLOCKCHAIN_RECORD : has
    PARTNER ||--o{ EXCHANGE_ORDER : processes
    PARTNER ||--o{ PROFIT_SETTLEMENT : has
    MERCHANT ||--o{ VOUCHER : issues
    MERCHANT ||--o{ VERIFICATION_RECORD : processes
    VOUCHER ||--o| VERIFICATION_RECORD : verifies
    VERIFICATION_RECORD ||--|| BLOCKCHAIN_RECORD : has
    AR_GEOFENCE ||--o{ AR_POST : contains
    AR_POST ||--|| BLOCKCHAIN_RECORD : has
    BLOCKCHAIN_RECORD ||--|| BLOCKCHAIN_BLOCK : belongs_to
    
    USER {
        uuid id PK
        string phone
        string nickname
        enum role
        datetime created_at
    }
    
    POINTS_ACCOUNT {
        uuid id PK
        uuid user_id FK
        enum source
        string source_account_id
        decimal balance
        decimal frozen_balance
        datetime expired_at
        datetime last_synced_at
    }
    
    PARTNER {
        uuid id PK
        string name
        enum type
        string api_key
        string api_secret
        string reconciliation_key
        json ip_whitelist
        decimal profit_share_rate
        enum status
    }
    
    MERCHANT {
        uuid id PK
        string name
        string business_license
        json pos_terminal_ids
        enum settlement_cycle
        enum status
    }
    
    EXCHANGE_ORDER {
        uuid id PK
        uuid user_id FK
        uuid partner_id FK
        decimal total_points
        decimal cash_amount
        enum status
        string blockchain_hash FK
        json signatures
        datetime created_at
    }
    
    EXCHANGE_ITEM {
        uuid id PK
        uuid order_id FK
        uuid points_account_id FK
        decimal points
        string source
    }
    
    VOUCHER {
        uuid id PK
        string code
        uuid merchant_id FK
        uuid order_id FK
        enum type
        decimal value
        date expiry_date
        enum status
        string blockchain_hash
    }
    
    VERIFICATION_RECORD {
        uuid id PK
        uuid voucher_id FK
        uuid merchant_id FK
        enum method
        string terminal_id
        enum status
        string blockchain_hash FK
        datetime created_at
    }
    
    AR_GEOFENCE {
        uuid id PK
        string name
        json center
        integer radius
        json polygon
        json rules
        enum status
    }
    
    AR_POST {
        uuid id PK
        uuid user_id FK
        uuid geofence_id FK
        text content
        json media_urls
        json location
        string blockchain_hash FK
        datetime created_at
    }
    
    PROFIT_SETTLEMENT {
        uuid id PK
        string period
        uuid partner_id FK
        decimal total_transaction_amount
        decimal profit_share_amount
        enum status
        datetime paid_at
    }
    
    BLOCKCHAIN_BLOCK {
        integer height PK
        string previous_hash
        string merkle_root
        datetime timestamp
        string hash
    }
    
    BLOCKCHAIN_RECORD {
        string transaction_hash PK
        integer block_height FK
        json data
        json signatures
        datetime timestamp
    }
```

### 6.2 DDL 语句

```sql
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'merchant', 'partner', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 积分账户表
CREATE TABLE points_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    source VARCHAR(20) NOT NULL CHECK (source IN ('insurance', 'bank', 'airline', 'telecom')),
    source_account_id VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    frozen_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    expired_at DATE,
    last_synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, source, source_account_id)
);

-- 合作方表
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('insurance', 'bank', 'airline', 'telecom')),
    api_key VARCHAR(64) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    reconciliation_key VARCHAR(255) NOT NULL,
    ip_whitelist JSONB DEFAULT '[]',
    profit_share_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.05,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 商户表
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    business_license VARCHAR(50) UNIQUE NOT NULL,
    pos_terminal_ids JSONB DEFAULT '[]',
    settlement_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (settlement_cycle IN ('daily', 'weekly', 'monthly')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 区块表
CREATE TABLE blockchain_blocks (
    height INTEGER PRIMARY KEY,
    previous_hash VARCHAR(64) NOT NULL,
    merkle_root VARCHAR(64) NOT NULL,
    timestamp BIGINT NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL
);

-- 区块链记录表
CREATE TABLE blockchain_records (
    transaction_hash VARCHAR(64) PRIMARY KEY,
    block_height INTEGER NOT NULL REFERENCES blockchain_blocks(height),
    data JSONB NOT NULL,
    signatures JSONB NOT NULL DEFAULT '[]',
    timestamp BIGINT NOT NULL
);

-- 兑换订单表
CREATE TABLE exchange_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    partner_id UUID NOT NULL REFERENCES partners(id),
    total_points DECIMAL(15, 2) NOT NULL,
    cash_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    blockchain_hash VARCHAR(64) REFERENCES blockchain_records(transaction_hash),
    signatures JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 兑换明细表
CREATE TABLE exchange_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES exchange_orders(id) ON DELETE CASCADE,
    points_account_id UUID NOT NULL REFERENCES points_accounts(id),
    points DECIMAL(15, 2) NOT NULL,
    source VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 券码表
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    order_id UUID REFERENCES exchange_orders(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('coupon', 'product', 'service')),
    value DECIMAL(15, 2) NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    blockchain_hash VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 核销记录表
CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    method VARCHAR(20) NOT NULL CHECK (method IN ('qrcode', 'nfc', 'bluetooth')),
    terminal_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    failure_reason VARCHAR(255),
    blockchain_hash VARCHAR(64) REFERENCES blockchain_records(transaction_hash),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AR地理围栏表
CREATE TABLE ar_geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    center JSONB NOT NULL,
    radius INTEGER NOT NULL,
    polygon JSONB,
    rules JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AR互助信息表 (MongoDB，此处为关系型映射)
CREATE TABLE ar_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    geofence_id UUID NOT NULL REFERENCES ar_geofences(id),
    content TEXT NOT NULL,
    media_urls JSONB,
    location JSONB NOT NULL,
    blockchain_hash VARCHAR(64) REFERENCES blockchain_records(transaction_hash),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 分润结算表
CREATE TABLE profit_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period VARCHAR(20) NOT NULL,
    partner_id UUID NOT NULL REFERENCES partners(id),
    total_transaction_amount DECIMAL(15, 2) NOT NULL,
    profit_share_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period, partner_id)
);

-- 创建索引
CREATE INDEX idx_points_accounts_user_id ON points_accounts(user_id);
CREATE INDEX idx_exchange_orders_user_id ON exchange_orders(user_id);
CREATE INDEX idx_exchange_orders_status ON exchange_orders(status);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_merchant_id ON vouchers(merchant_id);
CREATE INDEX idx_verification_records_voucher_id ON verification_records(voucher_id);
CREATE INDEX idx_verification_records_merchant_id ON verification_records(merchant_id);
CREATE INDEX idx_verification_records_created_at ON verification_records(created_at);
CREATE INDEX idx_ar_posts_geofence_id ON ar_posts(geofence_id);
CREATE INDEX idx_ar_posts_created_at ON ar_posts(created_at);
CREATE INDEX idx_blockchain_records_block_height ON blockchain_records(block_height);
CREATE INDEX idx_profit_settlements_partner_id ON profit_settlements(partner_id);
CREATE INDEX idx_profit_settlements_period ON profit_settlements(period);
```
