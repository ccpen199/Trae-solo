<template>
  <div class="logs-container">
    <div class="page-header">
      <div>
        <h2>日志审计</h2>
        <p class="header-sub">
          全操作审计追踪 · 风险实时监控 · {{ currentTime }}
          <el-tag type="danger" effect="dark" style="margin-left: 12px;" size="small">
            {{ highRiskCount }} 高风险
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="handleExport">导出日志</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索关键词" :prefix-icon="Search" clearable style="width: 200px;" />
      <el-select v-model="filters.opType" placeholder="操作类型" clearable style="width: 140px;">
        <el-option v-for="t in opTypeOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-input v-model="filters.operator" placeholder="操作人" clearable style="width: 140px;" />
      <el-date-picker
        v-model="filters.timeRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px;"
        value-format="YYYY-MM-DD"
      />
      <el-select v-model="filters.riskLevel" placeholder="风险等级" clearable style="width: 120px;">
        <el-option label="低" value="low" />
        <el-option label="中" value="medium" />
        <el-option label="高" value="high" />
        <el-option label="危险" value="critical" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Operation /></div>
          <div class="stat-label">今日操作总数</div>
          <div class="stat-value">{{ todayOps }}</div>
          <div class="stat-sub">较昨日 +{{ Math.floor(todayOps * 0.05) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-icon"><WarningFilled /></div>
          <div class="stat-label">高风险操作</div>
          <div class="stat-value">{{ highRiskCount }}</div>
          <div class="stat-sub">占比 {{ ((highRiskCount / todayOps) * 100).toFixed(1) }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><Warning /></div>
          <div class="stat-label">异常操作</div>
          <div class="stat-value">{{ anomalyCount }}</div>
          <div class="stat-sub">较昨日 -{{ Math.floor(anomalyCount * 0.1) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><Timer /></div>
          <div class="stat-label">平均响应时间</div>
          <div class="stat-value">{{ avgResponseTime }} <span style="font-size: 14px;">ms</span></div>
          <div class="stat-sub">P99: {{ p99ResponseTime }}ms</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">操作趋势（近7天）</div>
          </div>
          <v-chart :option="trendOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">风险分布</div>
          </div>
          <v-chart :option="riskPieOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">审计日志列表</div>
        <el-tag type="info" round size="small">共 {{ filteredLogs.length }} 条</el-tag>
      </div>
      <el-table
        :data="pagedLogs"
        size="default"
        stripe
        row-key="id"
        @expand-change="handleExpand"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-detail">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="日志ID">{{ row.id }}</el-descriptions-item>
                <el-descriptions-item label="会话ID">{{ row.sessionId }}</el-descriptions-item>
                <el-descriptions-item label="请求ID">{{ row.requestId }}</el-descriptions-item>
                <el-descriptions-item label="操作时间">{{ row.time }}</el-descriptions-item>
                <el-descriptions-item label="操作人">{{ row.operator }}</el-descriptions-item>
                <el-descriptions-item label="角色">{{ row.role }}</el-descriptions-item>
                <el-descriptions-item label="操作类型">{{ row.opType }}</el-descriptions-item>
                <el-descriptions-item label="操作对象">{{ row.target }}</el-descriptions-item>
                <el-descriptions-item label="IP地址">{{ row.ip }}</el-descriptions-item>
                <el-descriptions-item label="UA指纹">{{ row.uaFingerprint }}</el-descriptions-item>
                <el-descriptions-item label="风险等级">
                  <el-tag :type="riskTagType(row.riskLevel)" size="small" effect="dark">{{ riskLabel(row.riskLevel) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="执行结果">
                  <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.success ? '成功' : '失败' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="耗时">{{ row.duration }}ms</el-descriptions-item>
                <el-descriptions-item label="请求参数" :span="2">
                  <pre class="detail-pre">{{ row.params }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="响应结果" :span="3">
                  <pre class="detail-pre">{{ row.response }}</pre>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="日志ID" width="140" />
        <el-table-column prop="time" label="操作时间" width="170" sortable />
        <el-table-column prop="operator" label="操作人" width="90" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <span class="role-tag">{{ row.role }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="opType" label="操作类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="opTypeTagType(row.opType)" size="small" effect="plain">{{ row.opType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作对象" min-width="140" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="uaFingerprint" label="UA指纹" width="100" show-overflow-tooltip />
        <el-table-column label="风险等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.riskLevel)" size="small" effect="dark">{{ riskLabel(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.success ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="80" align="center" sortable>
          <template #default="{ row }">
            <span :style="{ color: row.duration > 1000 ? '#E74C3C' : row.duration > 500 ? '#F39C12' : '#27AE60' }">
              {{ row.duration }}ms
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="filteredLogs.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Search, Operation, WarningFilled, Warning, Timer } from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const currentTime = ref('')
const opTypeOptions = ['登录', '查询', '修改', '删除', '导出', '审批']

const filters = reactive({
  keyword: '',
  opType: '',
  operator: '',
  timeRange: null as string[] | null,
  riskLevel: ''
})

const pagination = reactive({ current: 1, size: 10 })

const todayOps = 3847
const highRiskCount = 23
const anomalyCount = 8
const avgResponseTime = 156
const p99ResponseTime = 892

interface LogItem {
  id: string
  time: string
  operator: string
  role: string
  opType: string
  target: string
  ip: string
  uaFingerprint: string
  riskLevel: string
  success: boolean
  duration: number
  sessionId: string
  requestId: string
  params: string
  response: string
}

const operators = ['张建国', '李明华', '王晓峰', '赵一凡', '陈思远', '刘美玲', '周志强', '吴晓东', '郑雨桐', '孙浩然']
const roles = ['超级管理员', '系统管理员', '审计员', '部门主管', '操作员', '只读用户']
const targets = [
  '用户管理-市民列表', '知识图谱-政策节点', '服务编排-医保接口',
  '工单系统-差评督办', '数据导出-办件报表', '系统配置-权限规则',
  '委办局管理-接口配置', '市民画像-标签管理', '反馈分析-聚类配置',
  '审计日志-日志查询', '系统配置-安全策略', '用户管理-角色权限',
  '服务编排-公积金接口', '知识图谱-QA配置', '数据导出-用户画像',
  '工单系统-工单分配', '系统配置-通知模板', '委办局管理-心跳检测'
]
const uas = [
  'Chrome/125-Win11', 'Chrome/124-macOS', 'Firefox/126-Ubuntu',
  'Safari/17-macOS', 'Edge/125-Win10', 'Chrome/125-Android',
  'Safari/17-iOS', 'Chrome/124-Linux'
]
const ips = [
  '10.0.1.101', '10.0.1.102', '10.0.2.55', '10.0.3.12',
  '10.0.1.200', '10.0.4.88', '10.0.2.110', '10.0.5.33',
  '172.16.0.50', '172.16.1.22', '192.168.1.100', '192.168.2.45'
]

const riskLevels = ['low', 'medium', 'high', 'critical']
const riskWeights = [0.55, 0.25, 0.13, 0.07]

function pickRisk(): string {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < riskWeights.length; i++) {
    acc += riskWeights[i]
    if (r < acc) return riskLevels[i]
  }
  return 'low'
}

const logsData = ref<LogItem[]>([])

function generateLogs(): LogItem[] {
  const logs: LogItem[] = []
  const now = new Date()
  for (let i = 0; i < 55; i++) {
    const t = new Date(now.getTime() - i * Math.floor(180000 + Math.random() * 600000))
    const risk = pickRisk()
    const opType = opTypeOptions[Math.floor(Math.random() * opTypeOptions.length)]
    const success = risk === 'critical' ? Math.random() > 0.4 : Math.random() > 0.05
    const duration = risk === 'critical' ? Math.floor(800 + Math.random() * 2000) :
      risk === 'high' ? Math.floor(300 + Math.random() * 700) :
        Math.floor(50 + Math.random() * 300)
    logs.push({
      id: `LOG-${String(20240618001 + i).padStart(11, '0')}`,
      time: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
      operator: operators[Math.floor(Math.random() * operators.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      opType,
      target: targets[Math.floor(Math.random() * targets.length)],
      ip: ips[Math.floor(Math.random() * ips.length)],
      uaFingerprint: uas[Math.floor(Math.random() * uas.length)],
      riskLevel: risk,
      success,
      duration,
      sessionId: `SID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      requestId: `REQ-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      params: risk === 'critical' || risk === 'high'
        ? JSON.stringify({ action: opType, targetId: `OBJ-${Math.floor(Math.random() * 9999)}`, bulkOp: true, count: Math.floor(Math.random() * 100) }, null, 2)
        : JSON.stringify({ action: opType, targetId: `OBJ-${Math.floor(Math.random() * 9999)}` }, null, 2),
      response: success
        ? JSON.stringify({ code: 200, message: '操作成功', affectedRows: Math.floor(Math.random() * 50) }, null, 2)
        : JSON.stringify({ code: 500, message: '操作失败: 权限不足或数据异常', error: 'PERMISSION_DENIED' }, null, 2)
    })
  }
  return logs
}

logsData.value = generateLogs()

const filteredLogs = computed(() => {
  let list = [...logsData.value]
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(l => l.id.toLowerCase().includes(kw) || l.target.toLowerCase().includes(kw) || l.operator.includes(kw))
  }
  if (filters.opType) list = list.filter(l => l.opType === filters.opType)
  if (filters.operator) list = list.filter(l => l.operator.includes(filters.operator))
  if (filters.riskLevel) list = list.filter(l => l.riskLevel === filters.riskLevel)
  if (filters.timeRange && filters.timeRange.length === 2) {
    const [start, end] = filters.timeRange
    list = list.filter(l => l.time >= start && l.time <= end + ' 23:59:59')
  }
  return list
})

const pagedLogs = computed(() => {
  const start = (pagination.current - 1) * pagination.size
  return filteredLogs.value.slice(start, start + pagination.size)
})

const riskTagType = (level: string): 'info' | 'warning' | 'danger' => ({ low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }[level] as 'info' | 'warning' | 'danger') || 'info'
const riskLabel = (level: string) => ({ low: '低', medium: '中', high: '高', critical: '危险' }[level] || level)
const opTypeTagType = (type: string): 'success' | 'warning' | 'info' | 'danger' | undefined => ({ '登录': undefined, '查询': 'info', '修改': 'warning', '删除': 'danger', '导出': 'success', '审批': undefined }[type] as 'success' | 'warning' | 'info' | 'danger' | undefined)

const trendDates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return `${d.getMonth() + 1}/${d.getDate()}`
})

const trendSeriesData: Record<string, number[]> = {
  '登录': [342, 389, 356, 412, 398, 445, 421],
  '查询': [891, 923, 876, 945, 912, 978, 934],
  '修改': [123, 145, 132, 156, 148, 167, 159],
  '删除': [34, 28, 42, 31, 38, 26, 35],
  '导出': [67, 72, 58, 81, 76, 89, 83],
  '审批': [45, 52, 48, 56, 51, 63, 58]
}

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: opTypeOptions, right: 10 },
  grid: { left: 50, right: 30, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: trendDates, boundaryGap: false },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
  series: opTypeOptions.map((name, idx) => {
    const colors = ['#1E4FA5', '#27AE60', '#F39C12', '#E74C3C', '#8E44AD', '#2980B9']
    return {
      name,
      type: 'line',
      stack: 'total',
      smooth: true,
      data: trendSeriesData[name],
      lineStyle: { color: colors[idx], width: 2 },
      itemStyle: { color: colors[idx] },
      areaStyle: { color: colors[idx], opacity: 0.15 }
    }
  })
}))

const riskDistribution = [
  { value: 2117, name: '低风险', color: '#27AE60' },
  { value: 962, name: '中风险', color: '#F39C12' },
  { value: 501, name: '高风险', color: '#E74C3C' },
  { value: 267, name: '危险', color: '#8B0000' }
]

const riskPieOption = {
  tooltip: { trigger: 'item', formatter: '{b}<br/>操作数：{c} ({d}%)' },
  legend: { orient: 'vertical', right: 5, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['45%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
    data: riskDistribution.map(d => ({ ...d, itemStyle: { color: d.color } }))
  }]
}

function handleSearch() {
  pagination.current = 1
  ElMessage.success('查询条件已应用')
}

function resetFilters() {
  filters.keyword = ''
  filters.opType = ''
  filters.operator = ''
  filters.timeRange = null
  filters.riskLevel = ''
  pagination.current = 1
}

function handleExpand() {}

function refreshData() {
  logsData.value = generateLogs()
  ElMessage.success('审计日志已刷新')
}

function handleExport() {
  ElMessage.info('正在导出审计日志...')
}

let timer: any
onMounted(() => {
  timer = setInterval(() => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.logs-container { padding: 0; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; display: flex; align-items: center; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.filter-bar {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  padding: 16px; background: $bg-card; border-radius: $radius-lg;
  border: 1px solid $border-lighter; box-shadow: $shadow-sm; margin-bottom: 20px;
}

.stat-row { margin-bottom: 20px; }

.stat-card {
  padding: 20px; border-radius: $radius-lg; background: $bg-card;
  border: 1px solid $border-lighter; box-shadow: $shadow-sm;
  .stat-icon { font-size: 24px; margin-bottom: 8px; }
  .stat-label { font-size: 13px; color: $text-secondary; margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 700; color: $text-primary; margin-bottom: 4px; }
  .stat-sub { font-size: 12px; color: $text-secondary; }
  &.stat-primary { border-left: 4px solid $primary-color; .stat-icon { color: $primary-color; } }
  &.stat-danger { border-left: 4px solid $danger-color; .stat-icon { color: $danger-color; } .stat-value { color: $danger-color; } }
  &.stat-warning { border-left: 4px solid $warning-color; .stat-icon { color: $warning-color; } .stat-value { color: $warning-color; } }
  &.stat-info { border-left: 4px solid $info-color; .stat-icon { color: $info-color; } .stat-value { color: $info-color; } }
}

.card-wrapper {
  background: $bg-card; border-radius: $radius-lg; padding: 18px;
  border: 1px solid $border-lighter; box-shadow: $shadow-sm; margin-bottom: 20px;
}

.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid $border-lighter;
  .card-title { font-size: 15px; font-weight: 600; color: $text-primary; }
}

.role-tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  background: $primary-color; color: #fff; font-size: 11px; font-weight: 500; opacity: 0.9;
}

.expand-detail { padding: 12px 20px; }

.detail-pre {
  font-size: 12px; background: #f5f7fa; padding: 8px 12px; border-radius: 4px;
  margin: 0; white-space: pre-wrap; word-break: break-all; max-height: 120px; overflow-y: auto;
}

.pagination-wrapper { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
