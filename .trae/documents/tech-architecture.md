## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (Frontend)"
        A["React 18 + Vite"]
        B["React Router 路由管理"]
        C["Zustand 状态管理"]
        D["Recharts 数据可视化"]
        E["TailwindCSS 样式系统"]
    end
    
    subgraph "后端服务层 (Backend)"
        F["Express API 服务"]
        G["WebSocket 实时通信"]
        H["设备模拟引擎"]
        I["Mock 数据生成器"]
    end
    
    subgraph "数据层 (Data)"
        J["内存数据存储"]
        K["模拟设备状态数据"]
        L["模拟告警事件数据"]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    
    A -->|"HTTP/REST"| F
    A -->|"WebSocket"| G
    
    F --> H
    G --> H
    H --> J
    H --> K
    H --> L
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **路由管理**：React Router v6
- **状态管理**：Zustand
- **样式方案**：TailwindCSS 3
- **图表库**：Recharts
- **图标库**：Lucide React
- **后端服务**：Express 4
- **实时通信**：WebSocket (ws)
- **数据方案**：Mock 数据 + 内存存储（开发阶段）
- **初始化方式**：Vite 脚手架初始化

## 3. 路由定义

| 路由路径 | 页面名称 | 模块说明 |
|----------|----------|----------|
| /dashboard | 设备健康看板 | 首页概览，设备健康度指标展示 |
| /monitor | 实时视频监控 | 视频流播放、双链路状态、快捷操作 |
| /events | AI侦测事件 | 告警事件列表、识别统计、告警配置 |
| /ota | 固件OTA管理 | 版本管理、升级进度、升级历史 |
| /geofence | 地理围栏设置 | 围栏配置、触发规则设置 |
| /privacy | 隐私与存储 | 加密设置、存储管理、视频片段 |
| /logs | 语音对讲与日志 | 通话记录、夜视日志、设备日志 |

## 4. API 定义

### 4.1 REST API

```typescript
// 设备健康数据
interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  online: boolean;
  signalStrength: number; // -50 ~ -100 dBm
  storageTotal: number;   // GB
  storageUsed: number;    // GB
  batteryLevel: number;   // 0-100%
  batteryHealth: number;  // 0-100%
  firmwareVersion: string;
  lastSeen: string;
}

// 信号强度历史
interface SignalHistory {
  timestamp: string;
  value: number;
}

// 电池衰减数据
interface BatteryTrend {
  date: string;
  capacity: number; // 相对初始容量百分比
}

// 告警事件
interface AlertEvent {
  id: string;
  type: 'visitor' | 'family' | 'pet' | 'motion';
  timestamp: string;
  thumbnail: string;
  confidence: number;
  deviceId: string;
  read: boolean;
}

// OTA 升级状态
interface OtaStatus {
  currentVersion: string;
  latestVersion: string;
  upgradeProgress: number; // 0-100
  upgradeStatus: 'idle' | 'downloading' | 'verifying' | 'installing' | 'rebooting' | 'success' | 'failed';
  breakpoint: number | null;
  deltaSize: string;
  fullSize: string;
  releaseNotes: string;
}

// 地理围栏配置
interface GeofenceConfig {
  enabled: boolean;
  homeAddress: string;
  latitude: number;
  longitude: number;
  radius: number; // 米，默认3000
  enterAction: 'silent' | 'notify' | 'disarm';
  exitAction: 'notify' | 'arm' | 'ignore';
}

// 视频链路状态
interface VideoLinkStatus {
  p2p: {
    connected: boolean;
    latency: number; // ms
    bitrate: number; // kbps
  };
  relay: {
    connected: boolean;
    latency: number;
    bitrate: number;
  };
  activeLink: 'p2p' | 'relay';
  resolution: '1080p' | '720p' | '480p';
  fps: number;
  codec: 'H.265' | 'H.264';
}

// 夜视日志
interface NightVisionLog {
  id: string;
  timestamp: string;
  event: 'ir_on' | 'ir_off' | 'exposure_adjust';
  lightLevel: number; // lux
  exposureCompensation: number; // EV
  reason: string;
}

// 通话记录
interface CallRecord {
  id: string;
  startTime: string;
  duration: number; // 秒
  direction: 'incoming' | 'outgoing';
  quality: number; // 1-5
  noiseReduction: boolean;
  echoCancellation: boolean;
}
```

### 4.2 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/devices | 获取设备列表及健康状态 |
| GET | /api/devices/:id | 获取设备详情 |
| GET | /api/devices/:id/signal/history | 获取信号强度历史数据 |
| GET | /api/devices/:id/battery/trend | 获取电池衰减趋势 |
| GET | /api/alerts | 获取告警事件列表 |
| GET | /api/alerts/stats | 获取告警分类统计 |
| PUT | /api/alerts/:id/read | 标记告警已读 |
| GET | /api/ota/status | 获取OTA升级状态 |
| POST | /api/ota/start | 开始固件升级 |
| POST | /api/ota/pause | 暂停升级（断点续传） |
| GET | /api/ota/history | 获取升级历史 |
| GET | /api/geofence | 获取地理围栏配置 |
| PUT | /api/geofence | 更新地理围栏配置 |
| GET | /api/video/link-status | 获取视频链路状态 |
| GET | /api/logs/night-vision | 获取夜视日志 |
| GET | /api/logs/calls | 获取通话记录 |
| GET | /api/privacy/storage | 获取存储使用情况 |
| PUT | /api/privacy/encryption | 更新加密设置 |

### 4.3 WebSocket 事件

| 事件名 | 方向 | 说明 |
|--------|------|------|
| device_status | S→C | 设备在线状态变更 |
| alert_new | S→C | 新告警事件推送 |
| ota_progress | S→C | OTA升级进度实时推送 |
| video_link_change | S→C | 视频链路切换通知 |
| signal_update | S→C | 信号强度实时更新 |

## 5. 服务端架构图

```mermaid
graph TD
    subgraph "API 层"
        A["Express HTTP 服务器"]
        B["WebSocket 服务器"]
    end
    
    subgraph "控制器层"
        C["设备控制器 DeviceController"]
        D["告警控制器 AlertController"]
        E["OTA控制器 OtaController"]
        F["围栏控制器 GeofenceController"]
        G["日志控制器 LogController"]
    end
    
    subgraph "服务层"
        H["设备模拟服务 DeviceSimulator"]
        I["数据生成服务 MockDataService"]
        J["实时推送服务 RealtimeService"]
    end
    
    subgraph "数据存储层"
        K["内存数据仓库"]
    end
    
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    
    B --> J
    
    C --> H
    D --> H
    E --> H
    
    H --> I
    I --> K
    J --> K
```

## 6. 数据模型

### 6.1 实体关系图

```mermaid
erDiagram
    DEVICE ||--o{ ALERT : triggers
    DEVICE ||--|| OTA_STATUS : has
    DEVICE ||--|| GEOFENCE : uses
    DEVICE ||--o{ CALL_RECORD : has
    DEVICE ||--o{ NV_LOG : generates
    DEVICE ||--|| PRIVACY_SETTING : has
    
    DEVICE {
        string deviceId PK
        string deviceName
        boolean online
        number signalStrength
        number storageTotal
        number storageUsed
        number batteryLevel
        number batteryHealth
        string firmwareVersion
    }
    
    ALERT {
        string id PK
        string type
        datetime timestamp
        number confidence
        string deviceId FK
        boolean read
    }
    
    OTA_STATUS {
        string id PK
        string currentVersion
        string latestVersion
        number progress
        string status
        string deviceId FK
    }
    
    GEOFENCE {
        string id PK
        boolean enabled
        string homeAddress
        number latitude
        number longitude
        number radius
        string deviceId FK
    }
    
    CALL_RECORD {
        string id PK
        datetime startTime
        number duration
        string direction
        number quality
        string deviceId FK
    }
    
    NV_LOG {
        string id PK
        datetime timestamp
        string event
        number lightLevel
        number exposureComp
        string deviceId FK
    }
    
    PRIVACY_SETTING {
        string id PK
        boolean endToEndEncryption
        boolean localOnlyStorage
        string encryptionKey
        string deviceId FK
    }
```

### 6.2 初始数据

系统启动时自动生成以下模拟数据：
- 1 个主猫眼设备（设备ID: doorbell-001）
- 最近 7 天的信号强度历史数据（每小时一个采样点）
- 最近 30 天的电池衰减趋势数据
- 最近 24 小时的告警事件（15-25 条随机生成）
- 3 个 OTA 升级历史记录
- 最近 10 条夜视切换日志
- 最近 5 条通话记录
- 默认地理围栏配置（3km 半径）
