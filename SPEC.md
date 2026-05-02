# 跨境电商店铺管理系统 SPEC

## 1. 项目概述

### 1.1 项目名称
xm-7013 跨境电商店铺管理系统

### 1.2 项目类型
跨境电商SaaS模式PC端业务系统（响应式适配）

### 1.3 核心服务对象
- **运营**：店铺授权、商品上下架、数据分析、经营决策
- **采购**：采购成本管理、库存预警响应
- **仓库**：订单发货、打包、物流交接
- **客服**：售后处理、退款退货、纠纷管理

### 1.4 核心业务流程
选品上架 → 订单同步 → 仓库发货 → 客服售后 → 利润核算

### 1.5 四大核心引擎
1. **多店铺授权引擎**：支持多平台店铺授权和令牌管理
2. **SKU映射引擎**：统一SKU管理，一键发布至多平台
3. **订单同步引擎**：自动拉取、审核、合并订单
4. **利润核算引擎**：自动归集成本，生成精准利润报表

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 | 说明 |
|-----|------|------|------|
| 前端框架 | React | 18.x | 组件化开发 |
| 前端语言 | TypeScript | 5.x | 类型安全 |
| 前端UI | Ant Design | 5.x | 企业级UI组件 |
| 前端路由 | React Router | 6.x | SPA路由管理 |
| 前端状态 | Redux Toolkit | 1.9.x | 全局状态管理 |
| 前端图表 | ECharts | 5.x | 数据可视化 |
| 后端框架 | Express | 4.x | 轻量级Web框架 |
| 后端语言 | Node.js | 18.x | JavaScript运行时 |
| 数据库 | SQLite | 3.x | 轻量级SQL数据库（避免MongoDB依赖） |
| ORM | Sequelize | 6.x | Node.js ORM框架 |
| 认证 | JWT | - | 无状态身份认证 |
| 实时通信 | Socket.io | 4.x | WebSocket通信 |
| 任务调度 | node-schedule | 2.x | 定时任务 |

### 2.2 端口配置（避免冲突）
- **前端开发服务器**: 3001
- **后端API服务器**: 5001
- **Socket.io服务器**: 5002
- **数据库**: SQLite文件存储（/backend/data/ecommerce.db）

### 2.3 目录结构
```
xm-7013/
├── backend/
│   ├── server.js                 # 后端入口
│   ├── package.json
│   ├── config/
│   │   └── database.js           # 数据库配置
│   ├── models/                   # 数据模型
│   │   ├── User.js
│   │   ├── Shop.js
│   │   ├── Product.js
│   │   ├── SKU.js
│   │   ├── Order.js
│   │   ├── Shipment.js
│   │   ├── AfterSale.js
│   │   ├── Cost.js
│   │   ├── Alert.js
│   │   └── Log.js
│   ├── routes/                   # 路由
│   │   ├── auth.js
│   │   ├── shops.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── warehouses.js
│   │   ├── customers.js
│   │   └── analytics.js
│   ├── engines/                  # 核心引擎
│   │   ├── AuthEngine.js         # 店铺授权引擎
│   │   ├── SKUEngine.js          # SKU映射引擎
│   │   ├── OrderSyncEngine.js    # 订单同步引擎
│   │   └── ProfitEngine.js       # 利润核算引擎
│   ├── services/                 # 业务服务
│   ├── middleware/                # 中间件
│   ├── schedulers/                # 定时任务
│   ├── data/                      # SQLite数据文件
│   └── tests/                     # 测试用例
│       ├── unit/
│       └── integration/
├── frontend/
│   ├── src/
│   │   ├── pages/                # 页面组件
│   │   ├── components/           # 公共组件
│   │   ├── store/                # Redux store
│   │   ├── services/             # API服务
│   │   ├── hooks/                # 自定义hooks
│   │   └── utils/                # 工具函数
│   └── vite.config.ts
└── SPEC.md
```

## 3. 数据库设计

### 3.1 数据模型

#### 3.1.1 用户表 (users)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| username | VARCHAR(50) | 用户名（唯一） |
| password | VARCHAR(255) | 密码（bcrypt加密） |
| role | ENUM | operation/purchase/warehouse/customer_service |
| name | VARCHAR(100) | 真实姓名 |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(20) | 电话 |
| status | ENUM | active/inactive |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.2 店铺表 (shops)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| name | VARCHAR(100) | 店铺名称 |
| platform | ENUM | amazon/ebay/shopify/tiktok |
| status | ENUM | active/inactive/pending |
| auth_token | TEXT | 授权令牌（加密存储） |
| refresh_token | TEXT | 刷新令牌 |
| token_expires_at | DATETIME | 令牌过期时间 |
| shop_config | JSON | 店铺配置信息 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.3 商品表 (products)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| name | VARCHAR(200) | 商品名称 |
| description | TEXT | 商品描述 |
| category | VARCHAR(100) | 商品分类 |
| brand | VARCHAR(100) | 品牌 |
| images | JSON | 商品图片URL数组 |
| attributes | JSON | 商品属性（颜色、尺寸等） |
| status | ENUM | active/inactive/draft |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.4 SKU表 (skus)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| product_id | INTEGER | 关联商品ID |
| sku_code | VARCHAR(50) | SKU编码（唯一） |
| attributes | JSON | 属性（颜色、尺寸等） |
| price | DECIMAL(10,2) | 销售价格 |
| cost | DECIMAL(10,2) | 采购成本 |
| stock | INTEGER | 当前库存 |
| min_stock | INTEGER | 最小库存预警值 |
| platform_skus | JSON | 各平台SKU映射 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.5 订单表 (orders)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| shop_id | INTEGER | 关联店铺ID |
| platform_order_id | VARCHAR(100) | 平台订单号（唯一） |
| platform | ENUM | 订单来源平台 |
| customer_info | JSON | 客户信息 |
| items | JSON | 订单商品明细 |
| total_amount | DECIMAL(10,2) | 订单总金额 |
| currency | VARCHAR(10) | 货币类型 |
| status | ENUM | pending/confirmed/processing/shipped/completed/cancelled |
| payment_status | ENUM | unpaid/paid/refunded |
| shipping_status | ENUM | unshipped/shipped |
| sync_status | ENUM | synced/pending/error |
| merge_order_id | INTEGER | 合并订单ID |
| processing_chain | JSON | 处理链路记录 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| platform_created_at | DATETIME | 平台订单创建时间 |

#### 3.1.6 物流表 (shipments)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| order_id | INTEGER | 关联订单ID |
| tracking_number | VARCHAR(100) | 物流单号 |
| carrier | VARCHAR(50) | 快递公司 |
| status | ENUM | pending/picked/upgraded/in_transit/delivered/exception |
| shipping_address | JSON | 收货地址 |
| estimated_delivery | DATETIME | 预计送达时间 |
| actual_delivery | DATETIME | 实际送达时间 |
| package_info | JSON | 包裹信息（重量、尺寸等） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.7 售后表 (after_sales)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| order_id | INTEGER | 关联订单ID |
| type | ENUM | refund/return/dispute |
| reason | VARCHAR(200) | 售后原因 |
| description | TEXT | 详细描述 |
| status | ENUM | pending/processing/completed/rejected |
| amount | DECIMAL(10,2) | 退款/赔偿金额 |
| images | JSON | 凭证图片 |
| platform_after_sale_id | VARCHAR(100) | 平台售后单号 |
| processing_chain | JSON | 处理链路记录 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.8 成本表 (costs)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| type | ENUM | purchase/shipping/platform_fee/ad/other |
| amount | DECIMAL(10,2) | 金额 |
| currency | VARCHAR(10) | 货币类型 |
| related_type | ENUM | order/product/sku |
| related_id | INTEGER | 关联ID |
| description | VARCHAR(200) | 成本说明 |
| cost_date | DATE | 成本发生日期 |
| created_at | DATETIME | 创建时间 |

#### 3.1.9 预警表 (alerts)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| type | ENUM | inventory/shipping/order/system |
| message | TEXT | 预警消息 |
| level | ENUM | info/warning/error |
| status | ENUM | pending/processing/resolved |
| related_type | ENUM | order/product/sku |
| related_id | INTEGER | 关联ID |
| assigned_to | INTEGER | 指派人ID |
| resolved_at | DATETIME | 解决时间 |
| created_at | DATETIME | 创建时间 |

#### 3.1.10 操作日志表 (logs)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键自增 |
| type | ENUM | auth/operation/sync/error |
| user_id | INTEGER | 用户ID |
| action | VARCHAR(100) | 操作类型 |
| target | VARCHAR(50) | 操作对象类型 |
| target_id | INTEGER | 操作对象ID |
| message | TEXT | 日志消息 |
| details | JSON | 详细信息 |
| ip_address | VARCHAR(50) | IP地址 |
| created_at | DATETIME | 创建时间 |

## 4. 核心引擎设计

### 4.1 多店铺授权引擎 (AuthEngine)

#### 功能职责
- 管理多平台店铺授权信息
- 自动刷新即将过期的授权令牌
- 统一存储和加密管理API凭证

#### 核心方法
```javascript
class AuthEngine {
  // 初始化平台授权
  async authorize(platform, authCode) {}

  // 刷新授权令牌
  async refreshToken(shopId) {}

  // 验证授权状态
  async validateAuth(shopId) {}

  // 撤销授权
  async revokeAuth(shopId) {}

  // 获取有效的授权令牌
  async getValidToken(shopId) {}
}
```

#### 支持平台
- Amazon Seller Central
- eBay API
- Shopify Admin API
- TikTok Shop API

### 4.2 SKU映射引擎 (SKUEngine)

#### 功能职责
- 统一管理系统内SKU编码
- 维护SKU与各平台SKU的映射关系
- 支持一键发布商品至多个平台

#### 核心方法
```javascript
class SKUEngine {
  // 生成唯一SKU编码
  generateSKUCode(productId, attributes) {}

  // 映射平台SKU
  async mapPlatformSKU(skuId, platform, platformSKU) {}

  // 批量发布至多平台
  async publishToPlatforms(skuId, platforms) {}

  // 同步平台SKU信息
  async syncPlatformSKU(skuId, platform) {}

  // 统一库存更新
  async updateStock(skuId, delta, reason) {}
}
```

### 4.3 订单同步引擎 (OrderSyncEngine)

#### 功能职责
- 定时从各平台拉取订单
- 订单数据清洗和标准化
- 订单自动审核、合并
- 订单状态同步回写

#### 核心方法
```javascript
class OrderSyncEngine {
  // 定时拉取订单
  async syncOrders(shopId) {}

  // 处理新订单
  async processNewOrder(orderData) {}

  // 订单自动审核
  async autoReview(orderId) {}

  // 订单合并
  async mergeOrders(orderIds) {}

  // 状态回写平台
  async writeBackStatus(orderId) {}

  // 检测异常订单
  async detectAnomalies(orderId) {}
}
```

#### 订单状态流转
```
pending → confirmed → processing → shipped → completed
   ↓         ↓           ↓
 cancelled  cancelled   cancelled
```

### 4.4 利润核算引擎 (ProfitEngine)

#### 功能职责
- 自动归集采购成本
- 计算物流费用
- 统计平台费用
- 计算广告成本
- 生成精准利润报表

#### 核心方法
```javascript
class ProfitEngine {
  // 归集订单成本
  async aggregateOrderCosts(orderId) {}

  // 计算单个订单利润
  async calculateOrderProfit(orderId) {}

  // 生成利润报表
  async generateProfitReport(startDate, endDate, groupBy) {}

  // 计算SKU利润
  async calculateSKUProfit(skuId, startDate, endDate) {}

  // 计算店铺利润
  async calculateShopProfit(shopId, startDate, endDate) {}
}
```

#### 利润计算公式
```
利润 = 销售收入 - 采购成本 - 物流费用 - 平台佣金 - 广告费用 - 其他费用
利润率 = 利润 / 销售收入 × 100%
```

## 5. API设计

### 5.1 认证相关 (/api/auth)
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出
- GET /api/auth/profile - 获取用户信息

### 5.2 店铺管理 (/api/shops)
- GET /api/shops - 获取店铺列表
- POST /api/shops - 创建店铺
- GET /api/shops/:id - 获取店铺详情
- PUT /api/shops/:id - 更新店铺
- DELETE /api/shops/:id - 删除店铺
- POST /api/shops/:id/authorize - 授权店铺
- POST /api/shops/:id/sync - 同步店铺数据

### 5.3 商品管理 (/api/products)
- GET /api/products - 获取商品列表
- POST /api/products - 创建商品
- GET /api/products/:id - 获取商品详情
- PUT /api/products/:id - 更新商品
- DELETE /api/products/:id - 删除商品
- POST /api/products/:id/publish - 发布商品至平台

### 5.4 SKU管理 (/api/skus)
- GET /api/skus - 获取SKU列表
- POST /api/skus - 创建SKU
- GET /api/skus/:id - 获取SKU详情
- PUT /api/skus/:id - 更新SKU
- DELETE /api/skus/:id - 删除SKU
- PUT /api/skus/:id/stock - 更新库存
- POST /api/skus/batch-update-stock - 批量更新库存

### 5.5 订单管理 (/api/orders)
- GET /api/orders - 获取订单列表
- GET /api/orders/:id - 获取订单详情
- PUT /api/orders/:id/status - 更新订单状态
- POST /api/orders/:id/confirm - 确认订单
- POST /api/orders/:id/cancel - 取消订单
- POST /api/orders/merge - 合并订单
- POST /api/orders/sync - 同步订单
- GET /api/orders/:id/processing-chain - 获取处理链路

### 5.6 仓库管理 (/api/warehouses)
- GET /api/warehouses/pending - 获取待发货订单
- POST /api/warehouses/:orderId/ship - 发货处理
- PUT /api/warehouses/:shipmentId/tracking - 更新物流信息
- GET /api/warehouses/shipments - 获取物流列表

### 5.7 客服管理 (/api/customers)
- GET /api/customers/after-sales - 获取售后列表
- POST /api/customers/after-sales - 创建售后记录
- PUT /api/customers/after-sales/:id - 更新售后状态
- GET /api/customers/after-sales/:id - 获取售后详情
- GET /api/customers/after-sales/:id/processing-chain - 获取处理链路

### 5.8 数据分析 (/api/analytics)
- GET /api/analytics/sales - 销量分析
- GET /api/analytics/profit - 利润分析
- GET /api/analytics/inventory - 库存分析
- GET /api/analytics/after-sales - 售后分析
- GET /api/analytics/dashboard - 仪表板数据

### 5.9 预警管理 (/api/alerts)
- GET /api/alerts - 获取预警列表
- PUT /api/alerts/:id - 更新预警状态
- POST /api/alerts/:id/resolve - 解决预警

## 6. 前端页面设计

### 6.1 登录页面 (/login)
- 用户名密码登录
- 角色显示
- 记住登录状态

### 6.2 仪表板 (/dashboard)
- 今日概览（订单量、销售额、待发货、售后单）
- 预警信息推送
- 快捷操作入口
- 销量趋势图
- 利润趋势图

### 6.3 店铺管理页面 (/shops)
- 店铺列表（支持按平台筛选）
- 店铺授权状态
- 新增店铺
- 店铺数据同步

### 6.4 商品管理页面 (/products)
- 商品列表（支持按分类、状态筛选）
- 商品信息编辑
- SKU管理
- 一键发布至多平台

### 6.5 订单管理页面 (/orders)
- 订单列表（支持按状态、平台、时间筛选）
- 订单详情查看
- 订单审核/取消
- 订单合并
- 处理链路追溯

### 6.6 仓库工作台 (/warehouse)
- 待发货订单列表
- 发货操作
- 批量发货
- 物流信息录入
- 发货记录查询

### 6.7 客服工作台 (/customer-service)
- 待处理售后列表
- 售后详情查看
- 退款/退货/纠纷处理
- 处理链路记录
- 批量处理

### 6.8 数据分析页面 (/analytics)
- 销量分析（按日/周/月/季/年）
- 利润分析（按SKU/店铺/平台）
- 库存分析（预警、周转）
- 售后分析（原因分布、趋势）

### 6.9 预警中心 (/alerts)
- 预警列表（按类型、级别筛选）
- 预警详情
- 预警处理
- 历史预警查询

## 7. 权限设计

### 7.1 角色权限矩阵

| 功能 | 运营 | 采购 | 仓库 | 客服 |
|-----|-----|-----|-----|-----|
| 店铺授权 | ✓ | - | - | - |
| 商品上下架 | ✓ | - | - | - |
| 订单查看 | ✓ | ✓ | ✓ | ✓ |
| 订单审核 | ✓ | - | - | - |
| 订单合并 | ✓ | - | - | - |
| 发货处理 | - | - | ✓ | - |
| 售后处理 | - | - | - | ✓ |
| 利润报表 | ✓ | - | - | - |
| 数据分析 | ✓ | - | - | - |
| 预警处理 | ✓ | ✓ | ✓ | ✓ |

## 8. 异常处理设计

### 8.1 异常类型
- **异常订单**：金额异常、地址异常、商品异常
- **延迟发货**：超过承诺发货时间未发货
- **库存不足**：SKU库存低于最小库存预警值
- **授权失效**：店铺授权令牌过期
- **同步失败**：订单/商品同步失败

### 8.2 预警级别
- **info**：信息提醒
- **warning**：需要关注
- **error**：需要立即处理

### 8.3 处理链路
每条关键记录都保留完整的处理链路记录，包括：
- 操作时间
- 操作人
- 操作类型
- 操作前状态
- 操作后状态
- 备注信息

## 9. 测试设计

### 9.1 单元测试
- 各引擎核心方法测试
- 各模型CRUD测试
- 工具函数测试

### 9.2 集成测试
- 用户登录流程测试
- 店铺授权流程测试
- 商品发布流程测试
- 订单同步流程测试
- 发货流程测试
- 售后流程测试
- 利润核算流程测试

### 9.3 端到端测试
- 完整业务流程测试（选品上架 → 订单同步 → 仓库发货 → 客服售后 → 利润核算）

## 10. 验收标准

### 10.1 功能验收
- [ ] 用户可以登录系统并根据角色显示不同菜单
- [ ] 运营可以完成多平台店铺授权
- [ ] 运营可以维护商品和SKU信息
- [ ] 运营可以一键发布商品至多平台
- [ ] 系统可以自动同步各平台订单
- [ ] 仓库可以处理订单发货
- [ ] 客服可以处理售后（退款、退货、纠纷）
- [ ] 系统可以自动计算利润并生成报表
- [ ] 系统可以自动检测异常并预警
- [ ] 所有关键操作都有处理链路记录

### 10.2 技术验收
- [ ] 前端运行在3001端口
- [ ] 后端运行在5001端口
- [ ] 数据库使用SQLite，无需额外安装
- [ ] 所有API响应时间<500ms
- [ ] 单元测试覆盖核心引擎方法
- [ ] 集成测试覆盖核心业务流程

### 10.3 业务验收
- [ ] 业务流程完整闭环
- [ ] 数据一致性得到保证
- [ ] 异常处理机制完善
- [ ] 可追溯性满足要求