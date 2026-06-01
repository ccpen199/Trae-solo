# 培训机构课消系统 - 测试样例文档

## 项目信息
- 项目目录: `/Users/chen/Documents/trae_projects/local_projects/may-63453`
- 前端地址: http://127.0.0.1:43453
- 后端地址: http://127.0.0.1:53453
- 数据库: `data/app.sqlite`
- 端口配置: FRONTEND_PORT=43453, BACKEND_PORT=53453 (tail4=3453)

## 启动方式
```bash
# 启动服务
cd /path/to/project
./start.sh

# 停止服务
./stop.sh

# 验证服务状态
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=43453
BACKEND_PORT=53453
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
```

## 主要文件结构
```
.
├── .env                      # 端口配置
├── start.sh                  # 启动脚本
├── stop.sh                   # 停止脚本
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js          # 主入口，API路由
│   │   └── database.js       # 数据库初始化
│   └── database/
│       ├── schema.sql        # 数据库表结构
│       └── migrations.sql    # 数据库迁移脚本
├── frontend/
│   ├── package.json
│   ├── vite.config.js        # Vite配置
│   └── src/
│       ├── App.vue           # 主应用组件
│       ├── main.js           # 入口文件
│       └── views/            # 7个功能模块视图
└── data/
    └── app.sqlite            # SQLite数据库文件
```

---

## 第一类: 正常样例 (Normal Cases)

### TC-01: 学员档案管理
**测试路径**: 学员档案 → 新增学员 → 查看详情
**前置条件**: 系统已启动
**测试步骤**:
1. 访问 `POST /api/students` 创建新学员
2. 访问 `GET /api/students` 查看学员列表
3. 访问 `GET /api/students/:id` 查看学员详情

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "gender": "男",
    "birthday": "2015-01-15",
    "phone": "13800001111",
    "parent_name": "张父",
    "parent_phone": "13900001111",
    "consultant": "李顾问",
    "learning_goal": "小升初冲刺"
  }'
```

**预期结果**:
- 返回 HTTP 201，包含新学员 ID
- 学员列表中可见新学员
- 学员详情包含购课记录、课包余额

---

### TC-02: 购买课包
**测试路径**: 财务管理 → 新增购课
**前置条件**: 学员已存在，课包已存在
**测试步骤**:
1. 访问 `POST /api/purchases` 创建购课记录
2. 访问 `GET /api/finance` 查看购课列表

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/purchases \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "package_id": 2,
    "discount": 0.9,
    "paid_amount": 5940,
    "has_invoice": 1,
    "invoice_amount": 5940,
    "contract_no": "HT20260528001"
  }'
```

**预期结果**:
- 返回 HTTP 201，包含购课记录
- 自动计算: total_hours=60, gift_hours=6, remaining_hours=66
- 课消单价: 6600 * 0.9 / 60 = 99元/课时

---

### TC-03: 排课管理
**测试路径**: 排课管理 → 新增排课
**前置条件**: 班级、教师、教室已存在
**测试步骤**:
1. 访问 `POST /api/schedules` 创建排课
2. 访问 `GET /api/schedules` 查看排课列表

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "teacher_id": 1,
    "classroom_id": 1,
    "course_date": "2026-06-01",
    "start_time": "18:30",
    "end_time": "20:00",
    "capacity": 10
  }'
```

**预期结果**:
- 返回 HTTP 201，包含排课 ID
- 自动检查教室时间冲突
- 自动创建该班级所有学员的签到记录（status=reserved）

---

### TC-04: 正常签到与课消
**测试路径**: 签到管理 → 学员签到
**前置条件**: 排课已存在，学员已报名，课包有余额
**测试步骤**:
1. 访问 `POST /api/attendance/:id/checkin` 进行签到
2. 验证课消记录已创建
3. 验证课包余额已扣减

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/attendance/1/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "status": "normal",
    "checkin_time": "2026-05-28 18:32:00"
  }'
```

**预期结果**:
- 返回 `{"success":true,"consumed":true,"hours":1.5,"amount":148.5,"type":"normal"}`
- 课时扣减: used_hours += 1.5, remaining_hours -= 1.5
- 课消记录: consumptions 表新增记录
- 签到状态: attendances 表 status 更新为 "normal"

---

### TC-05: 请假不扣课时
**测试路径**: 签到管理 → 学员请假
**前置条件**: 同 TC-04
**测试步骤**:
1. 访问 `POST /api/attendance/:id/checkin` 标记请假
2. 验证课包余额未变化

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/attendance/2/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "status": "leave",
    "checkin_time": "2026-05-28 19:00:00"
  }'
```

**预期结果**:
- 返回 `{"success":true,"consumed":false,"message":"已请假，不扣课时"}`
- 课时余额不变
- 课消记录不新增

---

### TC-06: 经营报表统计
**测试路径**: 经营报表 → 查看统计
**测试步骤**:
1. 访问 `GET /api/reports` 获取报表数据
2. 访问 `GET /api/finance` 获取财务概览

**预期结果**:
- 课包销售统计: 按课包汇总购买金额、课时
- 学科课消统计: 按学科汇总课消课时、金额
- 教师课时统计: 按教师统计授课课时、应发薪资
- 每日课消趋势: 按日期统计课消数据
- 续费线索: 剩余课时不足30%的学员

---

## 第二类: 边界样例 (Boundary Cases)

### TC-11: 课包余额为0时签到
**测试路径**: 签到管理 → 余额不足
**前置条件**: 学员课包 remaining_hours = 0
**测试步骤**:
1. 尝试签到
2. 验证系统提示余额不足

**预期结果**:
- 返回 HTTP 400，错误信息 "课包余额不足"
- 不扣减课时
- 不创建课消记录

---

### TC-12: 退费计算边界
**测试路径**: 财务管理 → 退费申请
**测试步骤**:
1. 访问 `POST /api/refunds` 申请退费
2. 验证退费金额计算正确

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 2,
    "purchase_id": 2,
    "refund_hours": 24,
    "reason": "学员转学",
    "has_invoice": 0
  }'
```

**预期结果**:
- 退费金额 = 剩余课时 × 单价 = 24 × 114 = 2736元
- 如已开票，需扣除发票税额
- 审批通过后，课包状态更新为 "refunded"

---

### TC-13: 跨天排课边界
**测试路径**: 排课管理 → 跨天课程
**测试步骤**:
1. 创建 21:00-22:30 的课程
2. 验证时长计算正确

**预期结果**:
- 课程时长 = 1.5小时
- 课消金额 = 1.5 × 单价
- 签到时间允许在课程开始前30分钟到结束后30分钟

---

### TC-14: 赠课使用边界
**测试路径**: 课消规则 → 赠课使用
**前置条件**: 课包包含赠课（如60课时+6赠课）
**测试步骤**:
1. 正常上课扣课时，直到付费课时用完
2. 继续上课，验证开始扣赠课

**预期结果**:
- 优先扣减付费课时，再扣赠课
- 赠课不计入课消金额（课消金额为0）
- 退费不包含赠课部分

---

## 第三类: 冲突样例 (Conflict Cases)

### TC-21: 教室时间冲突
**测试路径**: 排课管理 → 教室冲突检测
**前置条件**: 教室A101已排课 2026-06-01 18:30-20:00
**测试步骤**:
1. 尝试在同一教室、同一时间段创建另一排课

**预期结果**:
- 返回 HTTP 400，错误信息 "该教室在此时间段已有排课"
- 排课创建失败

---

### TC-22: 教师时间冲突
**测试路径**: 排课管理 → 教师冲突检测
**前置条件**: 张老师已排课 2026-06-01 18:30-20:00
**测试步骤**:
1. 尝试给张老师在同一时间段排另一门课

**预期结果**:
- 返回 HTTP 400，错误信息 "该教师在此时间段已有排课"
- 排课创建失败

---

### TC-23: 重复签到
**测试路径**: 签到管理 → 重复签到
**前置条件**: 学员已签到成功
**测试步骤**:
1. 同一学员、同一课表再次签到

**预期结果**:
- 返回 HTTP 400，错误信息 "该学员已签到"
- 不重复扣课时

---

### TC-24: 已开票退费冲突
**测试路径**: 财务管理 → 退费校验
**前置条件**: 购课记录 has_invoice=1
**测试步骤**:
1. 申请退费，未勾选"已退回发票"

**预期结果**:
- 返回 HTTP 400，错误信息 "已开票订单需先退回发票"
- 退费申请被拒绝

---

## 第四类: 失败样例 (Failure Cases)

### TC-31: 必填参数缺失
**测试路径**: 新增学员 → 参数校验
**测试步骤**:
1. 提交缺少必填字段的请求

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "测试学员"}'
```

**预期结果**:
- 返回 HTTP 400，错误信息 "缺少必填字段: parent_phone"
- 学员创建失败

---

### TC-32: 外键约束失败
**测试路径**: 新增购课 → 学员不存在
**测试步骤**:
1. 使用不存在的 student_id 创建购课记录

**请求样例**:
```bash
curl -X POST http://127.0.0.1:53453/api/purchases \
  -H "Content-Type: application/json" \
  -d '{"student_id": 99999, "package_id": 1, "paid_amount": 3600}'
```

**预期结果**:
- 返回 HTTP 500 或 400
- 购课记录创建失败
- 数据库保持完整性

---

### TC-33: 转账课时不足
**测试路径**: 转课管理 → 余额不足
**前置条件**: 学员A剩余课时 = 10
**测试步骤**:
1. 尝试转出 20 课时给学员B

**预期结果**:
- 返回 HTTP 400，错误信息 "转出学员课时不足"
- 转课申请失败

---

### TC-34: 数据库连接失败
**测试路径**: 任意API → 数据库异常
**前置条件**: 删除或移动数据库文件
**测试步骤**:
1. 访问任意需要数据库的API

**预期结果**:
- 返回 HTTP 500，包含具体错误信息
- 应用不崩溃，错误被正确捕获

---

## 核心API测试清单

| 模块 | API端点 | 方法 | 预期状态 | 落库验证 |
|------|---------|------|----------|----------|
| 运营看板 | `/api/dashboard` | GET | 200 | - |
| 学员列表 | `/api/students` | GET | 200 | - |
| 新增学员 | `/api/students` | POST | 201 | students表 |
| 学员详情 | `/api/students/:id` | GET | 200 | - |
| 课包列表 | `/api/course-packages` | GET | 200 | - |
| 购课列表 | `/api/finance` | GET | 200 | - |
| 新增购课 | `/api/purchases` | POST | 201 | purchases表 |
| 排课列表 | `/api/schedules` | GET | 200 | - |
| 新增排课 | `/api/schedules` | POST | 201 | schedules, attendances表 |
| 签到 | `/api/attendance/:id/checkin` | POST | 200 | attendances, consumptions, purchases表 |
| 退费申请 | `/api/refunds` | POST | 201 | refunds表 |
| 退费审批 | `/api/refunds/:id/approve` | POST | 200 | refunds, purchases表 |
| 转课申请 | `/api/transfers` | POST | 201 | transfers表 |
| 转课审批 | `/api/transfers/:id/approve` | POST | 200 | transfers, purchases表 |
| 经营报表 | `/api/reports` | GET | 200 | - |
| 健康检查 | `/api/health` | GET | 200 | - |

---

## 数据库核对清单

所有核心动作都必须落库，可通过以下SQL核对:

```sql
-- 核对学员数
SELECT COUNT(*) FROM students;

-- 核对购课记录
SELECT * FROM purchases ORDER BY id DESC LIMIT 10;

-- 核对课消记录
SELECT c.*, s.name AS student_name, cp.name AS package_name
FROM consumptions c
LEFT JOIN students s ON s.id = c.student_id
LEFT JOIN course_packages cp ON cp.id = c.purchase_id
ORDER BY c.id DESC LIMIT 10;

-- 核对签到记录
SELECT a.*, s.name AS student_name, sch.course_date
FROM attendances a
LEFT JOIN students s ON s.id = a.student_id
LEFT JOIN schedules sch ON sch.id = a.schedule_id
ORDER BY a.id DESC LIMIT 10;

-- 核对课时余额一致性
SELECT 
  p.id, p.total_hours, p.gift_hours, p.used_hours, p.remaining_hours,
  (p.total_hours + p.gift_hours - p.used_hours) AS expected_remaining,
  ABS((p.total_hours + p.gift_hours - p.used_hours) - p.remaining_hours) AS diff
FROM purchases p
HAVING diff > 0.001;

-- 核对课消金额一致性
SELECT 
  c.id, c.hours, c.unit_price, c.amount,
  ROUND(c.hours * c.unit_price, 2) AS expected_amount,
  ABS(ROUND(c.hours * c.unit_price, 2) - c.amount) AS diff
FROM consumptions c
HAVING diff > 0.01;
```

---

## 前端页面测试路径

| 页面 | 访问方式 | 核心功能 |
|------|----------|----------|
| 运营看板 | 首页 / Dashboard标签 | 关键指标、即将开课、余额预警 |
| 学员档案 | Students标签 | 学员列表、新增学员、查看详情 |
| 排课管理 | Schedules标签 | 排课列表、新增排课、冲突检测 |
| 签到管理 | Attendance标签 | 待签到列表、签到模态框、签到记录 |
| 财务管理 | Finance标签 | 购课记录、退费管理、转课管理 |
| 经营报表 | Reports标签 | 多维统计图表、续费线索 |
| 系统设置 | Settings标签 | 课包/教师/教室/班级管理 |

---

## 导出核对

### 数据导出路径
1. 课消记录可通过 `GET /api/consumptions` 导出
2. 购课记录可通过 `GET /api/finance` 导出
3. 报表数据可通过 `GET /api/reports` 导出

### 导出格式
- JSON格式，可直接导入Excel或其他数据分析工具
- 包含所有关联字段（学员姓名、课包名称等）

### 一致性校验
```bash
# 导出所有课消记录
curl -sS http://127.0.0.1:53453/api/consumptions > consumptions.json

# 统计总课消金额
python3 -c "import json; d=json.load(open('consumptions.json')); print(f'总课消笔数={len(d)}, 总金额=¥{sum(x[\"amount\"] for x in d):,.2f}')"

# 与报表数据核对
curl -sS http://127.0.0.1:53453/api/reports | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'报表总课消=¥{d[\"overall\"][\"total_consumed\"]:,}')"
```
