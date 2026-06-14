# 地理空间房地产中介服务平台

基于地理空间的房地产中介服务平台，支持多模态找房、VR看房、AI智能推荐等功能。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + React Router + Leaflet 地图
- **后端**: Node.js + Express + TypeScript + SQLite3
- **数据库**: SQLite (data/app.sqlite)

## 端口配置

- 前端: http://127.0.0.1:49056
- 后端: http://127.0.0.1:59056

## 启动方式

```bash
# 安装依赖
npm run install:all

# 启动后端（后台运行）
npm run start:backend

# 启动前端（后台运行）
npm run start:frontend

# 启动全部
npm run start:all

# 停止服务
npm run stop:all
```

## 核心功能

### 用户端
- 地图找房（GPS定位、地铁沿线、通勤圈）
- AI房源匹配推荐
- VR看房与热点标注
- 房价评估
- 经纪人在线预约

### 管理端
- 经纪人工作台（客户跟进、带看日程、佣金核算）
- 楼盘字典管理
- 虚假房源识别
- 培训课程管理
