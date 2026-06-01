# 气象灾害预警发布系统 - 验收指南

## 1. 启动说明

### 1.1 环境与依赖
```bash
# 安装依赖（已执行）
npm install

# 初始化数据库（已执行）
npm run seed
```

### 1.2 启动服务
```bash
# 后端（端口 3004）
npm run dev:server

# 前端（端口 5173）
npm run dev:web

# 或同时启动
npm run dev
```

### 1.3 当前运行状态
- **后端 API**: http://127.0.0.1:3004
- **前端**: http://127.0.0.1:5173
- **数据库**: ./data/warning.db (SQLite)

---

## 2. 核心功能验证

### 2.1 监测面板 (/)
- [ ] 实时数据卡片：4 个统计项（活跃预警、阈值命中、待回执、活跃渠道）
- [ ] 趋势图表：支持降雨、风速、温度、雷达回波、综合数据切换
- [ ] 阈值线：图表上显示各等级预警阈值线
- [ ] 实时数值表：各站点最新数值
- [ ] 阈值命中表：超限记录列表
- [ ] 阈值配置表：各数据类型预警阈值配置

### 2.2 预警制作 (/warning)
**Tab 1：预警列表**
- [ ] 筛选：按状态、类型、级别筛选
- [ ] 新建预警：打开模态框填写表单
- [ ] 模板应用：可快速应用预设模板
- [ ] 编辑：修改草稿或已发布预警
- [ ] 发布：选择渠道后批量发布
- [ ] 解除：对已发布预警进行解除操作

**Tab 2：预警模板**
- [ ] 模板列表：7 个预设模板（暴雨×4、大风×2、高温×1）
- [ ] 新建模板：自定义模板
- [ ] 模板应用：点击「应用」按钮快速生成预警

### 2.3 发布管理 (/publish)
**Tab 1：发布记录**
- [ ] 批次号、预警类型、渠道、总数、成功数、失败数
- [ ] 成功率计算、发送状态标签
- [ ] 重发失败：对有失败记录的批次进行重发
- [ ] 失败名单：查看具体失败对象

**Tab 2：发布渠道**
- [ ] 4 个默认渠道（短信、站内公告、接口推送、基层通知）
- [ ] 渠道启用/停用控制
- [ ] 渠道配置编辑

**Tab 3：接收对象**
- [ ] 四类对象：乡镇(3)、部门(3)、网格(3)、公众(1)
- [ ] 对象增删改

### 2.4 回执与处置 (/receipt)
**Tab 1：回执处置**
- [ ] 回执列表：按状态筛选
- [ ] 确认：将待确认标记为已确认
- [ ] 转发：记录转发去向
- [ ] 处置：填写已采取措施
- [ ] 未响应：标记超时未响应
- [ ] 反馈：记录反馈信息

**Tab 2：按预警汇总**
- [ ] 各预警的发布次数、总对象数、各状态计数

**Tab 3：按对象汇总**
- [ ] 各接收对象的总回执、各状态计数

### 2.5 复盘报表 (/report)
- [ ] 顶部 4 个统计卡片
- [ ] 预警类型分布饼图
- [ ] 回执状态分布饼图
- [ ] 各渠道发布柱状图
- [ ] 预警覆盖率柱状图
- [ ] 发布时效明细（延迟秒数）
- [ ] 阈值命中准确率表
- [ ] 预警解除记录表

### 2.6 操作日志 (/ops-log)
- [ ] 全系统操作流水记录
- [ ] 按操作类型筛选
- [ ] 按操作人搜索

---

## 3. 主要文件结构

```
.
├── .env                      # 根环境配置
├── package.json              # 根 package
├── server/                    # 后端
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── index.js          # 入口（Express 启动）
│       ├── db.js             # 数据库初始化
│       ├── seed.js           # 种子数据
│       ├── test.js           # 后端测试
│       └── routes/
│           ├── monitor.js    # 监测 API
│           ├── warning.js    # 预警 API
│           ├── publish.js    # 发布 API
│           ├── receipt.js    # 回执 API
│           ├── report.js     # 报表 API
│           └── ops-log.js    # 日志 API
├── web/                       # 前端
│   ├── .env
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api.ts            # API 封装
│       └── pages/
│           ├── MonitorPage.tsx    # 监测面板
│           ├── WarningPage.tsx    # 预警制作
│           ├── PublishPage.tsx    # 发布管理
│           ├── ReceiptPage.tsx    # 回执处置
│           ├── ReportPage.tsx     # 复盘报表
│           └── OpsLogPage.tsx     # 操作日志
└── data/
    └── warning.db            # SQLite 数据库
```

---

## 4. 测试用例

### 4.1 正常样例
```bash
# 1. 创建暴雨预警
curl -X POST http://127.0.0.1:3004/api/warning \
  -H "Content-Type: application/json" \
  -d '{"type":"暴雨","level":"yellow","affected_area":"全市","issuer":"测试员","content":"测试暴雨预警"}'

# 2. 查询预警列表
curl http://127.0.0.1:3004/api/warning?page=1\&pageSize=10

# 3. 发布预警（选择渠道 1-4）
curl -X POST http://127.0.0.1:3004/api/warning/1/publish \
  -H "Content-Type: application/json" \
  -d '{"channel_ids":[1,2,3,4]}'

# 4. 确认回执
curl -X POST http://127.0.0.1:3004/api/receipt/1/confirm

# 5. 查看报表概览
curl http://127.0.0.1:3004/api/report/overview
```

### 4.2 边界样例
1. **空数据边界**：删除所有预警后列表显示空状态
2. **超长文本**：预警内容超过 1000 字正常存储显示
3. **大量数据**：1000 条监测数据分页加载正常
4. **时间边界**：跨天预警、过期预警显示正常

### 4.3 冲突样例
1. **端口冲突避让**：3001、3002、3003 被占用时自动切换到 3004
2. **并发发布**：同一预警多次发布产生不同批次
3. **重复回执**：重复确认操作幂等处理

### 4.4 失败样例
1. **必填项缺失**：创建预警缺少 type/level/affected_area 时返回 400
2. **不存在的记录**：访问不存在的预警返回 404
3. **重发无失败**：对无失败的批次执行重发提示无数据

---

## 5. 导出核对

### 5.1 数据导出 (SQLite)
```bash
# 导出为 SQL
sqlite3 data/warning.db .dump > backup_$(date +%Y%m%d).sql

# 导出预警列表 CSV
sqlite3 -header -csv data/warning.db "SELECT * FROM warnings;" > warnings.csv

# 查看所有表
sqlite3 data/warning.db .tables
```

### 5.2 关键表说明
| 表名 | 用途 | 关键字段 |
|------|------|----------|
| stations | 监测站点 | name, code, type, status |
| monitor_data | 监测数据 | station_id, value, data_type, recorded_at, threshold_hit |
| thresholds | 预警阈值 | data_type, warning_level, threshold_value, comparison |
| warnings | 预警信息 | type, level, affected_area, issuer, status, valid_from, valid_to |
| warning_templates | 预警模板 | name, type, level, content |
| channels | 发布渠道 | name, channel_type, config, status |
| publish_records | 发布记录 | warning_id, channel_id, batch_no, total_count, success_count, fail_count |
| targets | 接收对象 | name, target_type, contact |
| receipts | 回执记录 | publish_record_id, target_id, confirm_status, confirm_time |
| operations_log | 操作日志 | action, target_type, target_id, operator, details |

---

## 6. API 清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/monitor/stations | 站点列表 |
| GET | /api/monitor/data/realtime | 实时监测数据 |
| GET | /api/monitor/data/trend | 趋势数据 |
| GET | /api/monitor/thresholds | 阈值配置 |
| GET | /api/monitor/alerts | 阈值命中记录 |
| GET | /api/warning | 预警列表（分页） |
| GET | /api/warning/:id | 预警详情 |
| POST | /api/warning | 创建预警 |
| PUT | /api/warning/:id | 更新预警 |
| POST | /api/warning/:id/publish | 发布预警 |
| POST | /api/warning/:id/cancel | 解除预警 |
| GET | /api/warning/templates/list | 模板列表 |
| GET | /api/publish | 发布记录 |
| GET | /api/publish/channels | 渠道列表 |
| GET | /api/publish/targets/list | 接收对象列表 |
| GET | /api/publish/:id/failures | 失败名单 |
| POST | /api/publish/:id/retry | 重发失败 |
| GET | /api/receipt | 回执列表 |
| POST | /api/receipt/:id/confirm | 确认回执 |
| POST | /api/receipt/:id/forward | 转发回执 |
| POST | /api/receipt/:id/act | 处置回执 |
| POST | /api/receipt/:id/no-response | 标记未响应 |
| GET | /api/report/overview | 概览统计 |
| GET | /api/report/warning-stats | 预警统计 |
| GET | /api/report/publish-stats | 发布统计 |
| GET | /api/report/receipt-stats | 回执统计 |
| GET | /api/report/timeliness | 发布时效 |
| GET | /api/report/coverage | 覆盖率 |
| GET | /api/report/hit-accuracy | 命中率 |
| GET | /api/report/cancellation-log | 解除记录 |
| GET | /api/report/ops-log | 操作日志 |