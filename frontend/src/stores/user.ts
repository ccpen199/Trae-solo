import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, getUserInfoApi } from '@/api/auth'

export interface UserInfo {
may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本curl -X POST http://127.0.0.1:48935/api/auth/login 
  → {"code":200,"message":"登录成功","data":{"token":"...","user":{"role":"admin",...}}}curl -X POST http://127.0.0.1:48935/api/auth/login 
  → {"code":200,"message":"登录成功","data":{"token":"...","user":{"role":"admin",...}}}curl -X POST http://127.0.0.1:48935/api/auth/login 
  → {"code":200,"message":"登录成功","data":{"token":"...","user":{"role":"admin",...}}}curl -X POST http://127.0.0.1:48935/api/auth/login 
  → {"code":200,"message":"登录成功","data":{"token":"...","user":{"role":"admin",...}}}const service = axios.create({
  baseURL: '/api',  // 走 Vite 代理，同源请求，无 CORS 问题
  timeout: 15000
})const service = axios.create({
  baseURL: '/api',  // 走 Vite 代理，同源请求，无 CORS 问题
  timeout: 15000
})VITE_API_BASE_URL=http://127.0.0.1:58935/apiVITE_API_BASE_URL=http://127.0.0.1:58935/api[Login handleLogin] Clicked, phone: admin
[Login handleLogin] Form valid: true
[Login handleLogin] Calling userStore.login...
[Store login] Starting login with phone: admin
[Store login] API response: {code: 200, message: '登录成功', data: {...}}
[Store login] Token saved: eyJhbGciOiJIUzI1NiIs...
[Store fetchUserInfo] Starting...
[Store fetchUserInfo] API response: {code: 200, data: {...}}
[Store fetchUserInfo] UserInfo set: {id: 6, phone: 'admin', nickname: '系统管理员', role: 'admin'}
[Login handleLogin] login completed, userInfo: {role: 'admin'}
[Login handleLogin] Redirect to: /admin/dashboard role: admin
[Router Guard] Navigating to: /admin/dashboard requiresAuth: true requiresAdmin: true
[Router Guard] token: true userInfo: {...} role: admin
[Router Guard] Admin check - role: admin isAdmin: true
[Router Guard] Proceed to: /admin/dashboard
[Login handleLogin] router.push completed[Login handleLogin] Clicked, phone: admin
[Login handleLogin] Form valid: true
[Login handleLogin] Calling userStore.login...
[Store login] Starting login with phone: admin
[Store login] API response: {code: 200, message: '登录成功', data: {...}}
[Store login] Token saved: eyJhbGciOiJIUzI1NiIs...
[Store fetchUserInfo] Starting...
[Store fetchUserInfo] API response: {code: 200, data: {...}}
[Store fetchUserInfo] UserInfo set: {id: 6, phone: 'admin', nickname: '系统管理员', role: 'admin'}
[Login handleLogin] login completed, userInfo: {role: 'admin'}
[Login handleLogin] Redirect to: /admin/dashboard role: admin
[Router Guard] Navigating to: /admin/dashboard requiresAuth: true requiresAdmin: true
[Router Guard] token: true userInfo: {...} role: admin
[Router Guard] Admin check - role: admin isAdmin: true
[Router Guard] Proceed to: /admin/dashboard
[Login handleLogin] router.push completedrouter.beforeEach(async (to, _from, next) => {
  // 关键修复：有 token 但无 userInfo 时，先异步加载用户信息
  if (userStore.token && !userStore.userInfo && to.path !== '/login') {
    await userStore.fetchUserInfo()
  }
  
  // 再进行角色权限检查
  if (to.meta.requiresAdmin) {
    const role = userStore.userInfo?.role || ''
    if (!ADMIN_ROLES.includes(role)) {
      next('/home')
      return
    }
  }
  next()
})router.beforeEach(async (to, _from, next) => {
  // 关键修复：有 token 但无 userInfo 时，先异步加载用户信息
  if (userStore.token && !userStore.userInfo && to.path !== '/login') {
    await userStore.fetchUserInfo()
  }
  
  // 再进行角色权限检查
  if (to.meta.requiresAdmin) {
    const role = userStore.userInfo?.role || ''
    if (!ADMIN_ROLES.includes(role)) {
      next('/home')
      return
    }
  }
  next()
})may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本curl -X POST http://127.0.0.1:48935/api/auth/login 
  → {"code":200,"message":"登录成功","data":{"token":"...","user":{"role":"admin",...}}}curl -X POST http://127.0.0.1:48935/api/auth/login 
  → {"code":200,"message":"登录成功","data":{"token":"...","user":{"role":"admin",...}}}[Login handleLogin] Clicked, phone: admin
[Login handleLogin] Form valid: true
[Login handleLogin] Calling userStore.login...
[Store login] Starting login with phone: admin
[Store login] API response: {code: 200, message: '登录成功', data: {...}}
[Store login] Token saved: eyJhbGciOiJIUzI1NiIs...
[Store fetchUserInfo] Starting...
[Store fetchUserInfo] API response: {code: 200, data: {...}}
[Store fetchUserInfo] UserInfo set: {id: 6, phone: 'admin', nickname: '系统管理员', role: 'admin'}
[Login handleLogin] login completed, userInfo: {role: 'admin'}
[Login handleLogin] Redirect to: /admin/dashboard role: admin
[Router Guard] Navigating to: /admin/dashboard requiresAuth: true requiresAdmin: true
[Router Guard] token: true userInfo: {...} role: admin
[Router Guard] Admin check - role: admin isAdmin: true
[Router Guard] Proceed to: /admin/dashboard
[Login handleLogin] router.push completed[Login handleLogin] Clicked, phone: admin
[Login handleLogin] Form valid: true
[Login handleLogin] Calling userStore.login...
[Store login] Starting login with phone: admin
[Store login] API response: {code: 200, message: '登录成功', data: {...}}
[Store login] Token saved: eyJhbGciOiJIUzI1NiIs...
[Store fetchUserInfo] Starting...
[Store fetchUserInfo] API response: {code: 200, data: {...}}
[Store fetchUserInfo] UserInfo set: {id: 6, phone: 'admin', nickname: '系统管理员', role: 'admin'}
[Login handleLogin] login completed, userInfo: {role: 'admin'}
[Login handleLogin] Redirect to: /admin/dashboard role: admin
[Router Guard] Navigating to: /admin/dashboard requiresAuth: true requiresAdmin: true
[Router Guard] token: true userInfo: {...} role: admin
[Router Guard] Admin check - role: admin isAdmin: true
[Router Guard] Proceed to: /admin/dashboard
[Login handleLogin] router.push completedmay-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本may-88935/
├── .env                              # 环境配置 (端口48935/58935)
├── ARCHITECTURE.md                   # 架构设计文档
├── frontend.log                      # 前端日志
├── backend.log                       # 后端日志
├── frontend/                         # 前端 Web 应用
│   ├── package.json
│   ├── vite.config.ts                # 端口48935 + 代理配置
│   └── src/
│       ├── views/
│       │   ├── user/                 # 用户端 (7个页面)
│       │   │   ├── Login.vue         # 登录/注册
│       │   │   ├── Home.vue          # 首页设备列表/地图
│       │   │   ├── DeviceDetail.vue  # 设备详情
│       │   │   ├── WashControl.vue   # 洗衣控制(启动/暂停/续洗)
│       │   │   ├── Payment.vue       # 多方式支付
│       │   │   ├── OrderList.vue     # 订单历史
│       │   │   └── OrderDetail.vue   # 订单详情(能耗图表)
│       │   └── admin/                # 管理后台 (9个页面)
│       │       ├── Layout.vue        # 侧边栏布局
│       │       ├── Dashboard.vue     # 数据概览
│       │       ├── GisMap.vue        # GIS设备热力图
│       │       ├── DeviceList.vue    # 设备CRUD管理
│       │       ├── WorkOrders.vue    # 报修工单
│       │       ├── Reports.vue       # 能耗/结算报表
│       │       ├── Alerts.vue        # 异常告警
│       │       ├── Firmware.vue      # 固件升级
│       │       └── BrandConfig.vue   # 品牌UI定制
│       ├── router/
│       ├── stores/
│       ├── api/
│       └── components/
├── backend/                          # 后端 API 服务
│   ├── package.json
│   ├── .env
│   ├── data/app.sqlite               # SQLite 数据库 (14张表)
│   └── src/
│       ├── index.ts                  # 入口 (监听127.0.0.1:58935)
│       ├── config.ts                 # 配置加载
│       ├── database.ts               # 数据库初始化
│       ├── middleware/
│       │   ├── auth.ts               # JWT认证 + 角色权限
│       │   └── cors.ts               # CORS (允许48935)
│       ├── services/                 # 业务逻辑层
│       ├── routes/                   # API路由
│       │   ├── auth.ts               # /api/auth/*
│       │   ├── devices.ts            # /api/devices/*
│       │   ├── orders.ts             # /api/orders/*
│       │   ├── device-api.ts         # /api/device/* (设备端)
│       │   ├── admin.ts              # /api/admin/*
│       │   └── health.ts             # /api/health
│       └── utils/
└── scripts/
    ├── start.sh                      # 启动脚本 (端口检查+后台启动+验证)
    ├── stop.sh                       # 停止脚本 (进程归属校验)
    └── check.sh                      # 状态检查脚本  id: number
  phone: string
  nickname: string
  role: 'user' | 'property' | 'manufacturer' | 'platform' | 'ops' | 'admin'
  avatar?: string
  balance?: number
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)
  const adminRoles = ['admin', 'platform', 'ops', 'property', 'manufacturer']

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => adminRoles.includes(userInfo.value?.role || ''))

  async function login(phone: string, password: string) {
    console.log('[Store login] Starting login with phone:', phone)
    try {
      const res = await loginApi({ phone, password })
      console.log('[Store login] API response:', res)
      
      if (!res?.data?.token) {
        console.error('[Store login] No token in response')
        throw new Error(res?.message || '登录失败：未获取到令牌')
      }
      
      if (!res?.data?.user) {
        console.error('[Store login] No user in response')
        throw new Error(res?.message || '登录失败：未获取到用户信息')
      }
      
      token.value = res.data.token
      userInfo.value = res.data.user
      localStorage.setItem('token', res.data.token)
      console.log('[Store login] Login completed, userInfo:', userInfo.value)
      
      return res
    } catch (error) {
      console.error('[Store login] Error:', error)
      throw error
    }
  }

  async function register(data: { phone: string; password: string; username: string }) {
    const res = await registerApi(data)
    return res
  }

  async function fetchUserInfo() {
    console.log('[Store fetchUserInfo] Starting...')
    try {
      const res = await getUserInfoApi()
      console.log('[Store fetchUserInfo] API response:', res)
      
      if (!res?.data) {
        console.error('[Store fetchUserInfo] No data in response')
        throw new Error(res?.message || '获取用户信息失败')
      }
      
      userInfo.value = res.data
      console.log('[Store fetchUserInfo] UserInfo set:', userInfo.value)
      return res
    } catch (error) {
      console.error('[Store fetchUserInfo] Error:', error)
      throw error
    }
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    register,
    fetchUserInfo,
    logout
  }
})
