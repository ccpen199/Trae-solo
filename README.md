# 社区服务中台系统

面向住宅小区的社区服务中台系统，支持物业方、业委会、居民三类角色。

## 技术架构

### 后端服务 (@community/backend)
- **框架**: NestJS 10.x
- **ORM**: Prisma 5.x
- **数据库**: PostgreSQL
- **认证**: JWT + Passport
- **任务调度**: NestJS Schedule

### 微信小程序 (@community/mini)
- **框架**: Taro 4.x (React 18)
- **语言**: TypeScript
- **样式**: CSS Modules + SCSS
- **状态管理**: Zustand

### Web管理后台 (@community/admin)
- **框架**: React 18 + TypeScript + Vite
- **UI组件**: Ant Design 5.x + Pro Components
- **图表**: ECharts 5.x
- **状态管理**: Zustand

## 核心功能

### 1. 智能门禁系统
- 支持蓝牙/NFC/二维码/人脸识别多种方式
- 远程授权访客（临时/一次性二维码）
- 通行日志审计与查询
- 设备在线状态监控

### 2. 物业服务工单
- 工单类型：报修、投诉、建议
- 完整工单闭环：提交 → 分配 → 处理 → 完成 → 评价
- 支持优先级设置、催办、转派
- 处理进度实时追踪

### 3. O2O生活服务
- 家政服务、快递收发、社区团购、在线商城
- 服务提供商入驻审核机制
- 智能分佣结算系统
- 订单全流程管理

### 4. 账户与权限管理
- 居民账户统一绑定房产信息
- 按楼栋/单元/房间分级权限控制
- 多角色体系：居民、物业员工、物业管理员、业委会成员、服务商、超级管理员

### 5. 物业KPI看板
- 工单响应时长、处理时长统计
- 完结率、满意度实时监控
- 趋势分析图表展示
- 物业人员绩效排名

### 6. 设备监控与告警
- 门禁设备在线状态实时监控
- 心跳异常检测与离线告警
- 多级别告警推送（信息/警告/错误/严重）

## 目录结构

```
may-89144/
├── packages/
│   ├── backend/          # 后端服务 (NestJS)
│   │   ├── src/
│   │   │   ├── access/          # 门禁模块
│   │   │   ├── auth/            # 认证模块
│   │   │   ├── community/       # 社区房产模块
│   │   │   ├── kpi/             # KPI看板模块
│   │   │   ├── monitor/         # 监控告警模块
│   │   │   ├── prisma/          # Prisma服务
│   │   │   ├── service/         # O2O服务模块
│   │   │   └── ticket/          # 工单模块
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # 数据库模型
│   │   │   └── seed.ts          # 数据种子
│   │   └── package.json
│   ├── mini/             # 微信小程序 (Taro)
│   │   └── src/
│   │       ├── pages/           # 页面（10个）
│   │       ├── components/      # 公共组件
│   │       ├── data/            # Mock数据
│   │       ├── store/           # 状态管理
│   │       └── types/           # 类型定义
│   └── admin/            # Web管理后台 (React)
│       └── src/
│           └── pages/           # 页面（15个）
├── package.json          # Monorepo根配置
├── .env.example          # 环境变量示例
└── README.md
```

## 快速开始

### 前置要求
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

### 安装依赖
```bash
# 在项目根目录执行
npm install
```

### 配置数据库
```bash
# 复制环境变量
cd packages/backend
cp .env.example .env
# 编辑 .env 配置数据库连接
```

### 初始化数据库
```bash
# 生成Prisma客户端
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate -- --name init

# 填充种子数据
npm run seed --workspace=@community/backend
```

### 启动服务

#### 方式一：分别启动（推荐开发用）
```bash
# 启动后端服务 (端口3000)
npm run dev:backend

# 启动管理后台 (端口5173)
npm run dev:admin

# 启动小程序 (微信开发者工具打开 packages/mini/dist)
npm run dev:mini
```

#### 方式二：全局启动
```bash
# 根目录
npm run dev:backend    # 终端1
npm run dev:admin      # 终端2
npm run dev:mini       # 终端3
```

### 测试账号

| 角色 | 手机号 | 密码 | 说明 |
|------|--------|------|------|
| 超级管理员 | 13800000001 | 123456 | 系统最高权限 |
| 物业管理员 | 13800000002 | 123456 | 物业后台管理 |
| 物业员工 | 13800000003 | 123456 | 工单处理人员 |
| 业委会主任 | 13800000004 | 123456 | 业委会管理 |
| 居民 | 13800000005 | 123456 | 小程序端用户 |
| 服务商 | 13800000006 | 123456 | O2O服务商 |

## API 文档

后端服务启动后访问：`http://localhost:3000/api`

主要API模块：
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取当前用户信息
- `GET /api/access/devices` - 门禁设备列表
- `POST /api/access/auth` - 授予门禁权限
- `POST /api/access/auth/verify` - 验证开门
- `GET /api/access/logs` - 通行日志
- `GET /api/tickets` - 工单列表
- `POST /api/tickets` - 创建工单
- `PUT /api/tickets/:id/status` - 更新工单状态
- `GET /api/kpi/overview` - KPI概览
- `GET /api/kpi/response-time` - 响应时长统计
- `GET /api/monitor/devices/status` - 设备状态监控
- `GET /api/monitor/alerts` - 告警列表

## 小程序页面列表

| 页面 | 路径 | 类型 | 说明 |
|------|------|------|------|
| 首页 | pages/home | TabBar | 小区概览、快捷功能、公告 |
| 服务 | pages/service | TabBar | O2O服务分类、服务列表 |
| 工单 | pages/ticket | TabBar | 我的工单列表、新建工单 |
| 我的 | pages/mine | TabBar | 个人中心、房产管理 |
| 门禁详情 | pages/access-detail | 二级 | 扫码开门、设备列表 |
| 工单详情 | pages/ticket-detail | 二级 | 工单信息、处理进度、评价 |
| 服务详情 | pages/service-detail | 二级 | 服务信息、下单 |
| 房产管理 | pages/house-manage | 二级 | 房产列表、绑定 |
| 通行日志 | pages/access-log | 二级 | 个人通行记录 |
| 新建工单 | pages/ticket-create | 二级 | 提交工单表单 |

## 管理后台页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | /login | 系统登录 |
| 数据概览 | /dashboard | 核心数据指标 |
| KPI看板 | /kpi | 物业KPI统计分析 |
| 门禁设备 | /access/devices | 门禁设备管理 |
| 通行日志 | /access/logs | 通行记录审计 |
| 工单列表 | /tickets | 工单管理 |
| 工单详情 | /tickets/:id | 工单处理 |
| 服务商管理 | /service/providers | 服务商入驻审核 |
| 服务商品 | /service/items | 服务商品管理 |
| 服务订单 | /service/orders | 订单管理 |
| 佣金结算 | /service/commissions | 分佣结算 |
| 小区列表 | /community/list | 小区管理 |
| 楼栋房产 | /community/buildings | 楼栋单元房产管理 |
| 用户管理 | /users | 业主/员工账户管理 |
| 设备监控 | /monitor/status | 设备在线状态监控 |
| 告警中心 | /monitor/alerts | 告警消息管理 |

## 数据模型

### 核心实体关系
```
Community (小区)
  ├── Building (楼栋)
  │   └── Unit (单元)
  │       └── House (房屋)
  │           └── UserHouse (用户房屋绑定)
  ├── AccessDevice (门禁设备)
  │   ├── AccessAuth (门禁授权)
  │   └── AccessLog (通行记录)
  └── Ticket (工单)
      ├── TicketComment (工单评论)
      ├── TicketLog (工单日志)
      └── TicketRating (工单评价)

User (用户)
  ├── UserCommunity (用户小区关联)
  └── UserHouse (用户房屋关联)

ServiceProvider (服务商)
  ├── ServiceItem (服务商品)
  └── ServiceOrder (服务订单)
      ├── ServiceOrderItem (订单项)
      ├── ServiceOrderRating (订单评价)
      └── CommissionSettlement (佣金结算)

Alert (告警)
```

## 开发规范

### Git 分支
- `main` - 主分支，生产环境
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - Bug修复分支

### 代码规范
- TypeScript 严格模式
- ESLint + Prettier
- 组件使用 PascalCase 命名
- 页面组件以 Page 结尾（如 HomePage）
- 所有接口返回统一格式

## License

MIT
