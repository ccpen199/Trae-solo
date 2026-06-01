# 企业内部培训直播系统

Enterprise Training Live Platform - 服务培训管理员、讲师、员工和 HR 的全栈培训系统。

## 功能特性

### 🎯 培训计划管理
- 课程主题、讲师、适用岗位、报名范围配置
- 直播时间、学分、必修状态设置
- 自动全员报名或范围报名

### 📺 直播课堂
- ✅ 签到（迟到检测、IP/设备记录）
- 💬 实时聊天（WebSocket）
- ❓ 提问互动
- 📊 实时投票
- 📁 资料下载
- 🎥 回放生成

### 👨‍🎓 学员端
- 待学课程列表（必修优先）
- 学习进度追踪
- 在线考试（单选/多选/判断）
- 证书管理
- 未完成必修提醒

### 📊 管理后台
- 部门完成率统计
- 缺席名单追踪
- 考试通过率分析
- 课程评价查看
- 培训档案导出（CSV）

### ⚠️ 异常处理
- 直播中断记录
- 签到迟到/代签到检测
- 回放不可用标记
- 考试重考管理
- 处理结果记录

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue 3 + Vite | 端口 5173（strictPort） |
| 后端 | Express + Node.js | 端口 3000 |
| 数据库 | SQLite | 单文件，无需额外服务 |
| 实时通信 | WebSocket | 直播聊天互动 |
| UI框架 | Element Plus | 企业级组件库 |
| 状态管理 | Pinia | Vue 3 推荐方案 |

## 快速开始

### 一键启动

```bash
# 赋予执行权限并启动
chmod +x start.sh && ./start.sh
```

### 手动启动

```bash
# 1. 安装依赖
npm run install-all

# 2. 初始化数据库（生成测试数据）
npm run init-db

# 3. 启动前后端服务
npm run dev
```

访问：http://localhost:5173

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 讲师 | instructor1 | 123456 |
| HR | hr1 | 123456 |
| 员工 | employee1 | 123456 |

## 端口说明

| 服务 | 端口 | 配置位置 |
|------|------|----------|
| 后端 API | 3000 | .env PORT |
| 前端开发 | 5173 | vite.config.js server.port |
| WebSocket | 3000 | 与后端复用 |

**端口冲突处理**：
1. 启动脚本自动检测端口占用
2. 仅终止当前项目归属进程（检查 cwd 和命令行）
3. 禁止使用 `pkill -f vite`、`killall node` 等全局命令
4. 无法确认归属时，建议修改 .env 配置备用端口

## 项目结构

```
may-63419/
├── .env                    # 环境配置
├── package.json            # 根配置
├── start.sh                # 启动脚本
├── TEST_GUIDE.md           # 测试验收指南
├── backend/                # 后端服务
│   ├── server.js           # 主入口
│   ├── database/           # SQLite数据库
│   ├── middleware/         # 中间件
│   └── routes/             # API路由
└── frontend/               # 前端应用
    ├── vite.config.js
    └── src/
        ├── views/          # 页面组件
        ├── router/         # 路由配置
        └── stores/         # 状态管理
```

## 核心API列表

### 认证
- `POST /api/auth/login` - 登录

### 课程
- `GET /api/courses` - 课程列表
- `GET /api/courses/my-courses` - 我的课程
- `GET /api/courses/:id` - 课程详情
- `POST /api/courses` - 创建课程（管理员）
- `POST /api/courses/:id/enroll` - 报名课程

### 直播
- `POST /api/live/:courseId/checkin` - 签到
- `GET /api/live/:courseId/attendance` - 签到状态
- `POST /api/live/:courseId/question` - 提交问题
- `POST /api/live/:courseId/poll` - 创建投票
- `POST /api/live/poll/:pollId/vote` - 投票

### 考试
- `GET /api/exams/:id` - 考试详情
- `POST /api/exams/:id/start` - 开始考试
- `POST /api/exams/:id/submit` - 提交答卷

### 管理
- `GET /api/admin/statistics` - 统计数据
- `GET /api/admin/exceptions` - 异常列表
- `POST /api/admin/exceptions/:id/handle` - 处理异常
- `GET /api/admin/export/training-records` - 导出培训档案

## 数据库表设计

| 表名 | 说明 |
|------|------|
| users | 用户表（员工、讲师、HR、管理员） |
| courses | 课程表 |
| course_enrollments | 报名表 |
| attendances | 签到表 |
| live_interactions | 互动记录表 |
| polls | 投票表 |
| poll_votes | 投票结果表 |
| exams | 考试表 |
| exam_questions | 考试题表 |
| exam_attempts | 考试记录表 |
| certificates | 证书表 |
| course_evaluations | 课程评价表 |
| exceptions | 异常记录表 |
| notifications | 通知表 |

## 测试与验收

详细测试用例请查看 [TEST_GUIDE.md](./TEST_GUIDE.md)，包含：
- 正常场景（培训计划、直播互动、考试、导出）
- 边界场景（迟到、次数限制）
- 冲突场景（重复签到、重复投票）
- 失败场景（未登录、权限不足、端口冲突）
- 数据库核对SQL
- API测试curl命令

## 合规说明

1. **进程隔离**：启动、重启和释放端口时，仅处理当前项目归属进程
2. **数据留存**：所有核心动作落库 SQLite，支持复查和导出
3. **端口管理**：Vite 启用 strictPort，后端显式绑定，启动前检测占用
4. **无外部依赖**：无需 MySQL/PostgreSQL/Redis/消息队列/对象存储
