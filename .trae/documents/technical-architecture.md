## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "React SPA（用户端）"
        "React SPA（运营后台）"
    end
    subgraph "后端层"
        "Express API Gateway"
        "充电桩接入服务"
        "AI路径规划服务"
        "结算引擎服务"
        "V2G策略服务"
        "社区内容服务"
    end
    subgraph "数据层"
        "SQLite 数据库"
        "Redis 缓存"
    end
    subgraph "外部服务"
        "国网桩API"
        "第三方运营商SDK"
        "GB/T 27930协议网关"
        "地图服务"
    end
    "React SPA（用户端）" --> "Express API Gateway"
    "React SPA（运营后台）" --> "Express API Gateway"
    "Express API Gateway" --> "充电桩接入服务"
    "Express API Gateway" --> "AI路径规划服务"
    "Express API Gateway" --> "结算引擎服务"
    "Express API Gateway" --> "V2G策略服务"
    "Express API Gateway" --> "社区内容服务"
    "充电桩接入服务" --> "国网桩API"
    "充电桩接入服务" --> "第三方运营商SDK"
    "充电桩接入服务" --> "GB/T 27930协议网关"
    "AI路径规划服务" --> "地图服务"
    "充电桩接入服务" --> "SQLite 数据库"
    "结算引擎服务" --> "SQLite 数据库"
    "V2G策略服务" --> "SQLite 数据库"
    "社区内容服务" --> "SQLite 数据库"
```

## 2. 技术说明

- 前端：React@18 + TypeScript + TailwindCSS@3 + Vite + Zustand + React Router DOM
- 初始化工具：vite-init
- 后端：Express@4 + TypeScript（ESM格式）
- 数据库：SQLite（开发阶段使用，mock数据为主）
- 图表库：Recharts
- 地图：Leaflet（开源地图方案，无需API Key）
- 图标：lucide-react

## 3. 路由定义

### 用户端路由

| 路由 | 用途 |
|------|------|
| / | 首页总览，充电网络态势感知 |
| /map | 智能充电站地图，全国桩站分布 |
| /route-plan | AI路径规划，多目的地充电路线 |
| /plug-charge | 即插即充，车辆绑定与认证 |
| /charging-monitor | 充电监控中心，实时充电数据 |
| /v2g | V2G充放电策略配置 |
| /community | 车友社区，帖子信息流 |

### 运营后台路由

| 路由 | 用途 |
|------|------|
| /admin | 运营看板，桩状态巡检大盘 |
| /admin/settlement | 分账结算引擎 |
| /admin/revenue | 收益分析模型 |
| /admin/user-profile | 用户画像标签体系 |
| /admin/community-review | 社区内容审核 |

## 4. API定义

### 4.1 充电桩相关API

```typescript
interface ChargingStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  operatorId: string;
  operatorName: string;
  piles: ChargingPile[];
  rating: number;
  images: string[];
}

interface ChargingPile {
  id: string;
  stationId: string;
  type: "fast" | "slow";
  power: number;
  status: "available" | "charging" | "fault" | "offline";
  price: number;
  connectorType: string;
}

// GET /api/stations?lat=&lng=&radius=&type=&operator=
// GET /api/stations/:id
// GET /api/stations/:id/piles
```

### 4.2 充电订单相关API

```typescript
interface ChargingOrder {
  id: string;
  userId: string;
  pileId: string;
  stationId: string;
  startTime: string;
  endTime?: string;
  status: "charging" | "completed" | "fault";
  energyConsumed: number;
  cost: number;
  socStart: number;
  socCurrent: number;
  power: number;
}

// POST /api/orders/start
// GET /api/orders/:id/status
// POST /api/orders/:id/stop
// GET /api/orders?userId=&status=&page=&limit=
```

### 4.3 即插即充认证API

```typescript
interface VehicleBinding {
  id: string;
  userId: string;
  vin: string;
  plateNumber: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  verified: boolean;
}

// POST /api/vehicles/bind
// GET /api/vehicles?userId=
// POST /api/vehicles/authenticate (VIN+车牌双因子认证)
```

### 4.4 AI路径规划API

```typescript
interface RoutePlanRequest {
  origin: { lat: number; lng: number };
  destinations: { lat: number; lng: number; name: string }[];
  currentSoc: number;
  batteryCapacity: number;
  vehicleModel: string;
  sortBy: "price" | "distance" | "waiting_time";
}

interface RoutePlanResult {
  waypoints: RouteWaypoint[];
  totalDistance: number;
  totalDuration: number;
  chargingStops: ChargingStop[];
}

// POST /api/route-plan
```

### 4.5 V2G策略API

```typescript
interface V2GStrategy {
  id: string;
  userId: string;
  name: string;
  dischargePowerLimit: number;
  minSocReserve: number;
  peakHours: { start: string; end: string }[];
  valleyHours: { start: string; end: string }[];
  enabled: boolean;
  estimatedMonthlyRevenue: number;
}

// GET /api/v2g/strategies?userId=
// POST /api/v2g/strategies
// PUT /api/v2g/strategies/:id
// GET /api/v2g/revenue-estimate
```

### 4.6 运营后台API

```typescript
interface DashboardStats {
  totalPiles: number;
  onlinePiles: number;
  chargingPiles: number;
  faultPiles: number;
  onlineRate: number;
  utilizationRate: number;
  todayOrders: number;
  todayRevenue: number;
}

interface SettlementRule {
  id: string;
  operatorId: string;
  platformRatio: number;
  operatorRatio: number;
  siteOwnerRatio: number;
  effectiveDate: string;
}

// GET /api/admin/dashboard
// GET /api/admin/settlement/rules
// POST /api/admin/settlement/rules
// GET /api/admin/settlement/bills?operatorId=&period=
// GET /api/admin/revenue/analysis?stationId=&period=
// GET /api/admin/user-profiles?tag=&page=&limit=
// GET /api/admin/community/reviews?status=&page=&limit=
// PUT /api/admin/community/reviews/:id
```

### 4.7 社区API

```typescript
interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  images: string[];
  topic?: string;
  likes: number;
  comments: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

// GET /api/community/posts?page=&limit=&topic=
// POST /api/community/posts
// POST /api/community/posts/:id/like
// POST /api/community/posts/:id/comment
```

## 5. 服务端架构图

```mermaid
flowchart TD
    "Controller层" --> "Service层"
    "Service层" --> "Repository层"
    "Repository层" --> "SQLite数据库"
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "用户" ||--o{ "车辆绑定" : "拥有"
    "用户" ||--o{ "充电订单" : "产生"
    "用户" ||--o{ "社区帖子" : "发布"
    "用户" ||--o{ "用户标签" : "标注"
    "运营商" ||--o{ "充电站" : "运营"
    "充电站" ||--o{ "充电桩" : "包含"
    "充电桩" ||--o{ "充电订单" : "服务"
    "运营商" ||--o{ "结算规则" : "配置"
    "结算规则" ||--o{ "结算账单" : "生成"
    "用户" {
        "string id PK"
        "string phone"
        "string name"
        "string role"
        "string createdAt"
    }
    "车辆绑定" {
        "string id PK"
        "string userId FK"
        "string vin"
        "string plateNumber"
        "string brand"
        "number batteryCapacity"
        "boolean verified"
    }
    "运营商" {
        "string id PK"
        "string name"
        "string type"
        "string contactName"
        "string contactPhone"
    }
    "充电站" {
        "string id PK"
        "string operatorId FK"
        "string name"
        "string address"
        "number latitude"
        "number longitude"
        "number rating"
    }
    "充电桩" {
        "string id PK"
        "string stationId FK"
        "string type"
        "number power"
        "string status"
        "number price"
    }
    "充电订单" {
        "string id PK"
        "string userId FK"
        "string pileId FK"
        "string stationId FK"
        "string status"
        "number energyConsumed"
        "number cost"
        "number socStart"
        "number socCurrent"
        "string startTime"
        "string endTime"
    }
    "结算规则" {
        "string id PK"
        "string operatorId FK"
        "number platformRatio"
        "number operatorRatio"
        "number siteOwnerRatio"
    }
    "结算账单" {
        "string id PK"
        "string ruleId FK"
        "string operatorId FK"
        "string period"
        "number totalAmount"
        "number platformAmount"
        "number operatorAmount"
        "number siteOwnerAmount"
        "string status"
    }
    "社区帖子" {
        "string id PK"
        "string userId FK"
        "string content"
        "string topic"
        "number likes"
        "number comments"
        "string status"
        "string createdAt"
    }
    "用户标签" {
        "string id PK"
        "string userId FK"
        "string tag"
        "number weight"
    }
```

### 6.2 数据定义语言

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE vehicle_bindings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  vin TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  battery_capacity REAL NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE operators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE charging_stations (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL REFERENCES operators(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  rating REAL DEFAULT 0,
  images TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE charging_piles (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES charging_stations(id),
  type TEXT NOT NULL CHECK(type IN ('fast', 'slow')),
  power REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'charging', 'fault', 'offline')),
  price REAL NOT NULL,
  connector_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE charging_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pile_id TEXT NOT NULL REFERENCES charging_piles(id),
  station_id TEXT NOT NULL REFERENCES charging_stations(id),
  status TEXT NOT NULL DEFAULT 'charging' CHECK(status IN ('charging', 'completed', 'fault')),
  energy_consumed REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  soc_start REAL,
  soc_current REAL,
  power REAL DEFAULT 0,
  start_time TEXT NOT NULL DEFAULT (datetime('now')),
  end_time TEXT
);

CREATE TABLE settlement_rules (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL REFERENCES operators(id),
  platform_ratio REAL NOT NULL,
  operator_ratio REAL NOT NULL,
  site_owner_ratio REAL NOT NULL,
  effective_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settlement_bills (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES settlement_rules(id),
  operator_id TEXT NOT NULL REFERENCES operators(id),
  period TEXT NOT NULL,
  total_amount REAL NOT NULL,
  platform_amount REAL NOT NULL,
  operator_amount REAL NOT NULL,
  site_owner_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'settled', 'exception')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE community_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  images TEXT,
  topic TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  tag TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_vehicle_bindings_user ON vehicle_bindings(user_id);
CREATE INDEX idx_charging_piles_station ON charging_piles(station_id);
CREATE INDEX idx_charging_orders_user ON charging_orders(user_id);
CREATE INDEX idx_charging_orders_status ON charging_orders(status);
CREATE INDEX idx_settlement_bills_operator ON settlement_bills(operator_id);
CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_user_tags_user ON user_tags(user_id);
```
