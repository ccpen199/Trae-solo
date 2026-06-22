## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React SPA - 镇雄本地通"]
        A1["首页/信息流"]
        A2["分类信息"]
        A3["资讯栏目"]
        A4["搜索"]
        A5["内容发布"]
        A6["商户详情/后台"]
        A7["民生服务"]
        A8["数据看板"]
        A9["个人中心"]
    end

    subgraph "数据层"
        B["Mock Data Service"]
        B1["商户数据"]
        B2["资讯数据"]
        B3["分类信息数据"]
        B4["用户数据"]
        B5["乡镇地理数据"]
    end

    subgraph "外部服务"
        C["社保查询跳转"]
        D["水电缴费跳转"]
        E["政务服务跳转"]
    end

    A --> A1
    A --> A2
    A --> A3
    A --> A4
    A --> A5
    A --> A6
    A --> A7
    A --> A8
    A --> A9

    A1 --> B
    A2 --> B
    A3 --> B
    A4 --> B
    A5 --> B
    A6 --> B
    A7 --> C
    A7 --> D
    A7 --> E
    A8 --> B
    A9 --> B

    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5
```

## 2. 技术说明

- 前端：React@18 + TailwindCSS@3 + Vite
- 初始化工具：Vite (npm create vite@latest)
- 后端：无（纯前端项目，使用 Mock 数据模拟接口）
- 数据库：无（使用本地 JSON Mock 数据）
- 状态管理：React Context + useReducer
- 路由：React Router v6
- 图表：Recharts（数据看板可视化）
- 地图：无需真实地图SDK，使用SVG绘制镇雄县乡镇示意图做热区展示
- 动画：Framer Motion
- 图标：Lucide React

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页，LBS信息流推荐+分类入口+便民服务 |
| /category | 分类信息页，招聘/房产/美食/交友板块 |
| /category/:type | 具体分类详情，如 /category/jobs |
| /news | 资讯栏目页，本地新闻/政策公告等 |
| /news/:id | 资讯文章详情 |
| /search | 搜索页，多维度搜索 |
| /publish | 内容发布页，UGC发布+结构化模板 |
| /merchant/:id | 商户详情页 |
| /merchant/dashboard | 商户管理后台 |
| /services | 民生服务页，社保/缴费/政务跳转 |
| /dashboard | 数据看板页 |
| /profile | 个人中心 |

## 4. API定义（Mock数据接口）

```typescript
interface Merchant {
  id: string;
  name: string;
  address: string;
  phone: string;
  category: string[];
  status: "open" | "closed";
  description: string;
  images: string[];
  location: { lat: number; lng: number };
  township: string;
  rating: number;
  verified: boolean;
}

interface InfoPost {
  id: string;
  type: "job" | "housing" | "food" | "dating";
  title: string;
  content: string;
  images: string[];
  author: string;
  createdAt: string;
  location: { lat: number; lng: number; township: string };
  tags: string[];
  status: "pending" | "approved" | "rejected";
  structuredData?: Record<string, string>;
}

interface NewsArticle {
  id: string;
  category: "local" | "policy" | "township" | "guide";
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  views: number;
  township?: string;
}

interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  interestTags: string[];
  location: { township: string; community?: string };
  role: "user" | "merchant" | "admin";
  publishedPosts: string[];
  favorites: string[];
}

interface Township {
  name: string;
  code: string;
  center: { lat: number; lng: number };
  polygon: [number, number][];
}

interface DashboardStats {
  hotCategories: { name: string; count: number; trend: number }[];
  activeTownships: { name: string; activeUsers: number; postCount: number }[];
  updateFrequency: { date: string; jobs: number; housing: number; food: number; dating: number }[];
  totalPosts: number;
  totalMerchants: number;
  totalUsers: number;
}
```

## 5. 服务端架构图

不适用——本项目为纯前端项目，使用 Mock 数据，无后端服务。

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "User" ||--o{ "InfoPost" : "publishes"
    "User" ||--o{ "Favorite" : "has"
    "Merchant" ||--o{ "InfoPost" : "publishes"
    "User" }|--|| "Township" : "located_in"
    "InfoPost" }|--|| "Township" : "located_in"
    "NewsArticle" }o--o| "Township" : "covers"
    "Merchant" }|--|| "Township" : "located_in"
    "Merchant" ||--o{ "MerchantCategory" : "has"

    User {
        string id PK
        string phone
        string nickname
        string avatar
        string role
        string township
    }

    Merchant {
        string id PK
        string name
        string address
        string phone
        boolean verified
        string status
        string township
    }

    InfoPost {
        string id PK
        string type
        string title
        string content
        string author_id FK
        string township
        string status
        string structuredData
    }

    NewsArticle {
        string id PK
        string category
        string title
        string content
        string township
        integer views
    }

    Township {
        string code PK
        string name
        float lat
        float lng
    }

    Favorite {
        string id PK
        string user_id FK
        string post_id FK
    }

    MerchantCategory {
        string id PK
        string merchant_id FK
        string category_name
    }
```

### 6.2 数据定义语言

本项目使用前端 Mock JSON 数据，不使用关系型数据库。数据存储于 `src/data/` 目录下的 JSON 文件中：

- `merchants.json` - 商户数据
- `posts.json` - 分类信息帖子数据
- `news.json` - 资讯文章数据
- `users.json` - 用户数据
- `townships.json` - 镇雄县乡镇地理数据（30个乡镇）
- `dashboard.json` - 数据看板统计数据
