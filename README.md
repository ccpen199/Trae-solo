# 餐饮App - 扫码点餐平台

## 项目简介
面向多餐厅复用的扫码点餐平台，支持用户到店扫码查看菜单、排队、点餐和评价。

## 技术栈
- 后端：Node.js + Express + SQLite
- 前端：Vue 3 + Vite + Vue Router + Axios

## 端口配置
- 后端：98801
- 前端：98802

## 启动方式

### 1. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 启动服务
```bash
# 后端（后台运行）
cd backend
npm start &

# 前端（后台运行）
cd ../frontend
npm run dev &
```

### 3. 访问地址
- 前端：http://localhost:19882
- 后端API：http://localhost:19881

## 主要功能
1. 扫码获取餐厅信息
2. 选择桌号或排队取号
3. 浏览菜单并点餐
4. 查看订单、呼叫服务员、申请结账
5. 订单完成后评价
