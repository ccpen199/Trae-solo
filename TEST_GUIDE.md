# 上门服务派单系统 - 测试用例与验收指南

## 系统信息

| 项目 | 值 |
|------|-----|
| 项目目录 | may-63424 |
| tail4 | 3424 |
| FRONTEND_PORT | 43424 |
| BACKEND_PORT | 53424 |
| 前端地址 | http://127.0.0.1:43424/ |
| 后端健康检查 | http://127.0.0.1:53424/api/health |
| 数据库 | data/app.sqlite |

---

## 启动说明

### 端口确认命令

```sh
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=43424
BACKEND_PORT=53424
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
echo "Frontend PID: $frontend_pid"
echo "Backend PID:  $backend_pid"
ps -p "$frontend_pid" -o pid=,stat=,command= 2>/dev/null
ps -p "$backend_pid" -o pid=,stat=,command= 2>/dev/null
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
```

### 启动后端（当前已运行）

```sh
cd backend && node server.js
```

### 启动前端（当前已运行）

```sh
cd frontend && npx vite --host 127.0.0.1 --port 43424 --strictPort
```

### 进程终止命令（仅当前项目）

```sh
PROJECT_DIR="$(pwd)"
kill_port_process() {
  PORT=$1
  pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    cwd=$(lsof -p $pid -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1)
    cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"*) kill "$pid" && echo "killed $pid: $cmd" ;;
      *) echo "skip kill: cwd=$cwd cmd=$cmd" ;;
    esac
  fi
}
kill_port_process 43424
kill_port_process 53424
```

---

## 演示账号

| 用户名 | 密码 | 角色 | 姓名 |
|--------|------|------|------|
| customer1 | 123456 | 用户 | 张客户 |
| agent1 | 123456 | 客服 | 李客服 |
| dispatcher1 | 123456 | 调度 | 王调度 |
| engineer1 | 123456 | 工程师 | 赵工程师 |
| finance1 | 123456 | 财务 | 刘财务 |

---

## 主要文件列表

### 后端核心文件

| 文件路径 | 说明 |
|---------|------|
| [backend/server.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/server.js) | Express 主入口，路由挂载，CORS，静态文件 |
| [backend/db.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/db.js) | SQLite 初始化，9张表 schema，种子数据 |
| [backend/middleware/auth.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/middleware/auth.js) | JWT 认证，角色权限中间件 |
| [backend/routes/auth.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/auth.js) | 登录，注册，当前用户信息 |
| [backend/routes/addresses.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/addresses.js) | 地址 CRUD，默认地址管理 |
| [backend/routes/workorders.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/workorders.js) | 工单列表/创建/详情/更新，服务范围检测，SLA 计算 |
| [backend/routes/dispatch.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/dispatch.js) | 工程师推荐（5维打分），派工指派，待派列表 |
| [backend/routes/service.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/service.js) | 服务流程：接单/出发/到场/维修/配件/报价/签字 |
| [backend/routes/exceptions.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/exceptions.js) | 异常上报与处理，工单状态联动 |
| [backend/routes/settlements.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/settlements.js) | 结算生成，多维度报表，确认支付 |
| [backend/routes/upload.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/backend/routes/upload.js) | 文件上传（故障照片/保修凭证/维修照片） |

### 前端核心文件

| 文件路径 | 说明 |
|---------|------|
| [frontend/vite.config.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/vite.config.js) | Vite 配置，strictPort，代理 |
| [frontend/src/App.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/App.jsx) | 路由配置，角色守卫 |
| [frontend/src/api.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/api.js) | API 客户端封装 |
| [frontend/src/components/Layout.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/components/Layout.jsx) | 通用布局，角色菜单，侧栏导航 |
| [frontend/src/pages/Login.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/pages/Login.jsx) | 登录/注册页 |
| [frontend/src/pages/UserSubmit.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/pages/UserSubmit.jsx) | 用户报修页，工单列表，详情弹窗 |
| [frontend/src/pages/DispatchBoard.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/pages/DispatchBoard.jsx) | 调度台，待派工单，推荐工程师卡片 |
| [frontend/src/pages/TechnicianWork.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/pages/TechnicianWork.jsx) | 师傅工作台，步骤条，配件/报价/异常 |
| [frontend/src/pages/ExceptionList.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/pages/ExceptionList.jsx) | 异常列表，筛选，处理表单 |
| [frontend/src/pages/Settlement.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63424/frontend/src/pages/Settlement.jsx) | 结算报表，多维度聚合，生成/确认 |

---

## 四类测试样例

### 1. 正常场景测试

#### 场景 1.1: 用户提交报修单

**测试路径**：customer1 登录 → 提交报修 → 查看工单列表

| 步骤 | 操作 | 预期结果 | API |
|------|------|----------|-----|
| 1 | 用户登录 | 返回 token + 用户信息 | POST /api/auth/login |
| 2 | 获取地址列表 | 返回用户的2个地址 | GET /api/addresses |
| 3 | 提交报修单（地址+故障+期望时间） | 工单创建成功，状态 pending | POST /api/workorders |
| 4 | 查看工单列表 | 新工单出现在列表 | GET /api/workorders |
| 5 | 查看工单详情 | 服务范围标记为"范围内" | GET /api/workorders/:id |

**导出核对**：
- `work_orders` 表新增记录，`in_service_area=1`，`sla_deadline` 按优先级计算
- 数据库核查：`SELECT * FROM work_orders ORDER BY id DESC LIMIT 1;`

#### 场景 1.2: 调度派单 + 工程师接单

**测试路径**：dispatcher1 查看待派工单 → 获取推荐 → 派单 → engineer1 接单

| 步骤 | 操作 | 预期结果 | API |
|------|------|----------|-----|
| 1 | 查看待派工单 | 显示 pending/dispatched 工单 | GET /api/dispatch/pending |
| 2 | 获取推荐工程师 | 返回 Top 5 推荐（含分数和理由） | GET /api/dispatch/recommendations/:id |
| 3 | 指派工程师 | 工单状态变为 dispatched | POST /api/dispatch/assign |
| 4 | 工程师查看待接单 | 工单出现在工程师列表 | GET /api/service/my-orders |
| 5 | 工程师接单 | 工单状态变为 accepted | PATCH /api/dispatch/:id/respond |

**导出核对**：
- `dispatch_records` 表新增记录，status=accepted
- `service_records` 表自动创建记录
- 数据库核查：`SELECT * FROM dispatch_records ORDER BY id DESC LIMIT 1;`

#### 场景 1.3: 完整服务流程 + 用户签字确认

**测试路径**：出发 → 到场 → 维修 → 配件 → 报价 → 签字

| 步骤 | 操作 | 预期结果 | API |
|------|------|----------|-----|
| 1 | 点击"出发" | 状态 departed | PATCH /api/service/:id/depart |
| 2 | 点击"到场" | 状态 arrived | PATCH /api/service/:id/arrive |
| 3 | 记录维修描述 | 状态 repairing | PATCH /api/service/:id/repair |
| 4 | 添加配件使用 | 配件记录入库 | POST /api/service/:id/parts |
| 5 | 提交费用报价 | 状态 quoting | POST /api/service/:id/quote |
| 6 | 用户签字确认 | 状态 completed | POST /api/service/:id/sign |

**导出核对**：
- `service_records` 表各时间点均填充，user_signature 有值
- `parts_usage` 表有配件记录
- `cost_quotes` 表状态 confirmed
- 数据库核查：`SELECT sr.*, cq.total_cost FROM service_records sr LEFT JOIN cost_quotes cq ON sr.id = cq.service_record_id WHERE sr.order_id = 1;`

#### 场景 1.4: 财务结算与报表

**测试路径**：生成结算 → 确认 → 标记已支付 → 查看多维度报表

| 步骤 | 操作 | 预期结果 | API |
|------|------|----------|-----|
| 1 | 生成周期结算 | 生成结算单（含收入+补贴） | POST /api/settlements/generate |
| 2 | 查看结算列表 | 新结算单状态 pending | GET /api/settlements |
| 3 | 确认结算 | 状态 confirmed | PATCH /api/settlements/:id/confirm |
| 4 | 标记已支付 | 状态 paid | PATCH /api/settlements/:id/confirm |
| 5 | 按工程师汇总 | 返回各工程师收入统计 | GET /api/settlements/report?group_by=engineer |
| 6 | 按配件汇总 | 返回各配件用量和费用 | GET /api/settlements/report?group_by=parts |

**导出核对**：
- `settlements` 表记录完整，travel_subsidy=travel_cost * 0.1
- 数据库核查：`SELECT * FROM settlements;`

---

### 2. 边界场景测试

#### 场景 2.1: 服务范围外地址

**前置条件**：创建一个服务范围外的地址（如城市不在 SERVICE_AREAS 中）

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 添加地址（city="深圳市", district="南山区"） | 地址创建成功 |
| 2 | 选择该地址提交报修 | 工单创建成功，in_service_area=0 |
| 3 | 工单列表显示 | 服务范围标记为"范围外"（红色） |

**导出核对**：`SELECT order_no, in_service_area FROM work_orders ORDER BY id DESC LIMIT 1;`

#### 场景 2.2: 多工程师竞派

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 同时给工单派给 engineer1 和 engineer2 | 生成两条 pending 派单记录 |
| 2 | engineer1 接单 | 工单状态 accepted，engineer2 的派单自动 cancelled |

**导出核对**：`SELECT * FROM dispatch_records WHERE order_id = X;` 应有 2 条记录，状态分别为 accepted 和 cancelled

#### 场景 2.3: SLA 紧急度升级

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 创建 urgent 优先级工单 | sla_deadline = 当前时间 + 8 小时 |
| 2 | 调度台获取推荐 | 推荐算法自动加分（+10分），理由含"SLA即将到期" |

---

### 3. 冲突场景测试

#### 场景 3.1: 工程师拒绝派单

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 给工程师派单 | 状态 dispatched |
| 2 | 工程师拒绝派单 | 派单状态 rejected，工单退回 pending |
| 3 | 无其他待处理派单时 | 工单自动恢复为 pending |

#### 场景 3.2: 异常中断服务流程

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 工程师到场后上报异常 | 异常创建，工单状态变为 exception |
| 2 | 调度处理异常，填写结果 | 异常 resolved，工单恢复为 arrived |
| 3 | 工程师可继续服务流程 | 从到场状态继续维修 |

**导出核对**：
- `exceptions` 表 handling_result 字段有值
- `work_orders.status` 回到 arrived
- 数据库核查：`SELECT * FROM exceptions WHERE id = 1;`

#### 场景 3.3: 重复派单

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 工程师已有同一工单的待处理派单 | 再次派单时 API 返回 409，提示"该工程师已被派单" |

---

### 4. 失败场景测试

#### 场景 4.1: 认证失败

| 操作 | 预期结果 |
|------|----------|
| 错误密码登录 | HTTP 401，返回 {"error":"用户名或密码错误"} |
| 无 token 访问受保护接口 | HTTP 401，返回 {"error":"未提供认证令牌"} |
| 错误角色访问（如用户访问调度台）| HTTP 403，返回 {"error":"权限不足"} |

#### 场景 4.2: 参数校验失败

| 操作 | 预期结果 |
|------|----------|
| 创建工单不填故障描述 | HTTP 400，返回 {"error":"故障描述不能为空"} |
| 派单给不存在的工程师 | HTTP 404，返回 {"error":"工程师不存在或不可用"} |
| 维修记录不填描述 | HTTP 400，返回 {"error":"维修描述不能为空"} |
| 已完成工单尝试状态回退 | HTTP 400，返回 {"error":"工单状态不允许"} |

#### 场景 4.3: 状态流约束

| 当前状态 | 非法操作 | 预期结果 |
|----------|----------|----------|
| pending | 直接"到场" | HTTP 400，状态校验失败 |
| arrived | 直接"签字确认" | HTTP 400，必须先报价 |
| completed | 重新出发 | HTTP 400，已完成工单不能操作 |
| exception | 继续维修流程 | HTTP 400，必须先处理异常 |

---

## 数据库导出核对

### 核心表结构验证

```sql
-- 表列表
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 预期表：users, addresses, work_orders, dispatch_records, service_records, 
--         parts_usage, cost_quotes, exceptions, settlements

-- 用户种子数据
SELECT id, username, name, role FROM users ORDER BY id;
-- 预期：5行，角色为 customer/service_agent/dispatcher/engineer/finance

-- 工单统计
SELECT status, COUNT(*) as cnt FROM work_orders GROUP BY status;
-- 至少包含 pending, dispatched, accepted, departed, arrived, repairing, completed

-- 派单统计
SELECT status, COUNT(*) as cnt FROM dispatch_records GROUP BY status;
-- 至少包含 pending, accepted, rejected, cancelled

-- 结算统计
SELECT status, COUNT(*) as cnt, SUM(total_income) as total FROM settlements GROUP BY status;
```

### 全量数据导出

```sh
# 导出为 SQL
cd /Users/chen/Documents/trae_projects/local_projects/may-63424
sqlite3 data/app.sqlite .dump > data/export_dump_$(date +%Y%m%d).sql

# 导出工单表 CSV
sqlite3 -header -csv data/app.sqlite "SELECT * FROM work_orders;" > data/work_orders_export.csv

# 导出结算表 CSV
sqlite3 -header -csv data/app.sqlite "SELECT * FROM settlements;" > data/settlements_export.csv
```

---

## 快速验证脚本

```sh
#!/bin/bash
BASE=http://127.0.0.1:53424/api

# 登录获取 token
TOKEN=$(curl -sS -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"dispatcher1","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: ${TOKEN:0:20}..."

# 健康检查
echo "=== Health ==="
curl -sS $BASE/../api/health

# 待派工单
echo "=== Pending Orders ==="
curl -sS $BASE/dispatch/pending -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; [print(f'  {o[\"order_no\"]} {o[\"status\"]}') for o in json.load(sys.stdin)]"

# 推荐工程师
echo "=== Recommendations for Order 1 ==="
curl -sS $BASE/dispatch/recommendations/1 -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; [print(f'  {r[\"engineer\"][\"name\"]} score={r[\"score\"]}') for r in json.load(sys.stdin)]"
```

---

## 验收标准

| 验收项 | 通过标准 | 验证方法 |
|--------|----------|----------|
| 端口监听 | 43424 和 53424 均在 LISTEN | `lsof -nP -iTCP:43424 -sTCP:LISTEN` |
| 进程存活 | 非 T/Z 状态 | `ps -o stat= -p $PID` |
| 前端访问 | HTTP 200 | `curl -I http://127.0.0.1:43424/` |
| 后端健康 | HTTP 200 + {"status":"ok"} | `curl http://127.0.0.1:53424/api/health` |
| 认证接口 | 登录成功返回 token | curl 验证 |
| 完整链路 | 报修→派单→接单→到场→维修→报价→签字→结算 全部成功 | 按场景 1.1~1.4 逐步验证 |
| 数据落库 | 各表有记录，状态流转正确 | sqlite3 查询 |
| 异常处理 | 6种异常类型均可上报和处理 | 异常表有 handling_result |
| 结算报表 | 按4种维度聚合正确 | 报表接口验证 |
