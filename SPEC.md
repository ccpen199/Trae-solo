# 线下门店 POS 系统 - 完整规格文档

## 1. 项目概述

### 1.1 项目名称
- **项目名称**: RetailPOS - 线下零售门店管理系统
- **项目类型**: 全栈业务应用（Spring Boot + Vue.js + PostgreSQL）
- **核心定位**: 支撑多人协作、规则裁决、凭证留存和追溯查询的业务级POS系统

### 1.2 目标用户
| 角色 | 职能描述 | 核心需求 |
|------|---------|---------|
| 店员 | 扫码收银、操作退款 | 快速收银、打印小票、折扣计算 |
| 店长 | 门店管理、营收分析 | 实时营收、库存预警、人员管理 |
| 会员 | 查询积分、余额消费记录 | 积分兑换、储值使用、消费明细 |
| 财务 | 账务核对、报表导出 | 日结对账、流水查询、财务报表 |

### 1.3 核心业务流程
```
[扫码商品] → [会员识别] → [优惠结算] → [库存扣减] → [收款打印] → [日结报表]
     ↓           ↓           ↓           ↓           ↓           ↓
  商品查询    积分抵扣     折扣规则    库存同步    小票凭证    财务核算
```

## 2. 系统架构

### 2.1 技术栈
- **后端**: Spring Boot 2.7.x + MyBatis-Plus + PostgreSQL 14
- **前端**: Vue 3 + Element Plus + Vite
- **缓存**: Redis 7.x（会话缓存、规则缓存）
- **消息队列**: N/A（首版采用同步处理）
- **日志**: Logback + ELK-ready JSON格式

### 2.2 端口配置策略
| 服务 | 容器端口 | 本地开发端口 | 配置文件位置 |
|------|---------|-------------|-------------|
| 后端 API | 8080 | 8888 | config/server.yml |
| 前端 PC | 80 | 3000 | frontend/.env |
| 前端移动端 | 81 | 4000 | frontend/.env |
| PostgreSQL | 5432 | 55432 | docker-compose.yml |
| Redis | 6379 | 16379 | redis/conf/redis.conf |

### 2.3 Docker 端口映射配置
```yaml
# docker-compose.yml 中的端口映射段
ports:
  - "8888:8080"   # 后端API: 外部端口:内部端口
  - "3000:80"     # PC端前端
  - "4000:81"     # 移动端前端
  - "55432:5432"  # PostgreSQL
  - "16379:6379"  # Redis
```

## 3. 数据库设计

### 3.1 核心业务表

#### 3.1.1 门店与用户表
```sql
-- 门店表
CREATE TABLE store (
    id BIGSERIAL PRIMARY KEY,
    store_code VARCHAR(20) UNIQUE NOT NULL,  -- 门店编码
    store_name VARCHAR(100) NOT NULL,         -- 门店名称
    address VARCHAR(255),                     -- 地址
    contact_phone VARCHAR(20),                -- 联系电话
    status VARCHAR(20) DEFAULT 'ACTIVE',       -- ACTIVE/INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表（店员、店长、财务共用）
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,                -- CLERK/MANAGER/FINANCE
    store_id BIGINT REFERENCES store(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会员表
CREATE TABLE member (
    id BIGSERIAL PRIMARY KEY,
    member_code VARCHAR(20) UNIQUE NOT NULL,  -- 会员码
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50),
    gender VARCHAR(10),
    birthday DATE,
    points_balance INT DEFAULT 0,             -- 积分余额
    stored_balance DECIMAL(12,2) DEFAULT 0,  -- 储值余额
    level VARCHAR(20) DEFAULT 'NORMAL',       -- NORMAL/SILVER/GOLD/DIAMOND
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.2 商品与库存表
```sql
-- 商品表
CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,      -- 商品条码
    product_name VARCHAR(200) NOT NULL,
    category_id BIGINT,
    standard_price DECIMAL(12,2) NOT NULL,   -- 标准售价
    cost_price DECIMAL(12,2),                 -- 成本价
    unit VARCHAR(20),                         -- 计量单位
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES store(id),
    product_id BIGINT REFERENCES product(id),
    quantity INT NOT NULL DEFAULT 0,          -- 当前库存
    low_stock_threshold INT DEFAULT 10,       -- 低库存阈值
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, product_id)
);

-- 会员价格表
CREATE TABLE member_price (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES product(id),
    member_level VARCHAR(20),                 -- 会员等级
    member_price DECIMAL(12,2) NOT NULL,
    UNIQUE(product_id, member_level)
);
```

#### 3.1.3 交易与凭证表
```sql
-- 交易主表
CREATE TABLE transaction (
    id BIGSERIAL PRIMARY KEY,
    transaction_no VARCHAR(50) UNIQUE NOT NULL,  -- 交易流水号
    store_id BIGINT REFERENCES store(id),
    cashier_id BIGINT REFERENCES users(id),
    member_id BIGINT REFERENCES member(id),     -- 可为空
    total_amount DECIMAL(12,2) NOT NULL,        -- 订单总金额
    discount_amount DECIMAL(12,2) DEFAULT 0,   -- 折扣金额
    actual_amount DECIMAL(12,2) NOT NULL,       -- 实收金额
    payment_method VARCHAR(20) NOT NULL,        -- CASH/CARD/WECHAT/ALIPAY
    points_used INT DEFAULT 0,                  -- 使用积分
    points_discount DECIMAL(12,2) DEFAULT 0,    -- 积分抵扣
    coupon_id BIGINT,                           -- 优惠券ID
    coupon_discount DECIMAL(12,2) DEFAULT 0,    -- 优惠券抵扣
    status VARCHAR(20) DEFAULT 'COMPLETED',     -- COMPLETED/REFUNDED/VOIDED
    transaction_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 交易明细表
CREATE TABLE transaction_item (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES transaction(id),
    product_id BIGINT REFERENCES product(id),
    product_name VARCHAR(200) NOT NULL,
    barcode VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_rate DECIMAL(5,2),                 -- 折扣率
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 退款记录表
CREATE TABLE refund_record (
    id BIGSERIAL PRIMARY KEY,
    original_transaction_id BIGINT REFERENCES transaction(id),
    refund_no VARCHAR(50) UNIQUE NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_reason VARCHAR(255),
    refund_method VARCHAR(20) NOT NULL,
    operator_id BIGINT REFERENCES users(id),
    refund_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.4 优惠券与促销表
```sql
-- 优惠券表
CREATE TABLE coupon (
    id BIGSERIAL PRIMARY KEY,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_name VARCHAR(100) NOT NULL,
    coupon_type VARCHAR(20) NOT NULL,           -- CASH/VOUCHER/DISCOUNT
    discount_value DECIMAL(12,2) NOT NULL,      -- 折扣值/金额
    min_consumption DECIMAL(12,2) DEFAULT 0,    -- 最低消费
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    total_quantity INT NOT NULL,
    remain_quantity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会员优惠券表
CREATE TABLE member_coupon (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT REFERENCES member(id),
    coupon_id BIGINT REFERENCES coupon(id),
    status VARCHAR(20) DEFAULT 'UNUSED',        -- UNUSED/USED/EXPIRED
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    used_transaction_id BIGINT
);

-- 促销规则表
CREATE TABLE promotion_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL,             -- FULL_CUT/DISCOUNT/FLASH
    condition_config JSONB NOT NULL,            -- 条件配置
    action_config JSONB NOT NULL,               -- 动作配置
    priority INT DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.5 日结与账务表
```sql
-- 日结报表表
CREATE TABLE daily_settlement (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES store(id),
    settlement_date DATE NOT NULL,
    total_sales DECIMAL(12,2) NOT NULL,         -- 总销售额
    total_refund DECIMAL(12,2) DEFAULT 0,       -- 总退款
    total_discount DECIMAL(12,2) DEFAULT 0,    -- 总折扣
    cash_sales DECIMAL(12,2) DEFAULT 0,         -- 现金销售
    card_sales DECIMAL(12,2) DEFAULT 0,         -- 卡支付
    wechat_sales DECIMAL(12,2) DEFAULT 0,       -- 微信支付
    alipay_sales DECIMAL(12,2) DEFAULT 0,       -- 支付宝
    points_redeemed INT DEFAULT 0,              -- 积分使用
    points_earned INT DEFAULT 0,                -- 积分获得
    coupons_used INT DEFAULT 0,                 -- 优惠券使用
    transaction_count INT DEFAULT 0,            -- 交易笔数
    refund_count INT DEFAULT 0,                 -- 退款笔数
    operator_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表（追溯用）
CREATE TABLE operation_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    operation_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    detail JSONB,
    ip_address VARCHAR(50),
    operation_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. 核心引擎设计

### 4.1 收银引擎 (CashierEngine)
```java
/**
 * 收银引擎职责：
 * 1. 扫码商品识别与价格获取
 * 2. 实时库存校验
 * 3. 多支付方式收款处理
 * 4. 交易流水生成与状态管理
 * 5. 小票数据准备
 */
@Service
public class CashierEngine {
    // 核心方法
    public ScanResult scanBarcode(String barcode, Long storeId);
    public OrderDTO createOrder(Long storeId, Long cashierId, List<OrderItem> items);
    public PaymentResult processPayment(OrderDTO order, PaymentDTO payment);
    public ReceiptData generateReceipt(Long transactionId);
    public RefundResult processRefund(Long transactionId, RefundDTO refundDTO);
}
```

### 4.2 折扣规则引擎 (DiscountEngine)
```java
/**
 * 折扣规则引擎职责：
 * 1. 促销规则加载与缓存
 * 2. 满减活动判定
 * 3. 折扣率计算
 * 4. 组合优惠计算
 * 5. 规则冲突解决（优先级）
 */
@Service
public class DiscountEngine {
    // 核心方法
    public DiscountResult calculateDiscount(OrderDTO order, List<PromotionRule> rules);
    public boolean isFullCutApplicable(OrderDTO order, FullCutRule rule);
    public BigDecimal applyFlashDiscount(OrderDTO order, FlashRule rule);
    public List<AppliedRule> getAppliedRules(OrderDTO order);
}
```

### 4.3 会员积分引擎 (MemberPointsEngine)
```java
/**
 * 会员积分引擎职责：
 * 1. 会员识别（手机号/会员码）
 * 2. 积分计算与抵扣
 * 3. 储值扣减
 * 4. 优惠券发放与使用
 * 5. 会员等级权益应用
 */
@Service
public class MemberPointsEngine {
    // 核心方法
    public MemberDTO identifyMember(String identifier);  // 手机号或会员码
    public PointsResult calculatePoints(Long memberId, BigDecimal amount);
    public PointsRedeemResult redeemPoints(Long memberId, Integer points);
    public StoredBalanceResult useStoredBalance(Long memberId, BigDecimal amount);
    public CouponResult issueCoupon(Long memberId, String couponCode);
}
```

### 4.4 日结算引擎 (DailySettlementEngine)
```java
/**
 * 日结算引擎职责：
 * 1. 日结数据汇总计算
 * 2. 交易笔数/金额统计
 * 3. 支付方式分类统计
 * 4. 积分/优惠券使用统计
 * 5. 日结报表生成
 */
@Service
public class DailySettlementEngine {
    // 核心方法
    public DailySettlementDTO generateDailySettlement(Long storeId, LocalDate date);
    public List<TransactionFlowDTO> getTransactionFlow(Long storeId, LocalDate date);
    public Map<String, Object> getSettlementSummary(Long storeId, LocalDate date);
}
```

## 5. API 设计

### 5.1 收银相关 API
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/pos/scan | 扫码商品 |
| POST | /api/pos/order/create | 创建订单 |
| POST | /api/pos/order/pay | 支付订单 |
| POST | /api/pos/order/refund | 退款 |
| POST | /api/pos/receipt/print | 重打印小票 |
| GET | /api/pos/receipt/{transactionId} | 获取小票数据 |

### 5.2 会员相关 API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/member/identify | 会员识别 |
| GET | /api/member/{id}/points | 查询积分 |
| GET | /api/member/{id}/balance | 查询储值余额 |
| GET | /api/member/{id}/coupons | 查询优惠券 |
| GET | /api/member/{id}/transactions | 消费记录 |
| POST | /api/member/points/redeem | 积分兑换 |

### 5.3 店长管理 API
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/manager/dashboard | 经营看板 |
| GET | /api/manager/realtime-sales | 实时销售 |
| GET | /api/manager/inventory-alert | 库存预警 |
| GET | /api/manager/product-sales | 商品销量 |

### 5.4 日结与财务 API
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/settlement/daily | 生成日结 |
| GET | /api/settlement/{date} | 查询日结报表 |
| GET | /api/finance/flow | 交易流水 |
| GET | /api/finance/export | 导出报表 |

## 6. 前端页面结构

### 6.1 PC 端（收银台）
```
/pos
├── /cashier              # 收银主界面
│   ├── ProductGrid       # 商品网格
│   ├── CartPanel         # 购物车面板
│   ├── MemberPanel       # 会员识别
│   ├── PaymentDialog     # 支付弹窗
│   └── ReceiptPreview    # 小票预览
├── /manager              # 店长后台
│   ├── Dashboard         # 经营看板
│   ├── Inventory         # 库存管理
│   └── Reports           # 报表中心
└── /finance              # 财务模块
    ├── DailySettlement   # 日结管理
    └── TransactionFlow   # 交易流水
```

### 6.2 移动端（会员/店长）
```
/mobile
├── /member               # 会员端
│   ├── Home             # 首页
│   ├── Points           # 积分中心
│   ├── Balance          # 储值查询
│   ├── Coupons          # 优惠券
│   └── Records          # 消费记录
└── /store-manager       # 店长端
    ├── Dashboard        # 门店看板
    └── Alerts           # 预警通知
```

## 7. 设备对接

### 7.1 扫码枪对接
- **协议**: HID 键盘输入（默认）
- **接口**: 监听键盘输入，识别条码前缀后触发查询
- **配置文件**: `config/device.yml`

### 7.2 小票打印机对接
- **类型**: ESC/POS 指令打印机
- **接口**: `/api/pos/receipt/print` 调用后端打印服务
- **后端服务**: `PrintService` 生成 ESC/POS 指令
- **配置文件**: `config/printer.yml`

## 8. Docker 部署配置

### 8.1 docker-compose.yml 结构
```yaml
version: '3.8'
services:
  pos-backend:
    build: ./backend
    ports:
      - "${BACKEND_PORT:-8888}:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - DB_PORT=5432
      - DB_HOST=pos-db
    depends_on:
      - pos-db
      - pos-redis

  pos-frontend-pc:
    build: ./frontend/pc
    ports:
      - "${PC_PORT:-3000}:80"

  pos-frontend-mobile:
    build: ./frontend/mobile
    ports:
      - "${MOBILE_PORT:-4000}:80"

  pos-db:
    image: postgres:14
    ports:
      - "${DB_PORT:-55432}:5432"
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD:-pos2024secure}
      - POSTGRES_USER=${DB_USER:-posuser}
      - POSTGRES_DB=${DB_NAME:-retailpos}

  pos-redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-16379}:6379"
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./redis/conf/redis.conf:/usr/local/etc/redis/redis.conf
```

### 8.2 环境变量配置
```bash
# .env 文件
BACKEND_PORT=8888
PC_PORT=3000
MOBILE_PORT=4000
DB_PORT=55432
DB_USER=posuser
DB_PASSWORD=pos2024secure
DB_NAME=retailpos
REDIS_PORT=16379
```

## 9. 安全与审计

### 9.1 权限控制
- 店员: 收银、退款（当日）、小票重打（当日）
- 店长: 全部店员权限 + 报表查看、库存管理
- 财务: 全部权限 + 账务核对、报表导出

### 9.2 操作日志
- 所有关键操作（支付、退款、余额调整）记录完整日志
- 日志包含: 操作人、时间、IP、操作详情、影响数据

## 10. 扩展性设计

### 10.1 插件化规则引擎
- 促销规则支持 JSON 配置，无需硬编码
- 规则可运行时启停

### 10.2 分布式支持（预留）
- Redis Session 共享
- 数据库连接池优化
- 读写分离预留接口

### 10.3 未来扩展方向
- 多门店统一管理
- 线上线下会员互通
- 供应链对接
- 智能补货建议
