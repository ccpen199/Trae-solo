
# 药品不良反应上报系统 - 测试样例

## 项目信息
- 项目目录：`/Users/chen/Documents/trae_projects/local_projects/may-63463`
- 前端地址：http://127.0.0.1:43463/
- 后端 API：http://127.0.0.1:53463/api/
- 数据库：`./data/app.sqlite`

---

## 一、正常样例（Happy Path）

### 1.1 完整上报流程
**测试路径**：首页 → 新建上报 → 填写表单 → 提交初报 → 质控复核 → 因果评价 → 正式上报 → 监管回执

**步骤**：
1. 浏览器访问 http://127.0.0.1:43463/
2. 左侧菜单点击「新建上报」
3. 填写患者信息：
   - 患者姓名：张明
   - 性别：男
   - 年龄：45
   - 患者ID：P20240529001
4. 填写用药信息：
   - 药品选择：阿莫西林胶囊
   - 剂量：0.5g tid
   - 给药途径：口服
   - 开始时间：2024-05-25
5. 填写反应表现：
   - 反应表现：全身皮疹、瘙痒、发热
   - 反应开始时间：2024-05-26 14:30
   - 严重程度：中度
6. 填写处理结果：
   - 处理措施：停药，口服氯雷他定 10mg qd，外涂炉甘石洗剂
   - 处理结果：皮疹消退，瘙痒缓解
7. 点击「保存草稿」或「提交初报」
8. 进入上报列表，找到刚创建的记录，点击「详情」
9. 点击「质控复核」按钮，填写备注：资料完整，同意进入评价
10. 点击「因果评价」按钮，填写五维评分：
    - 时间关系：8分
    - 停药改善：7分
    - 再用反应：0分
    - 合并用药：9分
    - 严重程度：6分
11. 系统自动计算等级：很可能（probable）
12. 返回详情页，点击「正式上报」
13. 点击「监管回执」，填写回执编号：ADR-HB-2024-0529-001

**预期结果**：
- 每一步操作后状态正确变更：draft → submitted → reviewing → reported → receipt
- 流程日志完整记录每一步操作人、时间、备注
- 数据库中 reports、assessments、process_logs 三表数据完整关联

---

### 1.2 药品库 CRUD
**测试路径**：首页 → 药品库 → 新增 → 编辑 → 查询 → 删除

**步骤**：
1. 点击「药品库」菜单
2. 点击「新增药品」
3. 填写：
   - 药品名称：盐酸西替利嗪片
   - 通用名：盐酸西替利嗪
   - 批号：20240501
   - 生产厂家：齐鲁制药有限公司
   - 持有人：齐鲁制药
   - 适应症：过敏性鼻炎、荨麻疹、皮肤瘙痒
   - 说明书风险：嗜睡、口干、头痛
4. 点击「保存」
5. 在搜索框输入「西替利嗪」验证搜索
6. 点击「编辑」修改说明书风险，增加「肝肾功能异常者慎用」
7. 点击「删除」删除测试药品

**预期结果**：
- 新增后列表显示新药品
- 搜索功能正确过滤
- 编辑后字段正确更新
- 删除后列表不再显示

---

### 1.3 分析报表查看
**测试路径**：首页 → 分析报表 → 各标签页

**步骤**：
1. 点击「分析报表」菜单
2. 依次查看「药品维度」「反应类型」「严重程度」「时效趋势」「重复病例」五个标签页
3. 验证图表数据与实际数据一致性

---

## 二、边界样例（Edge Cases）

### 2.1 极端严重程度上报
**测试数据**：
- 严重程度：致死（fatal）
- 患者年龄：1岁（最小）/ 99岁（最大）
- 反应时间：用药后立即（1分钟内）

**预期结果**：
- 状态标签显示红色高亮
- 分析报表中严重病例统计 +1
- 流程中需要质控特别标注

### 2.2 批量边界数据
- 同一药品 100 条上报记录
- 同一患者 30 天内多次上报
- 所有状态各有数据

### 2.3 搜索边界
- 空字符串搜索
- 超长文本搜索（> 100字符）
- 特殊字符搜索（%、_、空格）

### 2.4 分页边界
- 第1页 / 最后一页 / 超出范围页码
- pageSize = 1 / pageSize = 100 / pageSize = 0

---

## 三、冲突样例（Conflict Cases）

### 3.1 重复病例检测
**测试数据**：
- 报告1：张三 + 阿莫西林 + 皮疹，日期 2024-05-01
- 报告2：张三 + 阿莫西林 + 皮疹，日期 2024-05-15（间隔 < 30天）

**预期结果**：
- 「分析报表」→「重复病例」标签页显示上述两条记录
- 提示信息：30天内同一患者同一药品同一反应，建议核实

### 3.2 状态流转冲突
**测试场景**：
- 草稿状态的报告尝试直接「正式上报」
- 已上报的报告尝试「退回补充」

**预期结果**：
- API 返回 400 错误
- 错误信息：「状态流转不合法，当前状态 [xxx] 无法执行 [xxx] 操作」

### 3.3 药品删除冲突
**测试场景**：
- 已有报告关联的药品尝试删除

**预期结果**：
- API 返回 400 错误
- 错误信息：「该药品有关联的上报记录，无法删除」

---

## 四、失败样例（Failure Cases）

### 4.1 必填项缺失
**测试场景**：
- 创建上报时不填写患者姓名
- 创建药品时不填写批号

**预期结果**：
- 前端表单实时校验，红标提示
- 后端 API 返回 400 错误，字段级错误信息

### 4.2 参数格式错误
**测试场景**：
- 年龄输入非数字
- 日期格式错误（如 2024/05/01 或 05-01-2024）
- 评分超出 0-10 范围

**预期结果**：
- 参数校验失败，返回 400 错误
- 错误信息明确指出参数问题

### 4.3 资源不存在
**测试场景**：
- 访问 /api/reports/99999（不存在的ID）
- 访问 /api/drugs/99999（不存在的ID）

**预期结果**：
- API 返回 404 错误
- 错误信息：「Report/Drug not found」

### 4.4 数据库异常
**模拟方式**：
- 临时修改数据库文件权限为只读
- 尝试写入操作

**预期结果**：
- API 返回 500 错误
- 错误信息：「Database error」
- 日志 backend.log 记录详细错误栈

---

## 核心 API 测试命令

### 健康检查
```bash
curl -sS http://127.0.0.1:53463/api/health
```
预期：`{"success":true,"message":"ok"}`

### 药品列表
```bash
curl -sS "http://127.0.0.1:53463/api/drugs?pageSize=5&page=1"
```

### 新增药品
```bash
curl -sS -X POST "http://127.0.0.1:53463/api/drugs" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试药品","batchNumber":"TEST001","manufacturer":"测试厂家"}'
```

### 新增上报
```bash
curl -sS -X POST "http://127.0.0.1:53463/api/reports" \
  -H "Content-Type: application/json" \
  -d '{"patientName":"测试患者","patientGender":"male","patientAge":30,"drugId":1,"drugName":"阿莫西林胶囊","reaction":"测试反应","severity":"mild","createdBy":"测试"}'
```

### 提交初报
```bash
curl -sS -X POST "http://127.0.0.1:53463/api/reports/{id}/submit" \
  -H "Content-Type: application/json" \
  -d '{"operator":"张医生","remark":"资料完整"}'
```

### 因果评价
```bash
curl -sS -X POST "http://127.0.0.1:53463/api/assessments" \
  -H "Content-Type: application/json" \
  -d '{"reportId":{id},"temporalRelation":8,"withdrawalImprovement":7,"rechallengeReaction":0,"concomitantMedication":9,"severityLevel":6,"assessedBy":"李药师","remark":"评价完成"}'
```

### 分析统计
```bash
curl -sS http://127.0.0.1:53463/api/analytics/severity-stats
curl -sS http://127.0.0.1:53463/api/analytics/drug-stats
curl -sS http://127.0.0.1:53463/api/analytics/duplicates
```

---

## 数据库导出核对

### 查看所有表
```bash
sqlite3 data/app.sqlite ".tables"
```

### 导出药品数据
```bash
sqlite3 data/app.sqlite "SELECT * FROM drugs;" -header -column
```

### 导出上报数据
```bash
sqlite3 data/app.sqlite "SELECT id, report_no, status, patient_name, drug_name, severity, created_at FROM reports;" -header -column
```

### 导出流程日志
```bash
sqlite3 data/app.sqlite "SELECT id, report_id, from_status, to_status, operator, operate_at FROM process_logs;" -header -column
```

### 导出评价数据
```bash
sqlite3 data/app.sqlite "SELECT id, report_id, final_level, assessed_by, assessed_at FROM assessments;" -header -column
```

---

## 主要文件清单

| 文件 | 说明 |
|------|------|
| [api/app.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/app.ts) | Express 应用入口，CORS、路由注册 |
| [api/server.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/server.ts) | 服务启动，端口绑定 53463 |
| [api/db/index.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/db/index.ts) | SQLite 数据库初始化、表结构、初始数据 |
| [api/routes/drugs.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/routes/drugs.ts) | 药品 CRUD API |
| [api/routes/reports.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/routes/reports.ts) | 上报 CRUD + 状态流转 API |
| [api/routes/assessments.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/routes/assessments.ts) | 因果评价 API |
| [api/routes/analytics.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/api/routes/analytics.ts) | 统计分析 API |
| [src/components/Layout.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/components/Layout.tsx) | 整体布局、侧边栏导航、角色切换 |
| [src/pages/Dashboard.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/Dashboard.tsx) | 首页仪表盘 |
| [src/pages/DrugList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/DrugList.tsx) | 药品库页面 |
| [src/pages/ReportList.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/ReportList.tsx) | 上报列表页面 |
| [src/pages/ReportForm.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/ReportForm.tsx) | 新建/编辑上报表单 |
| [src/pages/ReportDetail.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/ReportDetail.tsx) | 上报详情 + 流程操作 |
| [src/pages/AssessmentForm.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/AssessmentForm.tsx) | 因果评价表单 |
| [src/pages/Analytics.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/Analytics.tsx) | 分析报表页面 |
| [src/pages/AdminView.tsx](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/src/pages/AdminView.tsx) | 运营管理视图 |
| [shared/types.ts](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/shared/types.ts) | 前后端共用类型定义 |
| [.env](file:///Users/chen/Documents/trae_projects/local_projects/may-63463/.env) | 端口配置（43463/53463） |
