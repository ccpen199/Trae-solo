<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h2>郑州市掌上办事中枢 · 运营数据大屏</h2>
        <p class="header-sub">
          实时监控 · {{ currentTime }} · 数据每秒刷新
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> LIVE
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refreshAll">刷新数据</el-button>
        <el-button :icon="Download" :loading="exporting" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><User /></div>
          <div class="stat-label">注册市民总数</div>
          <div class="stat-value">{{ formatNum(summary.totalRegisteredCitizens) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />今日新增 +{{ formatNum(summary.todayActiveUsers, 0) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><DocumentChecked /></div>
          <div class="stat-label">累计办件总量</div>
          <div class="stat-value">{{ formatNum(summary.totalServiceApplications, 0) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />今日 +{{ formatNum(summary.todayApplications, 0) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><OfficeBuilding /></div>
          <div class="stat-label">接入委办局</div>
          <div class="stat-value">{{ summary.connectedDepartments }} <span style="font-size: 14px;">个</span></div>
          <div class="stat-sub">
            <CircleCheck />在线 {{ summary.departments?.online || 18 }}
            <Warning style="margin-left: 8px;" />异常 {{ summary.departments?.degraded + summary.departments?.offline || 2 }}
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><Star /></div>
          <div class="stat-label">综合满意度</div>
          <div class="stat-value">{{ summary.overallSatisfaction }} <span style="font-size: 14px;">分</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上周 +0.8%</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">办件量趋势分析</div>
            <el-select v-model="trendMetric" size="small" style="width: 140px;">
              <el-option label="办件总量" value="applications" />
              <el-option label="活跃用户" value="activeUsers" />
              <el-option label="平均评分" value="avgRating" />
            </el-select>
          </div>
          <v-chart :option="trendChartOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">服务类别占比</div></div>
          <v-chart :option="categoryPieOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">热门服务 TOP10</div></div>
          <el-table :data="topServices" size="default">
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="{ $index }">
                <el-tag
                  v-if="$index < 3"
                  :type="['danger', 'warning', 'success'][$index]"
                  effect="dark"
                  round
                  size="small"
                >{{ $index + 1 }}</el-tag>
                <span v-else>{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="服务名称" />
            <el-table-column prop="department" label="委办局" width="100" />
            <el-table-column label="使用量" width="140">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round(row.usage / 35000 * 100)"
                  :stroke-width="10"
                  :color="'#1E4FA5'"
                  :text-inside="true"
                />
              </template>
            </el-table-column>
            <el-table-column label="满意度" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.satisfaction >= 95 ? 'success' : row.satisfaction >= 90 ? 'warning' : 'danger'" round size="small">
                  {{ row.satisfaction }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">24小时访问热力图</div>
            <el-tag type="info" round size="small">平均响应 {{ summary.avgResponseTimeMs }}ms</el-tag>
          </div>
          <div class="hourly-heatmap">
            <div class="heatmap-row" v-for="row in heatmapData" :key="row.label">
              <div class="heatmap-label">{{ row.label }}</div>
              <div class="heatmap-cells">
                <div
                  v-for="(cell, idx) in row.cells"
                  :key="idx"
                  class="heatmap-cell"
                  :style="{ background: heatmapColor(cell.value, row.max) }"
                  :title="`${idx}:00 - 请求${cell.value}次 · 响应${cell.avgMs}ms`"
                />
              </div>
            </div>
            <div class="heatmap-legend">
              <span>低</span>
              <div v-for="i in 5" :key="i" class="legend-cell" :style="{ background: heatmapColor(i * 200, 1000) }"></div>
              <span>高</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">差评督办动态</div></div>
          <div class="workorder-feed">
            <div class="feed-item" v-for="wo in urgentWorkorders" :key="wo.id">
              <el-badge :value="wo.priority" :hidden="false" class="wo-badge" />
              <div class="wo-content">
                <div class="wo-title">{{ wo.title }}</div>
                <div class="wo-meta">
                  <el-tag size="small" :type="wo.status === 'pending' ? 'warning' : 'danger'" effect="plain">
                    {{ statusText(wo.status) }}
                  </el-tag>
                  <span class="wo-assign">{{ wo.assignee }}</span>
                </div>
              </div>
            </div>
            <el-empty v-if="urgentWorkorders.length === 0" description="暂无紧急工单" :image-size="80" />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">市民画像标签云</div></div>
          <div class="tag-cloud">
            <span
              v-for="tag in topTags"
              :key="tag.name"
              class="cloud-tag"
              :style="{ fontSize: `${12 + tag.weight * 14}px`, color: tagColors[tag.category % tagColors.length] }"
            >
              {{ tag.name }}
            </span>
          </div>
          <el-divider style="margin: 12px 0;" />
          <div class="tag-stats">
            <div class="tag-stat-item">
              <div class="tag-stat-num">{{ summary.engines?.profile?.cachedProfiles || 0 }}</div>
              <div class="tag-stat-label">画像总数</div>
            </div>
            <div class="tag-stat-item">
              <div class="tag-stat-num">{{ summary.engines?.knowledgeGraph?.nodes || 0 }}</div>
              <div class="tag-stat-label">图谱节点</div>
            </div>
            <div class="tag-stat-item">
              <div class="tag-stat-num">{{ summary.engines?.feedback?.totalClusters || 0 }}</div>
              <div class="tag-stat-label">聚类数</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">各区县办件分布</div></div>
          <v-chart :option="districtOption" style="height: 300px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">实时监控 · 系统状态</div>
            <div>
              <el-tag type="success" effect="plain" round style="margin-right: 8px;">
                <el-icon><Cpu /></el-icon> CPU {{ system.cpu.toFixed(1) }}%
              </el-tag>
              <el-tag type="primary" effect="plain" round style="margin-right: 8px;">
                <el-icon><Coin /></el-icon> 内存 {{ system.memory.toFixed(1) }}%
              </el-tag>
              <el-tag type="info" effect="plain" round>
                <el-icon><Timer /></el-icon> 运行 {{ system.uptime }}
              </el-tag>
            </div>
          </div>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="mini-stat">
                <div class="mini-label">今日登录用户</div>
                <div class="mini-value">{{ formatNum(Math.floor(5000 + Math.random() * 3000), 0) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="mini-stat">
                <div class="mini-label">当前在线</div>
                <div class="mini-value" style="color: #27AE60;">{{ formatNum(Math.floor(1200 + Math.random() * 800), 0) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="mini-stat">
                <div class="mini-label">队列等待中</div>
                <div class="mini-value" style="color: #F39C12;">{{ Math.floor(Math.random() * 50) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="mini-stat">
                <div class="mini-label">API 成功率</div>
                <div class="mini-value" style="color: #1E4FA5;">99.{{ Math.floor(80 + Math.random() * 19) }}%</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart, MapChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  VisualMapComponent, DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Refresh, Download, User, DocumentChecked, OfficeBuilding, Star,
  TrendCharts, CircleCheck, Warning, Odometer, Cpu, Coin, Timer } from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, PieChart, BarChart, MapChart, GridComponent,
  TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, DataZoomComponent])

const currentTime = ref('')
const timeRange = ref('7d')
const trendMetric = ref('applications')
const exporting = ref(false)

const summary = reactive<any>({
  totalRegisteredCitizens: 8926340,
  todayActiveUsers: 12834,
  totalServiceApplications: 156892345,
  todayApplications: 32876,
  connectedDepartments: 20,
  overallSatisfaction: 94.6,
  avgResponseTimeMs: 128,
  departments: { online: 18, degraded: 1, offline: 1 },
  engines: {
    profile: { cachedProfiles: 45892, behaviorRecords: 2345678 },
    knowledgeGraph: { nodes: 8421, policies: 1256, qas: 5890 },
    feedback: { totalFeedbacks: 68934, totalWorkOrders: 4891, totalClusters: 156 }
  }
})

const system = reactive({ cpu: 23.5, memory: 61.2, uptime: '47天12小时' })

const dailyData = computed(() => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i))
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    applications: 25000 + Math.floor(Math.random() * 15000 + i * 800),
    activeUsers: 8000 + Math.floor(Math.random() * 5000 + i * 300),
    avgRating: Math.round((4.3 + Math.random() * 0.5) * 100) / 100
  }
}))

const trendChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['办件量', '新增用户', '7日均值'], right: 10 },
  grid: { left: 50, right: 30, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: dailyData.value.map(d => d.date), boundaryGap: false },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
  series: [
    {
      name: '办件量', type: 'line', smooth: true, data: dailyData.value.map(d => d.applications),
      lineStyle: { color: '#1E4FA5', width: 3 },
      itemStyle: { color: '#1E4FA5' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.35)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }]
        }
      }
    },
    {
      name: '新增用户', type: 'line', smooth: true, data: dailyData.value.map(d => d.activeUsers),
      lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' }
    },
    {
      name: '7日均值', type: 'line', smooth: true, data: dailyData.value.map((_, i, arr) =>
        Math.round(arr.slice(0, i + 1).reduce((s, x) => s + x.applications, 0) / (i + 1))
      ),
      lineStyle: { color: '#F39C12', width: 2, type: 'dashed' }, itemStyle: { color: '#F39C12' }
    }
  ]
}))

const categoryData = [
  { value: 38241, name: '社会保障', color: '#1E4FA5' },
  { value: 35892, name: '医疗保障', color: '#27AE60' },
  { value: 21098, name: '户籍证件', color: '#E74C3C' },
  { value: 19876, name: '住房公积金', color: '#F39C12' },
  { value: 15432, name: '不动产登记', color: '#8E44AD' },
  { value: 12765, name: '教育入学', color: '#2980B9' },
  { value: 8921, name: '交通出行', color: '#16A085' },
  { value: 6543, name: '其他', color: '#95A5A6' }
]

const categoryPieOption = {
  tooltip: { trigger: 'item', formatter: '{b}<br/>办件量：{c} ({d}%)' },
  legend: { orient: 'vertical', right: 5, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['45%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
    data: categoryData.map(d => ({ ...d, itemStyle: { color: d.color } }))
  }]
}

const topServices = ref([
  { name: '医保电子凭证激活', department: '医保局', usage: 32876, satisfaction: 98.2 },
  { name: '公积金账户余额查询', department: '公积金', usage: 28432, satisfaction: 96.5 },
  { name: '社保参保证明打印', department: '人社局', usage: 24198, satisfaction: 97.1 },
  { name: '交通违法查询处理', department: '交警支队', usage: 21567, satisfaction: 93.4 },
  { name: '义务教育入学报名', department: '教育局', usage: 18923, satisfaction: 91.2 },
  { name: '不动产登记查询', department: '自然资源局', usage: 15876, satisfaction: 96.8 },
  { name: '机动车六年免检', department: '交警支队', usage: 14321, satisfaction: 97.5 },
  { name: '新生儿落户登记', department: '公安局', usage: 11234, satisfaction: 95.6 },
  { name: '个税纳税记录开具', department: '税务局', usage: 9876, satisfaction: 98.1 },
  { name: '驾驶证补换领', department: '交警支队', usage: 8765, satisfaction: 96.3 }
])

const heatmapData = ref([{
  label: '请求量', max: 1000,
  cells: Array.from({ length: 24 }, (_, h) => {
    const peak = h >= 8 && h <= 22 ? 1 : 0.2
    return { value: Math.floor(500 + Math.random() * 500 * peak + (h === 20 ? 300 : 0)), avgMs: 80 + Math.floor(Math.random() * 80) }
  })
}])

const heatmapColor = (value: number, max: number) => {
  const ratio = Math.min(1, value / max)
  if (ratio < 0.2) return '#EBEEF5'
  if (ratio < 0.4) return '#C6E2FF'
  if (ratio < 0.6) return '#79BBFF'
  if (ratio < 0.8) return '#337ECC'
  return '#0D3A7C'
}

const urgentWorkorders = ref([
  { id: 'WO-24052501', title: '户籍科：材料清单不明确投诉', priority: 'urgent', status: 'pending', assignee: '张科长' },
  { id: 'WO-24052502', title: '医保局：系统高峰期崩溃问题', priority: 'urgent', status: 'in_progress', assignee: '刘处长' },
  { id: 'WO-24052503', title: '教育局：报名系统3次提交失败', priority: 'high', status: 'pending', assignee: '教育局技术科' },
  { id: 'WO-24052504', title: '人社窗口人员服务态度差评', priority: 'high', status: 'resolved', assignee: '社保中心' }
])

const statusText = (s: string) => ({ pending: '待处理', in_progress: '处理中', resolved: '已解决', escalated: '已升级' }[s] || s)

const topTags = ref([
  { name: '学龄前儿童家长', weight: 0.95, category: 0 },
  { name: '灵活就业人员', weight: 0.88, category: 1 },
  { name: '即将退休', weight: 0.82, category: 2 },
  { name: '首套房购买者', weight: 0.78, category: 0 },
  { name: '异地就医需求', weight: 0.74, category: 3 },
  { name: '二孩家庭', weight: 0.71, category: 1 },
  { name: '个体工商户', weight: 0.68, category: 2 },
  { name: '慢性病患者', weight: 0.65, category: 3 },
  { name: '租房提取公积金', weight: 0.62, category: 0 },
  { name: '高考生家长', weight: 0.58, category: 1 },
  { name: '人才引进落户', weight: 0.54, category: 2 },
  { name: '退伍军人', weight: 0.51, category: 3 }
])
const tagColors = ['#1E4FA5', '#27AE60', '#E74C3C', '#8E44AD']

const districtOption = {
  tooltip: { trigger: 'item', formatter: '{b}<br/>办件量：{c}' },
  grid: { left: 90, right: 30, top: 10, bottom: 30 },
  xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  yAxis: {
    type: 'category',
    data: ['上街区', '惠济区', '管城回族', '中原区', '二七区', '郑东新区', '金水区']
  },
  series: [{
    type: 'bar', barWidth: 18,
    data: [12876, 21543, 28932, 32187, 35621, 42987, 58234],
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [{ offset: 0, color: '#79BBFF' }, { offset: 1, color: '#1E4FA5' }] }
    },
    label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#606266' }
  }]
}

const formatNum = (n: number, digits = 0) => {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

let timer: any
onMounted(() => {
  timer = setInterval(() => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
    summary.avgResponseTimeMs = 100 + Math.floor(Math.random() * 80)
    system.cpu = 20 + Math.random() * 30
    system.memory = 55 + Math.random() * 20
  }, 1000)
})

onUnmounted(() => clearInterval(timer))

function refreshAll() {
  summary.totalRegisteredCitizens += Math.floor(Math.random() * 50)
  summary.totalServiceApplications += Math.floor(Math.random() * 300)
}

async function handleExport() {
  exporting.value = true
  await new Promise(r => setTimeout(r, 1500))
  exporting.value = false
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.dashboard-container { padding: 0; }
.dashboard-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; display: flex; align-items: center; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.stat-row { margin-bottom: 20px; }

.hourly-heatmap {
  .heatmap-row { display: flex; align-items: center; margin-bottom: 12px; }
  .heatmap-label { width: 60px; font-size: 12px; color: $text-secondary; flex-shrink: 0; }
  .heatmap-cells { flex: 1; display: grid; grid-template-columns: repeat(24, 1fr); gap: 4px; }
  .heatmap-cell { aspect-ratio: 1; border-radius: 3px; cursor: pointer; transition: all 0.2s; &:hover { transform: scale(1.2); box-shadow: 0 2px 6px rgba(0,0,0,0.2); } }
  .heatmap-legend { display: flex; align-items: center; gap: 6px; margin-top: 12px; padding-left: 60px; font-size: 11px; color: $text-secondary; }
  .legend-cell { width: 16px; height: 12px; border-radius: 2px; }
}

.workorder-feed {
  .feed-item { display: flex; gap: 12px; padding: 12px; border-radius: 8px; border: 1px solid $border-lighter; margin-bottom: 10px; transition: all 0.2s; &:hover { border-color: $primary-light; background: #f0f7ff; } }
  .wo-badge :deep(.el-badge__content) { min-width: 12px; height: 12px; padding: 0; font-size: 0; top: 6px; background: #E74C3C; }
  .wo-content { flex: 1; min-width: 0; }
  .wo-title { font-size: 13px; font-weight: 500; color: $text-primary; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wo-meta { display: flex; align-items: center; gap: 8px; }
  .wo-assign { font-size: 11px; color: $text-secondary; }
}

.tag-cloud {
  display: flex; flex-wrap: wrap; gap: 8px 14px; padding: 8px;
  .cloud-tag {
    display: inline-block; padding: 4px 12px; background: #f5f7fa; border-radius: 16px;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
    &:hover { transform: translateY(-2px); background: $primary-color; color: #fff !important; box-shadow: 0 4px 12px rgba(30,79,165,0.3); }
  }
}
.tag-stats { display: flex; gap: 12px; }
.tag-stat-item { flex: 1; text-align: center; padding: 12px; background: $border-extra-light; border-radius: 8px; }
.tag-stat-num { font-size: 20px; font-weight: 700; color: $primary-color; margin-bottom: 4px; }
.tag-stat-label { font-size: 12px; color: $text-secondary; }

.mini-stat {
  padding: 16px; background: $border-extra-light; border-radius: 8px; text-align: center;
  .mini-label { font-size: 12px; color: $text-secondary; margin-bottom: 8px; }
  .mini-value { font-size: 26px; font-weight: 700; color: $text-primary; }
}
</style>
