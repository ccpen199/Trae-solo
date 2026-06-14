# Debug Session: dashboard-blank-crash

**Status**: [OPEN]
**Created**: 2026-06-14
**Symptom**: 星程票务首屏完全空白，没有任何文本/按钮/标签/表格渲染，经营概览图表区报错后整页失效，互动数为 0
**Expected**: 首屏展示 6 张 KPI 卡 + 多币种 GMV 堆叠柱 + 余票走势折线 + 热度榜 + 最近工单列表
**Affected**: 首页仪表板作为演出票务平台经营入口完全不可用

---

## Step 1-2: Hypotheses (Pre-evidence)

| ID | Hypothesis | Falsifiable Observation |
|----|------------|-------------------------|
| H1 | 前端抛出未捕获的 React Error Boundary 外层异常，导致整棵子树 unmount | 浏览器控制台含 Uncaught Error 堆栈 + React tree 根节点为空 |
| H2 | Dashboard 组件内图表数据（recharts）在 API 返回前访问 `undefined.length` / 解构 `undefined` 触发崩溃 | 崩溃点在 Dashboard.tsx 渲染期，堆栈指向 recharts 或数据映射行 |
| H3 | useAppStore 初始状态中 `dashboard` 为 `undefined`，组件 `useEffect` 前就尝试解构其字段 | 崩溃点在函数组件顶层 body，堆栈指向 Dashboard 第 N 行 `const { ... } = dashboard` |
| H4 | `@/shared/types` 软链虽然 tsc 通过但运行时 vite 模块解析失败，模块级 `import` 抛出 `Cannot find module` 阻塞首屏渲染 | 浏览器控制台 Network 面板显示 src/shared/types.ts 500/404，或控制台含模块解析错误 |
| H5 | recharts `AreaChart` / `BarChart` 接收空数组 `data=[]` 时内部崩溃（recharts 已知空数据 edge case） | 崩溃堆栈在 recharts 内部，且 API 数据返回前首次渲染即触发 |

---

## Step 3: Instrumentation Points

| ID | Location | Purpose |
|----|----------|---------|
| IP-1 | src/main.tsx (before render) | 报告启动、模块导入完成、React 根挂载成功/失败 + 全局 error/unhandledrejection 捕获 |
| IP-2 | src/App.tsx (AppRoutes 组件) | 报告路由初始化、每条路由匹配 |
| IP-3 | src/pages/Dashboard.tsx (组件入口) | 报告组件函数进入、store 初始状态、useEffect 触发、API fetch 开始/结束、图表渲染准备 |
| IP-4 | 全局 window.onerror + unhandledrejection | 捕获任何未捕获错误（JS error / Promise reject） |
| IP-5 | PricingHeatChart return 前 | 检查传给 recharts ComposedChart 的 data 数组长度/内容 |
| IP-6 | GMVChart 入口 | 检查 currencyBreakdown 数据 |
| IP-7 | ArtistRanking 入口 | 检查 trendingArtists 数据 |

**Instrumentation Correction**: 最初错误使用了 `require('fs')`（浏览器端不可用）导致 Babel 解析错误。已全部改为纯浏览器硬编码 URL 版本。Vite 编译已通过，无错误。

---

## Step 5-7: Evidence Collection

### 🔴 ROOT CAUSE CONFIRMED (H2 成立)

**证据链：**

1. **API 返回验证**：`curl http://127.0.0.1:59190/api/dashboard` 返回 `currencyBreakdown` 含 **THB**（泰国铢）：
   ```json
   "currencyBreakdown": [
     {"c":"CNY","amount":5016},
     {"c":"HKD","amount":865},
     {"c":"KRW","amount":835926},
     {"c":"THB","amount":20160},  // ⚠️ THB 不在 Currency 枚举中！
     {"c":"TWD","amount":55200}
   ]
   ```

2. **后端数据进一步确认**：`api/src/db.ts` 还存在 **MYR**（马来西亚林吉特）种子数据：
   - `db.ts:346`: `currs: ['THB', 'SGD', 'USD']`
   - `db.ts:429`: `FX` 含 `MYR: 1.53, THB: 0.2`

3. **前端类型/数据不匹配**：
   - `Currency` 类型只定义了 7 种：`CNY | HKD | TWD | JPY | KRW | USD | SGD`
   - `CURRENCY_META` 只有这 7 种的元数据（sym/name/rate/cls/region）

4. **崩溃链路**：
   ```
   GMVChart 渲染 → bd.map((b) => ({ cname: CURRENCY_META[b.c].name }))
                                       ↓
                         CURRENCY_META['THB'] = undefined
                                       ↓
             TypeError: Cannot read property 'name' of undefined
                                       ↓
          React 渲染期未捕获错误 → 根组件 unmount → 整页空白
   ```

### 其他假设验证
| ID | Hypothesis | Status | Evidence |
|----|------------|--------|----------|
| H1 | React Error Boundary 外层崩溃 | ❌ 排除 | 无 Error Boundary，但崩溃点在子组件 GMVChart |
| **H2** | **图表数据访问 undefined 字段** | **✅ 确认** | **CURRENCY_META['THB'] = undefined** |
| H3 | useAppStore 初始状态 undefined | ❌ 排除 | store 正常返回 language/currency |
| H4 | @/shared/types 模块解析失败 | ❌ 排除 | tsc 0 errors，Vite 编译正常 |
| H5 | recharts 空数组崩溃 | ❌ 排除 | 崩溃点在 `CURRENCY_META[b.c].name`，非 recharts 内部 |

---

## Step 9: Fix

| 序号 | 文件 | 修改 |
|------|------|------|
| 1 | `api/src/shared/types.ts` | `Currency` 扩展为 9 种：`+ THB | MYR` |
| 2 | `api/src/services.ts` | `FX` + `CURRENCY_SYMBOL` 加 THB/MYR |
| 3 | `src/utils/meta.ts` | `FX` + `CURRENCY_META` 加 THB/MYR（含汇率、符号、渐变、区域） |
| 4 | `src/pages/Dashboard.tsx` | `FX_RATES` 加 THB/MYR；GMVChart 两处硬编码汇率改为引用 `FX_RATES`；`GMVChart` 加 `language` 参数；删除多余模块级 `const language` 声明 |
| 5 | `src/App.tsx` | `CurrencySwitcher` 币种列表扩展为 9 种 |
| 6 | `src/pages/EventList.tsx` | 币种筛选列表扩展为 9 种 |
| 7 | `src/main.tsx` | 修复 IIFE 分号问题（ASI 导致的表达式不可调用） |

### 关键新增币种元数据
```typescript
THB: { sym: '฿', name: '泰铢 (THB)', frac: 0, rate: 0.2, cls: 'from-lime-500 to-green-600', region: '泰国' },
MYR: { sym: 'RM', name: '林吉特 (MYR)', frac: 0, rate: 1.53, cls: 'from-cyan-500 to-sky-600', region: '马来西亚' },
```

---

## Step 10: Verification

| Metric | Pre-fix | Post-fix |
|--------|---------|----------|
| 首屏渲染 | ❌ 空白，整棵子树 unmount | ✅ 完整渲染 |
| KPI 卡可见 | ❌ | ✅ 7 张 KPI 卡（在售演出/活跃票档/跨境GMV/出票/赔付/核验/余票热度） |
| 经营概览图表 | ❌ 崩溃点：`CURRENCY_META['THB'].name` | ✅ 3 张图表正常渲染（定价热力/GMV 多币种堆叠/艺人热度榜） |
| THB/MYR 币种支持 | ❌ 类型未定义 → undefined | ✅ Currency 枚举 + CURRENCY_META 完整支持 |
| API fetch 状态 | ❌ 成功但渲染崩溃 | ✅ 200 OK，5 个币种正确解析 |
| 控制台异常 | ❌ `Cannot read property 'name' of undefined` | ✅ 0 errors |
| 入口可见性 | ❌ 动态定价/假票溯源/无票赔付/IP资产库/跨城轨迹全部不可见 | ✅ 侧边栏 6 大入口完整渲染 |

### 修复前后日志对比
| 阶段 | 日志事件 | 结果 |
|------|---------|------|
| Pre-fix | `uncaught_error` | `message: "Cannot read property 'name' of undefined"` |
| Post-fix | `app_start_before_render` | ✅ readyState: interactive |
| Post-fix | `root_render_executed` | ✅ rootEl: true |
| Post-fix | `app_routes_mounting` | ✅ pathname: "/" |
| Post-fix | `api_fetch_after` | ✅ status: 200, keys: 5 |
| Post-fix | `gmv_chart_data` | ✅ len: 5 (含 THB) |
| Post-fix | `pricing_chart_data` | ✅ len: 6 |
| Post-fix | `artist_ranking_data` | ✅ len: 6 |
| Post-fix | uncaught_error / unhandledrejection | ✅ 0 events |

---

## Root Cause Summary

**类型/数据不匹配导致 React 渲染期未捕获错误**：

```
后端种子数据含 THB/MYR 币种
       ↓
前端 Currency 类型和 CURRENCY_META 只定义了 7 种（缺 THB/MYR）
       ↓
GMVChart 渲染: CURRENCY_META['THB'].name → undefined.name
       ↓
TypeError: Cannot read property 'name' of undefined
       ↓
React 无 Error Boundary → 整棵子树 unmount → 白屏
```

**最小修复**：在 6 个文件中同步扩展 THB/MYR 币种支持，零破坏性改动。

---

## Notes

