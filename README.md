# 冷链物流温控平台

## 项目简介
这是一个完整的冷链物流温控管理系统，支持货主、承运商、司机、质控人员四种角色，提供任务管理、温度监控、异常告警、报告生成等核心功能。

## 技术栈
### 后端
- Spring Boot 2.5.4
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL (生产环境) | H2 (开发环境)
- Redis
- RabbitMQ
- WebSocket

### 前端
- Vue 3.3
- Vite 4.4
- Element Plus 2.3
- Pinia 2.1
- Vue Router 4.2
- ECharts 5.4
- Axios 1.5

### 核心引擎
- 温度采集引擎
- GPS定位引擎
- 异常告警引擎
- 温控报告引擎

## 快速启动

### 方式一：本地开发模式（推荐）

1. 启动后端
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

2. 启动前端（新终端）
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

3. 访问地址
- 前端: http://localhost:8081
- 后端: http://localhost:8080/api
- API文档: http://localhost:8080/api/swagger-ui.html
- H2控制台: http://localhost:8080/api/h2-console

4. 测试账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 货主 | shipper | 123456 |
| 承运商 | carrier | 123456 |
| 司机 | driver | 123456 |
| 质控 | quality | 123456 |

### 方式二：Docker Compose

1. 启动全部服务
```bash
docker-compose up -d
```

2. 访问地址
- 前端: http://localhost:8081
- 后端: http://localhost:8080/api
- PostgreSQL: localhost:5432 (coldchain / coldchain123)
- Redis: localhost:6379
- RabbitMQ: http://localhost:15672 (guest / guest)

## 项目结构

### 后端
```
backend/
├── src/main/java/com/coldchain/
│   ├── config/          # 配置类
│   ├── controller/      # REST控制器
│   ├── service/         # 业务服务
│   ├── repository/      # 数据访问
│   ├── entity/          # 实体类
│   ├── engine/          # 核心引擎
│   └── ColdchainApplication.java
└── src/main/resources/
    └── application*.yml
```

### 前端
```
frontend/
├── src/
│   ├── views/           # 页面组件
│   ├── components/      # 通用组件
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia状态管理
│   ├── App.vue
│   └── main.js
├── vite.config.js
└── package.json
```

## 核心功能

### 1. 任务管理
- 货主创建冷链运输任务
- 设置温度区间、时效、货品信息
- 任务状态流转：PENDING → ASSIGNED → IN_TRANSIT → COMPLETED

### 2. 温度监控
- 实时温度数据采集
- 温度曲线展示
- 历史数据查询

### 3. 异常告警
- 温度超限触发多级告警
- WebSocket实时推送
- 告警处理与记录

### 4. 验收管理
- 到货验收记录
- 货主/司机签字确认

### 5. 报告生成
- 完整温控报告（PDF）
- 质控分析报表

## 端口说明
| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 8081 | Vue开发服务器 |
| 后端 | 8080 | Spring Boot API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| RabbitMQ | 5672 | 消息队列 |
| RabbitMQ管理 | 15672 | Web管理界面 |

## 注意事项
1. 开发环境使用H2内存数据库，重启后数据会重置
2. 生产环境请使用application.yml中的PostgreSQL配置
3. 首次启动建议使用dev profile快速测试
4. 前端端口可通过VITE_PORT环境变量自定义
