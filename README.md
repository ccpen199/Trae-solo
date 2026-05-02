# 体检中心管理系统

## 项目概述

这是一个完整的体检中心管理系统，服务于体检客户、前台、科室医生、总检医生等岗位。系统嵌入了智能排队引擎、报告自动化解析引擎、慢病预警模型、套餐动态配置引擎，确保每一个环节可追溯、可管控、可落地。

## 核心功能

### 业务流程

1. **客户预约**：客户在Web前端选购套餐、预约时段。后端校验科室承载力，返回唯一预约码，订单状态置为"已预约"。

2. **现场签到**：现场签到后，后端"排队引擎"根据各诊室拥挤度生成动态导检路径，前端大屏实时显示队列，状态转为"体检中"。

3. **指标录入**：各科室医生在前端录入指标。后端实时计算异常范围，触发"危机值预警"，自动锁定该客户，并同步通知导诊台进行人工引导。

4. **报告生成**：所有项目结束后，后端"聚合引擎"拉取数据。总检医生在前端审核，一键生成PDF报告。状态转为"已出报告"。

5. **健康推送**：后端根据检查结果自动匹配健康建议，推送至客户前端。若出现重大异常，自动生成"复查工单"推送到客服端进行随访转化。

6. **离线支持**：系统支持离线录入，网络恢复后后端执行幂等补偿，确保体检数据完整性，所有修改操作均记录留痕供医疗审计。

## 技术架构

### 后端技术栈

- **运行时**: Node.js 20+
- **框架**: Express
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **缓存/实时队列**: Redis
- **实时通信**: Socket.io
- **认证**: JWT
- **PDF生成**: PDFKit
- **工作空间**: npm workspaces (monorepo)

### 前端技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **路由**: React Router
- **HTTP客户端**: Axios
- **实时通信**: Socket.io-client

## 端口配置 (稀有端口)

所有端口配置集中在 `.env` 文件中，**切勿在代码或README中硬编码端口**。

| 服务类型 | 端口 | 说明 |
|---------|------|------|
| 后端API服务 | 18443 | REST API接口 |
| Socket通信 | 18444 | 实时通信(队列、通知) |
| 客户Web端 | 18445 | 套餐选购、预约 |
| 前台端 | 18446 | 签到、队列管理 |
| 医生端 | 18447 | 指标录入、报告审核 |
| 大屏端 | 18448 | 实时队列显示 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存/实时队列 |

## 核心业务引擎

### 1. Intelligent-Triage 智能排队引擎
- 动态生成导检路径
- 实时计算科室拥挤度
- 智能优化检查顺序
- 估计等待时间

### 2. Report-Auto-Gen 报告自动化解析引擎
- 自动聚合检查结果
- 智能生成健康建议
- 一键生成PDF报告
- 异常指标自动分类

### 3. Risk-Model 慢病预警模型
- 实时异常值检测
- 危急值自动预警
- 慢病风险评估
- 自动生成随访工单

### 4. 套餐动态配置引擎
- 套餐灵活配置
- 科室承载力校验
- 可预约时段查询
- 自定义套餐支持

## 项目结构

```
xm-7142/
├── .env                          # 环境变量(端口、数据库配置)
├── .env.example                  # 环境变量模板
├── docker-compose.yml            # Docker部署配置
├── Dockerfile.backend            # 后端Docker镜像
├── package.json                  # 根package.json (workspaces)
├── start.sh                      # 快速启动脚本
├── ports.md                      # 端口配置说明
│
├── packages/                     # 共享包
│   ├── config/                   # 统一配置模块
│   │   ├── package.json
│   │   └── src/index.ts          # 端口、数据库等配置
│   └── types/                    # 共享类型定义
│       ├── package.json
│       └── src/index.ts          # 所有业务类型定义
│
└── apps/                         # 应用服务
    ├── backend/                  # 后端API服务
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts          # 入口文件
    │       ├── database/         # 数据库层
    │       │   ├── index.ts      # 数据库连接
    │       │   ├── redis.ts      # Redis连接
    │       │   ├── migrations.ts # 数据库迁移
    │       │   └── seed.ts       # 种子数据
    │       ├── engines/          # 核心业务引擎
    │       │   ├── triage-engine.ts      # 智能排队引擎
    │       │   ├── report-engine.ts      # 报告解析引擎
    │       │   ├── risk-model.ts         # 风险预警模型
    │       │   └── package-config-engine.ts # 套餐配置引擎
    │       ├── routes/           # API路由
    │       │   ├── auth.ts       # 认证路由
    │       │   ├── packages.ts   # 套餐路由
    │       │   ├── reservations.ts # 预约路由
    │       │   ├── examinations.ts # 检查路由
    │       │   ├── reports.ts    # 报告路由
    │       │   ├── patients.ts   # 患者路由
    │       │   ├── notifications.ts # 通知路由
    │       │   ├── followup.ts   # 随访路由
    │       │   ├── sync.ts       # 离线同步路由
    │       │   └── audit.ts      # 审计日志路由
    │       └── middleware/       # 中间件
    │           └── auth.ts       # 认证中间件
    │
    ├── client-web/               # 客户Web端
    │   ├── package.json
    │   ├── vite.config.ts        # 使用config包中的端口
    │   ├── tsconfig.json
    │   ├── index.html
    │   └── src/
    │       ├── main.tsx
    │       ├── App.tsx
    │       ├── store/            # 状态管理
    │       ├── services/         # API服务
    │       ├── components/       # 组件
    │       └── pages/            # 页面
    │
    ├── reception-web/            # 前台端
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── src/
    │       └── pages/
    │           ├── CheckInPage.tsx      # 签到页面
    │           └── QueueManagementPage.tsx # 队列管理
    │
    ├── doctor-web/               # 医生端
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── src/
    │       └── pages/
    │           └── ExaminationPage.tsx   # 检查录入
    │
    └── dashboard-web/            # 大屏显示
        ├── package.json
        ├── vite.config.ts
        └── src/
            └── pages/
                └── DashboardPage.tsx     # 实时队列大屏
```

## 快速开始

### 前置要求

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (可选，用于一键启动数据库)

### 方式一: Docker一键启动

```bash
# 1. 克隆项目
cd xm-7142

# 2. 启动数据库和后端
docker-compose up -d

# 3. 查看服务状态
docker-compose ps
```

### 方式二: 本地启动

```bash
# 1. 进入项目目录
cd xm-7142

# 2. 确保PostgreSQL和Redis已启动
# 或使用Docker启动数据库:
docker-compose up -d postgres redis

# 3. 安装依赖
npm install

# 4. 启动后端服务 (端口: 18443)
npm run dev:backend

# 5. 新开终端，启动前端服务

# 客户Web端 (端口: 18445)
npm run dev:client

# 前台端 (端口: 18446)
npm run dev:reception

# 医生端 (端口: 18447)
npm run dev:doctor

# 大屏端 (端口: 18448)
npm run dev:dashboard

# 或一键启动所有服务
npm run dev
```

## 默认账号

系统启动时自动创建以下测试账号:

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 系统管理员 | admin | Admin123! | 系统管理 |
| 前台 | reception1 | Admin123! | 签到、队列管理 |
| 前台 | reception2 | Admin123! | 签到、队列管理 |
| 科室医生 | doctor1 | Admin123! | 指标录入 |
| 科室医生 | doctor2 | Admin123! | 指标录入 |
| 总检医生 | chief1 | Admin123! | 报告审核 |
| 客服 | customer1 | Admin123! | 随访管理 |

## 业务对象生命周期

系统完整表达了以下业务对象的生命周期:

### 预约订单 (Reservation / Order)
```
created → reserved → checked_in → in_examination → examination_completed → report_generated
                           ↓
                        cancelled
```

### 患者状态 (Patient)
```
waiting → in_examination → completed
                 ↓
            abnormal → locked (危机值预警)
```

### 检查项目 (OrderItem)
```
pending → in_progress → completed
                      ↓
                   abnormal
```

### 随访任务 (FollowUpTask)
```
pending → in_progress → completed
    ↓
scheduled (已预约随访时间)
```

## 审计追踪

所有修改操作均记录留痕供医疗审计:

- 操作类型: create / update / delete / login / logout
- 记录字段: 操作人、时间、IP地址、用户代理、旧值、新值
- 审计日志不可修改，确保数据完整性

## 离线数据同步

系统支持离线录入，网络恢复后自动同步:

1. 前端使用LocalStorage/IndexedDB缓存未同步数据
2. 网络恢复后调用幂等接口进行补偿
3. 同步状态跟踪: pending → synced / failed
4. 失败记录支持手动重试

## 修改端口配置

如需修改端口，请编辑 `.env` 文件:

```env
# 后端API服务端口
PORT_API=18443
# Socket.io实时通信端口
PORT_SOCKET=18444
# 客户Web端端口
PORT_CLIENT=18445
# 前台端端口
PORT_RECEPTION=18446
# 医生端端口
PORT_DOCTOR=18447
# 大屏显示端口
PORT_DASHBOARD=18448
```

**重要**: 所有端口配置通过 `@medical/config` 包统一管理，前端通过 `vite.config.ts` 引用，后端通过环境变量读取。**切勿在代码中硬编码端口**。

## API文档

启动后端服务后，可通过以下方式测试API:

```bash
# 健康检查
curl http://localhost:18443/health

# 获取配置
curl http://localhost:18443/api/config
```

主要API端点:

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/auth/login | POST | 登录 |
| /api/auth/me | GET | 获取当前用户 |
| /api/packages | GET | 获取套餐列表 |
| /api/reservations | POST | 创建预约 |
| /api/reservations/:id/check-in | POST | 签到 |
| /api/examinations/:id/submit | POST | 提交检查结果 |
| /api/reports/generate/:orderId | POST | 生成报告 |
| /api/notifications | GET | 获取通知 |
| /api/sync | POST | 离线数据同步 |
| /api/audit | GET | 审计日志 |

## 注意事项

1. **端口安全**: 本系统使用稀有端口 (18443-18448) 避免与常见服务冲突
2. **Mock服务隔离**: 真实API和Mock服务不会互相覆盖
3. **数据安全**: 生产环境请修改默认密码和JWT密钥
4. **审计日志**: 所有操作均有记录，请妥善保管审计数据
5. **离线同步**: 确保网络恢复后及时同步，避免数据丢失

## License

MIT License
