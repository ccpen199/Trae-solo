# 企业培训直播系统 - 测试验收指南

## 快速启动

```bash
# 方式1：使用启动脚本
chmod +x start.sh && ./start.sh

# 方式2：手动启动
# 1. 安装依赖
npm run install-all

# 2. 初始化数据库
npm run init-db

# 3. 启动服务
npm run dev
```

启动后访问：http://localhost:5173

## 默认测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | 123456 | 培训主管，拥有全部权限 |
| 讲师 | instructor1 | 123456 | 张讲师，可管理直播、创建投票 |
| HR | hr1 | 123456 | HR专员，可查看统计、导出档案 |
| 员工 | employee1 | 123456 | 前端工程师，学员视角 |
| 员工 | employee2 | 123456 | 后端工程师，学员视角 |

---

## 一、正常场景测试（Positive）

### 1. 培训计划管理
**测试路径**: 管理后台 → 培训计划
**主要文件**: 
- [backend/routes/courses.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/backend/routes/courses.js)
- [frontend/src/views/admin/Courses.vue](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/frontend/src/views/admin/Courses.vue)

**测试步骤**:
1. 使用 admin/123456 登录
2. 进入「管理后台」→「培训计划」
3. 点击「新建培训计划」
4. 填写：课程主题、讲师、适用岗位、报名范围、直播时间、学分
5. 勾选「必修课程」→ 保存
6. 验证：课程列表显示新课程，员工自动报名

### 2. 直播课堂互动
**测试路径**: 课程详情 → 进入直播课堂
**主要文件**:
- [backend/routes/live.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/backend/routes/live.js)
- [frontend/src/views/live/Room.vue](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/frontend/src/views/live/Room.vue)

**测试步骤**:
1. 使用 employee1/123456 登录
2. 进入「Vue3 前端开发实战」课程
3. 点击「进入直播课堂」
4. 点击「签到」→ 验证显示「已签到」
5. 切换到「投票」→ 讲师创建投票后参与投票
6. 切换到「提问」→ 提交问题
7. 切换到「聊天」→ 发送消息（支持WebSocket实时）

### 3. 在线考试
**测试路径**: 课程详情 → 参加考试
**主要文件**:
- [backend/routes/exams.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/backend/routes/exams.js)
- [frontend/src/views/exam/Exam.vue](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/frontend/src/views/exam/Exam.vue)

**测试步骤**:
1. 使用 employee3/123456 登录（产品经理）
2. 进入「产品经理方法论」课程
3. 点击「参加考试」→ 开始考试
4. 答题（单选、多选、判断）
5. 交卷 → 验证显示分数和通过状态
6. 验证：自动生成证书、课程标记为完成

### 4. 数据统计与导出
**测试路径**: 管理后台 → 数据概览 → 导出培训档案
**主要文件**:
- [backend/routes/admin.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/backend/routes/admin.js)
- [frontend/src/views/admin/Dashboard.vue](file:///Users/chen/Documents/trae_projects/local_projects/may-63419/frontend/src/views/admin/Dashboard.vue)

**测试步骤**:
1. 使用 admin/123456 登录
2. 进入「管理后台」→「数据概览」
3. 查看：课程总数、员工总数、部门完成率、缺席名单
4. 点击「导出培训档案」
5. 验证：下载 CSV 文件，包含姓名、部门、课程、出勤、分数、证书等信息

---

## 二、边界场景测试（Edge）

### 1. 迟到签到
**前置条件**: 课程直播已开始超过15分钟
**测试步骤**:
1. 员工登录进入直播课堂
2. 点击签到
3. 验证：签到成功，后台异常列表产生「签到迟到」记录

### 2. 考试次数限制
**测试步骤**:
1. 员工参加考试，连续3次不及格
2. 验证：第4次时提示「已达到最大考试次数」
3. 管理后台可查看重考异常记录

### 3. 必修课程提醒
**测试步骤**:
1. 查看员工首页「待学课程」
2. 验证：必修课标红显示，排在前面
3. 未完成的必修课在首页有提醒

---

## 三、冲突场景测试（Conflict）

### 1. 重复签到
**测试步骤**:
1. 员工签到成功
2. 再次点击签到
3. 验证：按钮禁用，不重复记录

### 2. 重复投票
**测试步骤**:
1. 在直播课堂对某投票投过票
2. 再次点击其他选项
3. 验证：无法修改，保持原投票

### 3. 课程报名冲突
**测试步骤**:
1. 员工报名某课程
2. 再次点击「立即报名」
3. 验证：提示「已报名该课程」，不产生重复数据

---

## 四、失败场景测试（Failure）

### 1. 未登录访问
**测试步骤**:
1. 清除登录状态，直接访问 /courses
2. 验证：自动跳转到登录页

### 2. 权限不足
**测试步骤**:
1. 使用普通员工登录
2. 直接访问 /admin
3. 验证：跳转首页，提示权限不足

### 3. 端口冲突处理
**测试步骤**:
1. 先占用 3000 端口
2. 启动系统
3. 验证：后端启动脚本检测端口占用，提示错误

---

## 核心数据核对

### 数据库表检查
```bash
# 进入后端目录
cd backend

# 查看数据表
sqlite3 database/training.db ".tables"

# 查看测试数据
sqlite3 database/training.db "SELECT id,username,role,name FROM users;"
sqlite3 database/training.db "SELECT id,title,status,is_required FROM courses;"
sqlite3 database/training.db "SELECT * FROM course_enrollments;"
```

### 关键API测试
```bash
# 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 使用token获取课程列表
curl http://localhost:3000/api/courses \
  -H "Authorization: Bearer <your_token>"

# 获取统计数据
curl http://localhost:3000/api/admin/statistics \
  -H "Authorization: Bearer <your_token>"
```

---

## 项目结构

```
may-63419/
├── .env                    # 环境配置（端口3000、5173）
├── package.json            # 根项目配置
├── start.sh                # 启动脚本
├── backend/
│   ├── package.json
│   ├── server.js           # 主服务入口（含WebSocket）
│   ├── database/
│   │   ├── schema.sql      # 数据库Schema（12张表）
│   │   ├── init.js         # 初始化脚本
│   │   └── training.db     # SQLite数据库（运行时生成）
│   ├── middleware/
│   │   └── auth.js         # JWT认证中间件
│   └── routes/
│       ├── auth.js         # 认证接口
│       ├── courses.js      # 课程管理
│       ├── live.js         # 直播互动
│       ├── exams.js        # 考试系统
│       └── admin.js        # 管理后台
└── frontend/
    ├── package.json
    ├── vite.config.js      # Vite配置（strictPort: true）
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── router/         # 路由配置
        ├── stores/         # Pinia状态管理
        ├── utils/          # API封装
        └── views/          # 页面组件
```

---

## 验收标准

✅ **功能完整性**
- [ ] 培训计划CRUD
- [ ] 直播签到/聊天/投票/提问
- [ ] 在线考试（单选/多选/判断）
- [ ] 证书自动生成
- [ ] 数据统计与CSV导出
- [ ] 异常记录与处理

✅ **数据一致性**
- [ ] 签到记录落库
- [ ] 互动数据绑定学员
- [ ] 考试成绩影响课程状态
- [ ] 可导出完整培训档案

✅ **安全性**
- [ ] JWT认证
- [ ] 角色权限控制
- [ ] 密码加密存储

✅ **运维规范**
- [ ] 端口检测与冲突处理
- [ ] 禁止全局kill命令
- [ ] .env配置统一管理
