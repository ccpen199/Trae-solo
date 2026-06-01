# 消防接处警调度系统 - 测试验收文档

## 项目信息
- 项目名称：消防接处警调度系统
- 项目目录：`/Users/chen/Documents/trae_projects/local_projects/may-63443`
- 前端端口：44443（备用槽位1，原43443被占用）
- 后端端口：54443（备用槽位1，原53443被占用）
- 数据库：SQLite (`backend/data/fire_dispatch.db`)

## 启动方式

### 启动服务
```bash
# 方式1：使用启动脚本
./start.sh

# 方式2：手动启动
# 后端
cd backend && nohup node server.js > ../backend.log 2>&1 < /dev/null &

# 前端  
cd frontend && nohup npx vite --host 127.0.0.1 --port 44443 --strictPort > ../frontend.log 2>&1 < /dev/null &
```

### 停止服务
```bash
./stop.sh
```

### 检查服务状态
```bash
PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-63443"
FRONTEND_PORT=44443
BACKEND_PORT=54443

# 检查端口监听
lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN
lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN

# 检查进程状态
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
ps -o pid=,stat=,command= -p $frontend_pid
ps -o pid=,stat=,command= -p $backend_pid

# HTTP 检查
curl -I --max-time 5 http://127.0.0.1:44443/
curl -sS --max-time 5 http://127.0.0.1:54443/api/health
```

## 主要文件结构

```
may-63443/
├── .env                          # 环境配置（端口、API地址）
├── start.sh                      # 启动脚本
├── stop.sh                       # 停止脚本
├── test-flow.js                  # 业务链路测试脚本
├── backend.log                   # 后端日志
├── frontend.log                  # 前端日志
├── backend/
│   ├── package.json
│   ├── server.js                 # 后端主服务（所有API）
│   ├── db.js                     # 数据库连接
│   ├── scripts/
│   │   └── init-db.js            # 数据库初始化脚本
│   └── data/
│       └── fire_dispatch.db      # SQLite数据库文件
└── frontend/
    ├── package.json
    ├── vite.config.js            # Vite配置（strictPort、代理）
    ├── index.html
    └── src/
        ├── main.js               # 前端入口
        ├── App.vue               # 根组件（布局+导航）
        ├── api/index.js          # API接口封装
        ├── router/index.js       # 路由配置
        └── views/
            ├── Dashboard.vue     # 首页仪表盘
            ├── AlarmDesk.vue     # 接警台
            ├── Dispatch.vue      # 警情研判与派警
            ├── Scene.vue         # 现场处置回传
            ├── Reports.vue       # 复盘报表
            └── Resources.vue     # 资源管理
```

## 核心API列表

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/alarms` | 警情列表（分页、筛选） |
| GET | `/api/alarms/:id` | 警情详情（含派警、更新、时间线） |
| POST | `/api/alarms` | 创建接警记录 |
| POST | `/api/alarms/:id/recommend` | 力量推荐（距离、等级、灾种） |
| POST | `/api/alarms/:id/false-alarm` | 标记误报 |
| GET | `/api/dispatches` | 派警列表 |
| GET | `/api/dispatches/:id` | 派警详情 |
| POST | `/api/dispatches` | 创建派警 |
| POST | `/api/dispatches/:id/arrive` | 标记到场 |
| POST | `/api/dispatches/:id/timeout` | 超时提醒 |
| GET | `/api/scene-updates` | 现场回传列表 |
| POST | `/api/scene-updates` | 提交现场回传 |
| GET | `/api/reports/summary` | 复盘报表统计 |
| GET | `/api/stations` | 消防站列表 |
| GET | `/api/vehicles` | 车辆列表 |
| GET | `/api/firefighters` | 人员列表 |
| GET | `/api/key-locations` | 重点场所列表 |
| GET | `/api/timeline/:alarmId` | 警情时间线 |

---

## 四类测试样例

### 📌 样例1：正常业务流程（正常）

**测试目的**：验证完整接处警业务链路是否正常

**测试步骤**：
1. 接警员在接警台录入警情
2. 系统根据距离、灾种、等级推荐出动力量
3. 指挥员确认派警
4. 力量到场后标记到场
5. 现场队伍回传火势、救援进展
6. 处置结束提交结果
7. 查看复盘报表统计

**测试数据**：
```javascript
// 1. 创建接警
POST /api/alarms
{
  "caller_name": "张三",
  "caller_phone": "13800138000",
  "location": "市中心人民路100号城市中心广场",
  "lng": 116.403874,
  "lat": 39.916666,
  "disaster_type": "火灾",
  "disaster_level": "较大",
  "people_trapped": 2,
  "building_type": "高层建筑",
  "hazardous_materials": "无",
  "recording_index": "REC20260528001",
  "receiver": "接警员小李",
  "notes": "广场南侧商铺起火"
}

// 2. 力量推荐
POST /api/alarms/:id/recommend
{}

// 3. 确认派警
POST /api/dispatches
{
  "alarm_id": 1,
  "commander": "张建国",
  "vehicle_ids": [1, 2, 3, 4],
  "firefighter_ids": [1, 2, 3, 4, 5, 6]
}

// 4. 标记到场
POST /api/dispatches/:id/arrive
{ "reporter": "张建国" }

// 5. 现场回传
POST /api/scene-updates
{
  "alarm_id": 1,
  "dispatch_id": 1,
  "update_type": "火势报告",
  "fire_intensity": "猛烈燃烧",
  "rescue_progress": "正在疏散",
  "reporter": "张建国"
}

// 6. 处置结束
POST /api/scene-updates
{
  "alarm_id": 1,
  "dispatch_id": 1,
  "update_type": "处置结束",
  "notes": "火势已扑灭，无伤亡",
  "reporter": "张建国"
}
```

**预期结果**：
- 所有接口返回 200 且 `success: true`
- 警情状态流转：待研判 → 处置中 → 已结束
- 时间线完整记录所有操作
- 报表统计数据正确更新

**验证命令**：
```bash
node test-flow.js
```

---

### 📌 样例2：边界条件测试（边界）

**测试目的**：验证系统在边界条件下的表现

**测试场景**：

#### 场景A：极端警情等级
```javascript
// 重大警情 + 多人被困 + 危化品
POST /api/alarms
{
  "location": "东区化工路1号石化总厂",
  "disaster_type": "危化品火灾",
  "disaster_level": "重大",
  "people_trapped": 10,
  "hazardous_materials": "甲醇、苯",
  "receiver": "接警员小王"
}

// 预期：推荐至少4辆车，包含泡沫车
POST /api/alarms/:id/recommend
```

**预期**：推荐车辆包含泡沫车，数量≥4

#### 场景B：误报处理
```javascript
// 创建警情后标记为误报
POST /api/alarms
{
  "location": "测试地点",
  "disaster_type": "火灾",
  "receiver": "接警员小李"
}

POST /api/alarms/:id/false-alarm
{
  "reason": "小孩误报火警电话",
  "confirmed_by": "指挥员张建国"
}
```

**预期**：警情状态变为「误报」，报表误报率统计更新

#### 场景C：超时提醒
```javascript
// 创建派警后触发超时提醒
POST /api/dispatches/:id/timeout
{ "reporter": "调度员" }
```

**预期**：`timeout_reminded` 字段递增，时间线记录超时提醒

---

### 📌 样例3：并发与冲突测试（冲突）

**测试目的**：验证资源调度冲突处理

**测试场景**：

#### 场景A：车辆重复派警
```javascript
// 派警1使用车辆1、2
POST /api/dispatches
{
  "alarm_id": 1,
  "vehicle_ids": [1, 2],
  "firefighter_ids": [1, 2, 3]
}

// 立即派警2也使用车辆1、2
POST /api/dispatches
{
  "alarm_id": 2,
  "vehicle_ids": [1, 2],
  "firefighter_ids": [1, 2, 3]
}

// 检查车辆状态
GET /api/vehicles
```

**预期**：
- 车辆1、2状态变为「出警中」
- 第二次派警后再次推荐时，车辆1、2不再出现在可用列表中

#### 场景B：多警情同时调度
```javascript
// 同时创建3个警情并派警
// 验证车辆、人员状态正确流转
// 验证报表统计正确
```

---

### 📌 样例4：错误与失败测试（失败）

**测试目的**：验证系统错误处理和参数校验

**测试场景**：

#### 场景A：必填参数缺失
```javascript
// 缺少地点和灾种
POST /api/alarms
{ "caller_name": "张三" }

// 预期返回 400: {"error": "地点和灾种为必填项"}
```

#### 场景B：不存在的资源
```javascript
// 访问不存在的警情
GET /api/alarms/99999
// 预期返回 404: {"error": "Alarm not found"}

// 派警使用不存在的车辆
POST /api/dispatches
{
  "alarm_id": 1,
  "vehicle_ids": [99999]
}
// 预期：数据库外键约束错误或状态异常
```

#### 场景C：误报原因缺失
```javascript
POST /api/alarms/1/false-alarm
{}
// 预期返回 400: {"error": "误报原因必填"}
```

---

## 测试路径与导出核对

### 页面操作路径

| 角色 | 操作路径 | 页面 |
|------|---------|------|
| 接警员 | 首页 → 接警台 → 录入信息 → 提交 | AlarmDesk.vue |
| 指挥员 | 派警调度 → 选择待研判警情 → 查看推荐 → 调整力量 → 确认派警 | Dispatch.vue |
| 消防站 | 派警调度 → 查看派警 → 标记到场 | Dispatch.vue |
| 现场队伍 | 现场处置 → 选择警情 → 提交回传（火势/救援/伤亡/结束） | Scene.vue |
| 管理员 | 复盘报表 → 查看统计图表 → 导出数据 | Reports.vue |
| 管理员 | 资源管理 → 站点/车辆/人员/重点场所 | Resources.vue |

### 数据导出核对

#### 数据库表核对
```bash
# 进入数据库
cd backend && sqlite3 data/fire_dispatch.db

-- 警情数量
SELECT COUNT(*) FROM alarms;

-- 各状态警情统计
SELECT status, COUNT(*) FROM alarms GROUP BY status;

-- 派警数量
SELECT COUNT(*) FROM dispatches;

-- 现场回传数量
SELECT COUNT(*) FROM scene_updates;

-- 时间线完整性
SELECT a.alarm_no, COUNT(t.id) as timeline_count
FROM alarms a LEFT JOIN timelines t ON a.id = t.alarm_id
GROUP BY a.id;

-- 力量调派统计
SELECT s.station_name, COUNT(dv.id) as dispatch_count
FROM stations s
LEFT JOIN vehicles v ON s.id = v.station_id
LEFT JOIN dispatch_vehicles dv ON v.id = dv.vehicle_id
GROUP BY s.id;
```

#### API数据核对
```bash
# 警情列表
curl -sS http://127.0.0.1:54443/api/alarms | python3 -m json.tool

# 单警情详情（含时间线）
curl -sS http://127.0.0.1:54443/api/alarms/1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('警情号:', d['alarm_no'])
print('状态:', d['status'])
print('派警数:', len(d['dispatches']))
print('回传数:', len(d['updates']))
print('时间线事件数:', len(d['timeline']))
for t in d['timeline']:
    print(f\"  {t['event_type']}: {t['event_content'][:50]}\")
"

# 报表统计
curl -sS http://127.0.0.1:54443/api/reports/summary | python3 -m json.tool
```

---

## 验收标准

### ✅ 启动验收
- [ ] 前端端口 44443 监听，进程状态非 T/Z
- [ ] 后端端口 54443 监听，进程状态非 T/Z
- [ ] `curl http://127.0.0.1:44443/` 返回 HTTP 200
- [ ] `curl http://127.0.0.1:54443/api/health` 返回 `{"status": "ok"}`

### ✅ 功能验收
- [ ] 接警录入成功，警情入库
- [ ] 力量推荐算法正确（距离、等级、灾种匹配）
- [ ] 派警成功，车辆人员状态更新
- [ ] 现场回传成功，时间线完整
- [ ] 处置结束后状态正确流转
- [ ] 报表统计数据准确
- [ ] 误报标记功能正常
- [ ] 超时提醒功能正常

### ✅ 数据验收
- [ ] 所有核心操作均有时间线记录
- [ ] 车辆人员状态流转正确（待命→出警中→待命）
- [ ] 数据库表关系正确，外键约束有效
- [ ] 报表统计与原始数据一致

### ✅ 前端验收
- [ ] 首页仪表盘加载正常，数据显示正确
- [ ] 接警台表单完整，提交成功
- [ ] 派警调度页面显示待研判警情，推荐力量正确
- [ ] 现场处置页面可提交回传
- [ ] 复盘报表图表渲染正常
- [ ] 资源管理页面数据加载正常
- [ ] 浏览器控制台无 SyntaxError / Uncaught 错误
- [ ] API 请求无 500 错误

---

## 端口配置说明

项目目录 `may-63443`，N=63443，tail4=3443

| 槽位 | 前端端口 | 后端端口 | 状态 |
|------|---------|---------|------|
| 0 | 43443 | 53443 | 被其他项目占用 |
| 1 | 44443 | 54443 | ✅ 已使用 |
| 2 | 45443 | 55443 | 备用 |
| 3 | 46443 | 56443 | 备用 |
| 4 | 47443 | 57443 | 备用 |
| 5 | 48443 | 58443 | 备用 |

> 端口占用时自动切换到下一可用槽位并写回 `.env`
