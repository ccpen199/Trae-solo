## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["React Router 路由"]
        C["Zustand 状态管理"]
        D["TailwindCSS 样式"]
        E["Lucide 图标库"]
        F["Recharts 图表"]
    end

    subgraph "后端服务层"
        G["Express.js 4 + TypeScript"]
        H["认证中间件"]
        I["智能匹配引擎"]
        J["消息服务"]
        K["财务服务"]
        L["监管报表服务"]
    end

    subgraph "数据层"
        M["SQLite 数据库"]
        N["Mock 数据填充"]
    end

    subgraph "外部接口(模拟)"
        O["教育部学籍验证API"]
        P["银行批量代发接口"]
        Q["支付宝/微信提现接口"]
    end

    A --> G
    B --> A
    C --> A
    D --> A
    E --> A
    F --> A
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    I --> O
    K --> P
    K --> Q
```

## 2. 技术描述

- **前端**: React@18 + TypeScript + Vite@6
- **路由**: react-router-dom@6
- **状态管理**: zustand@4
- **样式**: tailwindcss@3
- **图表**: recharts@2
- **图标**: lucide-react
- **后端**: Express.js@4 + TypeScript
- **数据库**: SQLite（开发期，带 mock 数据）
- **初始化工具**: vite-init
- **代码规范**: ESLint + TypeScript 严格模式

### 技术选型说明

1. **React + TypeScript**：组件化开发，类型安全，便于维护扩展
2. **Express + TypeScript**：轻量后端，前后端共享类型定义
3. **SQLite**：零配置文件数据库，适合快速原型和演示
4. **Zustand**：轻量级状态管理，API 简洁，避免 Redux 过度工程化
5. **Recharts**：基于 React 的图表库，与技术栈统一，监管看板数据可视化

## 3. 路由定义

| 路由路径 | 页面/组件 | 权限要求 | 说明 |
|----------|-----------|----------|------|
| `/login` | 登录页 | 公开 | 三角色登录/注册入口 |
| `/` | 岗位大厅 | 学生/企业 | 首页，岗位列表与搜索 |
| `/jobs/:id` | 岗位详情 | 学生/企业 | 单个岗位详情展示 |
| `/match` | 智能匹配 | 学生 | 个性化匹配结果页 |
| `/student/profile` | 学生个人中心 | 学生 | 学籍认证、简历信息 |
| `/student/schedule` | 课程表管理 | 学生 | 周课表录入与编辑 |
| `/student/applications` | 我的投递 | 学生 | 投递记录与状态 |
| `/student/wallet` | 钱包与提现 | 学生 | 余额、提现、流水 |
| `/student/certificate` | 实习证明 | 学生 | 证明生成与下载 |
| `/company/profile` | 企业认证 | 企业 | 企业资质信息 |
| `/company/jobs` | 岗位管理 | 企业 | 已发布岗位列表 |
| `/company/jobs/new` | 发布岗位 | 企业 | 含用工备案表 |
| `/company/candidates` | 候选人管理 | 企业 | 投递者列表 |
| `/company/payroll` | 工资代发 | 企业 | 批量代发工资 |
| `/messages` | 消息中心 | 学生/企业 | 聊天列表 |
| `/messages/:id` | 聊天详情 | 学生/企业 | 单聊对话 |
| `/admin/dashboard` | 监管看板 | 管理员 | 数据总览大屏 |
| `/admin/schools` | 院校监控 | 管理员 | 各院校数据 |
| `/admin/complaints` | 投诉处理 | 管理员 | 投诉列表与处理 |

## 4. API 定义

### 4.1 认证接口

```typescript
// 学生登录
POST /api/auth/student/login
Request: { studentId: string; password: string; }
Response: { token: string; user: Student; }

// 企业登录
POST /api/auth/company/login
Request: { email: string; password: string; }
Response: { token: string; user: Company; }

// 管理员登录
POST /api/auth/admin/login
Request: { username: string; password: string; }
Response: { token: string; user: Admin; }

// 学籍验证
POST /api/auth/student/verify
Request: { studentId: string; name: string; school: string; }
Response: { verified: boolean; major?: string; grade?: string; }
```

### 4.2 岗位接口

```typescript
// 获取岗位列表
GET /api/jobs?page=&size=&keyword=&salaryMin=&major=&location=
Response: { list: Job[]; total: number; }

// 获取岗位详情
GET /api/jobs/:id
Response: Job & { company: Company; filingForm: FilingForm; }

// 发布岗位
POST /api/jobs
Request: JobCreate & { filingForm: FilingFormCreate; }
Response: Job

// 智能匹配
GET /api/jobs/match?studentId=
Response: { matches: MatchResult[]; }

interface MatchResult {
  job: Job;
  score: number;
  breakdown: {
    majorMatch: number;
    scheduleMatch: number;
    ratingScore: number;
  };
}
```

### 4.3 学生接口

```typescript
// 获取学生信息
GET /api/students/:id
Response: Student

// 更新简历
PUT /api/students/:id/profile
Request: StudentProfileUpdate
Response: Student

// 课程表
GET /api/students/:id/schedule
Response: Schedule
PUT /api/students/:id/schedule
Request: ScheduleUpdate
Response: Schedule

// 投递记录
GET /api/students/:id/applications
Response: Application[]

// 钱包
GET /api/students/:id/wallet
Response: Wallet

// 提现
POST /api/students/:id/withdraw
Request: { amount: number; channel: 'alipay' | 'wechat'; }
Response: WithdrawRecord
```

### 4.4 企业接口

```typescript
// 企业认证
POST /api/companies/verify
Request: CompanyVerify
Response: Company

// 岗位管理
GET /api/companies/:id/jobs
Response: Job[]

// 候选人
GET /api/companies/:id/candidates?jobId=
Response: Application[]

// 处理申请
PUT /api/applications/:id/status
Request: { status: 'accepted' | 'rejected' | 'interview'; }
Response: Application

// 工资代发
POST /api/payroll/batch
Request: { jobId: string; payrolls: PayrollItem[]; }
Response: { batchId: string; totalAmount: number; count: number; }
```

### 4.5 消息接口

```typescript
// 会话列表
GET /api/messages/conversations
Response: Conversation[]

// 消息记录
GET /api/messages/conversations/:id
Response: Message[]

// 发送消息
POST /api/messages
Request: { conversationId: string; content: string; type: 'text' | 'file'; }
Response: Message

// 生成实习证明
POST /api/certificate/generate
Request: { applicationId: string; }
Response: { certificateUrl: string; }
```

### 4.6 监管接口

```typescript
// 总览数据
GET /api/admin/overview
Response: AdminOverview

interface AdminOverview {
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalComplaints: number;
  complaintRate: number;
  salaryComplianceRate: number;
  dailyTrend: TrendItem[];
}

// 院校数据
GET /api/admin/schools
Response: SchoolStats[]

// 投诉列表
GET /api/admin/complaints
Response: Complaint[]
```

## 5. 服务端架构图

```mermaid
flowchart TD
    subgraph "路由层 Controllers"
        A1["AuthController"]
        A2["JobController"]
        A3["StudentController"]
        A4["CompanyController"]
        A5["MessageController"]
        A6["AdminController"]
        A7["PayrollController"]
    end

    subgraph "服务层 Services"
        B1["AuthService"]
        B2["JobService"]
        B3["MatchService"]
        B4["StudentService"]
        B5["CompanyService"]
        B6["MessageService"]
        B7["PayrollService"]
        B8["AdminService"]
        B9["CertificateService"]
    end

    subgraph "数据层 Repositories"
        C1["UserRepository"]
        C2["JobRepository"]
        C3["ApplicationRepository"]
        C4["MessageRepository"]
        C5["PayrollRepository"]
        C6["ComplaintRepository"]
    end

    subgraph "数据库"
        D["SQLite Database"]
    end

    A1 --> B1
    A2 --> B2
    A2 --> B3
    A3 --> B4
    A4 --> B5
    A5 --> B6
    A5 --> B9
    A6 --> B8
    A7 --> B7

    B1 --> C1
    B2 --> C2
    B3 --> C2
    B4 --> C1
    B4 --> C3
    B5 --> C1
    B5 --> C2
    B6 --> C4
    B7 --> C5
    B8 --> C6
    B8 --> C2
    B9 --> C3

    C1 --> D
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    C6 --> D
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    STUDENT ||--o{ APPLICATION : "投递"
    STUDENT ||--|| SCHEDULE : "拥有"
    STUDENT ||--|| WALLET : "拥有"
    COMPANY ||--o{ JOB : "发布"
    COMPANY ||--|| FILING_FORM : "备案"
    JOB ||--o{ APPLICATION : "收到"
    JOB ||--|| FILING_FORM : "关联"
    STUDENT ||--o{ MESSAGE : "发送"
    COMPANY ||--o{ MESSAGE : "发送"
    CONVERSATION ||--o{ MESSAGE : "包含"
    APPLICATION ||--o{ PAYROLL_RECORD : "产生"
    STUDENT ||--o{ WITHDRAW_RECORD : "申请"
    STUDENT ||--o{ CERTIFICATE : "生成"
    ADMIN ||--o{ COMPLAINT : "处理"
    STUDENT ||--o{ COMPLAINT : "发起"
    COMPANY ||--o{ COMPLAINT : "被投诉"
    SCHOOL ||--o{ STUDENT : "包含"

    STUDENT {
        string id PK
        string studentId
        string name
        string school
        string major
        string grade
        string password
        string avatar
        float rating
        boolean verified
        datetime createdAt
    }

    COMPANY {
        string id PK
        string name
        string email
        string password
        string licenseNo
        string contactName
        string contactPhone
        string address
        string avatar
        boolean verified
        datetime createdAt
    }

    JOB {
        string id PK
        string companyId FK
        string title
        string description
        string location
        float salaryPerHour
        float maxHoursPerDay
        float maxHoursPerWeek
        string majorRequired
        string status
        datetime createdAt
    }

    FILING_FORM {
        string id PK
        string jobId FK
        string companyId FK
        float maxHoursPerDay
        float maxHoursPerWeek
        float minWage
        boolean insuranceProvided
        string safetyMeasures
        datetime filedAt
    }

    APPLICATION {
        string id PK
        string studentId FK
        string jobId FK
        string status
        datetime appliedAt
        string interviewTime
        float workHours
        float salary
        float rating
        string comment
    }

    SCHEDULE {
        string id PK
        string studentId FK
        json courses
    }

    MESSAGE {
        string id PK
        string conversationId FK
        string senderId
        string senderType
        string content
        string type
        datetime createdAt
        boolean read
    }

    CONVERSATION {
        string id PK
        string studentId FK
        string companyId FK
        string jobId FK
        datetime lastMessageAt
    }

    WALLET {
        string id PK
        string studentId FK
        float balance
        string alipayAccount
        string wechatAccount
    }

    PAYROLL_RECORD {
        string id PK
        string applicationId FK
        string companyId FK
        string studentId FK
        float amount
        string status
        datetime paidAt
    }

    WITHDRAW_RECORD {
        string id PK
        string studentId FK
        float amount
        string channel
        string status
        datetime createdAt
    }

    CERTIFICATE {
        string id PK
        string studentId FK
        string applicationId FK
        string certificateUrl
        string sealUrl
        datetime createdAt
    }

    COMPLAINT {
        string id PK
        string studentId FK
        string companyId FK
        string jobId FK
        string type
        string description
        string status
        string result
        datetime createdAt
        datetime resolvedAt
    }

    SCHOOL {
        string id PK
        string name
        string province
        int studentCount
    }

    ADMIN {
        string id PK
        string username
        string password
        string name
        string role
    }
```

### 6.2 核心实体类型定义

```typescript
// 学生
interface Student {
  id: string;
  studentId: string;
  name: string;
  school: string;
  major: string;
  grade: string;
  avatar?: string;
  rating: number;
  verified: boolean;
  resume?: {
    skills: string[];
    experience: string;
    introduction: string;
  };
  createdAt: Date;
}

// 企业
interface Company {
  id: string;
  name: string;
  email: string;
  licenseNo: string;
  contactName: string;
  contactPhone: string;
  address: string;
  avatar?: string;
  verified: boolean;
  createdAt: Date;
}

// 岗位
interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  salaryPerHour: number;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  majorRequired: string[];
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  status: 'draft' | 'published' | 'closed';
  filingForm?: FilingForm;
  company?: Company;
  createdAt: Date;
}

// 用工备案表
interface FilingForm {
  id: string;
  jobId: string;
  companyId: string;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  minWage: number;
  insuranceProvided: boolean;
  insuranceType?: string;
  safetyMeasures: string;
  emergencyContact: string;
  emergencyPhone: string;
  filedAt: Date;
}

// 投递申请
interface Application {
  id: string;
  studentId: string;
  jobId: string;
  status: 'pending' | 'interview' | 'accepted' | 'rejected' | 'working' | 'completed';
  appliedAt: Date;
  interviewTime?: Date;
  workHours?: number;
  salary?: number;
  rating?: number;
  comment?: string;
  student?: Student;
  job?: Job;
}

// 智能匹配结果
interface MatchResult {
  job: Job;
  score: number;
  breakdown: {
    majorMatch: number;
    scheduleMatch: number;
    ratingScore: number;
  };
  reasons: string[];
}
```
