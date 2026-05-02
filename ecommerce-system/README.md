# 独立站电商系统

## 项目简介

这是一个基于Python FastAPI和Vue3的独立站电商系统，支持B2C模式多端业务，核心服务于消费者、运营、仓库、客服四大角色。

## 技术栈

- **后端**：Python 3.9+, FastAPI, MySQL, Redis
- **前端**：Vue 3, TypeScript, Vite
- **服务架构**：微服务架构，端口8000-8009

## 核心功能

### 1. 四大核心引擎
- **购物车引擎**：实时记录购物车数据，支持合并、优惠计算
- **优惠券引擎**：多类型优惠券规则校验与自动抵扣
- **支付回调引擎**：多支付渠道统一接入，异步回调处理
- **订单管理引擎**：全生命周期状态流转，可追溯管控

### 2. 核心业务流程
- **浏览商品**：多维度筛选、搜索、详情查看
- **加购结算**：购物车管理、优惠计算、地址管理
- **支付发货**：多支付方式、物流追踪、库存管理
- **售后复购**：退款、退货、换货、会员管理

### 3. 营销工具
- **秒杀活动**：定时秒杀、库存限制、防超卖
- **拼团活动**：多人拼团、价格优惠、成团管理
- **分销系统**：佣金设置、分销订单跟踪
- **优惠券**：满减、折扣、免运费等多种类型

## 服务架构

| 服务名称 | 端口 | 功能 |
|---------|------|------|
| API Gateway | 8000 | 统一入口，路由分发，鉴权 |
| 用户服务 | 8001 | 会员、积分、等级、行为记录 |
| 商品服务 | 8002 | 商品、分类、SKU、搜索、筛选 |
| 订单服务 | 8003 | 购物车、订单管理、结算 |
| 支付服务 | 8004 | 支付、退款、优惠券引擎 |
| 营销服务 | 8005 | 秒杀、拼团、分销 |
| 仓储服务 | 8006 | 库存、物流、退货逆向 |
| 通知服务 | 8007 | 邮件、短信、站内信 |
| 报表服务 | 8008 | 经营看板、数据导出 |
| 客服服务 | 8009 | 工单、售后、评价 |

## 项目结构

```
ecommerce-system/
├── services/              # 后端服务
│   ├── gateway/           # API网关 (8000)
│   ├── user-service/      # 用户服务 (8001)
│   ├── product-service/   # 商品服务 (8002)
│   ├── order-service/     # 订单服务 (8003)
│   ├── payment-service/   # 支付服务 (8004)
│   ├── marketing-service/ # 营销服务 (8005)
│   ├── warehouse-service/ # 仓储服务 (8006)
│   ├── notify-service/    # 通知服务 (8007)
│   ├── report-service/    # 报表服务 (8008)
│   └── cs-service/        # 客服服务 (8009)
├── admin/                 # 运营后台前端
├── config/                # 配置文件
├── utils/                 # 工具类
├── requirements.txt       # 依赖文件
├── start.sh               # 启动脚本
└── README.md              # 项目说明
```

## 快速开始

### 1. 环境准备

- Python 3.9+
- MySQL 8.0+
- Redis 7.0+

### 2. 数据库配置

创建数据库：
```sql
CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ecommerce'@'%' IDENTIFIED BY 'ECom2024!Db';
GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecommerce'@'%';
FLUSH PRIVILEGES;
```

### 3. 安装依赖

```bash
cd ecommerce-system
pip install -r requirements.txt
```

### 4. 启动服务

```bash
# 启动所有服务
./start.sh start

# 停止所有服务
./start.sh stop

# 重启所有服务
./start.sh restart

# 查看服务状态
./start.sh status
```

### 5. 前端启动

```bash
cd admin
npm install
npm run dev
```

## API文档

- API Gateway: http://localhost:8000/docs
- 用户服务: http://localhost:8001/docs
- 商品服务: http://localhost:8002/docs
- 订单服务: http://localhost:8003/docs
- 支付服务: http://localhost:8004/docs
- 营销服务: http://localhost:8005/docs
- 仓储服务: http://localhost:8006/docs

## 核心API

### 用户服务
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/user/me - 获取当前用户信息
- POST /api/user/points - 刷新积分

### 商品服务
- POST /api/categories - 创建分类
- GET /api/categories - 获取分类列表
- POST /api/products - 创建商品
- GET /api/products - 获取商品列表（支持筛选）
- GET /api/products/{id} - 获取商品详情

### 订单服务
- POST /api/cart/items - 添加商品到购物车
- GET /api/cart - 获取购物车
- POST /api/orders - 创建订单
- GET /api/orders - 获取订单列表

### 支付服务
- POST /api/payments - 创建支付
- POST /api/payments/callback/{payment_no} - 支付回调
- POST /api/coupons - 创建优惠券
- POST /api/coupons/apply - 应用优惠券

### 营销服务
- POST /api/seckill/activities - 创建秒杀活动
- POST /api/seckill/products - 添加秒杀商品
- POST /api/seckill/{activity_id}/buy - 秒杀购买
- POST /api/group-buy/activities - 创建拼团活动

### 仓储服务
- POST /api/warehouses - 创建仓库
- GET /api/warehouses - 获取仓库列表
- POST /api/inventory/adjust - 调整库存
- POST /api/shipments - 发货
- POST /api/returns - 申请退货

## 安全配置

- JWT token 认证
- 密码加密存储
- 接口权限控制
- 防SQL注入
- 防XSS攻击

## 部署建议

1. **开发环境**：本地启动所有服务
2. **测试环境**：Docker容器化部署
3. **生产环境**：Kubernetes集群部署，使用Ingress路由

## 监控与日志

- Prometheus + Grafana 监控
- ELK 日志收集
- 服务健康检查

## 联系方式

如有问题，请联系技术团队。
