# 贵州省全域数字服务融合平台中枢系统

## 项目概述

贵州省全域数字服务融合平台中枢系统是一个综合性的数字政府服务平台，整合了四大核心服务能力，为全省市民提供一站式数字服务体验。

### 四大服务能力

1. **政务服务** - 3000+项政务服务（社保/医保/不动产/户籍等）
2. **便民缴费** - 水电气暖等公共事业缴费
3. **生活服务** - 家政/装修/出行等民生服务
4. **消费补贴核销** - 各类政府补贴的发放与核销

### 六大核心能力

1. **统一身份认证体系** - 单点登录(SSO)，支持多种认证方式
2. **跨部门数据共享中间件** - API网关、数据脱敏、权限控制
3. **电子证照全生命周期管理** - 证照签发、使用、核验、注销
4. **补贴资金穿透式监管** - 从发放到核销全流程追溯
5. **服务可用性SLA监控** - 实时监控、告警、报表
6. **市民诉求智能分拨引擎** - 对接12345热线，智能分派处理

## 技术架构

### 后端技术栈
- **框架**: Spring Cloud Alibaba 2023.0.1
- **注册中心**: Nacos 2.3.2
- **网关**: Spring Cloud Gateway
- **数据库**: MySQL 8.0 + PostgreSQL 16
- **缓存**: Redis 7.0 Cluster
- **消息队列**: RocketMQ 5.2
- **认证**: Keycloak 24.0 + OAuth2
- **分布式事务**: Seata 2.0
- **搜索引擎**: Elasticsearch 8.12
- **监控**: Prometheus + Grafana + SkyWalking

### 前端技术栈
- **框架**: React 18 + TypeScript
- **UI组件**: Ant Design 5.15
- **构建工具**: Vite 5.2
- **状态管理**: Redux Toolkit
- **微前端**: Qiankun

### 部署架构
- **容器化**: Docker + Kubernetes
- **CI/CD**: Jenkins + GitLab CI
- **服务网格**: Istio

## 项目结构

```
guizhou-digital-platform/
├── docs/                          # 项目文档
├── infrastructure/                # 基础设施代码
│   ├── k8s/                      # Kubernetes配置
│   ├── docker/                   # Docker镜像配置
│   └── terraform/                # 基础设施即代码
├── backend/                       # 后端服务
│   ├── platform-gateway/         # API网关服务
│   ├── platform-auth/            # 统一认证服务
│   ├── platform-data-share/      # 数据共享中间件
│   ├── platform-certificate/     # 电子证照服务
│   ├── platform-subsidy/         # 补贴监管服务
│   ├── platform-monitor/         # SLA监控服务
│   ├── platform-ticket/          # 诉求分拨引擎
│   ├── service-government/       # 政务服务
│   ├── service-payment/          # 便民缴费服务
│   ├── service-living/           # 生活服务
│   ├── service-subsidy-verify/   # 补贴核销服务
│   └── platform-common/          # 公共模块
└── frontend/                      # 前端应用
    ├── admin-portal/             # 管理后台
    ├── citizen-portal/           # 市民门户
    ├── mobile-h5/                # 移动端H5
    └── shared-components/        # 共享组件库
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- Docker 24+
- Kubernetes 1.27+

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd guizhou-digital-platform
```

2. 启动基础设施
```bash
cd infrastructure/docker
docker-compose up -d
```

3. 启动后端服务
```bash
cd backend
mvn clean install
mvn spring-boot:run -pl platform-gateway
```

4. 启动前端应用
```bash
cd frontend/citizen-portal
npm install
npm run dev
```

## 文档索引

- [架构设计文档](docs/architecture.md)
- [API接口文档](docs/api.md)
- [部署指南](docs/deployment.md)
- [安全规范](docs/security.md)
- [SLA协议](docs/sla.md)

## 联系方式

- 项目负责人: 贵州省大数据发展管理局
- 技术支持: platform-support@guiyang.gov.cn
