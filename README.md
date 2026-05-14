# 云集 - 社交驱动精品会员电商

## 🚀 快速启动

```bash
# 后端 (端口 9893)
cd backend && npm start

# 前端 (端口 9892)
cd frontend && npm run dev
```

访问: http://localhost:9892

## 🌟 功能特性

### 用户认证
- ✅ 手机号验证码登录 (测试码: 123456)
- ✅ 微信登录 (UI已实现)
- ✅ JWT 会话管理

### 首页
- ✅ 搜索入口
- ✅ 分类导航
- ✅ Banner 轮播
- ✅ 热门商品推荐

### 商品模块
- ✅ 商品详情页
- ✅ 价格展示 (原价/现价)
- ✅ 运费说明
- ✅ 加入购物车
- ✅ 立即购买

### 购物车
- ✅ 购物车列表
- ✅ 商品删除
- ✅ 金额合计
- ✅ 结算下单

### 订单系统
- ✅ 订单列表
- ✅ 订单状态展示
- ✅ 创建时间

### 个人中心
- ✅ 用户信息展示
- ✅ 退出登录

## 🛠 技术栈

### 后端
- Node.js + Express
- JSON 文件存储 (data/db.json)
- JWT 认证
- CORS 跨域

### 前端
- React 18
- Vite 5
- React Router 6
- Axios
- 原生 CSS (内联样式)

## 📂 项目结构

```
may-989/
├── backend/
│   ├── server.js          # 后端主服务
│   ├── package.json
│   ├── .env
│   └── data/
│       └── db.json        # 数据存储
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── Profile.jsx
│   │   └── components/
│   │       └── BottomNav.jsx
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## 💡 使用说明

1. **登录测试**: 输入任意手机号，验证码输入 `123456`
2. **浏览商品**: 无需登录即可浏览首页和商品详情
3. **购买流程**: 需要先登录 -> 加入购物车 -> 结算 -> 查看订单

## 🎯 核心业务流程

1. 用户进入首页浏览
2. 点击商品查看详情
3. 加入购物车或立即购买
4. 登录认证
5. 购物车结算
6. 创建订单
7. 订单管理

---
✅ 项目已搭建完成，前后端服务可正常启动运行！
