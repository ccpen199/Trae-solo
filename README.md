# 跨协议家电远程控制服务平台

## 项目概述

智能家居控制平台，支持红外（IR）、Wi-Fi、蓝牙Mesh三类通信协议，提供设备管理、遥控面板自定义、电视EPG集成和数据分析功能。

## 技术架构

- **前端**: React 18 + Vite + TailwindCSS
- **后端**: Node.js + Express + Socket.io
- **数据库**: SQLite (better-sqlite3)
- **实时通信**: WebSocket (Socket.io)

## 端口配置

- **前端**: http://127.0.0.1:47792
- **后端**: http://127.0.0.1:56792
- **API**: http://127.0.0.1:56792/api

## 快速启动

### 方式一：使用启动脚本

```bash
# 启动服务
./start.sh start

# 查看状态
./start.sh status

# 停止服务
./start.sh stop

# 重启服务
./start.sh restart
```

### 方式二：手动启动

#### 启动后端

```bash
cd backend
npm install
npm run init-db
npm start
```

#### 启动前端

```bash
cd frontend
npm install
npm run build
python3 -m http.server 47792 --directory dist
```

## 功能模块

### 1. 设备管理
- 支持IR/WiFi/Bluetooth Mesh三类设备
- 设备添加、编辑、删除
- 设备状态监控

### 2. 红外学习向导
- 摄像头扫描遥控器按键
- 自动生成红外码库
- 用户物理按键确认

### 3. 万能遥控面板
- 自定义遥控面板布局
- 支持拖拽组合按键
- 长按/短按事件分离

### 4. 电视服务模块
- EPG节目单显示
- 录制预约管理
- 观看偏好分析

### 5. SDK管理
- 设备能力描述模型
- SDK包上传
- 沙箱测试流程

### 6. 安全机制
- 设备指纹水印
- TLS 1.3加密（模拟）
- 用户主动确认

### 7. 数据分析
- 设备使用报告
- 观看偏好分析
- 趋势图表展示

## API接口

### 设备管理
- `GET /api/devices` - 获取设备列表
- `POST /api/devices` - 创建设备
- `GET /api/devices/:id` - 获取设备详情
- `PUT /api/devices/:id` - 更新设备
- `DELETE /api/devices/:id` - 删除设备

### 遥控控制
- `POST /api/control/:deviceId/control` - 下发控制指令
- `POST /api/control/:deviceId/learn` - 红外学习
- `POST /api/control/:deviceId/learn/:learningId/confirm` - 确认学习
- `GET /api/control/:deviceId/codes` - 获取红外码
- `GET /api/control/:deviceId/status` - 获取设备状态

### 面板管理
- `GET /api/panels` - 获取面板列表
- `POST /api/panels` - 创建面板
- `PUT /api/panels/:id` - 更新面板
- `DELETE /api/panels/:id` - 删除面板

### EPG管理
- `GET /api/epg/channels` - 获取频道列表
- `GET /api/epg/programs` - 获取节目单
- `GET /api/epg/recordings` - 获取录制列表
- `POST /api/epg/recordings` - 创建录制计划

### 数据分析
- `GET /api/analytics/usage` - 使用报告
- `GET /api/analytics/preferences` - 偏好分析
- `GET /api/analytics/trends` - 趋势分析

### SDK管理
- `GET /api/sdk/packages` - SDK包列表
- `POST /api/sdk/upload` - 上传SDK包
- `POST /api/sdk/:id/test` - 测试SDK
- `PUT /api/sdk/:id/approve` - 审核SDK

## 数据库

SQLite数据库文件位置: `data/app.sqlite`

### 主要数据表
- `devices` - 设备表
- `ir_codes` - 红外码表
- `remote_panels` - 遥控面板表
- `control_logs` - 控制日志表
- `epg_channels` - 频道表
- `epg_programs` - 节目表
- `recording_schedules` - 录制计划表
- `watch_logs` - 观看日志表
- `device_capabilities` - 设备能力表
- `sdk_packages` - SDK包表
- `usage_reports` - 使用报告表
- `users` - 用户表
- `learning_logs` - 学习日志表

## 页面路由

- `/` - 首页控制台
- `/devices` - 设备管理
- `/devices/:id` - 设备详情
- `/devices/:id/control` - 遥控面板
- `/learn` - 红外学习向导
- `/epg` - 节目单
- `/recordings` - 录制管理
- `/analytics` - 数据分析
- `/sdk` - SDK管理
- `/admin` - 管理后台

## 默认用户

- 用户名: admin
- 密码: admin123

## 项目结构

```
may-86792/
├── backend/
│   ├── server.js
│   ├── database/
│   │   └── init.js
│   ├── routes/
│   │   ├── devices.js
│   │   ├── panels.js
│   │   ├── epg.js
│   │   ├── analytics.js
│   │   ├── sdk.js
│   │   ├── auth.js
│   │   └── control.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── data/
│   └── app.sqlite
├── start.sh
├── SPEC.md
├── README.md
└── .env
```

## 技术说明

### 红外学习
系统提供模拟的红外学习功能，用户可以通过摄像头扫描遥控器按键来生成红外码库。实际的红外信号处理和发送需要配合硬件设备。

### Wi-Fi设备
Wi-Fi设备通过REST API进行控制，系统记录所有控制指令并添加设备指纹水印。

### 蓝牙Mesh
蓝牙Mesh设备通过WebSocket进行实时通信，支持设备状态推送和批量控制。

### 安全机制
- 设备指纹水印：每个控制指令都包含唯一的设备指纹
- 用户确认：红外学习需要用户物理按键确认
- TLS加密：Wi-Fi通信使用TLS 1.3加密（模拟）

## 注意事项

1. 端口冲突：如果端口被占用，系统会自动切换到备用端口
2. 数据库：SQLite文件存储在`data/app.sqlite`
3. 日志：前后端日志分别记录在`backend.log`和`frontend.log`
4. 进程管理：使用`./start.sh`脚本管理服务生命周期
