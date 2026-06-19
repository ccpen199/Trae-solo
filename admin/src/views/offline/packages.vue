<template>
  <div class="packages-container">
    <div class="page-header">
      <div>
        <h2>离线包管理</h2>
        <p class="header-sub">
          离线包全生命周期管理 · 缓存策略监控 · {{ currentTime }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增离线包</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button :icon="Download" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Box /></div>
          <div class="stat-label">离线包总数</div>
          <div class="stat-value">{{ summary.totalPackages }}</div>
          <div class="stat-sub"><TrendCharts class="up" />证照类 {{ summary.certPackages }} 个</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><CircleCheck /></div>
          <div class="stat-label">总缓存命中数</div>
          <div class="stat-value">{{ formatNum(summary.totalHits) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />命中率 {{ summary.hitRate }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><DataLine /></div>
          <div class="stat-label">日均离线服务量</div>
          <div class="stat-value">{{ formatNum(summary.dailyService) }}</div>
          <div class="stat-sub">较昨日 +{{ summary.dailyGrowth }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><Files /></div>
          <div class="stat-label">平均包大小</div>
          <div class="stat-value">{{ summary.avgSize }} <span style="font-size: 14px;">MB</span></div>
          <div class="stat-sub">最大包 {{ summary.maxSize }} MB</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">离线包下载趋势（近7天）</div>
            <el-tag type="info" round size="small">日均 {{ avgDailyDownload }}</el-tag>
          </div>
          <v-chart :option="downloadTrendOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">各服务类别离线包大小</div></div>
          <v-chart :option="categoryPieOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">离线包列表</div>
        <div class="header-right">
          <el-input
            v-model="tableSearch"
            placeholder="搜索服务名称"
            :prefix-icon="Search"
            clearable
            style="width: 200px; margin-right: 12px;"
            size="default"
          />
          <el-select v-model="typeFilter" placeholder="包类型" clearable size="default" style="width: 120px; margin-right: 12px;">
            <el-option label="证照" value="证照" />
            <el-option label="指南" value="指南" />
            <el-option label="表单" value="表单" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="状态" clearable size="default" style="width: 120px; margin-right: 12px;">
            <el-option label="正常" value="正常" />
            <el-option label="过期" value="过期" />
            <el-option label="同步中" value="同步中" />
          </el-select>
          <el-button type="warning" :icon="RefreshRight" :disabled="!selectedRows.length" @click="handleBatchUpdate">批量更新</el-button>
          <el-button type="danger" :icon="Delete" :disabled="!selectedRows.length" @click="handleBatchClean">批量过期清理</el-button>
        </div>
      </div>
      <el-table
        :data="pagedTableData"
        size="default"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="id" label="包ID" width="100" />
        <el-table-column prop="serviceName" label="服务名称" min-width="160" />
        <el-table-column prop="packageType" label="包类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.packageType === '证照' ? 'primary' : row.packageType === '指南' ? 'success' : 'warning'"
              round size="small"
            >{{ row.packageType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本号" width="80" align="center" />
        <el-table-column prop="size" label="大小(MB)" width="95" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.size > 20 ? '#E74C3C' : row.size > 10 ? '#F39C12' : '#27AE60', fontWeight: 600 }">
              {{ row.size }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cachePeriod" label="缓存有效期" width="100" align="center" />
        <el-table-column prop="updateStrategy" label="更新策略" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.updateStrategy === '自动' ? 'success' : 'info'" effect="plain" size="small">
              {{ row.updateStrategy }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hits" label="命中次数" width="95" align="center">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ formatNum(row.hits) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastSyncTime" label="最后同步时间" width="160" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === '正常' ? 'success' : row.status === '过期' ? 'danger' : 'warning'"
              effect="dark" round size="small"
            >{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="handleSync(row)">同步</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 30]"
          :total="filteredTableData.length"
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
import {
  Refresh, Download, Plus, Search, Delete, RefreshRight,
  Box, CircleCheck, DataLine, Files, TrendCharts, Odometer
} from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const currentTime = ref('')
const tableSearch = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const selectedRows = ref<any[]>([])
const pagination = reactive({ current: 1, size: 10 })

const summary = reactive({
  totalPackages: 20,
  certPackages: 12,
  totalHits: 1289756,
  hitRate: 94.3,
  dailyService: 34521,
  dailyGrowth: 2.8,
  avgSize: 12.6,
  maxSize: 28.5
})

const dailyTrend = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    downloads: 28000 + Math.floor(Math.random() * 12000 + i * 800),
    hits: 22000 + Math.floor(Math.random() * 10000 + i * 600)
  }
})

const avgDailyDownload = computed(() =>
  Math.round(dailyTrend.reduce((s, d) => s + d.downloads, 0) / dailyTrend.length)
)

const downloadTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['下载量', '命中量'], right: 10 },
  grid: { left: 50, right: 30, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: dailyTrend.map(d => d.date), boundaryGap: false },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
  series: [
    {
      name: '下载量', type: 'line', smooth: true, data: dailyTrend.map(d => d.downloads),
      lineStyle: { color: '#1E4FA5', width: 3 }, itemStyle: { color: '#1E4FA5' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.35)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }]
        }
      }
    },
    {
      name: '命中量', type: 'line', smooth: true, data: dailyTrend.map(d => d.hits),
      lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' }
    }
  ]
}))

const categoryPieData = [
  { value: 156.8, name: '证照类', color: '#1E4FA5' },
  { value: 42.3, name: '指南类', color: '#27AE60' },
  { value: 53.1, name: '表单类', color: '#F39C12' }
]

const categoryPieOption = {
  tooltip: { trigger: 'item', formatter: '{b}<br/>总大小：{c} MB ({d}%)' },
  legend: { orient: 'vertical', right: 5, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['45%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
    data: categoryPieData.map(d => ({ ...d, itemStyle: { color: d.color } }))
  }]
}

interface PackageItem {
  id: string
  serviceName: string
  packageType: string
  version: string
  size: number
  cachePeriod: string
  updateStrategy: string
  hits: number
  lastSyncTime: string
  status: string
}

const packageData = ref<PackageItem[]>([
  { id: 'PKG001', serviceName: '社保参保证明', packageType: '证照', version: 'v3.2', size: 8.5, cachePeriod: '30天', updateStrategy: '自动', hits: 38241, lastSyncTime: '2026-06-18 08:12:35', status: '正常' },
  { id: 'PKG002', serviceName: '医保电子凭证', packageType: '证照', version: 'v4.1', size: 15.2, cachePeriod: '7天', updateStrategy: '自动', hits: 28432, lastSyncTime: '2026-06-18 09:45:20', status: '正常' },
  { id: 'PKG003', serviceName: '办事指南-户籍', packageType: '指南', version: 'v2.8', size: 3.2, cachePeriod: '90天', updateStrategy: '手动', hits: 21567, lastSyncTime: '2026-06-15 14:20:10', status: '正常' },
  { id: 'PKG004', serviceName: '办事指南-社保', packageType: '指南', version: 'v2.5', size: 4.1, cachePeriod: '90天', updateStrategy: '手动', hits: 18923, lastSyncTime: '2026-06-14 11:30:45', status: '正常' },
  { id: 'PKG005', serviceName: '公积金余额', packageType: '表单', version: 'v3.0', size: 6.8, cachePeriod: '15天', updateStrategy: '自动', hits: 24198, lastSyncTime: '2026-06-18 07:55:30', status: '正常' },
  { id: 'PKG006', serviceName: '身份证电子副本', packageType: '证照', version: 'v5.0', size: 22.3, cachePeriod: '7天', updateStrategy: '自动', hits: 45678, lastSyncTime: '2026-06-18 10:05:15', status: '正常' },
  { id: 'PKG007', serviceName: '驾驶证电子副本', packageType: '证照', version: 'v4.3', size: 18.7, cachePeriod: '7天', updateStrategy: '自动', hits: 14321, lastSyncTime: '2026-06-18 06:30:22', status: '正常' },
  { id: 'PKG008', serviceName: '不动产证明', packageType: '证照', version: 'v2.9', size: 28.5, cachePeriod: '30天', updateStrategy: '手动', hits: 15876, lastSyncTime: '2026-06-10 16:42:50', status: '过期' },
  { id: 'PKG009', serviceName: '个税完税证明', packageType: '证照', version: 'v3.5', size: 9.8, cachePeriod: '30天', updateStrategy: '自动', hits: 9876, lastSyncTime: '2026-06-18 08:28:17', status: '正常' },
  { id: 'PKG010', serviceName: '居住证电子副本', packageType: '证照', version: 'v3.1', size: 16.4, cachePeriod: '15天', updateStrategy: '自动', hits: 7654, lastSyncTime: '2026-06-17 22:15:08', status: '同步中' },
  { id: 'PKG011', serviceName: '出生医学证明', packageType: '证照', version: 'v2.2', size: 12.1, cachePeriod: '永久', updateStrategy: '手动', hits: 5432, lastSyncTime: '2026-06-12 09:10:33', status: '正常' },
  { id: 'PKG012', serviceName: '结婚证电子副本', packageType: '证照', version: 'v2.6', size: 11.5, cachePeriod: '永久', updateStrategy: '手动', hits: 6234, lastSyncTime: '2026-06-11 15:25:42', status: '正常' },
  { id: 'PKG013', serviceName: '学历证明', packageType: '证照', version: 'v3.0', size: 14.2, cachePeriod: '永久', updateStrategy: '手动', hits: 8765, lastSyncTime: '2026-06-13 10:50:18', status: '正常' },
  { id: 'PKG014', serviceName: '营业执照电子副本', packageType: '证照', version: 'v3.8', size: 19.6, cachePeriod: '30天', updateStrategy: '自动', hits: 4321, lastSyncTime: '2026-06-16 14:38:55', status: '同步中' },
  { id: 'PKG015', serviceName: '社保卡电子副本', packageType: '证照', version: 'v4.0', size: 13.8, cachePeriod: '7天', updateStrategy: '自动', hits: 32145, lastSyncTime: '2026-06-18 07:20:40', status: '正常' },
  { id: 'PKG016', serviceName: '公积金缴存证明', packageType: '表单', version: 'v2.4', size: 7.3, cachePeriod: '15天', updateStrategy: '自动', hits: 11234, lastSyncTime: '2026-06-17 18:45:12', status: '正常' },
  { id: 'PKG017', serviceName: '养老保险参保证明', packageType: '表单', version: 'v2.7', size: 8.9, cachePeriod: '30天', updateStrategy: '自动', hits: 13567, lastSyncTime: '2026-06-18 09:15:28', status: '正常' },
  { id: 'PKG018', serviceName: '失业登记证明', packageType: '表单', version: 'v1.9', size: 5.6, cachePeriod: '30天', updateStrategy: '手动', hits: 3456, lastSyncTime: '2026-06-05 11:22:30', status: '过期' },
  { id: 'PKG019', serviceName: '残疾证电子副本', packageType: '证照', version: 'v2.0', size: 10.4, cachePeriod: '永久', updateStrategy: '手动', hits: 2134, lastSyncTime: '2026-06-08 13:40:25', status: '正常' },
  { id: 'PKG020', serviceName: '电子签名证书', packageType: '证照', version: 'v5.2', size: 4.8, cachePeriod: '7天', updateStrategy: '自动', hits: 56789, lastSyncTime: '2026-06-18 10:30:05', status: '正常' }
])

const filteredTableData = computed(() => {
  let list = [...packageData.value]
  if (tableSearch.value) {
    const kw = tableSearch.value.toLowerCase()
    list = list.filter(p => p.serviceName.toLowerCase().includes(kw))
  }
  if (typeFilter.value) {
    list = list.filter(p => p.packageType === typeFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter(p => p.status === statusFilter.value)
  }
  return list
})

const pagedTableData = computed(() => {
  const start = (pagination.current - 1) * pagination.size
  return filteredTableData.value.slice(start, start + pagination.size)
})

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleAdd = () => {
  ElMessage.success('新增离线包对话框已打开')
}

const handleBatchUpdate = () => {
  ElMessage.success(`已批量更新 ${selectedRows.value.length} 个离线包`)
}

const handleBatchClean = () => {
  ElMessage.warning(`已清理 ${selectedRows.value.length} 个过期离线包`)
}

const handleView = (row: PackageItem) => {
  ElMessage.info(`查看「${row.serviceName}」离线包详情`)
}

const handleSync = (row: PackageItem) => {
  ElMessage.success(`正在同步「${row.serviceName}」离线包`)
}

const handleDelete = (row: PackageItem) => {
  ElMessage.warning(`已删除「${row.serviceName}」离线包`)
}

const refreshData = () => {
  ElMessage.success('离线包数据已刷新')
}

const handleExport = () => {
  ElMessage.info('正在导出离线包管理报表...')
}

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
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

.packages-container { padding: 0; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; display: flex; align-items: center; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.stat-row { margin-bottom: 20px; }

.stat-card {
  padding: 20px; border-radius: $radius-lg; border: 1px solid $border-lighter;
  box-shadow: $shadow-sm; background: $bg-card; position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    border-radius: $radius-lg 0 0 $radius-lg;
  }
  .stat-icon {
    width: 40px; height: 40px; border-radius: $radius-md; display: flex;
    align-items: center; justify-content: center; margin-bottom: 12px; font-size: 20px;
  }
  .stat-label { font-size: 13px; color: $text-secondary; margin-bottom: 8px; }
  .stat-value { font-size: 28px; font-weight: 700; color: $text-primary; line-height: 1.2; }
  .stat-sub { font-size: 12px; color: $text-secondary; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
  &.stat-primary::before { background: #1E4FA5; }
  &.stat-primary .stat-icon { background: rgba(30,79,165,0.1); color: #1E4FA5; }
  &.stat-success::before { background: #27AE60; }
  &.stat-success .stat-icon { background: rgba(39,174,96,0.1); color: #27AE60; }
  &.stat-warning::before { background: #F39C12; }
  &.stat-warning .stat-icon { background: rgba(243,156,18,0.1); color: #F39C12; }
  &.stat-info::before { background: #2980B9; }
  &.stat-info .stat-icon { background: rgba(41,128,185,0.1); color: #2980B9; }
}

.card-wrapper {
  background: $bg-card; border-radius: $radius-lg; padding: 18px;
  border: 1px solid $border-lighter; box-shadow: $shadow-sm; margin-bottom: 20px;
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid $border-lighter;
  .card-title { font-size: 15px; font-weight: 600; color: $text-primary; display: flex; align-items: center; gap: 8px; }
  .header-right { display: flex; align-items: center; }
}

.pagination-wrapper { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
