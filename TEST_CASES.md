# 新能源充电桩平台 - 测试样例

## 项目信息
- 项目目录: `/Users/chen/Documents/trae_projects/local_projects/may-63430`
- 前端端口: 43430 (http://127.0.0.1:43430)
- 后端端口: 53430 (http://127.0.0.1:53430)
- 数据库: SQLite - `./data/app.sqlite`

## 测试账号
| 角色 | 手机号 | 密码 | 余额 |
|------|--------|------|------|
| 车主 | 13800000003 | user1234 | ¥500.00 |
| 车主 | 13800000004 | user1234 | ¥1200.50 |
| 车主 | 13800000005 | user1234 | ¥50.00 |
| 运营商 | 13800000002 | op123456 | ¥0 |
| 管理员 | 13800000001 | admin123 | ¥0 |

## 服务启动与停止

### 启动命令
```bash
# 启动后端
cd /Users/chen/Documents/trae_projects/local_projects/may-63430
nohup npx tsx api/server.ts > backend.log 2>&1 < /dev/null &

# 启动前端
cd /Users/chen/Documents/trae_projects/local_projects/may-63430
nohup npx vite --host 127.0.0.1 --port 43430 --strictPort > frontend.log 2>&1 < /dev/null &
```

### 验证命令
```bash
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=43430
BACKEND_PORT=53430

# 检查端口
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

# 检查进程
ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=

# HTTP 检查
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
```

### 停止命令（仅终止当前项目进程）
```bash
PROJECT_DIR="$(pwd)"
PORT=43430  # 或 53430

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
cwd=$(ps -o cwd= -p "$pid" | xargs)
cmd=$(ps -o command= -p "$pid")

case "$cwd" in
  "$PROJECT_DIR"*) kill "$pid" ;;
  *) echo "skip kill: cwd=$cwd cmd=$cmd" ;;
esac
```

---

## 一、正常类测试样例

### 测试用例 1.1: 用户登录
- **测试路径**: 登录页面 → 输入手机号密码 → 进入首页
- **前置条件**: 无
- **测试步骤**:
  1. 打开 http://127.0.0.1:43430/
  2. 输入手机号: 13800000003
  3. 输入密码: user1234
  4. 点击"登录"按钮
- **预期结果**:
  - 登录成功，跳转到首页
  - 顶部显示用户昵称"张三"
  - 底部导航显示"首页、订单、我的"
- **接口验证**: `POST /api/auth/login` 返回 200，包含 token 和 user 信息
- **数据库核对**: `users` 表中 phone='13800000003' 的记录存在

### 测试用例 1.2: 查看站点列表
- **测试路径**: 首页 → 查看站点列表
- **前置条件**: 已登录
- **测试步骤**:
  1. 登录后自动进入首页
  2. 浏览站点卡片列表
- **预期结果**:
  - 显示 5 个充电站（望京SOHO、国贸中心、中关村、三里屯、西直门）
  - 每个站点显示: 名称、地址、空闲枪数、价格、功率、停车费、营业状态
- **接口验证**: `GET /api/stations` 返回 200，stations 数组长度为 5

### 测试用例 1.3: 预约充电
- **测试路径**: 首页 → 点击站点 → 选择空闲枪 → 点击"预约"
- **前置条件**: 已登录，账户余额 ≥ ¥10
- **测试步骤**:
  1. 点击"望京SOHO充电站"
  2. 选择一把状态为"空闲"的充电枪
  3. 点击"预约"按钮
  4. 确认预约（选择30分钟后）
- **预期结果**:
  - 预约成功，生成预约记录
  - 枪状态变为"已预约"
  - 个人中心"我的预约"显示该记录
- **接口验证**: `POST /api/charging/reserve` 返回 200
- **数据库核对**: `reservations` 表新增记录，`guns` 表对应枪状态为 'reserved'

### 测试用例 1.4: 启动充电
- **测试路径**: 站点详情 → 选择空闲枪 → 点击"开始充电"
- **前置条件**: 已登录，账户余额 ≥ ¥20，枪状态为 idle
- **测试步骤**:
  1. 进入站点详情页
  2. 选择一把空闲的充电枪
  3. 输入车辆信息（可选）
  4. 点击"开始充电"
- **预期结果**:
  - 充电订单创建成功
  - 跳转到充电中页面，实时显示充电状态
  - 枪状态变为"充电中"
- **接口验证**: `POST /api/charging/start` 返回 200
- **数据库核对**: `charging_orders` 表新增记录，`guns` 表状态为 'charging'

### 测试用例 1.5: 停止充电并支付
- **测试路径**: 充电中页面 → 点击"停止充电" → 确认支付
- **前置条件**: 有正在进行的充电订单
- **测试步骤**:
  1. 在充电中页面，点击"停止充电"
  2. 确认停止
  3. 查看费用明细
  4. 点击"立即支付"
- **预期结果**:
  - 充电停止，生成完整订单记录
  - 显示费用明细（峰谷电量、服务费、停车费）
  - 支付成功，余额扣减
  - 枪状态恢复为"空闲"
- **接口验证**: `POST /api/charging/{id}/stop` 和 `POST /api/charging/{id}/pay` 返回 200
- **数据库核对**: 订单 charging_status='completed'，payment_status='paid'，guns.status='idle'

### 测试用例 1.6: 运营后台登录
- **测试路径**: 登录页面 → 输入运营商账号 → 进入个人中心 → 点击"运营管理"
- **前置条件**: 无
- **测试步骤**:
  1. 使用账号 13800000002 / op123456 登录
  2. 进入"我的"页面
  3. 点击"运营管理后台"
- **预期结果**:
  - 成功进入运营仪表盘
  - 显示核心指标：总订单数、总充电量、总营收、用户数等
  - 左侧菜单显示设备管理、工单管理、告警中心、运营分析
- **接口验证**: `GET /api/analytics/overview` 返回 200

---

## 二、边界类测试样例

### 测试用例 2.1: 余额不足预约
- **测试路径**: 首页 → 站点详情 → 预约
- **前置条件**: 账户余额 < ¥10（使用账号 13800000005，余额 ¥50 刚好够，可先消费使其不足）
- **测试步骤**:
  1. 登录余额不足的账号
  2. 尝试预约充电
- **预期结果**:
  - 预约失败，提示"账户余额不足，请先充值（预约需至少10元）"
  - 预约记录未创建
  - 枪状态保持不变
- **接口验证**: `POST /api/charging/reserve` 返回 400 错误

### 测试用例 2.2: 余额不足启动充电
- **测试路径**: 站点详情 → 启动充电
- **前置条件**: 账户余额 < ¥20
- **测试步骤**:
  1. 登录余额不足的账号
  2. 尝试启动充电
- **预期结果**:
  - 启动失败，提示"账户余额不足，请先充值（启动充电需至少20元）"
  - 订单未创建
- **接口验证**: `POST /api/charging/start` 返回 400 错误

### 测试用例 2.3: 重复预约同一把枪
- **测试路径**: 站点详情 → 预约已被预约的枪
- **前置条件**: 某枪已被预约（状态为 reserved）
- **测试步骤**:
  1. 用户A预约了1号枪
  2. 用户B尝试预约同一把1号枪
- **预期结果**:
  - 用户B预约失败，提示"该充电枪已被预约"
  - 枪状态保持 reserved
- **接口验证**: `POST /api/charging/reserve` 返回 400 错误

### 测试用例 2.4: 预约过期
- **测试路径**: 预约后超过预约时间未到达
- **前置条件**: 有一个预约，且已超过预约到期时间
- **测试步骤**:
  1. 创建一个预约（系统自动设置30分钟后过期）
  2. 等待超过预约时间
  3. 查看预约状态
- **预期结果**:
  - 预约状态自动变为"已过期"
  - 枪状态恢复为"空闲"
  - 用户可重新预约该枪

### 测试用例 2.5: 充电时电量为0边界
- **测试路径**: 启动充电后立即停止
- **前置条件**: 有一个充电订单刚启动
- **测试步骤**:
  1. 启动充电
  2. 1分钟内立即停止充电
- **预期结果**:
  - 订单记录正常的开始和结束时间
  - 充电量可能为 0 或极小值
  - 费用计算正确（可能只收基础费用）

---

## 三、冲突类测试样例

### 测试用例 3.1: 同一把枪同时充电
- **测试路径**: 两个用户同时尝试启动同一把枪
- **前置条件**: 枪状态为 idle
- **测试步骤**:
  1. 用户A发起启动充电请求
  2. 在用户A请求处理完成前，用户B也发起启动同一把枪的请求
- **预期结果**:
  - 只有一个用户能成功启动充电
  - 另一个用户收到"充电枪已被占用"的错误
  - 数据库中只有一个充电中的订单
  - 枪状态正确变为 charging，不会出现数据不一致

### 测试用例 3.2: 预约与充电冲突
- **测试路径**: 用户A预约了枪，用户B尝试直接充电
- **前置条件**: 枪状态为 reserved（被用户A预约）
- **测试步骤**:
  1. 用户A预约了1号枪
  2. 用户B（非预约用户）尝试直接启动1号枪充电
- **预期结果**:
  - 用户B启动失败，提示"该充电枪已被预约"
  - 枪状态保持 reserved
  - 只有预约用户A可以启动充电

### 测试用例 3.3: 重复支付
- **测试路径**: 订单已支付后再次调用支付接口
- **前置条件**: 订单 payment_status = 'paid'
- **测试步骤**:
  1. 完成一个订单的支付
  2. 再次调用该订单的支付接口
- **预期结果**:
  - 支付失败，提示"订单已支付"
  - 余额不会重复扣减
  - 订单状态保持 paid
- **数据库核对**: `transactions` 表只有一条支付记录

### 测试用例 3.4: 并发充值
- **测试路径**: 同一账户同时发起多笔充值请求
- **前置条件**: 账户余额 ¥100
- **测试步骤**:
  1. 同时发起两笔 ¥100 的充值请求
  2. 查看最终余额
- **预期结果**:
  - 两笔充值都成功，余额变为 ¥300
  - 或按事务处理，保证数据一致性
  - `transactions` 表有两条充值记录

---

## 四、失败类测试样例

### 测试用例 4.1: 错误密码登录
- **测试路径**: 登录页面 → 输入错误密码
- **前置条件**: 无
- **测试步骤**:
  1. 输入正确手机号: 13800000003
  2. 输入错误密码: wrongpassword
  3. 点击登录
- **预期结果**:
  - 登录失败，提示"手机号或密码错误"
  - 未生成 token
  - 停留在登录页面
- **接口验证**: `POST /api/auth/login` 返回 401 错误

### 测试用例 4.2: 未授权访问接口
- **测试路径**: 直接调用需要登录的接口
- **前置条件**: 未登录（无 token）
- **测试步骤**:
  1. 不携带 Authorization header 调用 `GET /api/stations`
- **预期结果**:
  - 返回 401 未授权错误
  - 错误信息: "未提供认证令牌" 或 "无效的认证令牌"

### 测试用例 4.3: 访问不存在的订单
- **测试路径**: 订单详情 → 不存在的订单ID
- **前置条件**: 已登录
- **测试步骤**:
  1. 调用订单详情接口，传入不存在的订单ID（如 99999）
- **预期结果**:
  - 返回 404 错误
  - 错误信息: "订单不存在"

### 测试用例 4.4: 停止不存在的充电
- **测试路径**: 停止一个不存在的充电订单
- **前置条件**: 已登录
- **测试步骤**:
  1. 调用停止充电接口，传入不存在的订单ID
- **预期结果**:
  - 返回 404 错误
  - 错误信息: "订单不存在"

### 测试用例 4.5: 支付时余额不足
- **测试路径**: 订单待支付 → 支付时余额不足
- **前置条件**: 订单待支付金额 ¥100，账户余额 ¥50
- **测试步骤**:
  1. 完成一个 ¥100 的订单（未支付）
  2. 将账户余额消费到不足 ¥100
  3. 尝试支付该订单
- **预期结果**:
  - 支付失败，提示"账户余额不足"
  - 订单状态保持 unpaid
  - 余额未扣减
- **接口验证**: `POST /api/charging/{id}/pay` 返回 400 错误

### 测试用例 4.6: 权限不足访问运营后台
- **测试路径**: 普通车主用户尝试访问运营接口
- **前置条件**: 使用车主账号登录（role = 'owner'）
- **测试步骤**:
  1. 使用车主账号登录
  2. 尝试调用运营接口 `GET /api/operations/chargers`
- **预期结果**:
  - 返回 403 权限不足错误
  - 错误信息: "权限不足，需要运营商或管理员角色"

---

## 主要文件结构

```
may-63430/
├── .env                          # 端口和环境配置
├── package.json                  # 依赖和启动脚本
├── vite.config.ts                # Vite 配置（端口、代理）
├── data/
│   └── app.sqlite               # SQLite 数据库文件
├── api/                          # 后端代码
│   ├── server.ts                 # 服务启动入口
│   ├── app.ts                    # Express 应用
│   ├── db/
│   │   ├── index.ts              # 数据库连接
│   │   └── init.ts               # 数据库初始化和种子数据
│   ├── middleware/
│   │   └── auth.ts               # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.ts               # 认证接口
│   │   ├── stations.ts           # 站点接口
│   │   ├── charging.ts           # 充电接口
│   │   ├── operations.ts         # 运维接口
│   │   └── analytics.ts          # 统计分析接口
│   └── types/
│       └── index.ts              # TypeScript 类型定义
├── src/                          # 前端代码
│   ├── App.tsx                   # 主应用组件（路由）
│   ├── main.tsx                  # 入口文件
│   ├── lib/
│   │   └── api.ts                # API 客户端
│   ├── store/
│   │   └── index.ts              # Zustand 状态管理
│   └── pages/
│       ├── Login.tsx             # 登录页
│       ├── Home.tsx              # 车主首页
│       ├── StationDetail.tsx     # 站点详情页
│       ├── Charging.tsx          # 充电中页面
│       ├── Orders.tsx            # 订单列表页
│       ├── OrderDetail.tsx       # 订单详情页
│       ├── Profile.tsx           # 个人中心
│       ├── AdminDashboard.tsx    # 运营仪表盘
│       ├── AdminDevices.tsx      # 设备管理
│       ├── AdminWorkOrders.tsx   # 工单管理
│       ├── AdminAlarms.tsx       # 告警中心
│       └── AdminAnalytics.tsx    # 运营分析
├── frontend.log                  # 前端日志
└── backend.log                   # 后端日志
```

---

## 导出核对数据

### 数据导出命令
```bash
# 导出用户表
sqlite3 data/app.sqlite "SELECT id, phone, nickname, role, balance FROM users;" > exports/users.csv

# 导出站点表
sqlite3 data/app.sqlite "SELECT id, name, address, price_per_kwh, total_guns, available_guns, status FROM stations;" > exports/stations.csv

# 导出订单表
sqlite3 data/app.sqlite "SELECT id, order_no, user_id, station_id, gun_id, total_kwh, total_amount, charging_status, payment_status, created_at FROM charging_orders;" > exports/orders.csv

# 导出交易记录表
sqlite3 data/app.sqlite "SELECT id, user_id, order_id, amount, type, payment_method, status, created_at FROM transactions;" > exports/transactions.csv
```

### 数据核对要点

1. **用户余额一致性**:
   - `users.balance` 应等于该用户所有充值交易总和 - 消费交易总和
   - 支付成功后，订单 `payment_status = 'paid'`，同时用户余额扣减，交易记录新增

2. **枪状态一致性**:
   - 充电中的订单存在时，对应 `guns.status = 'charging'` 且 `current_order_id` 指向该订单
   - 订单完成或停止后，`guns.status` 应恢复为 'idle'，`current_order_id` 为 NULL

3. **订单金额一致性**:
   - `charging_orders.total_amount` = electricity_fee + service_fee + parking_fee
   - `total_kwh` = peak_kwh + flat_kwh + valley_kwh

4. **预约状态一致性**:
   - 预约生效期间，`guns.status = 'reserved'`
   - 预约过期或取消后，`guns.status` 恢复为 'idle'

5. **功率曲线数据**:
   - 订单完成后，`power_curve` 字段包含 JSON 格式的功率和 SOC 记录
   - 记录点数应与充电时长匹配
