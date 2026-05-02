# 跨境电商店铺管理系统数据库设计

## 1. 数据库概述

本系统采用MongoDB作为数据库，因为它是一个文档数据库，适合存储复杂的电商数据，具有良好的灵活性和可扩展性。

## 2. 集合设计

### 2.1 用户集合 (users)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 用户ID | 主键 | 自动生成 |
| username | String | 用户名 | 唯一索引 | 登录账号 |
| password | String | 密码 | - | 加密存储 |
| role | String | 角色 | 索引 | operation, purchase, warehouse, customer_service |
| name | String | 真实姓名 | - | - |
| email | String | 邮箱 | 唯一索引 | - |
| phone | String | 电话 | - | - |
| created_at | Date | 创建时间 | - | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.2 店铺集合 (shops)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 店铺ID | 主键 | 自动生成 |
| name | String | 店铺名称 | 索引 | - |
| platform | String | 平台类型 | 索引 | Amazon, eBay, Shopify等 |
| status | String | 状态 | 索引 | active, inactive |
| auth_info | Object | 授权信息 | - | 包含token、expires等 |
| api_credentials | Object | API凭证 | - | 各平台API密钥 |
| created_at | Date | 创建时间 | - | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.3 商品集合 (products)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 商品ID | 主键 | 自动生成 |
| name | String | 商品名称 | 索引 | - |
| description | String | 商品描述 | - | - |
| category | String | 商品分类 | 索引 | - |
| brand | String | 品牌 | 索引 | - |
| images | Array | 商品图片 | - | 图片URL数组 |
| attributes | Object | 商品属性 | - | 颜色、尺寸等 |
| status | String | 状态 | 索引 | active, inactive |
| created_at | Date | 创建时间 | - | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.4 SKU集合 (skus)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | SKU ID | 主键 | 自动生成 |
| product_id | ObjectId | 商品ID | 外键索引 | 关联products集合 |
| sku_code | String | SKU编码 | 唯一索引 | 系统内唯一 |
| attributes | Object | 属性 | - | 颜色、尺寸等具体属性 |
| price | Number | 价格 | - | 销售价格 |
| cost | Number | 成本 | - | 采购成本 |
| stock | Number | 库存 | 索引 | 当前库存数量 |
| min_stock | Number | 最小库存 | - | 低于此值触发预警 |
| platform_skus | Array | 平台SKU映射 | - | 各平台的SKU编码 |
| created_at | Date | 创建时间 | - | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.5 订单集合 (orders)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 订单ID | 主键 | 自动生成 |
| shop_id | ObjectId | 店铺ID | 外键索引 | 关联shops集合 |
| platform_order_id | String | 平台订单ID | 唯一索引 | 各平台的订单ID |
| customer_info | Object | 客户信息 | - | 姓名、地址、联系方式等 |
| items | Array | 订单商品 | - | 包含SKU、数量、价格等 |
| total_amount | Number | 总金额 | - | 订单总金额 |
| currency | String | 货币类型 | - | USD, CNY等 |
| status | String | 订单状态 | 索引 | pending, processing, shipped, completed, cancelled |
| shipping_info | Object | 物流信息 | - | 物流公司、单号等 |
| payment_info | Object | 支付信息 | - | 支付方式、交易ID等 |
| created_at | Date | 创建时间 | 索引 | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |
| platform_created_at | Date | 平台创建时间 | - | 订单在平台的创建时间 |

### 2.6 物流集合 (shipments)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 物流ID | 主键 | 自动生成 |
| order_id | ObjectId | 订单ID | 外键索引 | 关联orders集合 |
| tracking_number | String | 物流单号 | 唯一索引 | - |
| carrier | String | 快递公司 | 索引 | - |
| status | String | 物流状态 | 索引 | pending, shipped, in_transit, delivered, exception |
| shipping_address | Object | 收货地址 | - | - |
| estimated_delivery | Date | 预计送达时间 | - | - |
| actual_delivery | Date | 实际送达时间 | - | - |
| created_at | Date | 创建时间 | - | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.7 售后集合 (after_sales)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 售后ID | 主键 | 自动生成 |
| order_id | ObjectId | 订单ID | 外键索引 | 关联orders集合 |
| type | String | 售后类型 | 索引 | refund, return, dispute |
| reason | String | 售后原因 | - | - |
| description | String | 详细描述 | - | - |
| status | String | 售后状态 | 索引 | pending, processing, completed, rejected |
| amount | Number | 金额 | - | 退款或赔偿金额 |
| images | Array | 凭证图片 | - | 问题图片等 |
| created_at | Date | 创建时间 | - | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.8 成本集合 (costs)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 成本ID | 主键 | 自动生成 |
| type | String | 成本类型 | 索引 | purchase, shipping, platform_fee, ad, other |
| amount | Number | 金额 | - | 成本金额 |
| currency | String | 货币类型 | - | USD, CNY等 |
| related_id | ObjectId | 关联ID | 索引 | 关联订单、商品等 |
| description | String | 描述 | - | 成本说明 |
| created_at | Date | 创建时间 | 索引 | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.9 预警集合 (alerts)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 预警ID | 主键 | 自动生成 |
| type | String | 预警类型 | 索引 | inventory, shipping, order, system |
| message | String | 预警消息 | - | 详细信息 |
| level | String | 预警级别 | 索引 | info, warning, error |
| status | String | 状态 | 索引 | pending, processing, resolved |
| related_id | ObjectId | 关联ID | 索引 | 关联订单、商品等 |
| created_at | Date | 创建时间 | 索引 | 自动生成 |
| updated_at | Date | 更新时间 | - | 自动生成 |

### 2.10 日志集合 (logs)

| 字段名 | 数据类型 | 描述 | 索引 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| _id | ObjectId | 日志ID | 主键 | 自动生成 |
| type | String | 日志类型 | 索引 | auth, operation, sync, error |
| user_id | ObjectId | 用户ID | 外键索引 | 关联users集合 |
| action | String | 操作 | - | 具体操作内容 |
| target | String | 目标 | - | 操作对象 |
| target_id | ObjectId | 目标ID | 索引 | 操作对象ID |
| message | String | 日志消息 | - | 详细信息 |
| created_at | Date | 创建时间 | 索引 | 自动生成 |

## 3. 索引设计

### 3.1 用户集合索引
- `username`: 唯一索引，用于快速查找用户
- `email`: 唯一索引，用于快速查找用户
- `role`: 普通索引，用于按角色查询用户

### 3.2 店铺集合索引
- `name`: 普通索引，用于快速查找店铺
- `platform`: 普通索引，用于按平台查询店铺
- `status`: 普通索引，用于按状态查询店铺

### 3.3 商品集合索引
- `name`: 普通索引，用于快速查找商品
- `category`: 普通索引，用于按分类查询商品
- `brand`: 普通索引，用于按品牌查询商品
- `status`: 普通索引，用于按状态查询商品

### 3.4 SKU集合索引
- `sku_code`: 唯一索引，用于快速查找SKU
- `product_id`: 外键索引，用于关联商品
- `stock`: 普通索引，用于库存查询和预警

### 3.5 订单集合索引
- `platform_order_id`: 唯一索引，用于快速查找平台订单
- `shop_id`: 外键索引，用于按店铺查询订单
- `status`: 普通索引，用于按状态查询订单
- `created_at`: 普通索引，用于按时间查询订单

### 3.6 物流集合索引
- `tracking_number`: 唯一索引，用于快速查找物流信息
- `order_id`: 外键索引，用于关联订单
- `status`: 普通索引，用于按状态查询物流

### 3.7 售后集合索引
- `order_id`: 外键索引，用于关联订单
- `type`: 普通索引，用于按类型查询售后
- `status`: 普通索引，用于按状态查询售后

### 3.8 成本集合索引
- `type`: 普通索引，用于按类型查询成本
- `related_id`: 普通索引，用于关联其他对象
- `created_at`: 普通索引，用于按时间查询成本

### 3.9 预警集合索引
- `type`: 普通索引，用于按类型查询预警
- `level`: 普通索引，用于按级别查询预警
- `status`: 普通索引，用于按状态查询预警
- `created_at`: 普通索引，用于按时间查询预警

### 3.10 日志集合索引
- `type`: 普通索引，用于按类型查询日志
- `user_id`: 外键索引，用于按用户查询日志
- `created_at`: 普通索引，用于按时间查询日志

## 4. 关系模型

### 4.1 主要关系

1. **用户与其他对象**:
   - 一个用户可以创建多个订单、售后记录、成本记录等
   - 用户操作会生成日志记录

2. **店铺与其他对象**:
   - 一个店铺可以有多个订单
   - 一个店铺可以授权多个平台

3. **商品与SKU**:
   - 一个商品可以有多个SKU
   - 一个SKU属于一个商品

4. **订单与其他对象**:
   - 一个订单可以有多个商品项
   - 一个订单可以有一个物流记录
   - 一个订单可以有多个售后记录

5. **物流与订单**:
   - 一个物流记录对应一个订单
   - 一个订单可以有一个物流记录

6. **售后与订单**:
   - 一个售后记录对应一个订单
   - 一个订单可以有多个售后记录

7. **成本与其他对象**:
   - 一个成本记录可以关联一个订单、商品或其他对象

8. **预警与其他对象**:
   - 一个预警可以关联一个订单、商品或其他对象

### 4.2 数据流转关系

1. **商品数据流转**:
   - 运营创建商品和SKU
   - SKU映射引擎生成各平台SKU
   - 商品信息同步至各平台

2. **订单数据流转**:
   - 订单同步引擎从各平台拉取订单
   - 系统创建订单记录
   - 订单状态更新同步至各平台

3. **物流数据流转**:
   - 仓库创建物流记录
   - 物流状态更新同步至订单
   - 物流信息回写至各平台

4. **售后数据流转**:
   - 客服创建售后记录
   - 售后状态更新同步至订单
   - 售后信息回写至各平台

5. **财务数据流转**:
   - 系统自动归集各类成本
   - 利润核算引擎计算利润
   - 生成财务报表

6. **预警数据流转**:
   - 系统检测异常情况
   - 创建预警记录
   - 预警状态更新

## 5. 数据安全

### 5.1 加密存储
- 用户密码使用bcrypt加密存储
- 敏感信息（如API凭证）加密存储

### 5.2 访问控制
- 基于角色的访问控制
- 敏感操作需要权限验证

### 5.3 数据备份
- 定期备份数据库
- 备份数据存储在安全位置

### 5.4 审计日志
- 记录所有重要操作
- 便于追溯和审计

## 6. 性能优化

### 6.1 索引优化
- 为常用查询字段创建索引
- 定期优化索引

### 6.2 查询优化
- 使用投影减少返回数据量
- 使用分页减少一次性返回数据量
- 使用聚合操作优化统计查询

### 6.3 存储优化
- 合理设置集合大小
- 定期清理过期数据
- 使用压缩存储减少空间占用

## 7. 总结

本数据库设计采用MongoDB文档数据库，根据跨境电商业务特点，设计了用户、店铺、商品、SKU、订单、物流、售后、成本、预警和日志等集合。通过合理的索引设计和关系模型，确保了数据的高效存储和查询，同时保证了数据的安全性和完整性。