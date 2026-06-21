## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React SPA"] --> A1["页面路由"]
        A --> A2["状态管理 Zustand"]
        A --> A3["UI组件库"]
    end
    subgraph "数据层"
        B["Mock数据服务"] --> B1["房源数据"]
        B --> B2["合同数据"]
        B --> B3["支付数据"]
        B --> B4["用户数据"]
    end
    subgraph "模拟外部服务"
        C1["通勤计算引擎"]
        C2["AI户型解析"]
        C3["住建部备案接口"]
        C4["银行存证接口"]
        C5["资金审计引擎"]
    end
    A1 --> B
    A3 --> C1
    A3 --> C2
    B3 --> C4
    B2 --> C3
    B3 --> C5
```

## 2. 技术说明

- 前端: React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具: vite-init
- 后端: 无（纯前端，使用Mock数据）
- 数据库: 无（使用前端Mock数据模拟）
- 状态管理: Zustand
- 路由: React Router DOM v6
- 图标: lucide-react
- 动画: CSS animations + transitions
- 图表: 纯CSS/SVG实现数据可视化

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页，品牌展示+房源池入口+智能搜索 |
| /search | 房源搜索页，通勤地图+预算推荐+AI户型解析 |
| /listing/:id | 房源详情页，完整房源信息+预约看房入口 |
| /appointment | 预约看房页，时间锁+经纪人确认+状态跟踪 |
| /contract | 电子合同页，在线签署+银行存证+备案 |
| /payment | 支付中心，多通道支付+账单管理 |
| /service | 租后服务页，报修+派单+评价 |
| /admin | 后台管理页，审核+备案+审计+供应商管理 |

## 4. API定义（Mock）

### 4.1 房源相关

```typescript
interface Listing {
  id: string
  title: string
  type: 'ccb_direct' | 'partner' | 'personal'
  address: string
  district: string
  price: number
  area: number
  rooms: number
  halls: number
  floor: string
  orientation: string
  images: string[]
  floorPlan: string
  aiAnalysis: {
    areaBreakdown: { room: string; area: number }[]
    orientation: string
    lightingScore: number
    lightingMap: number[][]
  }
  commuteInfo: {
    metro: { station: string; minutes: number }[]
    bus: { station: string; minutes: number }[]
    drive: { destination: string; minutes: number }[]
  }
  landlord: {
    name: string
    type: 'ccb' | 'partner' | 'personal'
    verified: boolean
    rating: number
  }
  amenities: string[]
  status: 'available' | 'reserved' | 'rented'
}

interface SearchParams {
  commuteMode: 'metro' | 'bus' | 'drive'
  commuteDestination: string
  maxCommuteMinutes: number
  budgetMin: number
  budgetMax: number
  rooms: number[]
  listingType: ('ccb_direct' | 'partner' | 'personal')[]
  district: string
}
```

### 4.2 合同相关

```typescript
interface Contract {
  id: string
  listingId: string
  tenantId: string
  landlordId: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  status: 'draft' | 'signing' | 'signed' | 'filed'
  bankCertificate: {
    certificateNo: string
    hash: string
    timestamp: string
  }
  filingInfo: {
    filingNo: string
    status: 'pending' | 'filed' | 'rejected'
    filedAt: string
  }
  signatures: {
    tenant: { signed: boolean; timestamp: string }
    landlord: { signed: boolean; timestamp: string }
  }
}
```

### 4.3 支付相关

```typescript
interface Payment {
  id: string
  contractId: string
  amount: number
  method: 'ccb_card' | 'unionpay' | 'installment'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  installmentPlan?: {
    totalMonths: number
    monthlyAmount: number
    interestRate: number
  }
  auditTrail: {
    from: string
    to: string
    intermediateAccounts: string[]
    timestamp: string
  }[]
}
```

### 4.4 租后服务相关

```typescript
interface ServiceRequest {
  id: string
  contractId: string
  type: 'plumbing' | 'electrical' | 'appliance' | 'structural' | 'other'
  urgency: 'low' | 'medium' | 'high'
  description: string
  images: string[]
  status: 'submitted' | 'dispatched' | 'in_progress' | 'completed'
  assignedProvider: {
    id: string
    name: string
    rating: number
  }
  rating?: {
    score: number
    comment: string
    ratedAt: string
  }
}
```

## 5. 服务器架构图

不适用（纯前端项目，无后端服务器）

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "User" {
        string id PK
        string name
        string phone
        string role
        boolean verified
    }
    "Listing" {
        string id PK
        string title
        string type
        string address
        number price
        number area
        string status
    }
    "Contract" {
        string id PK
        string listingId FK
        string tenantId FK
        string landlordId FK
        string status
    }
    "Payment" {
        string id PK
        string contractId FK
        number amount
        string method
        string status
    }
    "ServiceRequest" {
        string id PK
        string contractId FK
        string type
        string urgency
        string status
    }
    "AuditTrail" {
        string id PK
        string paymentId FK
        string fromAccount
        string toAccount
        string timestamp
    }
    "User" ||--o{ "Contract" : "signs"
    "Listing" ||--o{ "Contract" : "associated"
    "Contract" ||--o{ "Payment" : "generates"
    "Contract" ||--o{ "ServiceRequest" : "creates"
    "Payment" ||--o{ "AuditTrail" : "tracked_by"
```

### 6.2 数据定义语言

不适用（纯前端项目，使用TypeScript接口定义Mock数据结构）
