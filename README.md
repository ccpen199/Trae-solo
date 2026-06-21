# 智能视频监控与告警协同平台

面向家庭与小微场所的**实时视频监控与告警协同平台**，完整的前后端分离架构实现。

## ✨ 功能特性

### 📹 设备与流媒体
- **多类型IPC设备接入**：支持 ONVIF / RTSP / GB28181 / 私有协议
- **H.264/H.265 流媒体低延迟播放**：基于 WebSocket 的帧级传输，延迟 1-3 秒
- **双向语音通话**：G.711A/AAC 编解码，全双工对讲
- **云台PTZ控制**：八方向云台 + 变焦控制
- **设备分组管理**：支持多层级设备分组与批量操作
- **设备离线监测**：心跳检测 + 5分钟超时告警

### 👥 用户与权限体系
- **三级角色系统**：
  - 🔑 **主账号 (owner)**：全权控制，设备/成员/策略管理
  - 👨‍👩‍👧 **家庭成员 (member)**：受限查看被分享设备
  - 👤 **访客 (guest)**：临时时效链接访问
- **设备分享分级权限**：
  - 👁 只看 (view)：仅预览画面
  - 🎙 可对讲 (talk)：预览 + 双向语音
  - ⚙️ 可配置 (config)：全部权限含云台/设置
- **临时分享链接**：带时效的访客访问

### 🤖 AI 智能侦测与告警
- **多类型AI侦测**：人形/移动/人脸识别、车辆检测、区域入侵、越界侦测
- **三渠道告警推送**：
  - 📱 **短信告警**：高危/严重级别的即时通知
  - 🔔 **站内信**：实时 WebSocket 推送 + 未读中心
  - 💬 **微信模板消息**：公众号/小程序模板推送
- **告警处置审计**：完整的处置流程记录（查看/确认/派发/完成）

### 💾 录像云存储策略
- **三种存储模式**：
  - ⏰ **定时录制**：按日程计划全量录制
  - 🚨 **事件录制**：告警触发前后 30 秒片段
  - 🤖 **智能录制**：仅AI识别到目标时录制
- **灵活保留周期**：1天 ~ 1年可配置
- **Web端回放控制**：拖拽进度、倍速播放、快照下载

### 🔐 安全合规
- **国密SM4加密传输**：请求/响应/流媒体帧端到端加密
- **设备IMEI绑定校验**：Luhn算法验证15位IMEI合法性
- **异常登录风控**：
  - IP 地理定位 + 设备指纹
  - 连续5次失败锁定1小时
  - 新设备/异地登录高风险提示
  - 受信任设备白名单管理

## 🏗 技术架构

```
┌──────────────────────────────────────────────────────┐
│                    前端 (React 18)                    │
│  AntD5 + MobX + ECharts + WebSocket + Canvas/HLS     │
└───────────────────────────┬──────────────────────────┘
                            │ REST API / WS
┌───────────────────────────▼──────────────────────────┐
│                后端服务 (Node.js + Express)           │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────────┐ │
│  │ 鉴权模块 │ │ SM4加密层 │ │ 风控/日志中间件       │ │
│  └────┬─────┘ └─────┬─────┘ └──────────┬───────────┘ │
│       │             │                  │             │
│  ┌────▼─────────────▼──────────────────▼───────────┐ │
│  │ 业务控制器 (用户/设备/流媒体/告警/存储/审计)     │ │
│  └────┬───────────────────────┬────────────────────┘ │
│       │ WebSocket             │ SQLite               │
│  ┌────▼─────────┐        ┌────▼─────────┐           │
│  │ 流媒体服务   │        │   数据层     │           │
│  │ 帧转发/录制  │        │ better-sqlite3│          │
│  └──────────────┘        └──────────────┘           │
└──────────────────────────────────────────────────────┘
```

## 📦 快速启动

### 环境要求
- Node.js ≥ 18
- npm / pnpm / yarn

### 一键启动（推荐）
```bash
chmod +x start.sh
./start.sh
```

### 分步启动

**1. 后端服务**
```bash
cd server
npm install
node src/app.js
# HTTP: http://localhost:3001
# WebSocket: ws://localhost:3002
```

**2. 前端 Web**
```bash
cd client
npm install
npm run dev
# 访问: http://localhost:5173
```

### 默认账号
```
用户名: admin
密码:   admin123456
```

## 📁 目录结构

```
.
├── server/                          # 后端服务
│   ├── src/
│   │   ├── app.js                   # 入口文件
│   │   ├── config/
│   │   │   ├── index.js             # 配置加载
│   │   │   └── database.js          # SQLite 初始化 + 建表
│   │   ├── controllers/
│   │   │   ├── UserController.js    # 用户/认证/子账号
│   │   │   ├── DeviceController.js  # 设备/分组/分享/云台
│   │   │   └── AlertController.js   # 告警/AI事件/存储策略
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT鉴权/权限/风控
│   │   ├── routes/                  # API 路由层
│   │   ├── services/                # 服务层 (预留)
│   │   ├── utils/
│   │   │   ├── sm4.js               # 国密SM4加解密工具
│   │   │   └── common.js            # JWT/IMEI校验/密码等
│   │   └── websocket/
│   │       └── streamServer.js      # 流媒体/设备/用户 WebSocket 服务
│   ├── data/                        # SQLite 数据文件
│   ├── uploads/                     # 录像/截图存储
│   ├── .env                         # 环境变量
│   └── package.json
│
├── client/                          # 前端 Web
│   ├── src/
│   │   ├── main.tsx                 # 入口
│   │   ├── AppRouter.tsx            # 路由 + 主布局
│   │   ├── pages/                   # 页面组件
│   │   │   ├── Login.tsx            # 登录/注册
│   │   │   ├── Dashboard.tsx        # 仪表盘 (统计/图表)
│   │   │   ├── DeviceList.tsx       # 设备管理 + 分组 + 分享
│   │   │   ├── LivePreview.tsx      # 多画面实时预览
│   │   │   ├── Playback.tsx         # 录像回放 + 存储策略
│   │   │   ├── Alerts.tsx           # 告警中心 + AI事件
│   │   │   ├── Members.tsx          # 家庭成员 + 分享管理
│   │   │   ├── AuditLogs.tsx        # 告警处置审计
│   │   │   ├── Settings.tsx         # 个人设置/安全/登录日志
│   │   │   └── TemporaryView.tsx    # 临时链接访客页面
│   │   ├── components/
│   │   │   └── VideoPlayer.tsx      # 自定义视频播放器 (WebSocket帧)
│   │   ├── services/api.ts          # API 请求封装
│   │   ├── store/index.ts           # MobX 全局状态
│   │   ├── utils/format.ts          # 格式化工具
│   │   └── types/index.ts           # TypeScript 类型
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── start.sh                         # 一键启动脚本
└── README.md
```

## 🔌 核心 API 接口

### 认证与用户
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/users/login` | 登录（带IMEI校验/风控） |
| POST | `/api/users/register` | 注册新主账号 |
| GET  | `/api/users/me` | 当前用户信息 |
| POST | `/api/users/sub-accounts` | 创建家庭成员 |
| GET  | `/api/users/login-logs` | 登录日志（含风险等级） |

### 设备管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/devices` | 设备列表/新增设备 |
| PUT/DELETE | `/api/devices/:id` | 编辑/删除设备 |
| GET/POST | `/api/devices/groups` | 分组列表/新建分组 |
| POST | `/api/devices/:id/share` | 分享设备（分级权限） |
| POST | `/api/devices/:id/ptz` | 云台控制命令 |
| POST | `/api/devices/heartbeat` | 设备心跳上报 |

### 流媒体
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/stream/devices/:id/stream-info` | 获取播放会话 |
| POST | `/api/stream/devices/:id/record` | 启动手动录制 |
| GET  | `/api/stream/recordings` | 录像列表查询 |
| GET  | `/api/stream/recordings/:id/playback` | 录像文件流式回放 |
| POST | `/api/stream/ai-event/report` | AI事件上报（设备端） |

### 告警与审计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/stream/alerts` | 告警消息列表 |
| PUT  | `/api/stream/alerts/read` | 标记已读 |
| GET  | `/api/stream/events` | AI事件历史 |
| GET  | `/api/stream/statistics` | 仪表盘统计数据 |
| GET/POST | `/api/stream/storage-policies` | 云存储策略 CRUD |
| GET/POST | `/api/stream/alert-audit` | 告警处置审计 |

## 🔗 WebSocket 协议

### 三种连接路径

| 路径 | 用途 | 鉴权 |
|------|------|------|
| `ws://host:3002/device?sn=xxx&token=xxx` | 设备端推流/收指令 | 设备SN+Token |
| `ws://host:3002/stream?session=xxx` | 客户端取流 | 会话Token |
| `ws://host:3002/ws?token=xxx` | 用户事件推送 | JWT Token |

### 帧消息格式
```json
// 设备 -> 服务端
{ "type": "video_frame", "codec": "H.264", "data": "<base64>", "encrypted": false }
{ "type": "event", "eventType": "person_detect", "confidence": 0.96, "snapshot": "<base64>" }

// 服务端 -> 设备
{ "type": "ptz", "command": "up", "speed": 1 }
{ "type": "audio_down", "format": "G.711A", "data": "<base64>" }

// 服务端 -> 用户（告警推送）
{ "type": "ai_event", "eventType": "person_detect", "deviceName": "客厅摄像头", "eventLevel": "high" }
```

## 🔐 国密 SM4 加密使用

所有敏感接口支持请求头 `X-SM4-Encrypt: true` 开启端到端加密：

```javascript
import { sm4 } from 'sm-crypto';

// 加密 (前端)
const key = '0123456789abcdef0123456789abcdef';
const encrypted = sm4.encrypt(JSON.stringify({ password: 'xxx' }), key);

// 后端自动解密中间件已集成
// 响应自动加密为 Buffer，前端需调用 sm4.decrypt 后解析
```

## 🔧 环境变量配置 (server/.env)

```env
PORT=3001              # HTTP API 端口
WS_PORT=3002           # WebSocket 端口
JWT_SECRET=...         # JWT 签名密钥
SM4_KEY=...            # 国密密钥 (32位hex)
DB_PATH=./data/surveillance.db
UPLOAD_PATH=./uploads

# 告警渠道配置（按需填写）
SMS_API_KEY=...        # 短信API
WECHAT_APPID=...       # 微信公众号
WECHAT_TEMPLATE_ID=... # 消息模板ID
```

## ⚠️ 重要说明

1. **视频流模拟**：当前版本 VideoPlayer 组件采用 Canvas 模拟渲染。生产环境需集成 **MediaSource Extensions (MSE)** + **WebCodecs** 或引入 **flv.js / hls.js** 进行真实解码。

2. **IPC对接**：实际设备端需实现 WebSocket 推流协议，或接入流媒体服务（SRS/ZLMediaKit）转换 RTSP -> WebSocket-FLV。

3. **告警渠道**：短信/微信模板消息需替换为真实服务商SDK，当前为Mock模式（控制台打印）。

---

© 2024 智能视频监控平台 · 国密合规 · AI驱动
