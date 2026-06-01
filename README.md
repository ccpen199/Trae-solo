# 企业密码保险库系统

团队密钥和账号凭据托管系统，服务研发、运维、安全和项目成员。

## ✨ 核心功能

### 1. 保险库空间管理
- 按团队和项目划分凭据空间
- 支持多种凭据类型：账号密码、API Token、证书、数据库连接、备注附件
- 凭据密文存储（AES-256-GCM加密）

### 2. 授权查看系统
- 访问申请/审批流程
- 记录申请人、授权范围、查看理由、到期时间
- 脱敏展示 + 水印提示
- 支持一次性复制

### 3. 分享与授权
- 指定用户/角色分配权限
- 设置有效期，超期自动失效
- 转交项目时保留授权历史

### 4. 轮换中心
- 过期凭据提醒
- 长期未改密检测
- 弱密码检测（zxcvbn评分）
- 离职人员相关权限清理
- 支持登记轮换结果

### 5. 安全事件响应
- 疑似泄露记录
- 异常查看检测（高频、非工作时间）
- 批量导出监控
- 紧急冻结功能
- 影响凭据清单和处置进度

## 🚀 快速启动

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖
```bash
npm run setup
```

### 启动服务
```bash
# 启动前后端开发服务
npm run dev

# 或分别启动
npm run dev:backend  # 后端端口 3001
npm run dev:frontend # 前端端口 5173
```

### 访问地址
- 前端: http://localhost:5173
- 后端API: http://localhost:3001/api
- 健康检查: http://localhost:3001/api/health

### 测试账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Admin@123 | 管理员 |
| devops | User@123 | 普通用户 |
| developer | User@123 | 普通用户 |

## 📁 项目结构

```
.
├── .env                    # 环境配置（端口、密钥）
├── package.json            # 根目录配置
├── backend/                # 后端服务
│   ├── package.json
│   ├── src/
│   │   ├── server.js       # 入口文件
│   │   ├── database/       # 数据库层
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # API路由
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试用例
│   └── data/               # SQLite数据库文件
└── frontend/               # 前端应用
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx        # 入口文件
        ├── App.jsx         # 路由配置
        ├── services/       # API服务
        ├── components/     # 通用组件
        └── pages/          # 页面组件
```

## 🧪 测试样例

### 1. 正常用例
- ✅ 用户登录登出
- ✅ 创建/编辑/删除凭据
- ✅ 查看明文凭据（含水印）
- ✅ 复制凭据内容
- ✅ 提交访问申请
- ✅ 审批/拒绝申请
- ✅ 创建安全事件

### 2. 边界用例
- ✅ 空字符串加密解密
- ✅ 长文本加密解密（10KB）
- ✅ 批量凭据查看
- ✅ 超长密码存储
- ✅ 特殊字符处理

### 3. 冲突用例
- ✅ 重复申请访问（应拒绝）
- ✅ 重复授权用户（应报错）
- ✅ 端口占用检测（应退出）
- ✅ 已冻结凭据查看（应拒绝）

### 4. 失败用例
- ✅ 错误密码登录（应拒绝）
- ✅ 错误密钥解密（应报错）
- ✅ 越权访问凭据（应403）
- ✅ 无效Token访问（应401）
- ✅ 非管理员冻结凭据（应拒绝）

## 🔧 端口配置

端口计算公式：
- 前端: `FRONTEND_PORT=5173`
- 后端: `BACKEND_PORT=3001`

Vite 使用 `strictPort: true` 模式，端口被占用时直接报错退出。

## 📊 核心数据表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| teams | 团队表 |
| projects | 项目表 |
| team_members | 团队成员表 |
| credentials | 凭据表（密文存储） |
| access_requests | 访问申请表 |
| access_grants | 授权表 |
| credential_views | 查看记录表 |
| rotation_reminders | 轮换提醒表 |
| security_incidents | 安全事件表 |
| audit_logs | 审计日志表 |

## 🔒 安全说明

1. **加密算法**: AES-256-GCM 带认证标签
2. **密钥派生**: PBKDF2 (100,000 轮迭代)
3. **密码哈希**: PBKDF2-SHA256
4. **身份认证**: JWT Token (24小时有效期)
5. **操作审计**: 所有敏感操作记录日志
6. **凭据查看**: 记录查看人、时间、水印
7. **数据脱敏**: 列表页默认展示脱敏值

## ⚙️ 外部依赖说明

本项目使用 **SQLite** 作为数据库，无外部服务依赖。

### 如考虑生产环境扩展：

| 组件 | 说明 | 配置入口 | 降级方案 |
|------|------|----------|----------|
| MySQL | 主数据库 | 后端配置 | SQLite（当前） |
| Redis | 会话缓存 | .env | 内存缓存 |
| RabbitMQ | 消息通知 | - | 同步调用 |
| MinIO | 附件存储 | - | 本地文件系统 |

### 启动方式（生产环境）
```bash
# MySQL
docker run -d -p 3306:3306 -e MYSQL_DATABASE=vault mysql:8

# Redis
docker run -d -p 6379:6379 redis:7-alpine
```

## 🧪 运行测试

```bash
cd backend
npm test
```

## 📝 主要文件说明

| 文件 | 说明 |
|------|------|
| [.env](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/.env) | 环境变量配置 |
| [server.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/backend/src/server.js) | 后端入口 |
| [schema.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/backend/src/database/schema.js) | 数据库 schema |
| [encryption.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/backend/src/utils/encryption.js) | 加密工具 |
| [auth.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/backend/src/middleware/auth.js) | 认证中间件 |
| [App.jsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/frontend/src/App.jsx) | 前端路由 |
| [vite.config.js](file:///Users/chen/Documents/trae_projects/local_projects/may-63398/frontend/vite.config.js) | Vite配置 |

## 🔍 导出核对

数据库文件位置: `backend/data/vault.db`

可使用 SQLite 客户端查看：
```bash
sqlite3 backend/data/vault.db ".tables"
sqlite3 backend/data/vault.db "SELECT * FROM credentials;"
```

加密字段验证：
- `encrypted_password` 字段为 Base64 编码的密文
- 包含 salt(64B) + iv(16B) + tag(16B) + ciphertext
- 无法直接从数据库读取明文
