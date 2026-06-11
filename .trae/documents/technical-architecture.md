## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        Web["Web客户端 (React + Vite)"]
        Desktop["桌面客户端 (Electron)"]
        MiniApp["小程序客户端 (Taro)"]
    end

    subgraph "服务层"
        APIGateway["API网关"]
        AuthSvc["认证服务"]
        ResumeSvc["简历服务"]
        AIAgent["AI对话Agent"]
        TemplateSvc["模板引擎服务"]
        LabSvc["简历实验室服务"]
        CaseSvc["案例库服务"]
        SyncSvc["同步服务"]
        AnalyticsSvc["分析服务"]
    end

    subgraph "数据层"
        DB[("PostgreSQL")]
        Redis[("Redis 缓存")]
        OSS["对象存储 (PDF/快照)"]
        Encrypt["端到端加密层"]
    end

    subgraph "外部服务"
        LLM["多模态大模型 API"]
        OCR["OCR识别服务"]
    end

    Web --> APIGateway
    Desktop --> APIGateway
    MiniApp --> APIGateway

    APIGateway --> AuthSvc
    APIGateway --> ResumeSvc
    APIGateway --> AIAgent
    APIGateway --> TemplateSvc
    APIGateway --> LabSvc
    APIGateway --> CaseSvc
    APIGateway --> SyncSvc
    APIGateway --> AnalyticsSvc

    AIAgent --> LLM
    LabSvc --> OCR
    LabSvc --> LLM

    ResumeSvc --> DB
    ResumeSvc --> Redis
    ResumeSvc --> OSS
    ResumeSvc --> Encrypt
    TemplateSvc --> DB
    TemplateSvc --> OSS
    LabSvc --> DB
    CaseSvc --> DB
    SyncSvc --> Redis
    SyncSvc --> DB
    AnalyticsSvc --> DB
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript + Vite
- **样式方案**：Tailwind CSS@3 + CSS变量主题系统
- **状态管理**：Zustand（轻量级，适合简历编辑器复杂状态）
- **拖拽库**：@dnd-kit/core + @dnd-kit/sortable（模块化拖拽排序）
- **图表库**：Recharts（数据仪表盘趋势图与热力图）
- **PDF处理**：pdfjs-dist（PDF解析预览）+ html2canvas + jsPDF（PDF导出）
- **Word导出**：docx（生成.docx文件）
- **动效库**：framer-motion（页面过渡与交互动画）
- **富文本/编辑**：自研结构化简历编辑器（基于块级编辑模型）
- **初始化工具**：Vite (create-vite)
- **后端**：前端原型阶段采用Mock数据 + localStorage模拟，架构预留API对接层
- **数据库**：前端原型使用localStorage + IndexedDB持久化，架构预留PostgreSQL

## 3. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| `/` | 首页/落地页 | 公开 |
| `/create` | AI对话创作页 | 已登录用户 |
| `/editor/:id` | 简历编辑器页（id为简历ID） | 已登录用户 |
| `/lab` | 简历实验室页 | 已登录用户 |
| `/cases` | 案例库页 | 公开 |
| `/cases/:id` | 案例详情页 | 公开 |
| `/dashboard` | 数据仪表盘页 | 管理员 |
| `/profile` | 个人中心页 | 已登录用户 |

## 4. API定义

### 4.1 简历相关

```typescript
interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  theme: ResumeTheme;
  sections: ResumeSection[];
  versions: ResumeVersion[];
  createdAt: string;
  updatedAt: string;
}

interface ResumeSection {
  id: string;
  type: "education" | "experience" | "project" | "skill" | "summary" | "custom";
  title: string;
  order: number;
  collapsed: boolean;
  items: ResumeItem[];
}

interface ResumeItem {
  id: string;
  fields: Record<string, string | string[]>;
  starRewrite?: {
    original: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

interface ResumeTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
}

interface ResumeVersion {
  id: string;
  snapshot: Resume;
  label: string;
  createdAt: string;
}
```

### 4.2 AI对话相关

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  structuredData?: Partial<Resume>;
}

interface AIAnalysisResult {
  verbStrength: {
    score: number;
    weakVerbs: string[];
    suggestions: string[];
  };
  quantification: {
    score: number;
    missingAreas: string[];
    suggestions: string[];
  };
  layout: {
    score: number;
    redundancyAreas: string[];
    suggestions: string[];
  };
  atsCompatibility: {
    score: number;
    issues: string[];
  };
  overallScore: number;
}
```

### 4.3 案例相关

```typescript
interface ResumeCase {
  id: string;
  industry: string;
  position: string;
  experienceLevel: "junior" | "mid" | "senior" | "executive";
  title: string;
  resumeSnapshot: Resume;
  hrReviews: HRReview[];
  rating: number;
  tags: string[];
}

interface HRReview {
  id: string;
  anchor: string;
  comment: string;
  type: "positive" | "suggestion" | "warning";
}
```

### 4.4 分析仪表盘相关

```typescript
interface AnalyticsData {
  qualityTrend: {
    date: string;
    avgEdits: number;
    atsPassRate: number;
  }[];
  templateHeatmap: {
    templateId: string;
    industry: string;
    usageCount: number;
  }[];
  userActivity: {
    date: string;
    dau: number;
    mau: number;
    retention: number;
  }[];
}
```

## 5. 核心模块架构

### 5.1 模板引擎架构

```mermaid
flowchart TD
    TemplateStore["模板存储 (JSON Schema)"] --> TemplateRenderer["模板渲染器"]
    CSSVars["CSS变量主题"] --> TemplateRenderer
    SectionComponents["模块化组件库"] --> TemplateRenderer
    TemplateRenderer --> PreviewCanvas["预览画布"]
    TemplateRenderer --> ExportEngine["导出引擎"]
    ExportEngine --> PDFExporter["PDF导出器"]
    ExportEngine --> WordExporter["Word导出器"]
    ExportEngine --> WebExporter["网页导出器"]
```

### 5.2 简历编辑器状态架构

```mermaid
flowchart TD
    UserAction["用户操作"] --> ZustandStore["Zustand状态仓库"]
    ZustandStore -->|"状态变更"| EditorView["编辑器视图"]
    ZustandStore -->|"状态变更"| PreviewView["预览视图"]
    ZustandStore -->|"持久化"| Storage["localStorage/IndexedDB"]
    ZustandStore -->|"版本快照"| VersionManager["版本管理器"]
    DragAction["拖拽操作"] --> DndKit["@dnd-kit处理"]
    DndKit --> ZustandStore
    ThemeAction["主题切换"] --> CSSVarEngine["CSS变量引擎"]
    CSSVarEngine --> ZustandStore
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "User" ||--o{ "Resume" : "creates"
    "Resume" ||--o{ "ResumeVersion" : "has"
    "Resume" }o--|| "Template" : "uses"
    "Resume" ||--o{ "ResumeSection" : "contains"
    "ResumeSection" ||--o{ "ResumeItem" : "contains"
    "ResumeItem" }o--o| "STARRewrite" : "has"
    "Template" ||--o{ "ThemePreset" : "provides"
    "ResumeCase" }o--|| "Industry" : "belongs_to"
    "ResumeCase" }o--|| "Position" : "belongs_to"
    "ResumeCase" ||--o{ "HRReview" : "has"
    "AIAnalysis" }o--|| "Resume" : "analyzes"

    "User" {
        string id PK
        string email
        string name
        string role
        string encrypted_key
        datetime created_at
    }

    "Resume" {
        string id PK
        string user_id FK
        string template_id FK
        string title
        json theme
        datetime created_at
        datetime updated_at
    }

    "ResumeVersion" {
        string id PK
        string resume_id FK
        json snapshot
        string label
        datetime created_at
    }

    "ResumeSection" {
        string id PK
        string resume_id FK
        string type
        string title
        int order
        boolean collapsed
    }

    "ResumeItem" {
        string id PK
        string section_id FK
        json fields
        json star_rewrite
    }

    "Template" {
        string id PK
        string name
        string category
        json schema
        json layout
    }

    "ThemePreset" {
        string id PK
        string template_id FK
        string name
        json css_vars
    }

    "ResumeCase" {
        string id PK
        string industry
        string position
        string experience_level
        string title
        json resume_snapshot
        float rating
    }

    "HRReview" {
        string id PK
        string case_id FK
        string anchor
        string comment
        string type
    }
```

### 6.2 前端持久化方案（原型阶段）

```sql
-- IndexedDB Stores
-- resumes: 存储用户简历数据
-- versions: 存储版本快照
-- templates: 存储模板定义
-- cases: 存储案例数据（预置）
-- settings: 存储用户偏好与主题

-- localStorage Keys
-- auth_token: 模拟认证令牌
-- theme_preference: 用户主题偏好
-- sync_status: 跨端同步状态
-- encryption_key: 端到端加密公钥
```
