# 跨协议家电远程控制服务平台 - 技术规格文档

## 1. 项目概述

### 项目名称
Cross-Protocol Smart Home Controller (跨协议家电远程控制服务平台)

### 项目标识
- 项目目录: may-86792
- 前端端口: 46792 (FRONTEND_PORT=40000+6792)
- 后端端口: 56792 (BACKEND_PORT=50000+6792)

### 核心功能定位
支持红外（IR）、Wi-Fi、蓝牙Mesh三类通信协议的智能家居控制平台，提供设备自动识别、遥控面板自定义、电视EPG集成、设备能力管理和安全控制功能。

### 目标用户
- 家庭用户：希望通过统一平台控制多品牌家电
- 设备厂商：提交SDK适配包进行设备接入
- 集成商：对接智能家居平台

## 2. 技术架构

### 2.1 技术栈

#### 后端
- **框架**: Node.js + Express.js
- **数据库**: SQLite (data/app.sqlite)
- **ORM**: better-sqlite3
- **实时通信**: WebSocket (Socket.io)
- **安全**: JWT + TLS1.3模拟 + 设备指纹

#### 前端
- **框架**: React 18 + Vite
- **路由**: React Router v6
- **状态管理**: Zustand
- **UI组件**: TailwindCSS + 自定义组件
- **拖拽**: React DnD / @dnd-kit
- **图表**: Recharts

### 2.2 系统架构

```
┌─────────────────────────────────────────┐
│          前端 (React + Vite)            │
│  46792                                  │
└──────────────┬──────────────────────────┘
               │ HTTP/WebSocket
               ↓
┌─────────────────────────────────────────┐
│          后端 (Express)                 │
│  56792                                  │
└────────┬────────┬─────────┬────────────┘
         │        │         │
    ┌────↓───┐ ┌──↓──┐   ┌─↓──────────┐
    │ SQLite │ │ EPF │   │ 协议适配器  │
    │  DB    │ │ 数据 │   │ IR/WiFi/Mesh│
    └────────┘ └─────┘   └────────────┘
```

## 3. 功能模块设计

### 3.1 设备协议支持模块

#### 3.1.1 红外（IR）协议
- **设备识别**: 通过摄像头扫描遥控器按键，捕获红外信号
- **码库管理**: 存储/检索红外码值（NEC/RC5/RC6等格式）
- **波形分析**: 解析载波频率、脉冲宽度、引导码
- **码库生成**: 从扫描数据生成设备码库

#### 3.1.2 Wi-Fi协议
- **设备发现**: mDNS/DNSSD服务发现
- **设备配网**: SmartConfig/AP模式配网
- **TLS加密**: 强制TLS1.3加密通信
- **心跳保持**: 设备在线状态监控

#### 3.1.3 蓝牙Mesh协议
- **Mesh网络**: 支持蓝牙Mesh组网
- **节点管理**: Mesh设备入网/退网
- **消息分发**: 发布-订阅消息模式
- **故障转移**: 节点故障自动绕路

### 3.2 红外学习向导模块

#### 流程设计
1. **准备阶段**: 用户选择遥控器类型（空调/电视/风扇等）
2. **摄像头授权**: 申请摄像头访问权限
3. **按键扫描**: 用户点击"开始学习"，对准遥控器按键
4. **信号捕获**: 捕获红外脉冲序列
5. **码值解析**: 解码信号格式和数据位
6. **用户确认**: 物理按键确认（防止误触发）
7. **码库存储**: 存入数据库并关联设备

#### 关键技术点
- 使用WebRTC获取摄像头流
- Canvas绘制红外信号波形
- 自定义信号处理算法
- 前端信号模拟（无实际硬件）

### 3.3 万能遥控面板模块

#### 界面设计
- **布局引擎**: 网格化布局，支持自由拖拽
- **按键组件**: 支持多种样式（圆形/方形/图标）
- **事件类型**: 短按（<500ms）/ 长按（>=500ms）
- **组合按键**: 宏命令，支持延时序列
- **主题定制**: 深色/浅色/自定义配色

#### 拖拽交互
- 使用@dnd-kit实现拖拽
- 支持多选批量操作
- 吸附网格对齐
- 支持撤销/重做

### 3.4 电视服务模块

#### 3.4.1 EPG数据源
- **数据接口**: 模拟广电EPG API
- **节目单**: 支持7天节目预报
- **实时同步**: 每15分钟刷新节目数据
- **频道管理**: 支持频道增删改查

#### 3.4.2 预约录制
- **录制计划**: 定时录制预约
- **录制状态**: 待执行/执行中/已完成/失败
- **存储管理**: 本地文件记录（模拟）
- **提醒通知**: 录制前15分钟提醒

#### 3.4.3 内容偏好分析
- **观看日志**: 记录观看时长/跳过次数
- **兴趣标签**: 基于行为生成标签（体育/综艺/剧集等）
- **推荐算法**: 简单协同过滤
- **用户画像**: 可视化兴趣分布

### 3.5 设备能力模型

#### 标准化描述
```json
{
  "device_type": "air_conditioner",
  "capabilities": {
    "temperature_control": {
      "type": "range",
      "min": 16,
      "max": 30,
      "unit": "celsius"
    },
    "mode_switch": {
      "type": "enum",
      "options": ["cool", "heat", "fan", "auto", "dry"]
    },
    "fan_speed": {
      "type": "enum",
      "options": ["low", "medium", "high", "auto"]
    }
  },
  "protocol": "IR",
  "manufacturer": "示例厂商",
  "model": "AC-1234"
}
```

#### SDK适配包管理
- **上传**: 支持JSON格式能力描述文件
- **沙箱测试**: 隔离环境测试设备控制
- **版本管理**: 多版本并存，支持回滚
- **审核流程**: 提交→测试→上线

### 3.6 安全机制

#### 3.6.1 红外学习确认
- **主动触发**: 必须用户点击"学习"按钮
- **物理确认**: 学习成功后需物理按键确认
- **超时机制**: 30秒无操作自动取消
- **审计日志**: 记录学习操作

#### 3.6.2 Wi-Fi TLS加密
- **强制TLS1.3**: 所有Wi-Fi通信使用TLS1.3
- **证书管理**: 自签名证书生成和验证
- **密钥交换**: 支持ECDHE_RSA_AES_256_GCM_SHA384
- **连接追踪**: 记录所有Wi-Fi连接

#### 3.6.3 设备指纹水印
- **指纹生成**: 设备型号+序列号+时间戳
- **水印嵌入**: 指令序列中嵌入水印
- **溯源追踪**: 记录水印对应的控制记录
- **防伪验证**: 检测异常水印

### 3.7 使用报告模块

#### 统计数据
- **设备使用时长**: 每日/每周/每月使用时长
- **操作频次**: 按设备/按键统计
- **能效分析**: 空调温度设置分布
- **异常报告**: 设备离线/控制失败统计

#### 可视化
- **趋势图表**: 使用时长折线图
- **分布饼图**: 设备使用占比
- **热力图**: 按时间段使用分布
- **导出功能**: 支持CSV/PDF导出

### 3.8 API开放平台

#### REST API
- **设备管理**: CRUD设备
- **遥控指令**: 下发控制指令
- **状态查询**: 设备实时状态
- **数据分析**: 使用报告接口

#### WebSocket API
- **实时推送**: 设备状态变更
- **故障告警**: 异常情况推送
- **EPG更新**: 节目单推送

## 4. 数据库设计

### 4.1 核心表结构

#### devices（设备表）
```sql
CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type TEXT NOT NULL,
  name TEXT NOT NULL,
  protocol ENUM('IR', 'WIFI', 'BLUETOOTH_MESH') NOT NULL,
  manufacturer TEXT,
  model TEXT,
  fingerprint TEXT,
  status ENUM('online', 'offline', 'error') DEFAULT 'offline',
  last_control_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### ir_codes（红外码表）
```sql
CREATE TABLE ir_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER REFERENCES devices(id),
  code_type TEXT NOT NULL,
  key_name TEXT NOT NULL,
  code_data BLOB NOT NULL,
  frequency INTEGER,
  format TEXT,
  event_type ENUM('short', 'long') DEFAULT 'short',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### remote_panels（遥控面板表）
```sql
CREATE TABLE remote_panels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER REFERENCES devices(id),
  name TEXT NOT NULL,
  layout_data JSON NOT NULL,
  theme TEXT DEFAULT 'light',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### control_logs（控制日志表）
```sql
CREATE TABLE control_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER REFERENCES devices(id),
  command TEXT NOT NULL,
  watermark TEXT,
  result ENUM('success', 'failure', 'timeout') NOT NULL,
  response_time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### epg_programs（节目单表）
```sql
CREATE TABLE epg_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  description TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### recording_schedules（录制计划表）
```sql
CREATE TABLE recording_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER REFERENCES epg_programs(id),
  status ENUM('pending', 'recording', 'completed', 'failed') DEFAULT 'pending',
  scheduled_time DATETIME NOT NULL,
  completed_time DATETIME,
  file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### watch_logs（观看日志表）
```sql
CREATE TABLE watch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  program_id INTEGER REFERENCES epg_programs(id),
  watch_duration INTEGER NOT NULL,
  skip_count INTEGER DEFAULT 0,
  category TEXT,
  watched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### device_capabilities（设备能力表）
```sql
CREATE TABLE device_capabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type TEXT NOT NULL,
  capabilities JSON NOT NULL,
  version TEXT NOT NULL,
  status ENUM('draft', 'testing', 'published', 'deprecated') DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### sdk_packages（SDK包表）
```sql
CREATE TABLE sdk_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT NOT NULL,
  version TEXT NOT NULL,
  device_type TEXT NOT NULL,
  package_data JSON NOT NULL,
  test_result JSON,
  status ENUM('pending', 'testing', 'approved', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### usage_reports（使用报告表）
```sql
CREATE TABLE usage_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER REFERENCES devices(id),
  report_date DATE NOT NULL,
  total_duration INTEGER DEFAULT 0,
  control_count INTEGER DEFAULT 0,
  avg_power_level REAL,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 5. API接口设计

### 5.1 设备管理
- `GET /api/devices` - 获取设备列表
- `POST /api/devices` - 创建设备
- `GET /api/devices/:id` - 获取设备详情
- `PUT /api/devices/:id` - 更新设备
- `DELETE /api/devices/:id` - 删除设备

### 5.2 遥控控制
- `POST /api/devices/:id/control` - 下发控制指令
- `POST /api/devices/:id/learn` - 红外学习
- `GET /api/devices/:id/status` - 获取设备状态

### 5.3 面板管理
- `GET /api/panels` - 获取面板列表
- `POST /api/panels` - 创建面板
- `PUT /api/panels/:id` - 更新面板布局
- `DELETE /api/panels/:id` - 删除面板

### 5.4 EPG管理
- `GET /api/epg/programs` - 获取节目单
- `GET /api/epg/channels` - 获取频道列表
- `POST /api/recordings` - 创建录制计划
- `GET /api/recordings` - 获取录制列表

### 5.5 数据分析
- `GET /api/analytics/usage` - 使用报告
- `GET /api/analytics/preferences` - 偏好分析
- `GET /api/analytics/trends` - 趋势分析

### 5.6 SDK管理
- `GET /api/sdk/packages` - SDK包列表
- `POST /api/sdk/upload` - 上传SDK包
- `POST /api/sdk/:id/test` - 测试SDK
- `PUT /api/sdk/:id/approve` - 审核SDK

## 6. 前端页面结构

### 6.1 页面路由
- `/` - 首页仪表盘
- `/devices` - 设备管理列表
- `/devices/:id` - 设备详情
- `/devices/:id/control` - 遥控面板
- `/learn` - 红外学习向导
- `/epg` - 节目单
- `/epg/:channelId` - 频道详情
- `/recordings` - 录制管理
- `/analytics` - 数据分析
- `/sdk` - SDK管理
- `/admin` - 管理后台

### 6.2 核心组件
- `DeviceCard` - 设备卡片
- `RemotePanel` - 遥控面板
- `ControlButton` - 控制按钮
- `EPGProgramCard` - 节目卡片
- `UsageChart` - 使用统计图表
- `LearningWizard` - 学习向导
- `PanelEditor` - 面板编辑器

## 7. 安全实现

### 7.1 认证授权
- JWT token认证
- 角色权限控制（user/admin/vendor）
- API访问频率限制

### 7.2 通信安全
- CORS配置限制
- Helmet安全头
- 请求签名验证

### 7.3 设备指纹水印
```javascript
function generateWatermark(deviceId, command, timestamp) {
  const data = `${deviceId}:${command}:${timestamp}:${SECRET_KEY}`;
  return sha256(data).substring(0, 16);
}
```

## 8. 验收标准

### 8.1 功能验收
- [ ] 支持IR/WiFi/Bluetooth Mesh三类设备管理
- [ ] 红外学习向导可完成码库生成
- [ ] 遥控面板支持拖拽和组合按键
- [ ] EPG节目单显示和录制预约功能
- [ ] 设备能力模型可配置和查询
- [ ] SDK包上传和沙箱测试流程
- [ ] 安全机制（水印/加密/用户确认）已实现
- [ ] 使用报告正确生成和展示
- [ ] API接口可正常调用

### 8.2 技术验收
- [ ] 前端端口: 46792
- [ ] 后端端口: 56792
- [ ] SQLite数据库正常读写
- [ ] 所有核心操作落库
- [ ] 前后端进程隔离管理
- [ ] 端口占用检测和备用槽位切换
- [ ] 服务启动稳定性验证

### 8.3 用户验收
- [ ] 设备添加向导流程顺畅
- [ ] 遥控面板操作响应及时
- [ ] 数据报告可视化清晰
- [ ] 管理后台功能完整
