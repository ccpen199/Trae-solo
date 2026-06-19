# 校园直饮水IoT服务平台

覆盖**学生、运维方、投资商**三方角色的校园直饮水 IoT 服务平台。

## ✨ 核心功能

### 👨‍🎓 学生端（小程序）
- 📱 **手机号登录** - 验证码快捷登录，免注册
- 📷 **扫码取水** - 扫描设备二维码快速启动
- 📶 **蓝牙取水** - 离线场景下蓝牙连接设备
- 💰 **实时扣费** - 按升计价，取水过程实时显示
- 📄 **电子账单** - 水温、用量、金额等详细账单
- 💳 **支付宝H5支付** - 余额不足自动唤起充值
- 🔔 **余额预警** - 低于阈值自动提醒充值

### 🛠️ 运维端（Web后台）
- 🔄 **远程重启** - 一键远程重启设备
- ⚙️ **参数下发** - 水温、功率、水价等参数远程配置
- 📲 **批量固件升级** - 支持立即/定时批量升级
- 📋 **工单系统** - 完整工单流转：创建→分配→处理→完成
- 📊 **实时监控** - 设备状态、告警实时刷新
- 📱 **设备管理** - 设备全生命周期管理

### 📈 投资商端（Web后台）
- 🗺️ **设备集群地图** - 地图可视化展示设备分布
- 📟 **单机运行数据** - 运行时长、故障码、能耗曲线
- 💹 **ROI仪表盘** - 日均用水量×单价－维保成本
- 📊 **能耗分析** - 24h/7d/30d/90d多维度能耗曲线
- 📑 **报表中心** - ROI报表、用水报表、故障报表
- 🔔 **故障预警** - 设备故障实时告警

## 🔐 安全机制
- 🔑 **设备双向认证** - 基于设备密钥的挑战-响应认证
- 🔒 **交易流水AES加密** - AES-256-CBC加密存储和传输
- 🛡️ **防重放攻击** - Nonce + 时间戳双重防护
- 📴 **离线缓存+断网续传** - 设备本地缓存，联网后自动同步
- 📱 **无卡化安全** - 全程无物理卡片，安全便捷

## 🏗️ 技术架构

### 后端服务
- **框架**: Node.js + Express.js + TypeScript
- **数据库**: MongoDB (Mongoose ODM)
- **缓存**: Redis (会话、限流、防重放)
- **IoT协议**: MQTT 5.0 (EMQX Broker)
- **安全**: JWT + AES-256 + HMAC-SHA256

### 投资商/运维后台
- **框架**: React 18 + TypeScript + Vite
- **UI组件**: Ant Design 5.x
- **图表**: ECharts 5.x
- **地图**: Leaflet
- **状态管理**: Zustand

### 学生端小程序
- **框架**: Taro 3.6 + React 18 + TypeScript
- **支持平台**: 微信小程序 / H5 / 支付宝小程序

## 📁 项目结构

```
campus-water-iot-platform/
├── backend/                     # 后端服务
│   ├── src/
│   │   ├── config/              # 配置模块
│   │   ├── models/              # 数据模型 (8个)
│   │   ├── controllers/         # 控制器 (8个)
│   │   ├── services/            # 业务服务 (7个)
│   │   ├── middleware/          # 中间件
│   │   ├── security/            # 安全模块
│   │   ├── iot/                 # IoT通信模块
│   │   ├── utils/               # 工具函数
│   │   ├── routes/              # 路由
│   │   ├── database.ts          # 数据库连接
│   │   └── app.ts               # 应用入口
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── admin/
│   ├── investor/                # 投资商后台（React）
│   │   └── src/
│   │       ├── pages/           # 页面（7个）
│   │       ├── components/      # 组件（4个）
│   │       ├── layouts/         # 布局
│   │       ├── services/        # API服务
│   │       └── store/           # 状态管理
│   │
│   └── operator/                # 运维后台（React）
│       └── src/
│           ├── pages/           # 页面（6个）
│           ├── components/      # 组件（6个）
│           ├── layouts/         # 布局
│           ├── services/        # API服务
│           └── store/           # 状态管理
│
├── miniprogram/                 # 学生端小程序（Taro）
│   ├── src/
│   │   ├── pages/               # 页面（7个）
│   │   ├── components/          # 组件（4个）
│   │   ├── services/            # API服务
│   │   ├── store/               # 状态管理
│   │   └── utils/               # 工具函数
│   ├── config/                  # Taro配置
│   └── project.config.json
│
├── docs/                        # 文档
├── docker-compose.yml           # Docker编排
├── package.json                 # 根项目配置
├── .env.example                 # 环境变量模板
└── ARCHITECTURE.md              # 架构设计文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0
- EMQX >= 5.0 (可选，用于MQTT通信)

### 一、后端服务

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库、Redis、MQTT 等连接信息

# 开发模式运行
npm run dev

# 生产构建
npm run build

# 生产运行
npm start
```

服务启动后访问: http://localhost:3000/api/v1/health

### 二、投资商后台

```bash
cd admin/investor

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

访问: http://localhost:5173

### 三、运维后台

```bash
cd admin/operator

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

访问: http://localhost:5173

### 四、学生端小程序

```bash
cd miniprogram

# 安装依赖
npm install

# 微信小程序开发
npm run dev:weapp
# 使用微信开发者工具打开 dist 目录

# H5开发
npm run dev:h5

# 生产构建
npm run build:weapp
npm run build:h5
```

### 五、Docker 一键部署

```bash
# 复制环境变量
cp .env.example .env

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📡 API 接口总览

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/send-code` | 发送验证码 |
| POST | `/api/v1/auth/login` | 手机号登录 |
| POST | `/api/v1/auth/refresh-token` | 刷新令牌 |
| POST | `/api/v1/auth/logout` | 退出登录 |

### 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/user/me` | 获取用户信息 |
| PUT | `/api/v1/user/profile` | 更新用户信息 |
| GET | `/api/v1/user/balance` | 查询余额 |
| PUT | `/api/v1/user/warning-threshold` | 设置余额预警 |

### 设备接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/device/` | 设备列表 |
| GET | `/api/v1/device/:id` | 设备详情 |
| GET | `/api/v1/device/my-devices` | 我的设备 |
| POST | `/api/v1/device/bind` | 绑定设备 |
| POST | `/api/v1/device/unbind` | 解绑设备 |
| POST | `/api/v1/device/scan-start` | 扫码启动 |
| POST | `/api/v1/device/bluetooth-start` | 蓝牙启动 |
| POST | `/api/v1/device/stop` | 停止取水 |

### 交易接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/transaction/` | 交易记录 |
| GET | `/api/v1/transaction/:id` | 交易详情 |
| GET | `/api/v1/transaction/bill/:id` | 电子账单 |
| GET | `/api/v1/transaction/statistics` | 交易统计 |

### 支付接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/payment/alipay/create` | 创建支付宝H5支付 |
| POST | `/api/v1/payment/alipay/notify` | 支付宝回调 |
| GET | `/api/v1/payment/order/:orderNo/status` | 查询订单状态 |

### 投资商接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/investor/projects` | 项目列表 |
| GET | `/api/v1/investor/dashboard` | 仪表盘数据 |
| GET | `/api/v1/investor/devices-map` | 设备集群地图 |
| GET | `/api/v1/investor/device/:id/details` | 设备详情 |
| GET | `/api/v1/investor/energy-curve` | 能耗曲线 |
| GET | `/api/v1/investor/roi` | ROI计算 |
| GET | `/api/v1/investor/fault-statistics` | 故障统计 |

### 运维接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/operator/devices` | 设备管理列表 |
| POST | `/api/v1/operator/device/:id/restart` | 远程重启 |
| POST | `/api/v1/operator/device/:id/params` | 参数下发 |
| POST | `/api/v1/operator/firmware/upload` | 固件上传 |
| POST | `/api/v1/operator/firmware/batch-upgrade` | 批量升级 |
| GET | `/api/v1/operator/firmwares` | 固件列表 |
| GET | `/api/v1/operator/work-orders` | 工单列表 |
| POST | `/api/v1/operator/work-orders` | 创建工单 |
| PUT | `/api/v1/operator/work-orders/:id` | 更新工单 |

### IoT接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/iot/device-auth` | 设备双向认证 |
| GET | `/api/v1/iot/mqtt-config` | MQTT连接配置 |
| POST | `/api/v1/iot/offline-sync` | 离线数据同步 |

## 🔧 核心业务流程

### 学生取水流程
```
1. 学生打开小程序 → 手机号验证码登录
2. 扫描设备二维码 / 蓝牙搜索设备
3. 设备双向认证 → 建立安全连接
4. 选择水温（冷/温/热）→ 点击启动
5. 设备出水 → 实时流量/水温数据上报
6. 实时扣费（按升计价）
   ├─ 余额充足 → 正常扣费
   └─ 余额不足 → 自动唤起支付宝H5充值
7. 停止出水 → 生成电子账单
8. 账单推送至小程序
```

### 设备离线重连流程
```
1. 设备检测网络断开 → 启动离线缓存模式
2. 交易数据AES加密存储到设备本地Flash
3. 网络恢复 → 设备主动重连MQTT Broker
4. 批量上报离线数据（带时间戳和nonce）
5. 后端去重处理 → 补扣费用 / 同步状态
6. 设备清除已同步缓存
```

### 投资商ROI计算
```
核心公式：
  日均收益 = 日均用水量 × 单价
  日均成本 = 设备数量 × 单设备日均维保成本
  日均净利润 = 日均收益 - 日均成本
  ROI = (日均净利润 × 365) / 总投资 × 100%
  投资回收期 = 总投资 / 日均净利润
```

## 🔐 安全机制说明

### 设备双向认证（挑战-响应模式）
```
设备端                                    服务端
   │                                        │
   ├── 连接请求(deviceId, random1) ───────▶│
   │                                        │  校验设备是否存在
   │◀── 响应(random2, sign(random1)) ───────┤
   │                                        │
   ├── sign(random2, deviceSecret) ───────▶│  验证签名
   │                                        │
   │◀────── 认证结果 + 会话令牌 ────────────┤
```

### 交易数据加密
- **算法**: AES-256-CBC
- **密钥**: 每设备独立密钥，出厂预置，支持动态更新
- **数据**: 所有交易流水加密后存储和传输
- **签名**: HMAC-SHA256 数据签名防止篡改

### 防重放攻击
- 每个请求携带唯一 nonce + Unix 时间戳
- nonce 缓存 5 分钟，重复请求直接拒绝
- 时间戳偏差超过 300 秒拒绝
- 设备端请求递增序号 + 服务端校验

## 📊 数据模型

### 核心模型
1. **User** - 用户（学生/运维/投资商/管理员）
2. **Device** - 设备（直饮机）
3. **DeviceBinding** - 用户设备绑定关系
4. **Transaction** - 交易记录（取水/充值/退款）
5. **Project** - 项目（投资商维度）
6. **Firmware** - 固件版本
7. **WorkOrder** - 运维工单
8. **IoTData** - IoT时序数据（心跳/遥测/事件/告警）

## 🎯 特色功能

1. **精美电子账单** - 仿纸质票据设计，带电子签章和防伪二维码
2. **实时取水动画** - 数字滚动、水波动画、水滴下落效果
3. **蓝牙雷达搜索** - 同心圆扩散动画，信号强度可视化
4. **ROI仪表盘** - 环形进度图、投资回收周期可视化
5. **设备集群地图** - 地图标记、状态色标、弹窗详情
6. **批量固件升级** - 灰度发布、进度监控、失败自动重试
7. **工单全流程** - 状态流转、时间线、图片上传、电子签名

## 📝 开发说明

### 环境变量
复制 `.env.example` 为 `.env` 并按需修改：
- 数据库连接
- Redis 连接
- MQTT Broker 配置
- 支付宝支付配置
- 短信服务配置
- 安全密钥配置

### 代码规范
- TypeScript 严格模式
- ESLint 代码检查
- 统一的错误处理
- 请求响应标准化

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
