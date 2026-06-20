# 高值数码与奢侈品C2B回收交易平台 - 技术架构文档

## 1. 架构设计

### 1.1 系统分层架构图

```mermaid
flowchart TB
    subgraph "用户接入层"
        U1["C端用户Web端"]
        U2["检测师移动H5"]
        U3["运营管理后台"]
    end

    subgraph "前端表现层 (React 18)"
        R1["路由层 React Router"]
        R2["状态管理 Zustand"]
        R3["UI组件库 (自研)"]
        R4["图表 ECharts 5"]
        R5["AI识别 Canvas/WebGL"]
    end

    subgraph "服务网关层"
        G1["Nginx / Vite Dev Server"]
    end

    subgraph "业务逻辑层 (Mock Service Worker)"
        S1["估价引擎服务"]
        S2["订单管理服务"]
        S3["检测师管理服务"]
        S4["库存周转服务"]
        S5["退货履约服务"]
        S6["环保计量服务"]
        S7["飞检质检服务"]
    end

    subgraph "数据接入层"
        D1["商品库 Mock DB"]
        D2["检测师档案 Mock DB"]
        D3["订单 Mock DB"]
        D4["行情数据 Mock API"]
        D5["AI识别 Mock API"]
    end

    subgraph "外部服务（模拟）"
        EXT1["京东/闲鱼/蜂鸟行情"]
        EXT2["AI成色识别引擎"]
        EXT3["电子签平台"]
        EXT4["地图/路线规划"]
        EXT5["物流快递接口"]
    end

    U1 --> R1
    U2 --> R1
    U3 --> R1
    R1 --> G1
    R2 --> S1
    R3 --> S2
    R4 --> S4
    R5 --> S1
    G1 --> S1
    G1 --> S2
    G1 --> S3
    G1 --> S4
    G1 --> S5
    G1 --> S6
    G1 --> S7
    S1 --> D1
    S1 --> D4
    S1 --> D5
    S2 --> D3
    S2 --> D1
    S3 --> D2
    S4 --> D3
    S5 --> D3
    S6 --> D3
    S7 --> D2
    S7 --> D3
    S1 --> EXT1
    S1 --> EXT2
    S5 --> EXT3
    S3 --> EXT4
    S5 --> EXT5
```

### 1.2 后端服务架构图（Mock模拟）

```mermaid
flowchart TD
    API["Controller 接口层"] --> SVC["Service 业务层"]
    SVC --> ENG["Engine 引擎层"]
    SVC --> REPO["Repository 数据层"]
    ENG --> EXT["External 外部服务"]
    REPO --> DB["Database 数据库"]
```

---

## 2. 技术选型说明

### 2.1 前端技术栈

| 分类 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 构建工具 | Vite | ^5.0 | 极速冷启动、HMR毫秒级响应、原生ESM支持 |
| 框架 | React | ^18.3 | 成熟生态、Concurrent模式、Suspense支持 |
| 语言 | TypeScript | ^5.4 | 类型安全、大型项目可维护性、智能提示 |
| 路由 | React Router DOM | ^6.22 | 嵌套路由、数据Loader/Action、受保护路由 |
| 状态管理 | Zustand | ^4.5 | 轻量无模板、DevTools支持、跨组件共享 |
| 样式方案 | TailwindCSS | ^3.4 | 原子化CSS、设计Token系统、JIT编译 |
| 组件库 | 自研 + Radix UI | ^1.0 | 无样式基元组件、无障碍a11y、深度定制 |
| 图标 | Lucide React | ^0.344 | 轻量矢量图标、统一线性风格 |
| 图表可视化 | ECharts | ^5.5 | 丰富图表类型、大数据量性能、Canvas渲染 |
| HTTP请求 | Axios | ^1.6 | 拦截器、取消请求、自动重试机制 |
| Mock方案 | MSW (Mock Service Worker) | ^2.2 | Service Worker拦截、REST/GraphQL双支持 |
| 动画 | Framer Motion | ^11.0 | 声明式动画、React原生集成、手势支持 |
| 表单 | React Hook Form | ^7.51 | 受控/非受控混合、Yup校验、高性能 |
| 日期处理 | dayjs | ^1.11 | 2kb体积、Moment兼容API、国际化 |
| 图片处理 | react-image-crop | ^11.0 | 图片裁剪、支持Canvas压缩 |
| 签名 | react-signature-canvas | ^1.0 | 电子签名画布、移动端触控支持 |
| 文件导出 | jspdf | ^2.5 | PDF检测报告生成、支持中文 |

### 2.2 工程化配置

- **代码规范**：ESLint + Prettier + Stylelint + Husky + lint-staged
- **路径别名**：`@/*` → `src/*`
- **环境变量**：`.env.development` / `.env.production`
- **构建优化**：代码分割（按路由+图表库）、图片压缩、资源哈希

---

## 3. 路由定义

| 路径 | 页面组件 | 权限 | 功能说明 |
|------|----------|------|----------|
| `/` | HomePage | 公开 | 平台首页：估价入口、品牌导航、信任背书 |
| `/evaluate` | EvaluatePage | 公开 | 智能估价向导：品类选择→AI识别→比价→报价 |
| `/products` | ProductLibraryPage | 公开 | 商品库浏览：品牌分类、型号详情 |
| `/products/:id` | ProductDetailPage | 公开 | 型号详情：规格参数、真伪校验、历史均价 |
| `/inspectors/:id` | InspectorProfilePage | 公开 | 检测师档案：资质、偏差率、服务评价 |
| `/auth/login` | LoginPage | 公开 | 用户/检测师/管理员登录 |
| `/user/orders` | UserOrdersPage | 用户 | 我的回收订单列表 |
| `/user/orders/:id` | UserOrderDetailPage | 用户 | 订单详情：检测报告、比价图、协议签署 |
| `/user/returns` | UserReturnsPage | 用户 | 退货履约中心 |
| `/user/returns/apply/:orderId` | ReturnApplyPage | 用户 | 退货申请流程 |
| `/user/certificates` | EcoCertificatesPage | 用户 | 环保电子证书列表 |
| `/inspector/tasks` | InspectorTasksPage | 检测师 | 上门任务列表 |
| `/inspector/tasks/:id` | InspectorTaskDetailPage | 检测师 | 任务详情：录入检测数据、上传报告 |
| `/inspector/stats` | InspectorStatsPage | 检测师 | 个人偏差率与业绩统计 |
| `/admin/dashboard` | AdminDashboard | 管理员 | 运营总览大屏 |
| `/admin/cities` | CityNetworkPage | 管理员 | 城市服务网络：排班、路线优化 |
| `/admin/inventory` | InventoryDashboardPage | 管理员 | 库存周转看板 |
| `/admin/quality` | QualityInspectionPage | 管理员 | 检测师飞检中心 |
| `/admin/eco` | EcoMetricsPage | 管理员 | 环保贡献计量大屏 |
| `/admin/products` | AdminProductsPage | 管理员 | 商品库管理 |
| `/admin/inspectors` | AdminInspectorsPage | 管理员 | 检测师档案管理 |
| `*` | NotFoundPage | 公开 | 404页面 |

---

## 4. API 接口定义（Mock）

### 4.1 通用响应结构

```typescript
interface ApiResponse<T> {
  code: number;           // 0成功，非0错误码
  message: string;        // 提示信息
  data: T;                // 业务数据
  timestamp: number;      // 服务器时间戳
}

interface PagedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 4.2 估价引擎相关

```typescript
// POST /api/evaluate/brands
interface BrandListParams { category: string }
interface Brand { id: string; name: string; logo: string; models: Model[] }
interface Model { id: string; name: string; series: string; basePrice: number }

// POST /api/evaluate/ai-analyze
interface AIAnalyzeRequest {
  modelId: string;
  images: string[];           // base64图片数组
  conditionAnswers: Record<string, string>;  // 基础问卷答案
}
interface AIAnalyzeResult {
  scratchLevel: 1 | 2 | 3 | 4 | 5;    // 划痕等级1-5
  wearLevel: 1 | 2 | 3 | 4 | 5;       // 磨损等级
  oxidationLevel: 1 | 2 | 3 | 4 | 5;  // 氧化等级
  functionScore: number;              // 功能完好度0-100
  overallGrade: 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C';  // 综合成色
  aiConfidence: number;               // AI置信度
  defectDetails: { area: string; type: string; severity: string }[];
}

// POST /api/evaluate/quote
interface QuoteRequest {
  modelId: string;
  aiResult: AIAnalyzeResult;
  conditionAnswers: Record<string, string>;
}
interface TieredPrice {
  tier: 'instant' | 'standard' | 'consignment';
  label: string;
  price: number;
  settlementDays: string;
  description: string;
}
interface QuoteResult {
  tieredPrices: TieredPrice[];
  priceComparison: {
    platform: string;
    price: number;
    trend: 'up' | 'down' | 'flat';
    trendPercent: number;
  }[];
  priceHistory: { date: string; price: number }[];   // 近30天价格走势
  serialVerifyRule: string;    // 序列号校验规则说明
}
```

### 4.3 订单相关

```typescript
// POST /api/orders
interface CreateOrderRequest {
  modelId: string;
  selectedTier: string;
  quotePrice: number;
  address: { province: string; city: string; district: string; detail: string; contact: string; phone: string };
  pickupWindow: { date: string; period: 'morning' | 'afternoon' | 'evening' };
}
interface Order {
  id: string;
  orderNo: string;
  status: 'pending_pickup' | 'inspecting' | 'pending_confirm' | 'paid' | 'completed' | 'returning' | 'returned' | 'cancelled';
  productInfo: { brand: string; model: string; image: string; grade: string };
  quotePrice: number;
  finalPrice?: number;
  pickupAddress: any;
  pickupWindow: any;
  inspector?: Inspector;
  inspectionReport?: InspectionReport;
  priceComparisonScreenshots?: string[];
  signedAgreement?: boolean;
  createdAt: string;
  paidAt?: string;
}

// POST /api/orders/:id/sign-agreement
interface SignAgreementRequest {
  signature: string;    // base64签名图片
  smsCode: string;
}

// GET /api/orders/:id/report
interface InspectionReport {
  id: string;
  inspectorName: string;
  inspectTime: string;
  serialNumber: string;
  serialVerified: boolean;
  grade: string;
  functionStatus: Record<string, boolean>;
  appearancePhotos: string[];
  defectMarkups: { position: string; description: string; photo: string }[];
  testItems: { name: string; result: string; note?: string }[];
  finalConclusion: string;
  priceSuggestion: number;
}
```

### 4.4 检测师相关

```typescript
interface Inspector {
  id: string;
  name: string;
  avatar: string;
  certificates: { name: string; no: string; issueDate: string; expireDate: string; issuer: string }[];
  experienceYears: number;
  specialties: string[];
  deviationRate30d: number;     // 近30天检测偏差率
  totalOrders: number;
  rating: number;
  region: string;
  flyCheckPassRate: number;     // 飞检通过率
}

// GET /api/inspectors/:id/stats
interface InspectorStats {
  deviationTrend: { date: string; rate: number }[];
  avgDeviation: number;
  industryAvg: number;
  flyCheckResults: { date: string; original: number; recheck: number; deviation: number }[];
}
```

### 4.5 退货相关

```typescript
// POST /api/returns
interface ReturnApplyRequest {
  orderId: string;
  reason: string;
  description: string;
  photos: string[];
  refundMethod: 'original' | 'bank';
  bankInfo?: { bank: string; account: string; holder: string };
}
interface ReturnRecord {
  id: string;
  orderId: string;
  status: 'pending_pickup' | 'shipping' | 'inspecting' | 'refunding' | 'completed' | 'rejected';
  reason: string;
  timeline: { time: string; status: string; operator?: string }[];
  estimatedRefundDate: string;
  refundAmount: number;
  logistics?: { company: string; trackingNo: string };
}
```

### 4.6 库存周转相关

```typescript
// GET /api/admin/inventory/overview
interface InventoryOverview {
  totalInStock: number;
  avgStockDays: number;
  refurbishmentRate: number;
  monthlyProfit: number;
  monthlyProfitTrend: { month: string; profit: number }[];
  channelProfit: { channel: string; count: number; profit: number; margin: number }[];
  stockAgeDistribution: { range: string; count: number; percentage: number }[];
  slowMovingItems: { product: string; days: number; cost: number; suggestion: string }[];
}
```

### 4.7 环保相关

```typescript
// GET /api/eco/metrics
interface EcoMetrics {
  totalRecycled: number;
  totalCarbonSavedKg: number;
  equivalentTrees: number;
  equivalentEnergy: number;         // 度电
  categoryBreakdown: { category: string; count: number; carbonKg: number }[];
  monthlyTrend: { month: string; carbonKg: number }[];
}

// GET /api/eco/certificates/:orderId
interface EcoCertificate {
  id: string;
  orderId: string;
  certNo: string;
  issueDate: string;
  productName: string;
  carbonSavedKg: number;
  equivalentTrees: number;
  userName: string;
  qrCode: string;
  template: 'standard' | 'premium';
}
```

### 4.8 飞检相关

```typescript
// POST /api/admin/quality/fly-check
interface FlyCheckCreateRequest {
  orderIds: string[];      // 随机抽检的订单
  inspectorId: string;     // 复检员ID
  priority: 'normal' | 'urgent';
}
interface FlyCheckTask {
  id: string;
  originalOrderId: string;
  originalInspector: string;
  originalGrade: string;
  originalPrice: number;
  recheckInspector?: string;
  recheckGrade?: string;
  recheckPrice?: number;
  deviationPercent?: number;
  status: 'pending' | 'in_progress' | 'completed';
  warning?: boolean;
  warningLevel?: 'low' | 'medium' | 'high';
  createdAt: string;
}
```

---

## 5. 服务器架构图（Mock MSW层）

```mermaid
flowchart TD
    subgraph "Mock Service Worker (浏览器内)"
        H1["REST Handler Layer<br>/api/**"]
        H2["GraphQL Handler Layer"]
    end

    subgraph "Handlers / 路由分发"
        A1["估价引擎 handlers"]
        A2["订单 handlers"]
        A3["检测师 handlers"]
        A4["退货 handlers"]
        A5["库存 handlers"]
        A6["飞检 handlers"]
        A7["环保 handlers"]
    end

    subgraph "Mock Service / 业务逻辑"
        B1["EvaluateService<br>· 阶梯报价算法<br>· 多平台比价聚合"]
        B2["OrderService<br>· 订单状态机<br>· 派单匹配算法"]
        B3["InspectorService<br>· 偏差率计算<br>· 排班匹配"]
        B4["ReturnService<br>· 履约状态机<br>· 退款SLA监控"]
        B5["InventoryService<br>· 库存周转计算<br>· 毛利分析"]
        B6["QualityService<br>· 随机抽检算法<br>· 预警阈值判断"]
        B7["EcoService<br>· 碳减排折算<br>· 证书编号生成"]
    end

    subgraph "Mock Data / 数据源"
        C1["products.db.ts<br>50+品牌型号"]
        C2["inspectors.db.ts"]
        C3["orders.db.ts"]
        C4["行情模拟生成器"]
        C5["AI识别模拟器"]
        C6["碳减排系数表"]
    end

    H1 --> A1 & A2 & A3 & A4 & A5 & A6 & A7
    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
    A5 --> B5
    A6 --> B6
    A7 --> B7
    B1 --> C1 & C4 & C5
    B2 --> C3 & C2
    B3 --> C2 & C3
    B4 --> C3
    B5 --> C3
    B6 --> C2 & C3
    B7 --> C3 & C6
```

---

## 6. 数据模型

### 6.1 ER 关系图

```mermaid
erDiagram
    CATEGORY ||--o{ BRAND : "包含"
    BRAND ||--o{ PRODUCT_MODEL : "包含"
    PRODUCT_MODEL ||--o{ PRODUCT_SKU : "包含"
    PRODUCT_MODEL ||--o{ SERIAL_RULE : "配置"

    USER ||--o{ ORDER : "发起"
    PRODUCT_MODEL ||--o{ ORDER : "对应"
    INSPECTOR ||--o{ ORDER : "分配上门"
    ORDER ||--o| INSPECTION_REPORT : "生成"
    ORDER ||--o{ PRICE_SNAPSHOT : "记录"
    ORDER ||--o| RETURN_RECORD : "可退货"
    ORDER ||--o| ECO_CERTIFICATE : "生成"

    INSPECTOR ||--o{ CERTIFICATE : "持有"
    INSPECTOR ||--o{ SCHEDULE : "有排班"
    INSPECTOR ||--o{ FLY_CHECK_TASK : "被飞检"
    FLY_CHECK_TASK }o--|| ORDER : "关联订单"
    INSPECTOR ||--o{ FLY_CHECK_TASK : "执行复检"

    ORDER ||--o{ INVENTORY_ITEM : "入库"
    INVENTORY_ITEM ||--o| DISPOSAL_RECORD : "处置"

    CATEGORY {
        string id PK
        string name
        string icon
        int sort_order
    }
    BRAND {
        string id PK
        string category_id FK
        string name
        string logo
        string country
    }
    PRODUCT_MODEL {
        string id PK
        string brand_id FK
        string name
        string series
        string launch_year
        decimal msrp
        json specs
    }
    SERIAL_RULE {
        string id PK
        string model_id FK
        string pattern
        string check_digit_algo
        string lookup_url
    }
    USER {
        string id PK
        string phone
        string nickname
        string avatar
        datetime created_at
    }
    INSPECTOR {
        string id PK
        string name
        string phone
        string region
        int experience_years
        decimal deviation_rate
        decimal fly_check_pass_rate
        json specialties
    }
    CERTIFICATE {
        string id PK
        string inspector_id FK
        string name
        string cert_no
        datetime issue_date
        datetime expire_date
    }
    SCHEDULE {
        string id PK
        string inspector_id FK
        date work_date
        json time_slots
        string status
    }
    ORDER {
        string id PK
        string order_no
        string user_id FK
        string model_id FK
        string inspector_id FK
        string status
        decimal quote_price
        decimal final_price
        json pickup_address
        json pickup_window
        boolean agreement_signed
        datetime created_at
    }
    INSPECTION_REPORT {
        string id PK
        string order_id FK
        string serial_no
        boolean serial_verified
        string grade
        decimal price_suggestion
        json defects
        json function_tests
        datetime inspect_time
    }
    PRICE_SNAPSHOT {
        string id PK
        string order_id FK
        string platform
        decimal price
        string screenshot_url
    }
    RETURN_RECORD {
        string id PK
        string order_id FK
        string status
        string reason
        decimal refund_amount
        json timeline
    }
    ECO_CERTIFICATE {
        string id PK
        string order_id FK
        string cert_no
        decimal carbon_saved_kg
        decimal equivalent_trees
        datetime issue_date
    }
    FLY_CHECK_TASK {
        string id PK
        string order_id FK
        string original_inspector_id FK
        string recheck_inspector_id FK
        string original_grade
        string recheck_grade
        decimal deviation_percent
        string warning_level
        string status
    }
    INVENTORY_ITEM {
        string id PK
        string order_id FK
        string sku_code
        int stock_days
        string status
        decimal cost_price
    }
    DISPOSAL_RECORD {
        string id PK
        string inventory_id FK
        string channel
        decimal sale_price
        decimal profit
        datetime dispose_date
    }
```

### 6.2 关键算法说明

**1. 阶梯报价算法（EvaluateService）**
```
基础价 = 型号历史成交均价 × 成色系数
成色系数 = {
  S: 0.92-0.95, A+: 0.85-0.91, A: 0.78-0.84,
  B+: 0.70-0.77, B: 0.60-0.69, C: 0.50-0.59
}
三档报价 = 基础价 × [0.88(即时), 0.95(标准), 1.02(寄售×15天费率)]
多平台比价加权 = JD×0.35 + Xianyu×0.4 + Fengniao×0.25
```

**2. 随机飞检算法（QualityService）**
```
抽检权重 = 检测师偏差率×2 + 订单高价值系数×1.5 + 新入职系数×3
每日每检测师至少1单抽检（偏差率>5%则3单/日）
预警阈值 = 偏差率 >3% 黄色警告，>5% 红色警告并停单培训
```

**3. 碳减排折算（EcoService）**
```
碳减排(kg) = 新品生产碳排放 - 回收处理碳排放
折算系数表 = {
  手机: 85kg/台, 笔记本: 220kg/台, 相机: 150kg/台,
  手表: 120kg/只, 包包: 95kg/只, 珠宝: 65kg/件
}
等效植树数 = 碳减排kg ÷ 18 （每棵树年均吸碳约18kg）
```
