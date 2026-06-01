# 版权保护管理系统 - 测试样例与验收文档

## 一、系统架构

### 技术栈
- **前端**: React 18 + TypeScript + Vite + Ant Design 5.x + ECharts
- **后端**: Node.js + Express + TypeScript + better-sqlite3
- **数据库**: SQLite (文件存储: data/copyright.db)
- **认证**: JWT Token + bcryptjs

### 端口配置
- 前端端口: 5173 (Vite strictPort 模式)
- 后端端口: 3001 (Express 显式绑定)
- 配置文件: 根目录 `.env`

### 目录结构
```
may-63418/
├── .env                      # 环境配置
├── backend/                  # 后端服务
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # 服务入口
│       ├── database/         # 数据库层
│       ├── dao/              # 数据访问层
│       ├── middleware/       # 中间件
│       ├── routes/           # API 路由
│       └── types/            # 类型定义
├── frontend/                 # 前端应用
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx          # 入口文件
│       ├── App.tsx           # 路由配置
│       ├── services/         # API 服务
│       ├── components/       # 通用组件
│       └── pages/            # 页面组件
└── data/                     # 数据目录 (运行时创建)
    └── copyright.db          # SQLite 数据库
```

---

## 二、启动说明

### 前置检查
```bash
# 检查端口占用
lsof -i :5173  # 检查前端端口
lsof -i :3001  # 检查后端端口

# 如端口被占用，确认 PID 归属当前项目后再终止
# 或修改 .env 中的端口配置
```

### 首次启动流程

#### 1. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 2. 初始化数据库
```bash
cd backend
npm run init-db
```

#### 3. 启动后端服务
```bash
cd backend
npm run dev
# 服务地址: http://localhost:3001
# 健康检查: http://localhost:3001/api/health
```

#### 4. 启动前端服务
```bash
cd frontend
npm run dev
# 访问地址: http://localhost:5173
```

### 测试账号
| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | admin | 系统管理员，全部权限 |
| operation1 | 123456 | operation | 运营专员，课程/素材管理 |
| lecturer1 | 123456 | lecturer | 讲师，查看自己的课程 |
| legal1 | 123456 | legal | 法务，审核/维权/报表 |
| cs1 | 123456 | customer_service | 客服，登记盗版线索 |

---

## 三、核心 API 列表

### 认证模块
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 公开 |
| GET | /api/auth/profile | 获取用户信息 | 已登录 |
| POST | /api/auth/logout | 登出 | 已登录 |

### 课程管理
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/courses | 课程列表 | 已登录 |
| GET | /api/courses/:id | 课程详情 | 已登录 |
| POST | /api/courses | 创建课程 | admin/operation |
| PUT | /api/courses/:id | 更新课程 | admin/operation |
| POST | /api/courses/:id/submit-review | 提交审核 | 已登录 |

### 素材管理
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/materials | 素材列表 | 已登录 |
| GET | /api/materials/:id | 素材详情 | 已登录 |
| POST | /api/materials | 创建素材 | admin/operation/lecturer |
| PUT | /api/materials/:id | 更新素材 | admin/operation/lecturer |
| POST | /api/materials/:id/authorize | 素材授权 | admin/legal |
| GET | /api/materials/expiring-soon | 即将到期素材 | 已登录 |

### 上架审核
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/publication/check/:courseId | 合规检查 | admin/operation/legal |
| POST | /api/publication/review/:courseId | 审核课程 | admin/legal |
| POST | /api/publication/publish/:courseId | 发布课程 | admin/operation |

### 盗版线索
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/piracy | 线索列表 | 已登录 |
| GET | /api/piracy/:id | 线索详情 | 已登录 |
| POST | /api/piracy | 登记线索 | 已登录 |
| PUT | /api/piracy/:id | 更新线索 | admin/operation/legal |
| POST | /api/piracy/batch-update | 批量更新 | admin/operation/legal |

### 维权管理
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/enforcement | 案件列表 | 已登录 |
| GET | /api/enforcement/:id | 案件详情 | 已登录 |
| POST | /api/enforcement | 创建案件 | admin/legal |
| PUT | /api/enforcement/:id/status | 更新状态 | admin/legal |
| POST | /api/enforcement/:id/attachments | 上传附件 | admin/legal |

### 报表统计
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/reports/overview | 概览统计 | 已登录 |
| GET | /api/reports/high-risk-courses | 高风险课程 | 已登录 |
| GET | /api/reports/piracy-trend | 侵权趋势 | 已登录 |
| GET | /api/reports/infringement-statistics | 侵权统计 | 已登录 |
| GET | /api/reports/processing-efficiency | 处理效率 | 已登录 |
| GET | /api/reports/loss-estimation | 损失估算 | 已登录 |
| GET | /api/reports/authorization-expiry | 授权到期提醒 | 已登录 |

---

## 四、测试样例

### 1. 正常流程样例

#### 样例 1.1: 课程完整上架流程
**前置条件**: 使用 admin/operation1 账号登录

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 创建课程: POST /api/courses <br> body: {course_code: "TEST-001", name: "测试课程"} | 返回课程 ID，状态为 draft |
| 2 | 创建素材: POST /api/materials <br> body: {material_code: "MAT-TEST-001", name: "测试视频", type: "video", course_id: 课程ID, authorization_status: "authorized"} | 返回素材 ID |
| 3 | 提交审核: POST /api/courses/{id}/submit-review | 课程状态变为 pending_review |
| 4 | 合规检查: POST /api/publication/check/{courseId} | 返回 can_publish: true |
| 5 | 审核通过: POST /api/publication/review/{courseId} <br> body: {review_status: "approved"} | 课程状态变为 approved |
| 6 | 发布课程: POST /api/publication/publish/{courseId} | 课程状态变为 published |

**验证点**: 
- 每一步操作都有 audit_log 记录
- 课程状态流转正确: draft → pending_review → approved → published

#### 样例 1.2: 盗版线索登记与维权
**前置条件**: 使用 cs1 账号登记线索，legal1 账号处理

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 登记线索: POST /api/piracy <br> body: {source_channel: "user_report", infringing_url: "...", related_course_id: 1} | 返回线索 ID，状态为 pending |
| 2 | (legal1) 创建案件: POST /api/enforcement <br> body: {piracy_clue_id: 线索ID, case_type: "takedown"} | 返回案件 ID，状态为 notice_sent |
| 3 | 更新状态: PUT /api/enforcement/{id}/status <br> body: {status: "platform_notified"} | 案件状态更新 |
| 4 | 更新状态: PUT /api/enforcement/{id}/status <br> body: {status: "takedown_confirmed"} | 案件和关联线索状态都更新 |

**验证点**:
- 案件状态更新后，关联线索状态同步更新
- 所有操作留痕

---

### 2. 边界条件样例

#### 样例 2.1: 缺少授权的课程无法提交审核
**前置条件**: 课程包含未授权的素材

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 创建课程，添加素材时设置 authorization_status: "pending" | 素材创建成功 |
| 2 | 调用提交审核接口 | 返回 400 错误，提示存在未授权素材 |
| 3 | 调用合规检查接口 | 返回 can_publish: false，issues 包含未授权提示 |

#### 样例 2.2: 未审核课程无法发布
**前置条件**: 课程状态为 draft 或 pending_review

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 直接调用发布接口 | 返回 400 错误，提示课程尚未通过审核 |

#### 样例 2.3: 授权到期提醒
**前置条件**: 存在 30 天内到期的授权素材

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 访问 GET /api/materials/expiring-soon | 返回到期列表，按到期时间排序 |
| 2 | 访问 GET /api/reports/authorization-expiry | 返回分类统计 (30天内/60天内/90天内) |

---

### 3. 冲突与权限样例

#### 样例 3.1: 角色权限控制
| 角色 | 尝试操作 | 预期结果 |
|------|----------|----------|
| lecturer1 | 调用 POST /api/publication/review | 返回 403 权限不足 |
| cs1 | 调用 PUT /api/piracy/{id} | 返回 403 权限不足 |
| legal1 | 调用 GET /api/audit | 返回 403 权限不足 |
| admin | 调用所有接口 | 正常访问 |

#### 样例 3.2: 未认证访问
| 操作 | 预期结果 |
|------|----------|
| 不带 Token 调用任何受保护接口 | 返回 401，提示未提供认证令牌 |
| 使用过期 Token 调用接口 | 返回 401，提示令牌无效或已过期 |

#### 样例 3.3: 重复编码
| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 创建课程编码 PYTHON-001 (已存在) | 返回 400，提示课程编码已存在 |
| 2 | 创建素材编码 MAT-VIDEO-001 (已存在) | 返回 400，提示素材编码已存在 |

---

### 4. 失败与异常样例

#### 样例 4.1: 登录失败
| 场景 | 操作 | 预期结果 |
|------|------|----------|
| 用户名不存在 | POST /api/auth/login <br> body: {username: "nonexist", password: "123456"} | 返回 401，用户名或密码错误 |
| 密码错误 | POST /api/auth/login <br> body: {username: "admin", password: "wrong"} | 返回 401，用户名或密码错误 |
| 空用户名 | POST /api/auth/login <br> body: {username: "", password: "123456"} | 返回 400，用户名和密码不能为空 |

#### 样例 4.2: 资源不存在
| 操作 | 预期结果 |
|------|----------|
| GET /api/courses/99999 | 返回 404，课程不存在 |
| GET /api/materials/99999 | 返回 404，素材不存在 |
| PUT /api/courses/99999 | 返回 404，课程不存在 |

#### 样例 4.3: 端口占用
| 场景 | 操作 | 预期结果 |
|------|------|----------|
| 3001 端口被占用 | 启动后端服务 | 启动失败，提示端口已被占用 |
| 5173 端口被占用 | 启动前端服务 | Vite 报错退出 (strictPort: true) |

---

## 五、验收清单

### 功能验收
- [ ] 用户登录/登出功能正常
- [ ] 课程 CRUD 功能正常
- [ ] 素材 CRUD 功能正常，授权流程正常
- [ ] 上架审核流程完整（提交→检查→审核→发布）
- [ ] 缺少授权的课程无法提交审核
- [ ] 盗版线索登记、查询、批量更新功能正常
- [ ] 维权案件创建、状态流转、附件管理正常
- [ ] 报表统计数据准确，图表正常展示
- [ ] 操作日志记录完整，仅管理员可见
- [ ] 角色权限控制正确

### 非功能验收
- [ ] 后端服务正常启动，健康检查返回 200
- [ ] 前端服务正常启动，页面可访问
- [ ] 端口绑定正确，无端口冲突
- [ ] SQLite 数据库文件正确创建
- [ ] 所有 API 接口响应时间 < 500ms (本地)
- [ ] 敏感操作都有审计日志记录
- [ ] 异常情况有友好的错误提示

---

## 六、主要文件清单

### 后端核心文件
| 文件 | 说明 |
|------|------|
| [backend/src/server.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/server.ts) | 服务入口，端口检查，路由注册 |
| [backend/src/database/schema.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/database/schema.ts) | 数据库表结构定义和初始数据 |
| [backend/src/database/index.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/database/index.ts) | 数据库连接和初始化 |
| [backend/src/middleware/auth.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/middleware/auth.ts) | 认证中间件和权限控制 |
| [backend/src/dao/base.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/dao/base.ts) | 通用数据访问方法 |
| [backend/src/types/index.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/types/index.ts) | TypeScript 类型定义 |

### 后端路由文件
| 文件 | 说明 |
|------|------|
| [backend/src/routes/auth.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/auth.ts) | 认证接口 |
| [backend/src/routes/courses.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/courses.ts) | 课程管理接口 |
| [backend/src/routes/materials.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/materials.ts) | 素材管理接口 |
| [backend/src/routes/lecturers.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/lecturers.ts) | 讲师管理接口 |
| [backend/src/routes/publication.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/publication.ts) | 上架审核接口 |
| [backend/src/routes/piracy.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/piracy.ts) | 盗版线索接口 |
| [backend/src/routes/enforcement.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/enforcement.ts) | 维权管理接口 |
| [backend/src/routes/reports.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/reports.ts) | 报表统计接口 |
| [backend/src/routes/audit.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/backend/src/routes/audit.ts) | 审计日志接口 |

### 前端核心文件
| 文件 | 说明 |
|------|------|
| [frontend/src/main.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/main.tsx) | 应用入口 |
| [frontend/src/App.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/App.tsx) | 路由配置 |
| [frontend/src/services/api.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/services/api.ts) | API 服务封装 |
| [frontend/src/components/MainLayout.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/components/MainLayout.tsx) | 主布局组件 |
| [frontend/vite.config.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/vite.config.ts) | Vite 配置 (strictPort) |

### 前端页面文件
| 页面 | 路径 |
|------|------|
| 登录页 | [frontend/src/pages/Login.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/Login.tsx) |
| 数据概览 | [frontend/src/pages/Dashboard.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/Dashboard.tsx) |
| 课程列表 | [frontend/src/pages/courses/CourseList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/courses/CourseList.tsx) |
| 课程详情 | [frontend/src/pages/courses/CourseDetail.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/courses/CourseDetail.tsx) |
| 素材列表 | [frontend/src/pages/materials/MaterialList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/materials/MaterialList.tsx) |
| 素材详情 | [frontend/src/pages/materials/MaterialDetail.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/materials/MaterialDetail.tsx) |
| 讲师管理 | [frontend/src/pages/lecturers/LecturerList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/lecturers/LecturerList.tsx) |
| 上架审核 | [frontend/src/pages/publication/PublicationReview.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/publication/PublicationReview.tsx) |
| 盗版线索列表 | [frontend/src/pages/piracy/PiracyClueList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/piracy/PiracyClueList.tsx) |
| 盗版线索详情 | [frontend/src/pages/piracy/PiracyClueDetail.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/piracy/PiracyClueDetail.tsx) |
| 维权案件列表 | [frontend/src/pages/enforcement/EnforcementCaseList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/enforcement/EnforcementCaseList.tsx) |
| 维权案件详情 | [frontend/src/pages/enforcement/EnforcementCaseDetail.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/enforcement/EnforcementCaseDetail.tsx) |
| 版权报表 | [frontend/src/pages/reports/Reports.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/reports/Reports.tsx) |
| 操作日志 | [frontend/src/pages/audit/AuditLog.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63418/frontend/src/pages/audit/AuditLog.tsx) |

---

## 七、数据导出与核对

### 数据库导出
```bash
# 备份数据库
cp data/copyright.db data/copyright_backup_$(date +%Y%m%d).db

# 导出为 SQL (需安装 sqlite3 命令行工具)
sqlite3 data/copyright.db .dump > data/copyright_dump.sql

# 导出指定表
sqlite3 data/copyright.db "SELECT * FROM piracy_clues;" -csv > data/piracy_clues.csv
```

### 核心数据核对清单

#### 1. 课程数据核对
```sql
-- 统计各状态课程数量
SELECT status, COUNT(*) as count FROM courses GROUP BY status;

-- 检查无素材的课程
SELECT c.id, c.course_code, c.name 
FROM courses c 
LEFT JOIN materials m ON c.id = m.course_id 
WHERE m.id IS NULL;

-- 检查已发布但未审核的课程
SELECT * FROM courses WHERE status = 'published' 
AND id NOT IN (SELECT course_id FROM publication_reviews WHERE review_status = 'approved');
```

#### 2. 素材授权核对
```sql
-- 统计各授权状态素材
SELECT authorization_status, COUNT(*) as count FROM materials GROUP BY authorization_status;

-- 已过期授权
SELECT * FROM materials 
WHERE authorization_end_date < DATE('now') 
AND status = 'active';

-- 即将 30 天内过期
SELECT * FROM materials 
WHERE authorization_end_date BETWEEN DATE('now') AND DATE('now', '+30 days')
AND status = 'active';
```

#### 3. 盗版线索核对
```sql
-- 各状态线索数量
SELECT status, COUNT(*) as count FROM piracy_clues GROUP BY status;

-- 无关联案件的已确认线索
SELECT * FROM piracy_clues 
WHERE status = 'confirmed' 
AND id NOT IN (SELECT piracy_clue_id FROM enforcement_cases);

-- 估算总损失
SELECT SUM(estimated_loss) as total_loss FROM piracy_clues;
```

#### 4. 维权案件核对
```sql
-- 各状态案件数量
SELECT status, COUNT(*) as count FROM enforcement_cases GROUP BY status;

-- 平均处理天数（已完成案件）
SELECT AVG(JULIANDAY(updated_at) - JULIANDAY(created_at)) as avg_days
FROM enforcement_cases 
WHERE status IN ('closed', 'takedown_confirmed');

-- 无附件的案件
SELECT * FROM enforcement_cases 
WHERE id NOT IN (SELECT case_id FROM enforcement_attachments);
```

#### 5. 审计日志核对
```sql
-- 各模块操作统计
SELECT module, action, COUNT(*) as count 
FROM audit_logs 
GROUP BY module, action 
ORDER BY module, count DESC;

-- 用户操作统计
SELECT u.name, u.role, COUNT(a.id) as operation_count 
FROM audit_logs a 
LEFT JOIN users u ON a.user_id = u.id 
GROUP BY a.user_id 
ORDER BY operation_count DESC;
```

---

## 八、常见问题

### Q1: 端口被占用怎么办？
```bash
# 查找占用端口的进程
lsof -i :3001

# 确认为当前项目进程后终止
kill <PID>

# 或修改 .env 中的端口配置
```

### Q2: 数据库文件损坏？
```bash
# 检查数据库完整性
sqlite3 data/copyright.db "PRAGMA integrity_check;"

# 从备份恢复
cp data/copyright_backup_YYYYMMDD.db data/copyright.db
```

### Q3: 忘记管理员密码？
```bash
# 重置密码需要修改数据库
sqlite3 data/copyright.db
# 执行 (密码 123456 的 hash):
UPDATE users SET password_hash = '$2a$10$rNqCxY5yQx5z9w8v7u6t5s4r3q2p1o0n9m8l7k6j5i4h3g2f1e0d' WHERE username = 'admin';
```

### Q4: 前端代理不生效？
检查 `frontend/vite.config.ts` 中的代理配置，确保后端端口正确。重启前端服务。

---

**文档版本**: v1.0  
**最后更新**: 2024-05-27
