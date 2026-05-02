# 冷链物流温控平台架构设计

## 1. 技术栈选择

### 1.1 后端技术栈
- **语言**：Java 11
- **框架**：Spring Boot 2.5.4
- **数据库**：PostgreSQL 13.0
- **缓存**：Redis 6.0+
- **消息队列**：RabbitMQ 3.8+
- **认证**：JWT
- **API文档**：Swagger 3.0

### 1.2 前端技术栈
- **框架**：Vue 3 + Vite
- **状态管理**：Pinia
- **路由**：Vue Router
- **UI组件**：Element Plus
- **图表库**：ECharts
- **地图**：高德地图 API
- **网络请求**：Axios

### 1.3 中间件
- **Nginx**：反向代理、负载均衡
- **Docker**：容器化部署
- **ELK**：日志收集与分析

## 2. 系统架构

### 2.1 架构风格
采用分层架构，包括：
- **表现层**：前端应用
- **API层**：RESTful API
- **服务层**：业务逻辑
- **数据访问层**：数据库操作
- **基础设施层**：中间件、工具类

### 2.2 核心模块
- **用户模块**：用户管理、权限控制
- **任务模块**：任务创建、分配、状态管理
- **温度模块**：温度数据采集、存储、查询
- **告警模块**：告警触发、处理、通知
- **验收模块**：验收流程、结果管理
- **报告模块**：报告生成、下载
- **引擎模块**：四大核心引擎实现

### 2.3 数据流
1. **温度数据流程**：温控设备 → 采集服务 → 消息队列 → 处理服务 → 数据库
2. **告警流程**：温度数据 → 告警引擎 → 告警消息 → 通知服务 → 前端
3. **任务流程**：货主创建 → 承运商分配 → 司机执行 → 到货验收 → 报告生成

## 3. 数据库设计

### 3.1 核心表结构

#### users表
| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| user_id | SERIAL | PRIMARY KEY | 用户ID |
| username | VARCHAR(50) | UNIQUE NOT NULL | 用户名 |
| password | VARCHAR(100) | NOT NULL | 密码（加密） |
| role | VARCHAR(20) | NOT NULL | 角色 |
| contact_info | JSONB | | 联系方式 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### tasks表
| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| task_id | SERIAL | PRIMARY KEY | 任务ID |
| shipper_id | INTEGER | REFERENCES users(user_id) | 货主ID |
| carrier_id | INTEGER | REFERENCES users(user_id) | 承运商ID |
| driver_id | INTEGER | REFERENCES users(user_id) | 司机ID |
| task_status | VARCHAR(20) | NOT NULL | 任务状态 |
| goods_info | JSONB | NOT NULL | 货品信息 |
| temperature_range | JSONB | NOT NULL | 温度区间 |
| time_limit | VARCHAR(50) | | 时效要求 |
| start_location | JSONB | NOT NULL | 起始位置 |
| end_location | JSONB | NOT NULL | 目的地 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### temperature_data表
| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| data_id | SERIAL | PRIMARY KEY | 数据ID |
| task_id | INTEGER | REFERENCES tasks(task_id) | 关联任务ID |
| temperature | DECIMAL(5,2) | NOT NULL | 温度值 |
| humidity | DECIMAL(5,2) | | 湿度值 |
| location | JSONB | | 位置信息 |
| collect_time | TIMESTAMP | NOT NULL | 采集时间 |

#### alarms表
| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| alarm_id | SERIAL | PRIMARY KEY | 告警ID |
| task_id | INTEGER | REFERENCES tasks(task_id) | 关联任务ID |
| alarm_type | VARCHAR(20) | NOT NULL | 告警类型 |
| alarm_level | VARCHAR(20) | NOT NULL | 告警级别 |
| alarm_value | DECIMAL(5,2) | NOT NULL | 告警值 |
| threshold_value | DECIMAL(5,2) | NOT NULL | 阈值 |
| alarm_time | TIMESTAMP | NOT NULL | 告警时间 |
| handle_status | VARCHAR(20) | NOT NULL | 处理状态 |
| handle_time | TIMESTAMP | | 处理时间 |
| handle_method | TEXT | | 处理措施 |
| handler_id | INTEGER | REFERENCES users(user_id) | 处理人ID |

#### inspections表
| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| inspection_id | SERIAL | PRIMARY KEY | 验收ID |
| task_id | INTEGER | REFERENCES tasks(task_id) | 关联任务ID |
| inspection_time | TIMESTAMP | NOT NULL | 验收时间 |
| inspection_result | VARCHAR(20) | NOT NULL | 验收结果 |
| problem_description | TEXT | | 问题描述 |
| shipper_signature | VARCHAR(100) | | 货主签名 |
| driver_signature | VARCHAR(100) | | 司机签名 |

### 3.2 索引设计
- **tasks表**：task_id, shipper_id, driver_id, task_status
- **temperature_data表**：task_id, collect_time
- **alarms表**：task_id, alarm_time, handle_status

## 4. API设计

### 4.1 用户接口
- `POST /api/users/login`：登录
- `POST /api/users/logout`：登出
- `PUT /api/users/password`：修改密码
- `GET /api/users/info`：获取用户信息

### 4.2 任务接口
- `POST /api/tasks`：创建任务
- `GET /api/tasks`：获取任务列表
- `GET /api/tasks/{task_id}`：获取任务详情
- `PUT /api/tasks/{task_id}/assign`：分配任务
- `PUT /api/tasks/{task_id}/start`：开始任务
- `PUT /api/tasks/{task_id}/complete`：完成任务
- `PUT /api/tasks/{task_id}/cancel`：取消任务

### 4.3 温度数据接口
- `POST /api/temperature`：采集温度数据
- `GET /api/temperature/{task_id}`：获取任务温度数据
- `GET /api/temperature/{task_id}/chart`：获取温度曲线数据

### 4.4 告警接口
- `GET /api/alarms/{task_id}`：获取任务告警列表
- `PUT /api/alarms/{alarm_id}/handle`：处理告警

### 4.5 验收接口
- `POST /api/inspections`：创建验收记录
- `GET /api/inspections/{task_id}`：获取验收记录

### 4.6 报告接口
- `GET /api/reports/{task_id}`：生成温控报告
- `GET /api/reports/{task_id}/download`：下载温控报告
- `GET /api/reports/quality`：获取质控分析报表

## 5. 核心引擎设计

### 5.1 温度采集引擎
- **功能**：实时采集温度、湿度数据
- **实现**：通过MQTT协议接收设备数据，存储到数据库
- **性能**：支持高并发数据采集，采用批处理优化存储

### 5.2 GPS定位引擎
- **功能**：实时采集位置数据
- **实现**：通过GPS设备或手机定位，存储到数据库
- **性能**：按需采集，避免频繁数据传输

### 5.3 异常告警引擎
- **功能**：监测温度异常，触发多级告警
- **实现**：实时分析温度数据，超出阈值时触发告警
- **通知**：通过WebSocket、短信、邮件等方式通知相关人员

### 5.4 温控报告引擎
- **功能**：生成完整温控报告
- **实现**：汇总任务数据、温度数据、告警记录，生成PDF报告
- **存储**：报告存储到文件系统，记录路径到数据库

## 6. 部署架构

### 6.1 开发环境
- **前端**：Vite开发服务器（端口3000）
- **后端**：Spring Boot开发服务器（端口8080）
- **数据库**：PostgreSQL（端口5432）
- **缓存**：Redis（端口6379）
- **消息队列**：RabbitMQ（端口5672）

### 6.2 生产环境
- **前端**：Nginx静态部署
- **后端**：Docker容器化部署，负载均衡
- **数据库**：PostgreSQL集群
- **缓存**：Redis集群
- **消息队列**：RabbitMQ集群
- **监控**：ELK日志系统

## 7. 安全设计

### 7.1 认证与授权
- **认证**：JWT令牌认证
- **授权**：基于角色的权限控制（RBAC）
- **密码**：BCrypt加密存储

### 7.2 数据安全
- **传输**：HTTPS加密
- **存储**：敏感数据加密存储
- **审计**：操作日志记录

### 7.3 接口安全
- **防SQL注入**：使用参数化查询
- **防XSS攻击**：输入验证
- **防CSRF攻击**：Token验证

## 8. 性能优化

### 8.1 数据库优化
- **索引优化**：合理创建索引
- **查询优化**：避免全表扫描
- **分表分库**：针对温度数据等大表

### 8.2 缓存优化
- **Redis缓存**：缓存热点数据
- **本地缓存**：缓存频繁访问数据

### 8.3 消息队列优化
- **异步处理**：非实时任务异步处理
- **削峰填谷**：处理高并发请求

### 8.4 前端优化
- **代码分割**：按需加载
- **资源压缩**：减少传输大小
- **缓存策略**：合理设置缓存
