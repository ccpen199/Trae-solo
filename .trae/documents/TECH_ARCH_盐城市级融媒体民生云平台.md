## 1. 架构设计

```mermaid
graph TB
    subgraph "客户端层"
        A1["Web端（PC/Pad）"]
        A2["移动端H5"]
    end
    
    subgraph "前端应用层"
        B1["React SPA（路由+状态管理）"]
        B2["组件库（Tailwind定制）"]
        B3["适老化引擎（字号/对比度/语音）"]
        B4["地图/视频/音频SDK集成"]
    end
    
    subgraph "网关与接口层"
        C1["Express API Gateway"]
        C2["鉴权中间件（JWT）"]
        C3["请求限流与日志"]
    end
    
    subgraph "业务服务层"
        D1["新闻资讯服务"]
        D2["工单系统服务"]
        D3["应急预警服务"]
        D4["便民服务聚合"]
        D5["地图服务接口"]
    end
    
    subgraph "内容中台AI层"
        E1["稿件自动打标引擎"]
        E2["热点事件聚类算法"]
        E3["舆情情感分析模块"]
        E4["风险等级评估模型"]
    end
    
    subgraph "数据存储层"
        F1["SQLite（业务数据）"]
        F2["文件存储（图片/视频）"]
        F3["缓存层（内存）"]
    end

    A1 & A2 --> B1 & B2 & B3 & B4
    B1 --> C1 & C2 & C3
    C1 --> D1 & D2 & D3 & D4 & D5
    D1 & D2 --> E1 & E2 & E3 & E4
    D1 & D2 & D3 & D4 & D5 --> F1 & F2 & F3
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript + Vite
- **UI框架**：TailwindCSS 3 + lucide-react 图标
- **状态管理**：Zustand
- **路由管理**：React Router DOM
- **后端服务**：Express 4 + TypeScript（ESM）
- **数据库**：SQLite（轻量级演示）
- **多媒体处理**：HTML5 Video/Audio API、浏览器语音识别（Web Speech API）
- **地图可视化**：Leaflet.js（开源地图库，无需密钥）

## 3. 路由定义

| 路由路径 | 页面用途 |
|----------|----------|
| `/` | 首页（综合入口） |
| `/news` | 新闻列表页 |
| `/news/:id` | 新闻详情页（图文/视频/直播） |
| `/workorder` | 12345工单列表 |
| `/workorder/submit` | 工单提交页 |
| `/workorder/:id` | 工单进度详情 |
| `/emergency` | 应急广播预警中心 |
| `/map` | 公共服务地图 |
| `/services` | 便民服务大厅 |
| `/services/:category` | 便民服务分类页 |
| `/admin/content` | 内容中台-稿件管理 |
| `/admin/analytics` | 内容中台-舆情分析 |
| `/elderly/settings` | 适老化设置页 |
| `/elderly/sos` | 紧急呼救配置页 |

## 4. API 接口定义

### 4.1 TypeScript 核心类型

```typescript
// 新闻稿件
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: 'policy' | 'livelihood' | 'culture' | 'general';
  type: 'article' | 'video' | 'live';
  videoUrl?: string;
  tags: string[];
  source: string;
  publishTime: string;
  views: number;
  likes: number;
}

// 工单
interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  category: string;
  description: string;
  images?: string[];
  status: 'pending' | 'assigned' | 'processing' | 'completed';
  responsibleDept: string;
  submitTime: string;
  deadline: string;
  progress: WorkOrderProgress[];
  rating?: number;
}

interface WorkOrderProgress {
  time: string;
  status: string;
  operator: string;
  remark: string;
}

// 应急预警
interface EmergencyAlert {
  id: string;
  title: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  type: 'typhoon' | 'rainstorm' | 'high_temp' | 'earthquake' | 'other';
  content: string;
  publishTime: string;
  effectiveTime: string;
  scope: string;
}

// 服务网点
interface ServiceOutlet {
  id: string;
  name: string;
  type: 'water' | 'electricity' | 'gas' | 'health';
  address: string;
  lat: number;
  lng: number;
  phone: string;
  openHours: string;
  queueCount: number;
  queueWaitTime: number;
}

// 舆情数据
interface PublicOpinion {
  id: string;
  keyword: string;
  sentimentScore: number; // -1 ~ 1
  spreadCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  relatedArticles: string[];
  trend: { time: string; count: number }[];
}
```

### 4.2 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/news` | 获取新闻列表（支持分类/分页/搜索） |
| GET | `/api/news/:id` | 获取新闻详情 |
| POST | `/api/news/:id/like` | 点赞新闻 |
| GET | `/api/workorder` | 获取用户工单列表 |
| POST | `/api/workorder` | 提交新工单 |
| GET | `/api/workorder/:id` | 获取工单详情与进度 |
| POST | `/api/workorder/:id/rate` | 工单满意度评价 |
| GET | `/api/alerts` | 获取应急预警列表 |
| GET | `/api/alerts/active` | 获取当前生效预警 |
| GET | `/api/outlets` | 获取服务网点列表 |
| GET | `/api/outlets/:id/queue` | 获取网点实时排队数据 |
| GET | `/api/services` | 获取便民服务分类列表 |
| POST | `/api/sos/call` | 触发紧急呼救 |
| GET | `/api/admin/content/articles` | 内容中台-稿件列表 |
| POST | `/api/admin/content/tag` | 触发稿件自动打标 |
| GET | `/api/admin/analytics/clusters` | 获取热点事件聚类 |
| GET | `/api/admin/analytics/opinion` | 获取舆情分析数据 |

## 5. 服务端架构图

```mermaid
graph TD
    A["API路由层 (Routes)"] --> B["控制器层 (Controllers)"]
    B --> C["业务服务层 (Services)"]
    C --> D["数据访问层 (Repositories)"]
    D --> E["数据库 (SQLite)"]
    
    C --> F["AI处理中间件"]
    F --> G["打标引擎"]
    F --> H["聚类算法"]
    F --> I["情感分析"]
    
    J["Mock数据种子 (Seed)"] --> E
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    NEWS_ARTICLE ||--o{ NEWS_TAG : has
    NEWS_ARTICLE {
        string id PK
        string title
        text content
        string category
        string type
        string source
        datetime publish_time
        int views
        int likes
    }
    NEWS_TAG {
        string id PK
        string article_id FK
        string tag_name
    }
    
    WORK_ORDER ||--o{ ORDER_PROGRESS : has
    WORK_ORDER {
        string id PK
        string order_no
        string title
        string category
        text description
        string status
        string dept
        datetime submit_time
        int rating
    }
    ORDER_PROGRESS {
        string id PK
        string order_id FK
        string status
        string remark
        datetime time
    }
    
    EMERGENCY_ALERT {
        string id PK
        string title
        string level
        string type
        text content
        datetime publish_time
        datetime effective_until
    }
    
    SERVICE_OUTLET {
        string id PK
        string name
        string type
        string address
        float lat
        float lng
        int queue_count
    }
    
    PUBLIC_OPINION {
        string id PK
        string keyword
        float sentiment
        int spread_count
        string risk_level
    }
```

### 6.2 初始化 DDL（SQLite 方言）

```sql
CREATE TABLE IF NOT EXISTS news_article (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  type TEXT NOT NULL DEFAULT 'article',
  video_url TEXT,
  source TEXT,
  publish_time TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news_tag (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES news_article(id)
);

CREATE TABLE IF NOT EXISTS work_order (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  responsible_dept TEXT,
  submit_time TEXT NOT NULL,
  deadline TEXT,
  rating INTEGER
);

CREATE TABLE IF NOT EXISTS order_progress (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  operator TEXT,
  remark TEXT,
  time TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES work_order(id)
);

CREATE TABLE IF NOT EXISTS emergency_alert (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  publish_time TEXT NOT NULL,
  effective_time TEXT,
  scope TEXT
);

CREATE TABLE IF NOT EXISTS service_outlet (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT,
  open_hours TEXT,
  queue_count INTEGER DEFAULT 0,
  queue_wait_time INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public_opinion (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  sentiment_score REAL NOT NULL,
  spread_count INTEGER NOT NULL,
  risk_level TEXT NOT NULL
);
```
