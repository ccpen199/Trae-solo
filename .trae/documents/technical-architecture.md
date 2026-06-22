## 1. 架构设计

```mermaid
graph TD
    subgraph "前端展示层"
        A1["Web 门户 (React)"]
        A2["移动端 H5"]
        A3["无障碍访问模块"]
    end
    
    subgraph "网关层"
        B1["API 网关"]
        B2["统一认证网关"]
    end
    
    subgraph "应用服务层"
        C1["用户中心服务"]
        C2["政务办事服务"]
        C3["一件事联办服务"]
        C4["智能导办服务"]
        C5["进度追踪服务"]
        C6["资讯聚合服务"]
        C7["诉求响应服务"]
        C8["数据统计服务"]
    end
    
    subgraph "数据层"
        D1["用户数据库"]
        D2["办件数据库"]
        D3["资讯数据库"]
        D4["诉求数据库"]
        D5["Redis 缓存"]
    end
    
    subgraph "外部对接"
        E1["政务云统一认证"]
        E2["省政务服务平台"]
        E3["各委办局业务系统"]
        E4["12345 热线系统"]
        E5["RSS 资讯源"]
    end
    
    A1 & A2 & A3 --> B1
    B1 --> B2
    B2 --> C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8
    C1 --> D1 & D5
    C2 & C3 --> D2 & D5
    C6 --> D3
    C7 --> D4
    C8 --> D1 & D2 & D3 & D4
    C1 --> E1
    C2 & C3 --> E2
    C5 --> E3
    C7 --> E4
    C6 --> E5
```

## 2. 技术选型

- **前端框架**：React@18 + TypeScript + Vite@5
- **状态管理**：Zustand@4
- **路由管理**：React Router@6
- **UI 框架**：TailwindCSS@3 + Ant Design@5（政务风格组件）
- **图表库**：ECharts@5
- **图标库**：lucide-react
- **HTTP 客户端**：Axios@1
- **后端框架**：Express@4 + TypeScript
- **数据库**：SQLite3（开发环境）/ PostgreSQL（生产环境）
- **缓存**：Redis
- **认证**：JWT + 政务云 OAuth2.0
- **ORM**：Prisma@5

## 3. 路由定义

| 路由 | 页面 | 说明 |
|------|------|------|
| / | 首页 | 统一入口、热门服务、资讯轮播 |
| /services | 政务办事 | 服务分类列表 |
| /services/:itemCode | 事项详情 | 办事指南、在线申报入口 |
| /services/:itemCode/apply | 在线申报 | 表单填写、材料上传 |
| /one-stop | 一件事一次办 | 主题服务列表 |
| /one-stop/:themeId | 联办详情 | 联办流程、一表填报 |
| /guide | 智能导办 | AI 助手、服务推荐 |
| /progress | 服务进度 | 办件列表 |
| /progress/:applyId | 进度详情 | 办理节点、物流信息 |
| /news | 本地资讯 | 资讯列表、分类筛选 |
| /news/:newsId | 资讯详情 | 文章内容、相关推荐 |
| /complaints | 诉求响应 | 工单列表、提交入口 |
| /complaints/submit | 诉求提交 | 工单填写 |
| /dashboard | 数据驾驶舱 | 数据统计、图表展示 |
| /profile | 个人中心 | 用户信息、我的办件 |
| /profile/settings | 设置 | 无障碍、消息通知设置 |
| /login | 登录 | 政务云统一认证 |

## 4. 数据模型

### 4.1 ER 图

```mermaid
erDiagram
    USER ||--o{ APPLICATION : "发起"
    USER ||--o{ COMPLAINT : "提交"
    USER ||--o{ USER_PROFILE : "拥有"
    SERVICE_ITEM ||--o{ APPLICATION : "对应"
    SERVICE_CATEGORY ||--o{ SERVICE_ITEM : "包含"
    ONE_STOP_THEME ||--o{ THEME_SERVICE : "包含"
    SERVICE_ITEM ||--o{ THEME_SERVICE : "属于"
    APPLICATION ||--o{ PROGRESS_NODE : "包含"
    COMPLAINT ||--o{ COMPLAINT_LOG : "包含"
    NEWS_CATEGORY ||--o{ NEWS : "包含"
    APPLICATION ||--o{ SERVICE_RATING : "被评价"
    COMPLAINT ||--o{ COMPLAINT_RATING : "被评价"
    
    USER {
        string id PK "用户ID"
        string idCard "身份证号"
        string realName "真实姓名"
        string phone "手机号"
        string avatar "头像"
        string userType "用户类型"
        datetime createdAt "创建时间"
        datetime lastLoginAt "最后登录"
    }
    
    USER_PROFILE {
        string id PK
        string userId FK
        string address "常用地址"
        json contactInfo "联系人信息"
        json userTags "用户标签"
        json behaviorData "行为数据"
    }
    
    SERVICE_CATEGORY {
        string id PK
        string name "分类名称"
        string parentId "父分类ID"
        int sort "排序"
    }
    
    SERVICE_ITEM {
        string itemCode PK "事项编码"
        string name "事项名称"
        string categoryId FK
        string department "办理部门"
        string handleType "办理类型"
        text guideContent "办事指南"
        json requiredMaterials "所需材料"
        int handlingTime "办理时限"
        string feeStandard "收费标准"
    }
    
    ONE_STOP_THEME {
        string id PK
        string name "主题名称"
        string description "主题描述"
        string icon "图标"
        string gradientColor "渐变色"
    }
    
    THEME_SERVICE {
        string id PK
        string themeId FK
        string itemCode FK
        int sort "排序"
    }
    
    APPLICATION {
        string id PK
        string userId FK
        string itemCode FK
        string status "办理状态"
        json formData "表单数据"
        json materials "材料列表"
        datetime submitTime "提交时间"
        datetime expectedTime "预计完成"
    }
    
    PROGRESS_NODE {
        string id PK
        string applyId FK
        string nodeName "节点名称"
        string status "节点状态"
        datetime time "时间"
        string operator "经办人"
        string remark "备注"
    }
    
    NEWS_CATEGORY {
        string id PK
        string name "栏目名称"
        string code "栏目编码"
    }
    
    NEWS {
        string id PK
        string categoryId FK
        string title "标题"
        text content "内容"
        string source "来源"
        string rssUrl "RSS来源"
        datetime publishTime "发布时间"
        int viewCount "浏览量"
    }
    
    COMPLAINT {
        string id PK
        string userId FK
        string title "诉求标题"
        string type "诉求类型"
        text content "诉求内容"
        string location "事发地点"
        json images "图片"
        string status "处理状态"
        string handlerDept "处理部门"
        datetime createTime "创建时间"
    }
    
    COMPLAINT_LOG {
        string id PK
        string complaintId FK
        string action "操作"
        string content "内容"
        datetime time "时间"
        string operator "操作人"
    }
    
    SERVICE_RATING {
        string id PK
        string applyId FK
        int score "评分"
        string comment "评价内容"
        datetime createTime "时间"
    }
    
    COMPLAINT_RATING {
        string id PK
        string complaintId FK
        int score "评分"
        string comment "评价内容"
        datetime createTime "时间"
    }
```

### 4.2 共享类型定义

```typescript
// shared/types/index.ts

export interface User {
  id: string;
  idCard: string;
  realName: string;
  phone: string;
  avatar?: string;
  userType: 'citizen' | 'enterprise' | 'staff' | 'admin';
  createdAt: string;
  lastLoginAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  address?: string;
  contactInfo?: ContactInfo[];
  userTags?: string[];
  behaviorData?: BehaviorData;
}

export interface ServiceCategory {
  id: string;
  name: string;
  parentId?: string;
  sort: number;
  children?: ServiceCategory[];
}

export interface ServiceItem {
  itemCode: string;
  name: string;
  categoryId: string;
  department: string;
  handleType: 'online' | 'offline' | 'hybrid';
  guideContent: string;
  requiredMaterials: MaterialItem[];
  handlingTime: number;
  feeStandard: string;
}

export interface MaterialItem {
  name: string;
  required: boolean;
  format: string[];
  maxSize: number;
  description?: string;
}

export interface OneStopTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradientColor: string;
  services: ThemeService[];
}

export interface ThemeService {
  id: string;
  themeId: string;
  itemCode: string;
  sort: number;
  serviceItem?: ServiceItem;
}

export interface Application {
  id: string;
  userId: string;
  itemCode: string;
  status: 'pending' | 'reviewing' | 'processing' | 'completed' | 'rejected';
  formData: Record<string, any>;
  materials: UploadedMaterial[];
  submitTime: string;
  expectedTime: string;
  serviceItem?: ServiceItem;
  progressNodes?: ProgressNode[];
}

export interface ProgressNode {
  id: string;
  applyId: string;
  nodeName: string;
  status: 'pending' | 'current' | 'completed';
  time?: string;
  operator?: string;
  remark?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  code: 'government' | 'convenience' | 'policy';
}

export interface News {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  source: string;
  rssUrl?: string;
  publishTime: string;
  viewCount: number;
  category?: NewsCategory;
}

export interface Complaint {
  id: string;
  userId: string;
  title: string;
  type: string;
  content: string;
  location?: string;
  images?: string[];
  status: 'pending' | 'assigned' | 'processing' | 'replied' | 'closed';
  handlerDept?: string;
  createTime: string;
  logs?: ComplaintLog[];
}

export interface ComplaintLog {
  id: string;
  complaintId: string;
  action: string;
  content: string;
  time: string;
  operator: string;
}

export interface DashboardStats {
  todayApplications: number;
  completionRate: number;
  averageSatisfaction: number;
  pendingComplaints: number;
  applicationTrend: TrendData[];
  hotIssues: HotIssue[];
  departmentRanking: DepartmentRank[];
}
```

## 5. API 接口定义

```typescript
// shared/api/types.ts

// 用户认证
export interface LoginRequest {
  authType: 'idcard' | 'phone' | 'face';
  credential: string;
  verifyCode?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// 服务事项
export interface ServiceListQuery {
  categoryId?: string;
  keyword?: string;
  userType?: string;
  page?: number;
  pageSize?: number;
}

export interface ServiceListResponse {
  list: ServiceItem[];
  total: number;
}

// 办件申请
export interface SubmitApplicationRequest {
  itemCode: string;
  formData: Record<string, any>;
  materials: UploadedMaterial[];
}

export interface SubmitApplicationResponse {
  applyId: string;
  status: string;
  expectedTime: string;
}

// 诉求提交
export interface SubmitComplaintRequest {
  title: string;
  type: string;
  content: string;
  location?: string;
  images?: string[];
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 数据统计
export interface DashboardResponse {
  todayApplications: number;
  completionRate: number;
  averageSatisfaction: number;
  pendingComplaints: number;
  applicationTrend: { date: string; count: number }[];
  hotIssues: { name: string; count: number }[];
  departmentRanking: { dept: string; rate: number }[];
}
```

## 6. 服务端架构

```mermaid
graph TD
    subgraph "中间件层"
        M1["认证中间件"]
        M2["日志中间件"]
        M3["限流中间件"]
        M4["权限校验"]
    end
    
    subgraph "控制器层 (Controller)"
        C1["AuthController"]
        C2["ServiceController"]
        C3["ApplicationController"]
        C4["OneStopController"]
        C5["ProgressController"]
        C6["NewsController"]
        C7["ComplaintController"]
        C8["DashboardController"]
        C9["AIGuideController"]
    end
    
    subgraph "服务层 (Service)"
        S1["AuthService"]
        S2["ServiceItemService"]
        S3["ApplicationService"]
        S4["OneStopService"]
        S5["ProgressService"]
        S6["NewsService"]
        S7["ComplaintService"]
        S8["DashboardService"]
        S9["AIGuideService"]
        S10["ExternalIntegrationService"]
    end
    
    subgraph "数据访问层 (Repository)"
        R1["UserRepository"]
        R2["ServiceRepository"]
        R3["ApplicationRepository"]
        R4["NewsRepository"]
        R5["ComplaintRepository"]
    end
    
    subgraph "数据层"
        DB1[(PostgreSQL)]
        DB2[(Redis Cache)]
    end
    
    M1 & M2 & M3 & M4 --> C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9
    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4
    C5 --> S5
    C6 --> S6
    C7 --> S7
    C8 --> S8
    C9 --> S9
    S1 & S2 & S3 & S6 & S7 --> R1 & R2 & R3 & R4 & R5
    S4 & S5 & S8 & S9 & S10 --> R1 & R2 & R3 & R4 & R5
    R1 & R2 & R3 & R4 & R5 --> DB1 & DB2
    S10 --> E1["政务云认证"]
    S10 --> E2["省平台对接"]
    S10 --> E3["委办局系统"]
    S10 --> E4["12345系统"]
```

## 7. 目录结构

```
├── src/                    # 前端源码
│   ├── components/         # 公共组件
│   │   ├── layout/         # 布局组件
│   │   ├── ui/             # UI 组件
│   │   └── accessibility/  # 无障碍组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # Zustand 状态
│   ├── services/           # API 服务
│   ├── utils/              # 工具函数
│   ├── types/              # 类型定义
│   ├── styles/             # 全局样式
│   ├── router/             # 路由配置
│   └── main.tsx            # 入口文件
├── api/                    # 后端源码
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务服务
│   │   ├── repositories/   # 数据访问
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── server.ts       # 入口文件
│   └── prisma/             # Prisma ORM
├── shared/                 # 共享类型
├── public/                 # 静态资源
└── migrations/             # 数据库迁移
```
