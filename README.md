# 网易严选 - 生活电商平台

## 🚀 项目概述

这是一个仿网易严选风格的生活电商平台，包含完整的商品浏览、购物车、订单、用户系统等功能。

## 📍 服务地址

- **前端地址**: http://localhost:2990
- **后端地址**: http://localhost:1990

## 🛠 技术栈

### 后端
- Node.js + Express
- JSON 文件数据库（无需额外数据库软件）
- JWT 认证
- bcryptjs 密码加密

### 前端
- React 18
- React Router
- Vite
- Axios

## 🎯 功能特性

### 1. 启动流程
- 欢迎页
- 广告页（可自动跳过或查看详情）
- 广告详情页（支持收藏、分享）

### 2. 用户系统
- 手机号验证码登录
- 账号密码登录
- 邮箱账号登录
- 用户注册
- 找回密码
- 第三方授权登录（模拟）

### 3. 首页
- 顶部频道导航（推荐、新品、众筹、福利社等）
- 频道横向滚动
- 展开全部频道
- 商品列表展示

### 4. 推荐页
- 私人订制推荐
- 猜你喜欢
- 人气推荐
- 品牌制造商直供
- 严选一起拼
- 积分中心
- 会员俱乐部

### 5. 搜索页
- 搜索输入
- 联想词推荐
- 历史搜索
- 热门搜索
- 搜索结果跳转

### 6. 购物车
- 商品列表
- 数量调整
- 删除商品
- 全选/取消全选
- 价格合计
- 下单

### 7. 订单页
- 订单列表
- 订单详情
- 订单状态

### 8. 个人页
- 用户信息
- 我的订单
- 功能菜单

## 📁 项目结构

```
may-990/
├── backend/              # 后端服务
│   ├── routes/          # API 路由
│   ├── middleware/      # 中间件
│   ├── database.js      # 数据库操作
│   ├── server.js        # 服务入口
│   └── package.json
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 通用组件
│   │   ├── context/    # React Context
│   │   └── services/   # API 服务
│   ├── index.html
│   └── package.json
├── data/                # 数据存储目录
└── .env                 # 环境配置
```

## 🚀 启动与停止

### 启动服务
服务已经在后台运行，无需手动启动。

### 停止服务
```bash
# 停止后端
pkill -f "node server.js"

# 停止前端
pkill -f "vite"
```

### 重新启动
```bash
# 后端
cd backend && nohup npm start > backend.log 2>&1 &

# 前端
cd frontend && nohup npm run dev > frontend.log 2>&1 &
```

## 📝 开发说明

### 后端 API 说明

#### 认证相关
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `POST /api/auth/reset-password` - 重置密码
- `POST /api/auth/send-code` - 发送验证码

#### 广告相关
- `GET /api/ads` - 获取广告列表
- `GET /api/ads/:id` - 获取广告详情
- `POST /api/ads/:id/favorite` - 收藏/取消收藏广告
- `GET /api/ads/:id/favorite/check` - 检查收藏状态

#### 商品相关
- `GET /api/products/categories` - 获取分类列表
- `GET /api/products` - 获取商品列表
- `GET /api/products/recommend` - 获取推荐商品
- `GET /api/products/:id` - 获取商品详情

#### 购物车相关
- `GET /api/cart` - 获取购物车
- `POST /api/cart` - 添加到购物车
- `PUT /api/cart/:id` - 更新购物车
- `DELETE /api/cart/:id` - 删除购物车项

#### 订单相关
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单

#### 搜索相关
- `GET /api/search/hot` - 热门搜索
- `GET /api/search/history` - 搜索历史
- `GET /api/search/suggestions` - 搜索建议
- `GET /api/search` - 搜索商品

## 🎉 使用说明

1. 打开浏览器访问 http://localhost:2990
2. 首次启动会看到欢迎页 → 广告页
3. 使用手机号验证码登录（任意手机号，验证码 123456）
4. 开始浏览商品！

## 📌 注意事项

- 数据存储在 `data/db.json` 文件中
- 服务使用后台运行，关闭终端不影响
- 如需要重启，请参考上方停止和启动命令
