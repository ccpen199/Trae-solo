may-88945/
├── .env                          # 端口配置 (48945/58945)
├── backend/
│   ├── .env                      # 后端环境变量
│   ├── package.json              # Express + Sequelize + SQLite
│   ├── data/app.sqlite           # SQLite 数据库文件
│   └── src/
│       ├── server.js             # 入口：127.0.0.1:58945
│       ├── app.js                # Express 应用 + CORS + 路由挂载
│       ├── config/database.js    # Sequelize SQLite 配置
│       ├── models/               # 9个核心模型
│       │   ├── User.js           # 用户（手机号/实名/钱包/优惠券）
│       │   ├── ServiceProvider.js# 服务商（资质/类目/结算周期）
│       │   ├── ServiceProduct.js # 商品（SKU/计价规则/账单模板）
│       │   ├── Order.js          # 订单（7种状态/4种支付方式）
│       │   ├── SubOrder.js       # 子订单（餐单/配送单/支付单）
│       │   ├── RiskEventLog.js   # 风控事件日志
│       │   ├── Coupon.js         # 优惠券池
│       │   ├── Arbitration.js    # 仲裁工单
│       │   ├── FeeConfig.js      # 费率配置
│       │   └── index.js          # 模型关联 + sync
│       ├── routes/               # 11组 API 路由
│       ├── middleware/auth.js    # JWT 认证 + 管理员权限
│       └── services/
│           ├── routingGateway.js # 动态路由网关（结算周期→费率→商品数排序）
│           └── fulfillmentCenter.js # 履约调度中心（按品类自动创建子订单）
└── frontend/
    ├── package.json              # React + Vite + Ant Design
    ├── vite.config.js            # strictPort + 代理 /api → 58945
    └── src/
        ├── main.jsx / App.jsx    # 路由 + 登录保护
        ├── services/api.js       # Axios 实例 + 12个 API 模块
        ├── layouts/MainLayout.jsx# 侧边栏 9 项菜单
        └── pages/                # 12 个业务页面may-88945/
├── .env                          # 端口配置 (48945/58945)
├── backend/
│   ├── .env                      # 后端环境变量
│   ├── package.json              # Express + Sequelize + SQLite
│   ├── data/app.sqlite           # SQLite 数据库文件
│   └── src/
│       ├── server.js             # 入口：127.0.0.1:58945
│       ├── app.js                # Express 应用 + CORS + 路由挂载
│       ├── config/database.js    # Sequelize SQLite 配置
│       ├── models/               # 9个核心模型
│       │   ├── User.js           # 用户（手机号/实名/钱包/优惠券）
│       │   ├── ServiceProvider.js# 服务商（资质/类目/结算周期）
│       │   ├── ServiceProduct.js # 商品（SKU/计价规则/账单模板）
│       │   ├── Order.js          # 订单（7种状态/4种支付方式）
│       │   ├── SubOrder.js       # 子订单（餐单/配送单/支付单）
│       │   ├── RiskEventLog.js   # 风控事件日志
│       │   ├── Coupon.js         # 优惠券池
│       │   ├── Arbitration.js    # 仲裁工单
│       │   ├── FeeConfig.js      # 费率配置
│       │   └── index.js          # 模型关联 + sync
│       ├── routes/               # 11组 API 路由
│       ├── middleware/auth.js    # JWT 认证 + 管理员权限
│       └── services/
│           ├── routingGateway.js # 动态路由网关（结算周期→费率→商品数排序）
│           └── fulfillmentCenter.js # 履约调度中心（按品类自动创建子订单）
└── frontend/
    ├── package.json              # React + Vite + Ant Design
    ├── vite.config.js            # strictPort + 代理 /api → 58945
    └── src/
        ├── main.jsx / App.jsx    # 路由 + 登录保护
        ├── services/api.js       # Axios 实例 + 12个 API 模块
        ├── layouts/MainLayout.jsx# 侧边栏 9 项菜单
        └── pages/                # 12 个业务页面may-88945/
├── .env                          # 端口配置 (48945/58945)
├── backend/
│   ├── .env                      # 后端环境变量
│   ├── package.json              # Express + Sequelize + SQLite
│   ├── data/app.sqlite           # SQLite 数据库文件
│   └── src/
│       ├── server.js             # 入口：127.0.0.1:58945
│       ├── app.js                # Express 应用 + CORS + 路由挂载
│       ├── config/database.js    # Sequelize SQLite 配置
│       ├── models/               # 9个核心模型
│       │   ├── User.js           # 用户（手机号/实名/钱包/优惠券）
│       │   ├── ServiceProvider.js# 服务商（资质/类目/结算周期）
│       │   ├── ServiceProduct.js # 商品（SKU/计价规则/账单模板）
│       │   ├── Order.js          # 订单（7种状态/4种支付方式）
│       │   ├── SubOrder.js       # 子订单（餐单/配送单/支付单）
│       │   ├── RiskEventLog.js   # 风控事件日志
│       │   ├── Coupon.js         # 优惠券池
│       │   ├── Arbitration.js    # 仲裁工单
│       │   ├── FeeConfig.js      # 费率配置
│       │   └── index.js          # 模型关联 + sync
│       ├── routes/               # 11组 API 路由
│       ├── middleware/auth.js    # JWT 认证 + 管理员权限
│       └── services/
│           ├── routingGateway.js # 动态路由网关（结算周期→费率→商品数排序）
│           └── fulfillmentCenter.js # 履约调度中心（按品类自动创建子订单）
└── frontend/
    ├── package.json              # React + Vite + Ant Design
    ├── vite.config.js            # strictPort + 代理 /api → 58945
    └── src/
        ├── main.jsx / App.jsx    # 路由 + 登录保护
        ├── services/api.js       # Axios 实例 + 12个 API 模块
        ├── layouts/MainLayout.jsx# 侧边栏 9 项菜单
        └── pages/                # 12 个业务页面may-88945/
├── .env                          # 端口配置 (48945/58945)
├── backend/
│   ├── .env                      # 后端环境变量
│   ├── package.json              # Express + Sequelize + SQLite
│   ├── data/app.sqlite           # SQLite 数据库文件
│   └── src/
│       ├── server.js             # 入口：127.0.0.1:58945
│       ├── app.js                # Express 应用 + CORS + 路由挂载
│       ├── config/database.js    # Sequelize SQLite 配置
│       ├── models/               # 9个核心模型
│       │   ├── User.js           # 用户（手机号/实名/钱包/优惠券）
│       │   ├── ServiceProvider.js# 服务商（资质/类目/结算周期）
│       │   ├── ServiceProduct.js # 商品（SKU/计价规则/账单模板）
│       │   ├── Order.js          # 订单（7种状态/4种支付方式）
│       │   ├── SubOrder.js       # 子订单（餐单/配送单/支付单）
│       │   ├── RiskEventLog.js   # 风控事件日志
│       │   ├── Coupon.js         # 优惠券池
│       │   ├── Arbitration.js    # 仲裁工单
│       │   ├── FeeConfig.js      # 费率配置
│       │   └── index.js          # 模型关联 + sync
│       ├── routes/               # 11组 API 路由
│       ├── middleware/auth.js    # JWT 认证 + 管理员权限
│       └── services/
│           ├── routingGateway.js # 动态路由网关（结算周期→费率→商品数排序）
│           └── fulfillmentCenter.js # 履约调度中心（按品类自动创建子订单）
└── frontend/
    ├── package.json              # React + Vite + Ant Design
    ├── vite.config.js            # strictPort + 代理 /api → 58945
    └── src/
        ├── main.jsx / App.jsx    # 路由 + 登录保护
        ├── services/api.js       # Axios 实例 + 12个 API 模块
        ├── layouts/MainLayout.jsx# 侧边栏 9 项菜单
        └── pages/                # 12 个业务页面import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProviderList from './pages/providers/ProviderList';
import ProviderAudit from './pages/providers/ProviderAudit';
import ProductList from './pages/products/ProductList';
import OrderList from './pages/orders/OrderList';
import FeeConfig from './pages/admin/FeeConfig';
import Arbitration from './pages/admin/Arbitration';
import Reports from './pages/admin/Reports';
import RiskEvents from './pages/risk/RiskEvents';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="providers" element={<ProviderList />} />
        <Route path="providers/audit" element={<ProviderAudit />} />
        <Route path="products" element={<ProductList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="fee-config" element={<FeeConfig />} />
        <Route path="arbitrations" element={<Arbitration />} />
        <Route path="reports" element={<Reports />} />
        <Route path="risk-events" element={<RiskEvents />} />
      </Route>
    </Routes>
  );
}
