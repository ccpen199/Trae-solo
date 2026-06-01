# 线上活动互动抽奖运营平台 - 测试样例

## 项目信息
- 项目目录: may-63481
- 前端端口: 43481 (40000 + 3481)
- 后端端口: 53481 (50000 + 3481)
- 数据库: data/app.sqlite

## 测试账号
| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | admin | 全部权限 |
| operator | admin123 | operator | 活动运营 |
| risk | admin123 | risk | 风控管理 |
| finance | admin123 | finance | 财务查看 |

---

## 一、正常测试样例 ✅

### 1.1 管理员登录
- **测试路径**: POST /api/auth/login
- **输入**: `{"username":"admin","password":"admin123"}`
- **预期输出**: 返回 token 和 admin 信息，code=200
- **测试命令**:
```bash
curl -sS -X POST http://127.0.0.1:53481/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
- **实际结果**: ✅ 通过，返回 token

### 1.2 创建活动
- **测试路径**: POST /api/activities
- **前置条件**: 已登录获取 token
- **输入**: 活动名称、时间、参与规则、抽奖规则、奖品配置
- **预期输出**: 返回活动 ID，code=200
- **主要文件**: [ActivityService.ts](api/services/ActivityService.ts), [ActivityRepository.ts](api/repositories/ActivityRepository.ts)
- **实际结果**: ✅ 通过，活动创建成功

### 1.3 发布活动
- **测试路径**: PATCH /api/activities/:id/status
- **输入**: `{"status":"published"}`
- **预期输出**: code=200，状态更新成功
- **实际结果**: ✅ 通过

### 1.4 用户资格校验
- **测试路径**: POST /api/lottery/qualify
- **输入**: activityId, userId, channel, orderAmount=299
- **预期输出**: qualified=true
- **实际结果**: ✅ 通过

### 1.5 用户完成任务
- **测试路径**: POST /api/lottery/task
- **输入**: activityId, userId, taskId, channel
- **预期输出**: success=true，任务完成
- **实际结果**: ✅ 通过

### 1.6 用户抽奖
- **测试路径**: POST /api/lottery/draw
- **输入**: activityId, userId, channel, deviceId, ip
- **预期输出**: 返回抽奖结果（中奖/未中奖），code=200
- **主要文件**: [LotteryService.ts](api/services/LotteryService.ts)
- **实际结果**: ✅ 通过

### 1.7 查询用户抽奖记录
- **测试路径**: GET /api/lottery/user/records?userId=xxx
- **预期输出**: 返回抽奖记录列表，code=200
- **实际结果**: ✅ 通过

### 1.8 查询用户中奖记录
- **测试路径**: GET /api/prizes/user/winners?userId=xxx
- **预期输出**: 返回中奖记录列表，code=200
- **实际结果**: ✅ 通过

### 1.9 运营后台查看中奖列表
- **测试路径**: GET /api/prizes/winners
- **前置条件**: 已登录
- **预期输出**: 分页返回中奖列表，code=200
- **实际结果**: ✅ 通过

### 1.10 查看风控队列
- **测试路径**: GET /api/risk/queue
- **前置条件**: 已登录（admin/risk 角色）
- **预期输出**: 分页返回风控队列，code=200
- **实际结果**: ✅ 通过

### 1.11 查看报表数据
- **测试路径**: GET /api/reports/summary?activityId=xxx
- **预期输出**: 返回活动汇总数据（参与人数、转化、成本等）
- **主要文件**: [ReportService.ts](api/services/ReportService.ts)
- **实际结果**: ✅ 通过

### 1.12 查看仪表盘
- **测试路径**: GET /api/reports/dashboard
- **预期输出**: 返回全平台汇总数据
- **实际结果**: ✅ 通过

---

## 二、边界测试样例 ⚠️

### 2.1 活动时间边界
- **测试场景**: 活动开始前参与
- **测试路径**: POST /api/lottery/qualify
- **输入**: 活动开始时间在未来
- **预期输出**: qualified=false, reason="活动尚未开始"
- **实际结果**: ✅ 通过

### 2.2 每日抽奖次数上限
- **测试场景**: 用户单日抽奖次数达到 dailyLimit
- **前置条件**: 活动配置 dailyLimit=3
- **测试路径**: POST /api/lottery/draw
- **预期输出**: 第4次抽奖返回"今日抽奖次数已用完"
- **验证方式**: 连续抽奖4次
- **实际结果**: 待验证

### 2.3 总抽奖次数上限
- **测试场景**: 用户总抽奖次数达到 totalLimit
- **前置条件**: 活动配置 totalLimit=10
- **测试路径**: POST /api/lottery/draw
- **预期输出**: 第11次抽奖返回"总抽奖次数已用完"
- **实际结果**: 待验证

### 2.4 奖品库存为0
- **测试场景**: 奖品库存耗尽后抽奖
- **前置条件**: 某奖品库存已扣减至0
- **测试路径**: POST /api/lottery/draw
- **预期输出**: 不会抽到该奖品，自动分配其他奖品或"谢谢参与"
- **实际结果**: 待验证

### 2.5 概率边界
- **测试场景**: 极低概率奖品（0.1%）
- **测试路径**: POST /api/lottery/draw
- **预期输出**: 数学期望上1000次抽中1次
- **验证方式**: 运行10000次抽奖统计分布
- **实际结果**: 待验证

### 2.6 消费金额边界
- **测试场景**: 用户消费金额刚好等于 minAmount
- **测试路径**: POST /api/lottery/qualify
- **输入**: orderAmount=199, minAmount=199
- **预期输出**: qualified=true
- **实际结果**: 待验证

---

## 三、冲突测试样例 🚫

### 3.1 并发抽奖冲突
- **测试场景**: 同一用户同时发起多个抽奖请求
- **测试路径**: POST /api/lottery/draw
- **测试方法**: 并发10个相同userId的请求
- **预期输出**: 只有1次成功，其余返回"操作过于频繁"或"请稍后再试"
- **主要文件**: [LotteryService.ts](api/services/LotteryService.ts) 事务处理
- **实际结果**: 待验证

### 3.2 库存扣减冲突
- **测试场景**: 多个用户同时抽中同一奖品（库存=1）
- **测试路径**: POST /api/lottery/draw
- **预期输出**: 只有1人中奖，另一人抽中其他奖品
- **验证方式**: 事务保证数据一致性
- **实际结果**: 待验证

### 3.3 权限冲突
- **测试场景**: finance 角色尝试访问风控接口
- **测试路径**: GET /api/risk/queue
- **登录账号**: finance / admin123
- **预期输出**: code=403, message="无权限访问"
- **实际结果**: 待验证

### 3.4 跨活动抽奖冲突
- **测试场景**: 用户同时参与多个活动，抽奖次数独立计算
- **测试路径**: POST /api/lottery/draw (activityId=1 和 activityId=2)
- **预期输出**: 两个活动的抽奖次数独立计数，互不影响
- **实际结果**: 待验证

### 3.5 端口占用冲突
- **测试场景**: 端口53481被其他项目占用
- **预期行为**: 自动切换到备用端口 41000+3481=44481 / 51000+3481=54481，写回 .env
- **主要文件**: .env, vite.config.ts, api/server.ts
- **验证方式**: 手动占用端口后重启
- **实际结果**: 待验证

---

## 四、失败测试样例 ❌

### 4.1 登录失败 - 密码错误
- **测试路径**: POST /api/auth/login
- **输入**: `{"username":"admin","password":"wrong"}`
- **预期输出**: code=401, message="用户名或密码错误"
- **测试命令**:
```bash
curl -sS -X POST http://127.0.0.1:53481/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
```
- **实际结果**: 待验证

### 4.2 登录失败 - 用户不存在
- **输入**: `{"username":"nonexist","password":"admin123"}`
- **预期输出**: code=401, message="用户名或密码错误"
- **实际结果**: 待验证

### 4.3 Token 无效
- **测试路径**: GET /api/activities
- **Header**: `Authorization: Bearer invalid_token`
- **预期输出**: code=401, message="认证令牌无效"
- **实际结果**: 待验证

### 4.4 Token 过期
- **测试路径**: GET /api/activities
- **Header**: 使用过期的 token
- **预期输出**: code=401, message="认证令牌已过期"
- **实际结果**: 待验证

### 4.5 活动不存在
- **测试路径**: GET /api/activities/public/99999
- **预期输出**: code=404, message="活动不存在或未开始/已结束"
- **实际结果**: 待验证

### 4.6 参数缺失
- **测试路径**: POST /api/lottery/draw
- **输入**: 缺少 userId
- **预期输出**: code=400, message="用户ID不能为空"
- **实际结果**: 待验证

### 4.7 风控拦截
- **测试场景**: 同一IP 5分钟内抽奖超过10次
- **测试路径**: POST /api/lottery/draw
- **预期输出**: riskStatus="risk_pending"，进入风控队列
- **主要文件**: [RiskService.ts](api/services/RiskService.ts)
- **实际结果**: 待验证

### 4.8 同设备多账号刷量
- **测试场景**: 同一 deviceId 关联超过5个不同 userId
- **预期输出**: 自动创建风控项，标记为"设备刷量"
- **实际结果**: 待验证

### 4.9 接口不存在
- **测试路径**: GET /api/nonexistent
- **预期输出**: code=404, message="接口不存在"
- **实际结果**: 待验证

---

## 五、导出数据核对

### 5.1 数据导出路径
- **报表导出**: GET /api/reports/export?activityId=xxx
- **导出格式**: CSV

### 5.2 导出字段核对
| 字段 | 来源表 | 验证方式 |
|------|--------|----------|
| 活动ID | activities | 核对活动配置 |
| 参与人数 | participations | COUNT(DISTINCT user_id) |
| 抽奖次数 | lottery_records | COUNT(*) |
| 中奖数 | winners | COUNT(*) WHERE status!='rejected' |
| 中奖率 | 计算 | 中奖数 / 抽奖次数 |
| 总成本 | prizes | SUM(prize.value) |
| 发放率 | 计算 | 已发放数 / 中奖数 |
| 投诉数 | 待实现 | 0 |

### 5.3 数据库直接核对
```bash
# 进入数据库
sqlite3 data/app.sqlite

# 核对活动数量
SELECT COUNT(*) FROM activities;

# 核对参与记录
SELECT COUNT(*), COUNT(DISTINCT user_id) FROM participations;

# 核对抽奖记录
SELECT COUNT(*), SUM(is_win) FROM lottery_records;

# 核对中奖记录
SELECT status, COUNT(*) FROM winners GROUP BY status;

# 核对奖品库存
SELECT name, total_stock, used_stock FROM prizes;

# 核对风控项
SELECT risk_type, status, COUNT(*) FROM risk_items GROUP BY risk_type, status;
```

---

## 六、启动与验收

### 6.1 启动命令
```bash
# 启动后端（后台运行）
cd /Users/chen/Documents/trae_projects/local_projects/may-63481
nohup npm run start:backend > backend.log 2>&1 &

# 启动前端（后台运行）
nohup npm run start:frontend > frontend.log 2>&1 &
```

### 6.2 验收检查清单
- [ ] 前端端口 43481 监听，HTTP 200
- [ ] 后端端口 53481 监听，健康检查正常
- [ ] 进程状态不是 T/Z 状态
- [ ] 管理后台可正常登录
- [ ] 活动创建、发布流程正常
- [ ] 用户抽奖流程正常
- [ ] 中奖记录可查询
- [ ] 风控队列可访问
- [ ] 报表数据正确
- [ ] 数据库所有核心动作已落库

### 6.3 停止命令
```bash
# 停止前端
pid=$(lsof -nP -iTCP:43481 -sTCP:LISTEN -t | head -n1)
cwd=$(ps -o cwd= -p "$pid" | xargs)
case "$cwd" in
  "/Users/chen/Documents/trae_projects/local_projects/may-63481"/*) kill "$pid" ;;
  *) echo "skip kill" ;;
esac

# 停止后端
pid=$(lsof -nP -iTCP:53481 -sTCP:LISTEN -t | head -n1)
cwd=$(ps -o cwd= -p "$pid" | xargs)
case "$cwd" in
  "/Users/chen/Documents/trae_projects/local_projects/may-63481"/*) kill "$pid" ;;
  *) echo "skip kill" ;;
esac
```

---

## 七、主要文件清单

### 后端核心文件
- [api/server.ts](api/server.ts) - 后端入口，绑定 127.0.0.1:53481
- [api/app.ts](api/app.ts) - Express 应用，路由整合
- [api/db/connection.ts](api/db/connection.ts) - SQLite 连接
- [api/db/init.ts](api/db/init.ts) - 数据库初始化
- [api/services/LotteryService.ts](api/services/LotteryService.ts) - 核心抽奖引擎
- [api/services/RiskService.ts](api/services/RiskService.ts) - 风控引擎
- [api/services/ReportService.ts](api/services/ReportService.ts) - 报表统计

### 前端核心文件
- [vite.config.ts](vite.config.ts) - Vite 配置，strictPort: true
- [src/App.tsx](src/App.tsx) - 路由配置
- [src/pages/LotteryPage.tsx](src/pages/LotteryPage.tsx) - 用户抽奖页
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) - 仪表盘
- [src/lib/api.ts](src/lib/api.ts) - API 封装

### 配置文件
- [.env](.env) - 端口配置
- [package.json](package.json) - 依赖和脚本
- [nodemon.json](nodemon.json) - 后端热重载配置
