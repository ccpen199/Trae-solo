# 分销佣金系统

一个完整的社交电商分销平台系统，包含归因引擎、分润引擎、提现风控引擎和反作弊引擎。

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8472 | 稀有端口，避免与常见服务冲突 |
| 前端 Web | 9357 | 稀有端口，开发服务器 |
| PostgreSQL | 5432 | 数据库标准端口 |
| Redis | 6379 | 缓存标准端口 |

## 技术栈

### 后端
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT 认证

### 前端
- Vue 3 + TypeScript
- Element Plus UI
- Pinia 状态管理
- Vue Router

### 核心引擎
- **Attribution-Link**: 归因链路引擎，定位推荐人关系
- **Commission-Calculator**: 阶梯分润引擎，多级佣金计算
- **Cash-Out**: 提现风控引擎，提现审核与风控
- **Fraud-Detection**: 反作弊引擎，刷单行为检测

## 快速启动

### 前置条件
- Node.js >= 18
- Docker & Docker Compose
- npm 或 yarn

### 步骤 1: 启动数据库和缓存
```bash
# 进入项目根目录
cd d:\trae_projects\local_projects\8759

# 启动 PostgreSQL 和 Redis
docker-compose up -d
```

### 步骤 2: 配置后端
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 生成 Prisma 客户端
npm run prisma:generate

# 同步数据库结构
npm run prisma:push

# 导入种子数据（测试账号）
npm run prisma:seed

# 启动开发服务器
npm run dev
```

### 步骤 3: 配置前端
```bash
# 进入前端目录
cd ../frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 步骤 4: 访问系统
- 前端界面: http://localhost:9357
- 后端 API: http://localhost:8472/api/v1
- 健康检查: http://localhost:8472/api/v1/health

## 测试账号

| 角色 | 手机号 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | 13800138000 | 123456 | 系统管理员 |
| 财务 | 13800138001 | 123456 | 提现审核权限 |
| 运营 | 13800138002 | 123456 | 风控监控权限 |
| 分销员A | 13900139001 | 123456 | 推荐码: DISTA001 |
| 分销员B | 13900139002 | 123456 | 推荐码: DISTB001 |
| 普通用户 | 13700137001 | 123456 | 可申请成为分销员 |

## 业务流程

### 1. 用户申请分销
1. 用户注册登录
2. 点击"申请成为分销员"
3. 系统生成专属推荐码，状态设为"已激活"
4. 前端展示推广素材

### 2. 新用户下单
1. 新用户通过推荐码/分享链接注册
2. 创建订单时记录来源信息
3. 支付成功后，归因引擎定位推荐人
4. 生成冻结佣金单，状态"待结算"
5. 同步至分销员看板

### 3. 售后期满
1. 订单完成后经过售后期（默认7天）
2. 分润引擎按阶梯比例计算实发金额
3. 佣金从冻结状态转为已结算
4. 划拨至分销员虚拟账户
5. 发送通知

### 4. 发起提现
1. 分销员发起提现申请
2. 提现风控引擎执行身份核验和风险检查
3. 小额提现自动审核，大额需财务审核
4. 财务人员在前端审核
5. 审核通过后调用接口打款
6. 同步状态为"已到账"

### 5. 反作弊监控
1. 后端持续监控疑似刷单行为
2. 检测规则包括：IP聚集、设备聚集、快速下单等
3. 异常记录推送至运营前端
4. 支持自动执行分销权冻结与处罚
5. 运营人员可手动复核处理

## 数据校验与统计口径

### 数据校验
- 手机号格式校验（中国大陆手机号）
- 金额校验（最小1分，最大50000元）
- 推荐码格式校验（8位大写字母数字）
- 银行卡/支付宝账号格式校验

### 统计口径一致性
- **金额单位**: 全部使用"分"为单位存储，前端展示转换为"元"
- **时间时区**: 全部使用 UTC 时间存储，前端按用户时区展示
- **佣金计算**:
  - 冻结金额 = 订单金额 × 层级比例（四舍五入到分）
  - 实发金额 = 冻结金额（无扣减时）
- **账户余额**:
  - 总余额 = 可用余额 + 冻结余额
  - 累计收益 = 所有已结算佣金之和
  - 累计提现 = 所有已打款提现之和

### 高频主线流程
```
用户注册 → 申请分销 → 推广获客 → 新用户下单 → 支付成功
                                                    ↓
                                              归因引擎定位
                                                    ↓
                                              生成冻结佣金
                                                    ↓
                                              售后期结束
                                                    ↓
                                              分润引擎结算
                                                    ↓
                                              佣金到账
                                                    ↓
                                              发起提现 → 风控检查 → 审核 → 打款
```

### 低频异常处理
```
订单取消/退款 → 佣金取消（冻结状态可取消）
                        ↓
                  余额回滚
                        ↓
                  流水记录

疑似刷单 → 风控记录 → 运营复核 → 冻结/终止分销资格
                                          ↓
                                    余额不受影响
                                          ↓
                                    新佣金暂停
```

## 目录结构

```
8759/
├── backend/                    # 后端项目
│   ├── prisma/
│   │   ├── schema.prisma      # 数据库模型
│   │   └── seed.ts            # 种子数据
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── engines/           # 核心引擎
│   │   │   ├── attribution-link/    # 归因引擎
│   │   │   ├── commission-calculator/ # 分润引擎
│   │   │   ├── cash-out/      # 提现风控引擎
│   │   │   └── fraud-detection/ # 反作弊引擎
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务服务
│   │   └── index.ts           # 入口文件
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # 环境变量
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   │   ├── dashboard/     # 仪表盘
│   │   │   ├── orders/        # 订单管理
│   │   │   ├── commissions/   # 佣金明细
│   │   │   ├── withdraws/     # 提现记录
│   │   │   ├── materials/     # 推广素材
│   │   │   ├── finance/       # 财务审核
│   │   │   ├── operator/      # 运营监控
│   │   │   ├── profile/       # 个人中心
│   │   │   └── login/         # 登录注册
│   │   ├── stores/            # 状态管理
│   │   ├── router/            # 路由配置
│   │   ├── utils/             # 工具函数
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml         # Docker 环境
└── README.md
```

## 环境变量

### 后端 (.env)
```env
PORT=8472
DATABASE_URL="postgresql://dist_admin:DistPass2024@localhost:5432/dist_commission?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dist-commission-jwt-secret-key-2024-very-secure
JWT_EXPIRES_IN=7d
DISTRIBUTION_MAX_LEVEL=3
AFTER_SALE_DAYS=7
MIN_WITHDRAW_AMOUNT=100
MAX_WITHDRAW_AMOUNT=500000
```

## API 文档

### 认证接口
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/profile` - 获取用户信息
- `POST /api/v1/auth/apply-distributor` - 申请成为分销员

### 订单接口
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/orders` - 获取订单列表
- `GET /api/v1/orders/:id` - 获取订单详情
- `POST /api/v1/orders/:id/pay` - 确认支付
- `POST /api/v1/orders/:id/attribute` - 订单归因
- `POST /api/v1/orders/:id/deliver` - 确认收货
- `POST /api/v1/orders/:id/complete` - 完成售后期
- `POST /api/v1/orders/:id/cancel` - 取消订单

### 佣金接口
- `GET /api/v1/commissions/stats` - 获取佣金统计
- `GET /api/v1/commissions` - 获取佣金列表
- `GET /api/v1/commissions/transactions` - 获取交易流水
- `GET /api/v1/commissions/performance` - 获取业绩统计
- `GET /api/v1/reports/settlement` - 结算报表（财务权限）

### 提现接口
- `POST /api/v1/withdraws` - 发起提现
- `GET /api/v1/withdraws` - 获取提现记录
- `GET /api/v1/withdraws/pending` - 获取待审核提现（财务权限）
- `POST /api/v1/withdraws/:id/review` - 审核提现（财务权限）
- `POST /api/v1/withdraws/:id/pay` - 执行打款（财务权限）

## 注意事项

1. **端口冲突**: 后端使用 8472、前端使用 9357，均为稀有端口。如需修改，请同步修改：
   - 后端: `.env` 中的 `PORT`
   - 前端: `vite.config.ts` 中的 `server.port`

2. **数据库连接**: 确保 PostgreSQL 和 Redis 已启动，端口未被占用。

3. **生产环境**: 生产部署时请修改以下配置：
   - `JWT_SECRET` 使用强随机密钥
   - 数据库密码使用强密码
   - 启用 HTTPS
   - 配置 CORS 白名单
   - 调整限流策略

4. **种子数据**: 种子数据仅用于开发测试，生产环境请勿执行。

## 故障排查

### 后端无法启动
1. 检查端口 8472 是否被占用: `netstat -ano | findstr :8472`
2. 检查数据库连接: 确保 PostgreSQL 已启动
3. 检查环境变量: 确认 `.env` 文件配置正确

### 前端无法连接后端
1. 检查后端是否已启动
2. 检查代理配置: `vite.config.ts` 中的代理目标
3. 检查 CORS 配置: 后端是否允许跨域

### 数据库迁移失败
1. 检查数据库用户权限
2. 检查数据库连接字符串格式
3. 删除 `node_modules/.prisma` 后重新生成
