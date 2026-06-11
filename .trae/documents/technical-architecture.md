## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React SPA 管理控制台"]
        B["路由管理 (React Router)"]
        C["状态管理 (Zustand)"]
    end

    subgraph "数据模拟层"
        D["Mock 数据服务"]
        E["模拟 WebSocket 实时推送"]
        F["本地存储 (localStorage)"]
    end

    subgraph "可视化层"
        G["ECharts 图表引擎"]
        H["Leaflet 地图引擎"]
        I["Canvas 动效引擎"]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> G
    A --> H
    A --> I
    D --> F
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript@5
- **样式方案**：Tailwind CSS@3 + CSS Variables 主题系统
- **构建工具**：Vite@5
- **路由**：React Router@6
- **状态管理**：Zustand@4
- **图表库**：ECharts@5（折线图/饼图/雷达图/热力图/条形图）
- **地图库**：Leaflet@1 + react-leaflet（GIS地图展示）
- **动画库**：Framer Motion@11（页面过渡/微交互）
- **图标库**：Lucide React
- **数据模拟**：Mock数据 + 模拟WebSocket实时推送
- **后端**：无（纯前端项目，所有数据本地模拟）
- **数据库**：无（使用localStorage持久化 + 内存数据）

## 3. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| `/` | 重定向至仪表盘 | 全部角色 |
| `/dashboard` | 运营仪表盘，核心指标总览 | 全部角色 |
| `/map` | 充电桩GIS地图管理 | 运营/运维/超管 |
| `/devices` | 设备管理中心，充电桩列表 | 运营/运维/超管 |
| `/devices/:id` | 充电桩详情，端口状态/远程控制 | 运营/运维/超管 |
| `/orders` | 订单与计费管理 | 运营/财务/超管 |
| `/billing` | 分时电价与计费规则配置 | 财务/超管 |
| `/alerts` | 安全与告警中心 | 运维/运营/超管 |
| `/safety` | 充电安全策略中心 | 运维/超管 |
| `/users` | 用户与信用管理 | 运营/超管 |
| `/settlement` | 结算与分润管理 | 财务/超管 |
| `/prediction` | 故障预测与设备健康度 | 运维/超管 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    "充电站" ||--o{ "充电桩" : "包含"
    "充电桩" ||--o{ "充电端口" : "包含"
    "用户" ||--o{ "充电订单" : "发起"
    "充电端口" ||--o{ "充电订单" : "产生"
    "充电订单" ||--|| "计费明细" : "对应"
    "充电订单" ||--o{ "告警记录" : "触发"
    "充电桩" ||--o{ "告警记录" : "产生"
    "充电订单" ||--o{ "清分明细" : "拆分为"
    "充电桩" ||--o{ "固件升级记录" : "升级"
    "用户" ||--o{ "信用变动记录" : "记录"

    "充电站" {
        string station_id "站点ID"
        string name "站点名称"
        float longitude "经度"
        float latitude "纬度"
        string address "详细地址"
        string region "所属区域"
        int total_piles "桩总数"
        string status "运营状态"
    }

    "充电桩" {
        string pile_id "桩ID"
        string station_id "所属站点ID"
        string pile_type "桩类型(两轮/三轮/四轮)"
        string model "设备型号"
        string firmware_version "固件版本"
        float online_rate "在线率"
        string status "状态(充电中/空闲/故障/离线)"
        int health_score "健康度评分"
    }

    "充电端口" {
        string port_id "端口ID"
        string pile_id "所属桩ID"
        int port_number "端口号"
        string status "端口状态"
        float max_power "最大功率(W)"
        float current_power "当前功率(W)"
    }

    "用户" {
        string user_id "用户ID"
        string phone "手机号"
        string nickname "昵称"
        int credit_score "信用分(0-100)"
        int charge_count "充电次数"
        string status "状态(正常/降权/黑名单)"
        datetime last_active "最后活跃时间"
    }

    "充电订单" {
        string order_id "订单ID"
        string user_id "用户ID"
        string port_id "端口ID"
        string pile_id "桩ID"
        string station_id "站点ID"
        datetime start_time "开始时间"
        datetime end_time "结束时间"
        float energy_kwh "充电电量(kWh)"
        float total_amount "总金额(元)"
        string status "状态(充电中/已完成/异常终止)"
        string start_method "启动方式(扫码/蓝牙/NFC)"
    }

    "计费明细" {
        string order_id "订单ID"
        float peak_energy "峰时电量"
        float flat_energy "平时电量"
        float valley_energy "谷时电量"
        float peak_price "峰时电价"
        float flat_price "平时电价"
        float valley_price "谷时电价"
        float service_fee "服务费"
        float total_electric_fee "总电费"
        float total_amount "总金额"
    }

    "告警记录" {
        string alert_id "告警ID"
        string pile_id "桩ID"
        string order_id "关联订单ID"
        string alert_type "类型(过载/高温/断连/拔枪)"
        string severity "等级(紧急/重要/一般)"
        string status "状态(待处理/已处理)"
        datetime triggered_at "触发时间"
        string description "描述"
        string snapshot_json "参数快照JSON"
    }

    "清分明细" {
        string settlement_id "清分ID"
        string order_id "订单ID"
        float total_amount "总金额"
        float grid_share "电网公司份额"
        float property_share "物业份额"
        float operator_share "运营方份额"
        string grid_rule "电网分润规则"
        string property_rule "物业分润规则"
        datetime settled_at "结算时间"
    }

    "固件升级记录" {
        string upgrade_id "升级ID"
        string pile_id "桩ID"
        string from_version "原版本"
        string to_version "目标版本"
        string status "状态(升级中/成功/失败)"
        datetime started_at "开始时间"
        datetime completed_at "完成时间"
    }

    "信用变动记录" {
        string record_id "记录ID"
        string user_id "用户ID"
        int score_change "分数变动"
        string reason "变动原因"
        string rule_id "触发规则ID"
        datetime created_at "记录时间"
    }
```

### 4.2 模拟数据策略

- 使用 `src/mock/` 目录存放模拟数据生成器
- 充电站数据：模拟5个站点，共30台充电桩，120个端口
- 用户数据：模拟50个用户，含不同信用等级
- 订单数据：模拟最近30天500+笔订单
- 告警数据：模拟最近7天100+条告警
- 实时数据：使用 `setInterval` 模拟WebSocket推送，每5秒更新充电桩状态与功率
