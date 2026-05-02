# 教培机构排课系统 - 代码生成说明文档

## 项目概述

**系统名称**: 教培机构排课系统 (Education Timetable System)  
**服务端口**: 8765 (稀有端口，避免与常见端口冲突)  
**技术栈**: Node.js + Express + TypeScript + PostgreSQL + Redis + Prisma ORM  
**架构模式**: SaaS模式多端业务系统，服务于教务、老师、学员、家长四大角色

---

## 一、主流程 (Main Workflow)

### 1.1 核心业务闭环

```
报名缴费 → 排课 → 上课签到 → 课时消耗 → 续费跟进
     ↓           ↓            ↓              ↓
  课程包创建   冲突检测    自动课消      续费提醒
  有效期设置   智能建议    考勤通知      提升续报率
```

### 1.2 流程详细说明

#### 流程1：学员报名缴费

**涉及模块**: `src/routes/enrollments.ts` (POST /api/v1/enrollments)

**处理步骤**:
1. **校验学员状态** - 验证学员是否存在、是否活跃
2. **校验课程状态** - 验证课程是否存在、是否启用
3. **检查重复报名** - 该学员是否已报名该课程且报名有效
4. **创建报名记录** - 生成 Enrollment 记录，包含：
   - 总课时数 (totalHours)
   - 剩余课时数 (remainingHours = totalHours)
   - 有效期开始日期 (startDate)
   - 有效期结束日期 (endDate = startDate + validMonths)
5. **创建支付记录** - 若有付款金额，同步创建 Payment 记录
6. **同步通知** - 可扩展发送报名成功通知

**数据模型关联**:
```
Organization → User (学员) → Enrollment (报名)
                                    ↓
                              Course (课程)
                                    ↓
                              CoursePackage (课程包 - 可选)
```

#### 流程2：教务排课

**涉及模块**: 
- `src/routes/schedules.ts` (POST /api/v1/schedules)
- `src/engines/timetable.engine.ts` (智能排课引擎)

**处理步骤**:
1. **智能冲突检测** - 自动检测三类冲突：
   - **教师冲突**: 该教师在同一时间是否有其他课程
   - **教室冲突**: 该教室在同一时间是否被占用
   - **时间冲突**: 时间范围是否重叠

2. **冲突处理机制**:
   ```typescript
   // 冲突检测核心逻辑 (timetable.engine.ts:164-203)
   async function detectAllConflicts(
     organizationId, teacherId, date, startTime, endTime, classroomId
   ): Promise<ConflictDetectionResult> {
     // 1. 检查教师时间冲突
     const teacherConflict = await checkTeacherConflict(...);
     
     // 2. 检查教室冲突
     const classroomConflict = await checkClassroomConflict(...);
     
     return {
       hasConflict: conflicts.length > 0,
       conflicts,
     };
   }
   ```

3. **替代时段建议** - 当存在冲突时，系统自动推荐可用时段：
   - 基于教师空闲时间
   - 基于教室可用状态
   - 优先推荐接近原计划的时间
   - 按推荐度评分排序

4. **创建课表记录** - 生成 Schedule 记录，状态为 DRAFT (草稿)

5. **课表确认** - 教务确认后，状态变更为 CONFIRMED (已确认)

**冲突检测API**: `POST /api/v1/schedules/detect-conflict`

#### 流程3：上课签到

**涉及模块**:
- `src/routes/attendances.ts` (POST /api/v1/attendances)
- `src/engines/attendance.engine.ts` (考勤引擎)

**支持方式**:
1. **手动签到** - 教师在前端逐个/批量标记考勤
2. **自动签到** - 可扩展：基于位置、二维码、人脸识别等

**处理步骤**:
1. **校验课表状态** - 课表必须是 CONFIRMED 状态
2. **校验报名状态** - 学员必须有该课程的有效报名
3. **创建考勤记录** - 生成 Attendance 记录，状态包括：
   - `PRESENT` (出勤)
   - `ABSENT` (缺勤)
   - `LATE` (迟到)
   - `LEAVE_EARLY` (早退)
   - `LEAVE` (请假)
   - `MAKEUP` (补课)

4. **批量考勤支持**:
   ```typescript
   // 批量考勤处理 (attendances.ts:241-277)
   POST /api/v1/attendances/batch
   Body: {
     scheduleId: string,
     attendances: [
       { studentId: string, status: AttendanceStatus, notes?: string }
     ]
   }
   ```

#### 流程4：课时消耗 (课消)

**涉及模块**:
- `src/engines/consumption.engine.ts` (课消计算引擎)
- `src/routes/enrollments.ts` (报名/续费)

**触发时机**: 考勤记录创建时自动触发 (出勤类状态)

**处理步骤**:
1. **状态判断** - 仅出勤类状态消耗课时：
   - ✅ PRESENT, LATE, LEAVE_EARLY, MAKEUP → 消耗课时
   - ❌ LEAVE, ABSENT → 不消耗课时

2. **报名有效性校验**:
   - 报名状态必须为 ACTIVE
   - 报名有效期未过期
   - 剩余课时充足

3. **课消计算**:
   ```typescript
   // 课时计算逻辑 (consumption.engine.ts:30-33)
   function calculateHoursFromDuration(durationMinutes: number): Decimal {
     const hours = durationMinutes / 60;
     return new Decimal(hours.toFixed(2));
   }
   
   // 单价计算逻辑 (consumption.engine.ts:35-64)
   async function getPricePerHour(enrollmentId, organizationId): Promise<Decimal> {
     // 优先使用课程包单价
     if (enrollment.coursePackage) {
       return enrollment.coursePackage.price.div(enrollment.coursePackage.totalHours);
     }
     // 其次使用课程默认单价
     return enrollment.course.defaultPrice;
   }
   ```

4. **数据更新**:
   - 减少 Enrollment.remainingHours
   - 增加 Enrollment.usedHours
   - 生成 Consumption 记录
   - 关联 Attendance 记录

#### 流程5：续费跟进

**涉及模块**:
- `src/engines/consumption.engine.ts` (续费检测)
- `src/engines/notification.engine.ts` (通知引擎)
- `src/routes/reports.ts` (续费分析报表)

**触发条件**:
- 剩余课时 ≤ 5课时 (可配置)
- 有效期剩余 ≤ 14天 (可配置)

**处理步骤**:
1. **自动检测**:
   ```typescript
   // 续费检测逻辑 (consumption.engine.ts:220-293)
   async function checkRenewalNeeded(
     organizationId, thresholdHours = 5, thresholdDays = 14
   ): Promise<RenewalCheckResult[]> {
     const enrollments = await prisma.enrollment.findMany({
       where: {
         organizationId,
         status: 'ACTIVE',
         OR: [
           { remainingHours: { lte: thresholdHours } },
           { endDate: { lte: thresholdDate } },
         ],
       },
     });
   }
   ```

2. **发送提醒**:
   - 发送给学员
   - 发送给家长 (如有绑定)
   - 通知类型: `RENEWAL_REMINDER`

3. **教务跟进**:
   - 报表: `GET /api/v1/reports/renewal-analysis`
   - 查看所有待续费学员
   - 按风险等级分类

4. **续费操作**:
   - API: `POST /api/v1/enrollments/:id/renew`
   - 增加课时
   - 延长有效期
   - 创建续费支付记录

---

## 二、旁路流程 (Bypass Workflow)

### 2.1 学员请假流程

**数据模型**: `Leave` 表 (prisma/schema.prisma:388-415)

**流程步骤**:
1. **学员提交请假申请**:
   - 指定请假日期/时间段
   - 填写请假原因
   - 选择是否需要补课

2. **教务审批**:
   - 状态变更: `PENDING` → `APPROVED` / `REJECTED`
   - 记录审批人、审批时间
   - 记录拒绝原因

3. **通知学员**:
   - 发送审批结果通知
   - 类型: `LEAVE_RESULT`

4. **生成补课记录** (如需要):
   - 创建 `Makeup` 记录
   - 状态: `PENDING` (待安排)
   - 关联原始 `Leave` 记录

### 2.2 补课安排流程

**数据模型**: `Makeup` 表 (prisma/schema.prisma:417-440)

**流程步骤**:
1. **教务查看待补课列表**:
   - 过滤条件: `status = PENDING`
   - 按学生、课程分组

2. **安排补课**:
   - 选择补课日期时间
   - 分配教师、教室
   - 记录安排人
   - 状态变更: `PENDING` → `SCHEDULED`

3. **发送补课通知**:
   - 通知学员和家长
   - 类型: `MAKEUP_NOTICE`

4. **完成补课**:
   - 创建补课考勤记录 (标记 `isMakeup = true`)
   - 状态变更: `SCHEDULED` → `COMPLETED`
   - 记录完成时间

### 2.3 课表同步流程

**触发时机**:
- 课表创建/更新时
- 课表状态变更时 (DRAFT → CONFIRMED)

**同步对象**:
| 角色 | 同步内容 |
|------|----------|
| 老师 | 个人课表、学员名单、教室信息 |
| 学员 | 个人课表、教师信息、教室信息 |
| 家长 | 孩子的课表、教师信息、教室信息 |

**API接口**:
- `GET /api/v1/schedules` - 支持按角色过滤
- 教师: `teacherId = currentUserId`
- 学员: `attendances.some(studentId = currentUserId)`

### 2.4 课前提醒流程

**涉及模块**: `src/engines/notification.engine.ts`

**提醒时机**:
- 上课前 60分钟 (默认，可配置)
- 上课前 30分钟 (可选)
- 上课前 15分钟 (可选)

**提醒对象**:
1. **老师**: 课程名称、时间、教室、学员名单
2. **学员**: 课程名称、时间、教室、教师姓名
3. **家长**: 孩子姓名、课程名称、时间、教室、教师姓名

**通知类型**: `SCHEDULE_REMINDER`

**API接口**:
- `POST /api/v1/schedules/:id/send-reminder` - 手动发送提醒
- 参数: `reminderMinutes` (提前多少分钟提醒)

### 2.5 考勤通知流程

**触发时机**: 考勤记录创建/更新后

**通知内容**:
- 课程名称
- 上课日期时间
- 教师姓名
- 考勤状态 (出勤/迟到/早退/缺勤/请假/补课)
- 课时消耗情况 (如适用)

**通知对象**: 学员 + 家长 (如有绑定)

**通知类型**: `ATTENDANCE_NOTICE`

---

## 三、异常流程 (Exception Workflow)

### 3.1 排课冲突处理

**冲突类型定义** (ErrorCode枚举):
```typescript
// src/utils/errors.ts:10-24
export enum ErrorCode {
  TEACHER_CONFLICT = 'TEACHER_CONFLICT',    // 教师时间冲突
  CLASSROOM_CONFLICT = 'CLASSROOM_CONFLICT',  // 教室冲突
  STUDENT_CONFLICT = 'STUDENT_CONFLICT',      // 学员冲突 (可扩展)
  TIME_OVERLAP = 'TIME_OVERLAP',               // 时间重叠
}
```

**冲突检测API响应**:
```json
{
  "success": true,
  "data": {
    "hasConflict": true,
    "conflicts": [
      {
        "type": "TEACHER",
        "entityId": "uuid-teacher-001",
        "entityName": "李老师",
        "conflictEntityId": "uuid-schedule-001",
        "conflictEntityName": "李老师 - 2024-01-15 09:00-10:30",
        "timeRange": {
          "date": "2024-01-15",
          "start": "09:00",
          "end": "10:30"
        }
      }
    ]
  }
}
```

**冲突解决策略**:

| 策略 | 适用场景 | 处理方式 |
|------|----------|----------|
| 智能推荐 | 存在冲突时 | 自动推荐替代时段，按推荐度排序 |
| 教师调换 | 教师冲突 | 建议替换可用教师 |
| 教室调换 | 教室冲突 | 建议替换可用教室 |
| 时间调整 | 时间冲突 | 调整到非高峰时段 |

### 3.2 课时不足处理

**触发条件**: 课消计算时检测到课时不足

**错误码**: `ErrorCode.INSUFFICIENT_HOURS`

**处理流程**:
1. **抛出异常** - 阻止课消创建
2. **记录日志** - 记录学员ID、课程ID、剩余课时
3. **触发提醒** - 自动发送续费提醒
4. **教务介入** - 在报表中查看待续费列表

**API响应示例**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_HOURS",
    "message": "课时不足。剩余: 2, 需要: 1.5",
    "details": {
      "remainingHours": 2,
      "requiredHours": 1.5
    }
  }
}
```

### 3.3 报名过期处理

**错误码**: `ErrorCode.ENROLLMENT_EXPIRED`

**处理流程**:
1. **状态校验** - 课消前检查报名有效期
2. **阻止课消** - 拒绝消耗课时
3. **状态变更** - 可扩展：自动设置报名为 EXPIRED
4. **通知学员** - 发送过期提醒，引导续费

### 3.4 重复考勤处理

**错误码**: `ErrorCode.DUPLICATE_ATTENDANCE`

**触发场景**:
- 同一学员在同一课表重复签到
- 课消记录已存在时尝试修改考勤状态为请假/缺勤

**处理方式**:
1. **创建时校验** - 检查是否已存在考勤记录
2. **更新时校验** - 如已产生课消，不可修改为不消耗课时的状态
3. **返回错误** - 明确提示原因

### 3.5 数据一致性保障

**事务处理** - 使用 Prisma 事务确保数据一致性:
```typescript
// 报名+支付原子操作 (enrollments.ts:242-282)
const enrollment = await prisma.$transaction(async (tx) => {
  const newEnrollment = await tx.enrollment.create({...});
  
  if (validated.paymentAmount > 0) {
    await tx.payment.create({...});
  }
  
  return newEnrollment;
});
```

**关键事务场景**:
| 操作 | 涉及表 | 事务边界 |
|------|--------|----------|
| 报名缴费 | Enrollment + Payment | 原子创建 |
| 续费操作 | Enrollment + Payment | 原子更新 |
| 课消处理 | Attendance + Consumption + Enrollment | 原子更新 |

### 3.6 服务启动异常

**端口占用检查** (src/utils/port-check.ts):

```typescript
// 端口检查流程
async function checkPortAndValidate(configPort: number): Promise<number> {
  // 1. 检查端口是否可用
  const available = await isPortAvailable(configPort);
  
  if (!available) {
    // 2. 自动查找替代端口 (稀有端口列表)
    const newPort = await findAvailablePort(configPort);
    console.log(`ℹ️  首选端口 ${configPort} 被占用，已自动选择: ${newPort}`);
    return newPort;
  }
  
  // 3. 警告常见端口
  if (isCommonPort(configPort)) {
    console.warn(`⚠️  建议使用稀有端口，避免冲突风险`);
    console.log(`💡 推荐稀有端口: ${RARE_PORTS.slice(0, 5).join(', ')}`);
  }
  
  return configPort;
}
```

**稀有端口列表**:
```typescript
// 避免使用: 3000, 3001, 4200, 4300, 5173, 8080, 9000 等常见端口
export const RARE_PORTS = [
  8765, 9876, 12345, 23456, 34567,
  45678, 56789, 67890, 78901, 89012, 90123
];
```

---

## 四、报表口径 (Report Specifications)

### 4.1 数据模型

**报表存储**: `Report` 表 (prisma/schema.prisma:468-484)

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| reportType | String | 报表类型 |
| periodStart | DateTime | 统计周期开始 |
| periodEnd | DateTime | 统计周期结束 |
| data | Json | 报表数据 JSON |
| generatedAt | DateTime | 生成时间 |

### 4.2 核心报表接口

#### 报表1：Dashboard 仪表盘

**API**: `GET /api/v1/reports/dashboard`

**统计口径**:

| 指标 | 计算方式 | 数据来源 |
|------|----------|----------|
| 今日课数 | 今日 CONFIRMED/COMPLETED 课表数 | Schedule |
| 今日考勤数 | 今日创建的考勤记录数 | Attendance |
| 今日课消数 | 今日消耗记录数 | Consumption |
| 今日营收 | 今日消耗金额合计 | Consumption.totalAmount |
| 本月营收 | 本月消耗金额合计 | Consumption |
| 活跃报名 | 状态为 ACTIVE 的报名数 | Enrollment |
| 待续费 | 课时≤5 或 有效期≤14天 | Enrollment |
| 活跃教师 | 状态为 ACTIVE 的教师数 | User (role=TEACHER) |
| 活跃课程 | 状态为 ACTIVE 的课程数 | Course |

#### 报表2：课消统计

**API**: `GET /api/v1/reports/consumption`

**参数**:
- `startDate` (可选): 开始日期
- `endDate` (可选): 结束日期

**统计口径**:

```typescript
// 核心统计逻辑 (consumption.engine.ts:295-399)
export async function getConsumptionSummary(
  organizationId, startDate, endDate
): Promise<{
  totalConsumptions: number;
  totalHours: number;
  totalAmount: number;
  byCourse: Array<{
    courseId, courseName, count, hours, amount
  }>;
  byTeacher: Array<{
    teacherId, teacherName, count, hours, amount
  }>;
}>
```

**分组维度**:
1. **按课程统计**: 每门课程的课消次数、课时、金额
2. **按教师统计**: 每位教师的课消次数、课时、金额

#### 报表3：考勤统计

**API**: `GET /api/v1/reports/attendance`

**参数**:
- `startDate`, `endDate`, `courseId`, `teacherId`

**统计口径**:

| 指标 | 计算方式 |
|------|----------|
| 总考勤数 | count(Attendance) |
| 出勤数 | count(status=PRESENT) |
| 缺勤数 | count(status=ABSENT) |
| 迟到数 | count(status=LATE) |
| 请假数 | count(status=LEAVE) |
| 早退数 | count(status=LEAVE_EARLY) |
| 补课数 | count(status=MAKEUP) |
| 出勤率 | (出勤+迟到+早退+补课) / (总考勤-请假) * 100% |

**出勤率公式**:
```
出勤率 = (PRESENT + LATE + LEAVE_EARLY + MAKEUP) / (TOTAL - LEAVE) × 100%
```
- 请假不计入分母 (公平统计)

#### 报表4：营收统计

**API**: `GET /api/v1/reports/revenue`

**参数**:
- `startDate`, `endDate`

**统计口径**:

| 指标 | 数据来源 |
|------|----------|
| 收款笔数 | count(Payment where status=PAID) |
| 收款金额 | sum(Payment.paidAmount) |
| 优惠金额 | sum(Payment.discount) |
| 按课程分组 | group by Enrollment.courseId |

**统计范围**: `Payment.paidAt` 时间范围内

#### 报表5：班级满班率

**API**: `GET /api/v1/reports/class-occupancy`

**参数**:
- `startDate`, `endDate`

**统计口径**:

```typescript
// 满班率计算 (reports.ts:312-328)
const classOccupancy = schedules.map(s => ({
  scheduleId: s.id,
  courseName: s.course.name,
  teacherName: s.teacher.realName,
  date: format(s.date, 'yyyy-MM-dd'),
  startTime: s.startTime,
  endTime: s.endTime,
  maxStudents: s.maxStudents,
  actualStudents: s._count.attendances,
  occupancyRate: s.maxStudents > 0 
    ? Math.round((s._count.attendances / s.maxStudents) * 10000) / 100 
    : 0,
}));
```

**平均满班率**:
```
平均满班率 = sum(occupyRate) / count(schedules)
```

#### 报表6：续费分析

**API**: `GET /api/v1/reports/renewal-analysis`

**统计口径**:

| 指标 | 说明 |
|------|------|
| 风险学员总数 | 满足续费条件的学员数 |
| 按原因分类: 课时不足 | remainingHours ≤ 5 |
| 按原因分类: 即将过期 | endDate ≤ 14天后 |

**风险学员详情**:
- 学员ID、姓名、电话
- 课程ID、名称
- 课程包信息
- 总课时、已用课时、剩余课时
- 有效期开始/结束
- 剩余天数
- 支付次数、课消次数

### 4.3 报表权限控制

| 报表 | 教务 | 教师 | 学员 | 家长 |
|------|------|------|------|------|
| Dashboard | ✅ | 部分 | ❌ | ❌ |
| 课消统计 | ✅ | 仅本人 | ❌ | ❌ |
| 考勤统计 | ✅ | 仅本人 | ❌ | ❌ |
| 营收统计 | ✅ | ❌ | ❌ | ❌ |
| 满班率 | ✅ | 仅本人 | ❌ | ❌ |
| 续费分析 | ✅ | ❌ | ❌ | ❌ |

**权限控制实现**:
```typescript
// reports.ts:15-16
router.use(authenticate);
router.use(requireAdmin);  // 所有报表需管理员权限
```

---

## 五、系统架构概览

### 5.1 目录结构

```
xm-7125/
├── prisma/
│   ├── schema.prisma      # 数据库模型定义
│   └── seed.ts            # 初始化数据脚本
├── src/
│   ├── config/
│   │   └── index.ts       # 配置管理
│   ├── engines/           # 四大核心引擎
│   │   ├── timetable.engine.ts    # 智能排课引擎
│   │   ├── consumption.engine.ts  # 课消计算引擎
│   │   ├── attendance.engine.ts   # 考勤引擎
│   │   └── notification.engine.ts # 家长通知引擎
│   ├── middleware/
│   │   ├── auth.ts          # 认证中间件
│   │   └── error-handler.ts # 错误处理
│   ├── routes/
│   │   ├── auth.ts          # 认证路由
│   │   ├── schedules.ts     # 课表路由
│   │   ├── enrollments.ts   # 报名路由
│   │   ├── attendances.ts   # 考勤路由
│   │   ├── notifications.ts # 通知路由
│   │   └── reports.ts       # 报表路由
│   ├── utils/
│   │   ├── errors.ts        # 错误定义
│   │   ├── logger.ts        # 日志工具
│   │   ├── port-check.ts    # 端口检查
│   │   └── response.ts      # 响应工具
│   └── index.ts             # 应用入口
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
├── Dockerfile               # Docker构建
├── docker-compose.yml       # 容器编排
├── package.json             # 依赖配置
└── tsconfig.json            # TypeScript配置
```

### 5.2 四大核心引擎职责

| 引擎 | 文件名 | 核心职责 | 关键函数 |
|------|--------|----------|----------|
| 智能排课引擎 | `timetable.engine.ts` | 冲突检测、冲突解决、智能推荐 | `detectAllConflicts`, `suggestAlternativeSlots`, `validateScheduleCreate` |
| 课消计算引擎 | `consumption.engine.ts` | 课时计算、课消处理、续费检测 | `processConsumption`, `getPricePerHour`, `checkRenewalNeeded` |
| 考勤引擎 | `attendance.engine.ts` | 考勤创建、批量考勤、状态更新 | `createAttendance`, `batchCreateAttendance`, `updateAttendanceStatus` |
| 家长通知引擎 | `notification.engine.ts` | 消息创建、提醒发送、状态管理 | `createScheduleReminder`, `createAttendanceNotice`, `createRenewalReminder` |

### 5.3 数据库模型关系图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│Organization │1─────∞│     User     │       │  Classroom   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ name         │       │ username     │       │ name         │
│ contactName  │       │ passwordHash │       │ capacity     │
└──────────────┘       │ realName     │       │ equipment    │
                       │ phone        │       └──────┬───────┘
                       │ email        │              │
                       │ role         │              │
                       │ isActive     │              │
                       └──────┬───────┘              │
                              │                      │
         ┌────────────────────┼──────────────────┐   │
         │                    │                  │   │
         ▼                    ▼                  ▼   ▼
┌────────────────┐    ┌────────────────┐   ┌────────────────┐
│ TeacherProfile │    │StudentProfile  │   │    Schedule    │
├────────────────┤    ├────────────────┤   ├────────────────┤
│ teacherNo      │    │ studentNo      │   │ date           │
│ subjects       │    │ grade          │   │ startTime      │
│ certifications │    │ school         │   │ endTime        │
└────────────────┘    │ parentId       │   │ duration       │
                      └────────────────┘   │ status         │
                                             │ maxStudents    │
                                             └───────┬────────┘
                                                     │
                    ┌────────────────────────────────┼───────────────────────────┐
                    │                                │                           │
                    ▼                                ▼                           ▼
           ┌────────────────┐              ┌────────────────┐         ┌────────────────┐
           │   Enrollment   │              │   Attendance   │         │  Consumption   │
           ├────────────────┤              ├────────────────┤         ├────────────────┤
           │ totalHours     │              │ status         │         │ hoursConsumed  │
           │ remainingHours │              │ checkInTime    │         │ pricePerHour   │
           │ usedHours      │              │ checkOutTime   │         │ totalAmount    │
           │ startDate      │              │ isMakeup       │         │ consumedAt     │
           │ endDate        │              └───────┬────────┘         └────────────────┘
           │ status         │                      │
           └───────┬────────┘                      │
                   │                               │
                   ▼                               ▼
           ┌────────────────┐              ┌────────────────┐
           │  CoursePackage │              │    Payment     │
           ├────────────────┤              ├────────────────┤
           │ name           │              │ amount         │
           │ totalHours     │              │ paidAmount     │
           │ price          │              │ discount       │
           │ validMonths    │              │ status         │
           └────────────────┘              │ paidAt         │
                                             └────────────────┘
```

### 5.4 API接口概览

#### 认证模块 (`/api/v1/auth`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/login` | 用户登录 | 公开 |
| POST | `/refresh` | 刷新Token | 公开 |
| GET | `/me` | 获取当前用户 | 登录 |
| POST | `/change-password` | 修改密码 | 登录 |

#### 课表模块 (`/api/v1/schedules`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取课表列表 | 登录 |
| GET | `/:id` | 获取课表详情 | 登录 |
| POST | `/` | 创建课表 | 教务 |
| PUT | `/:id` | 更新课表 | 教务 |
| DELETE | `/:id` | 取消课表 | 教务 |
| POST | `/:id/confirm` | 确认课表 | 教务 |
| POST | `/:id/send-reminder` | 发送提醒 | 教师/教务 |
| POST | `/detect-conflict` | 检测冲突 | 登录 |
| POST | `/suggest-slots` | 推荐时段 | 登录 |

#### 报名模块 (`/api/v1/enrollments`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取报名列表 | 登录 |
| GET | `/renewal-check` | 续费检测 | 教务 |
| GET | `/:id` | 获取报名详情 | 登录 |
| POST | `/` | 创建报名 | 教务 |
| POST | `/:id/renew` | 续费操作 | 教务 |
| POST | `/:id/payment` | 添加支付 | 教务 |
| GET | `/:id/payments` | 获取支付记录 | 登录 |

#### 考勤模块 (`/api/v1/attendances`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取考勤列表 | 登录 |
| GET | `/statistics` | 获取考勤统计 | 登录 |
| GET | `/:id` | 获取考勤详情 | 登录 |
| POST | `/` | 创建考勤 | 教师/教务 |
| POST | `/batch` | 批量考勤 | 教师/教务 |
| PUT | `/:id` | 更新考勤 | 教师/教务 |
| GET | `/schedule/:scheduleId` | 课表考勤列表 | 登录 |

#### 通知模块 (`/api/v1/notifications`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 获取通知列表 | 登录 |
| GET | `/unread-count` | 获取未读数 | 登录 |
| GET | `/:id` | 获取通知详情 | 登录 |
| POST | `/:id/read` | 标记已读 | 登录 |
| POST | `/batch-read` | 批量标记已读 | 登录 |
| POST | `/mark-all-read` | 全部标记已读 | 登录 |

#### 报表模块 (`/api/v1/reports`)
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/dashboard` | 仪表盘数据 | 教务 |
| GET | `/consumption` | 课消统计 | 教务 |
| GET | `/attendance` | 考勤统计 | 教务 |
| GET | `/revenue` | 营收统计 | 教务 |
| GET | `/class-occupancy` | 满班率统计 | 教务 |
| GET | `/renewal-analysis` | 续费分析 | 教务 |

---

## 六、启动与部署

### 6.1 本地开发环境

**前置要求**:
- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6 (可选，用于缓存/队列)

**启动步骤**:

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量 (已配置好 .env 文件)
# 默认端口: 8765 (稀有端口)

# 3. 启动数据库 (Docker方式)
docker-compose up -d postgres redis

# 4. 初始化数据库
npx prisma migrate dev
npx prisma db seed  # 初始化测试数据

# 5. 启动开发服务
npm run dev
```

**默认测试账号**:
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 教师1 | teacher01 | 123456 |
| 教师2 | teacher02 | 123456 |
| 家长 | parent01 | 123456 |
| 学员1 | student01 | 123456 |
| 学员2 | student02 | 123456 |

### 6.2 Docker 部署

**一键启动**:
```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api

# 停止服务
docker-compose down
```

**服务端口**:
| 服务 | 端口 | 说明 |
|------|------|------|
| API服务 | 8765 | 后端API (稀有端口) |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存服务 |

**健康检查**:
```bash
# API健康检查
curl http://localhost:8765/health

# API前缀健康检查
curl http://localhost:8765/api/v1/health
```

### 6.3 端口配置

**端口选择原则**:
- ✅ 使用稀有端口: 8765, 9876, 12345, 23456, 34567 等
- ❌ 避免常见端口: 3000, 3001, 4200, 4300, 5173, 8080, 9000 等

**端口自动切换**:
- 服务启动时自动检查端口可用性
- 如端口被占用，自动切换到下一个稀有端口
- 日志中提示切换信息

**配置修改**:
```bash
# 修改 .env 文件中的 PORT
PORT=9876  # 使用其他稀有端口
```

---

## 七、核心业务场景示例

### 场景1：学员报名缴费

**操作流程**:
1. 教务登录系统
2. 进入"学员管理" > "添加报名"
3. 选择学员、课程、课程包
4. 输入课时数、有效期
5. 录入缴费金额
6. 提交创建

**API调用**:
```http
POST /api/v1/enrollments
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "uuid-student-001",
  "courseId": "uuid-course-001",
  "coursePackageId": "uuid-package-001",
  "totalHours": 40,
  "startDate": "2024-01-15T00:00:00Z",
  "validMonths": 12,
  "paymentAmount": 7200,
  "paymentMethod": "微信支付",
  "transactionId": "WX202401150001"
}
```

---

### 场景2：教务排课

**操作流程**:
1. 教务进入"课表管理" > "排课"
2. 选择课程、教师、教室
3. 设置日期时间 (如: 2024-01-20 09:00-10:30)
4. 系统自动检测冲突
   - 如无冲突: 创建成功
   - 如有冲突: 显示冲突详情，推荐替代时段
5. 确认课表

**冲突检测**:
```http
POST /api/v1/schedules/detect-conflict
Authorization: Bearer {token}
Content-Type: application/json

{
  "teacherId": "uuid-teacher-001",
  "classroomId": "uuid-classroom-001",
  "date": "2024-01-20T00:00:00Z",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

**创建课表**:
```http
POST /api/v1/schedules
Authorization: Bearer {token}
Content-Type: application/json

{
  "courseId": "uuid-course-001",
  "teacherId": "uuid-teacher-001",
  "classroomId": "uuid-classroom-001",
  "date": "2024-01-20T00:00:00Z",
  "startTime": "09:00",
  "endTime": "10:30",
  "duration": 90,
  "maxStudents": 15
}
```

---

### 场景3：上课签到

**操作流程**:
1. 教师登录系统
2. 进入"我的课表" > 选择今日课程
3. 点击"开始考勤"
4. 逐个或批量标记学员状态
   - 出勤、迟到、早退、缺勤、请假
5. 提交考勤记录
6. 系统自动:
   - 消耗课时 (出勤类状态)
   - 发送考勤通知 (学员+家长)

**批量考勤**:
```http
POST /api/v1/attendances/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "scheduleId": "uuid-schedule-001",
  "attendances": [
    { "studentId": "uuid-student-001", "status": "PRESENT" },
    { "studentId": "uuid-student-002", "status": "LATE", "notes": "迟到10分钟" },
    { "studentId": "uuid-student-003", "status": "LEAVE" }
  ]
}
```

---

### 场景4：课时不足续费

**触发时机**:
- 教务查看"续费分析"报表
- 学员签到时课时不足
- 系统自动发送续费提醒

**教务操作**:
1. 进入"报表" > "续费分析"
2. 查看风险学员列表
3. 联系学员/家长
4. 完成续费操作

**续费API**:
```http
POST /api/v1/enrollments/{enrollmentId}/renew
Authorization: Bearer {token}
Content-Type: application/json

{
  "totalHours": 40,
  "validMonths": 6,
  "paymentAmount": 7200,
  "paymentMethod": "支付宝",
  "transactionId": "ALI202402150001"
}
```

---

## 八、代码扩展指南

### 8.1 添加新功能模块

**步骤**:
1. 在 `src/routes/` 创建路由文件
2. 在 `src/engines/` 创引擎逻辑 (如涉及核心业务)
3. 在 `prisma/schema.prisma` 添加数据模型 (如需要)
4. 在 `src/index.ts` 注册路由
5. 添加权限控制中间件

**示例: 添加请假管理路由**:
```typescript
// src/routes/leaves.ts
import { Router } from 'express';
import { authenticate, requireStudent } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

router.use(authenticate);

// 学员提交请假申请
router.post('/', requireStudent, asyncHandler(async (req, res) => {
  // 实现逻辑...
}));

// 教务审批请假
router.put('/:id/approve', requireAdmin, asyncHandler(async (req, res) => {
  // 实现逻辑...
}));

export default router;

// src/index.ts 中注册
import leavesRouter from './routes/leaves';
app.use(`${apiPrefix}/leaves`, leavesRouter);
```

### 8.2 添加新的通知类型

**步骤**:
1. 在 `prisma/schema.prisma` 的 `NotificationType` 枚举添加新类型
2. 在 `src/engines/notification.engine.ts` 添加创建函数
3. 在路由中调用

---

## 九、安全与权限

### 9.1 认证机制

- **JWT Token** - 无状态认证
- **Access Token** - 有效期: 7天 (可配置)
- **Refresh Token** - 有效期: 30天 (可配置)
- **密码加密** - bcrypt, 10轮加盐

### 9.2 角色权限

| 角色 | 权限说明 |
|------|----------|
| ADMIN (教务) | 完整权限: 报名管理、排课、报表、用户管理 |
| TEACHER (教师) | 个人课表、考勤管理、学员查看 |
| STUDENT (学员) | 个人课表、个人报名、个人考勤、个人通知 |
| PARENT (家长) | 孩子的课表、孩子的报名、孩子的考勤、孩子的通知 |

### 9.3 中间件保护

```typescript
// 示例: 路由保护
router.use(authenticate);           // 需要登录
router.use(requireAdmin);           // 需要教务权限
router.use(requireTeacher);         // 需要教师权限 (教务也可访问)
router.use(requireStudent);         // 需要学员权限 (教师/教务也可访问)
```

---

## 十、错误处理规范

### 10.1 错误码定义

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| INTERNAL_ERROR | 服务器内部错误 | 500 |
| VALIDATION_ERROR | 参数验证失败 | 400 |
| UNAUTHORIZED | 未授权访问 | 401 |
| FORBIDDEN | 权限不足 | 403 |
| NOT_FOUND | 资源不存在 | 404 |
| CONFLICT | 数据冲突 | 409 |
| BAD_REQUEST | 请求参数错误 | 400 |
| TEACHER_CONFLICT | 教师时间冲突 | 409 |
| CLASSROOM_CONFLICT | 教室冲突 | 409 |
| INSUFFICIENT_HOURS | 课时不足 | 400 |
| ENROLLMENT_EXPIRED | 报名已过期 | 400 |
| DUPLICATE_ATTENDANCE | 重复考勤 | 400 |

### 10.2 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {
      "field": "额外信息 (可选)"
    }
  }
}
```

### 10.3 成功响应格式

```json
{
  "success": true,
  "data": {
    "field": "数据内容"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 十一、监控与日志

### 11.1 日志级别

| 级别 | 使用场景 |
|------|----------|
| error | 错误发生 |
| warn | 警告信息 |
| info | 一般信息 |
| debug | 调试信息 (开发环境) |

### 11.2 关键日志点

- 用户登录/登出
- 数据创建/更新/删除
- 排课冲突检测
- 课消处理
- 异常捕获
- 服务启动/停止

---

## 十二、版本信息

- **版本**: 1.0.0
- **Node.js**: >= 18.0.0
- **TypeScript**: 5.3.3
- **Prisma**: 5.10.0
- **Express**: 4.18.2
- **PostgreSQL**: 15+
- **Redis**: 6+ (可选)

---

**文档更新时间**: 2024-01-15  
**维护者**: 教培系统开发团队
