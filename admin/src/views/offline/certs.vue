<template>
  <div class="certs-container">
    <div class="page-header">
      <div>
        <h2>离线证明监控</h2>
        <p class="header-sub">
          证照验证全链路监控 · 离线证明状态追踪 · {{ currentTime }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button :icon="Download" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Monitor /></div>
          <div class="stat-label">在线证照数</div>
          <div class="stat-value">{{ summary.onlineCerts }}</div>
          <div class="stat-sub">占比 {{ summary.onlineRate }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><Cellphone /></div>
          <div class="stat-label">离线证照数</div>
          <div class="stat-value">{{ formatNum(summary.offlineCerts) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />较昨日 +{{ summary.offlineGrowth }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><Checked /></div>
          <div class="stat-label">今日验证次数</div>
          <div class="stat-value">{{ formatNum(summary.todayVerifyCount) }}</div>
          <div class="stat-sub">峰值 {{ summary.peakHour }}时</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><SuccessFilled /></div>
          <div class="stat-label">验证成功率</div>
          <div class="stat-value">{{ summary.verifySuccessRate }} <span style="font-size: 14px;">%</span></div>
          <div class="stat-sub">失败 {{ summary.failCount }} 次</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">各证照类型验证量</div>
            <el-tag type="info" round size="small">累计验证量</el-tag>
          </div>
          <v-chart :option="verifyBarOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">验证成功率趋势</div>
            <el-tag type="success" round size="small">近7天</el-tag>
          </div>
          <v-chart :option="successRateTrendOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">证照列表</div>
        <div class="header-right">
          <el-input
            v-model="certSearch"
            placeholder="搜索证照类型"
            :prefix-icon="Search"
            clearable
            style="width: 200px; margin-right: 12px;"
            size="default"
          />
          <el-select v-model="verifyMethodFilter" placeholder="验证方式" clearable size="default" style="width: 130px; margin-right: 12px;">
            <el-option label="二维码" value="二维码" />
            <el-option label="人脸" value="人脸" />
            <el-option label="NFC" value="NFC" />
          </el-select>
          <el-select v-model="onlineStatusFilter" placeholder="在线/离线" clearable size="default" style="width: 120px;">
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
          </el-select>
        </div>
      </div>
      <el-table :data="filteredCertData" size="default" stripe>
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="certType" label="证照类型" min-width="150" />
        <el-table-column prop="department" label="发放部门" width="120">
          <template #default="{ row }">
            <span class="dept-tag">{{ row.department }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="holderCount" label="持有人数" width="100" align="center">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ formatNum(row.holderCount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="onlineStatus" label="在线/离线" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.onlineStatus === '在线' ? 'success' : 'warning'" effect="dark" round size="small">
              {{ row.onlineStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyMethod" label="验证方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.verifyMethod === '二维码' ? 'primary' : row.verifyMethod === '人脸' ? 'success' : 'warning'"
              effect="plain" size="small"
            >{{ row.verifyMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyCount" label="验证次数" width="100" align="center">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ formatNum(row.verifyCount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="successRate" label="验证成功率" width="110" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.successRate"
              :stroke-width="10"
              :color="row.successRate >= 95 ? '#27AE60' : row.successRate >= 85 ? '#F39C12' : '#E74C3C'"
              :text-inside="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdateTime" label="最后更新时间" width="160" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleCertDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="handleCertSync(row)">同步</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">验证记录</div>
        <div class="header-right">
          <el-input
            v-model="recordSearch"
            placeholder="搜索验证ID"
            :prefix-icon="Search"
            clearable
            style="width: 200px; margin-right: 12px;"
            size="default"
          />
          <el-select v-model="resultFilter" placeholder="验证结果" clearable size="default" style="width: 120px;">
            <el-option label="成功" value="成功" />
            <el-option label="失败" value="失败" />
          </el-select>
        </div>
      </div>
      <el-table :data="filteredRecordData" size="default" stripe>
        <el-table-column prop="verifyId" label="验证ID" width="140" />
        <el-table-column prop="certType" label="证照类型" width="150" />
        <el-table-column prop="verifyMethod" label="验证方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.verifyMethod === '二维码' ? 'primary' : row.verifyMethod === '人脸' ? 'success' : 'warning'"
              effect="plain" size="small"
            >{{ row.verifyMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyResult" label="验证结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.verifyResult === '成功' ? 'success' : 'danger'" effect="dark" round size="small">
              {{ row.verifyResult }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifyTime" label="验证时间" width="180" />
        <el-table-column prop="deviceInfo" label="设备信息" min-width="200" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="recordPagination.current"
          v-model:page-size="recordPagination.size"
          :page-sizes="[10, 20, 30]"
          :total="filteredRecordData.length"
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
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import {
  Refresh, Download, Search, Monitor, Cellphone, Checked,
  SuccessFilled, TrendCharts, Odometer
} from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const currentTime = ref('')
const timeRange = ref('7d')
const certSearch = ref('')
const verifyMethodFilter = ref('')
const onlineStatusFilter = ref('')
const recordSearch = ref('')
const resultFilter = ref('')
const recordPagination = reactive({ current: 1, size: 10 })

const summary = reactive({
  onlineCerts: 8,
  offlineCerts: 567890,
  offlineGrowth: 3.2,
  todayVerifyCount: 28456,
  peakHour: 10,
  verifySuccessRate: 97.8,
  failCount: 626,
  onlineRate: 15.4
})

const verifyBarData = [
  { name: '身份证', value: 45678 },
  { name: '驾驶证', value: 32145 },
  { name: '社保卡', value: 28934 },
  { name: '医保凭证', value: 24567 },
  { name: '居住证', value: 18923 },
  { name: '结婚证', value: 12345 },
  { name: '营业执照', value: 8976 },
  { name: '残疾证', value: 5432 }
]

const verifyBarOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 80, right: 30, top: 20, bottom: 30 },
  xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  yAxis: { type: 'category', data: verifyBarData.map(d => d.name).reverse() },
  series: [{
    type: 'bar', barWidth: 18,
    data: verifyBarData.map(d => d.value).reverse(),
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [{ offset: 0, color: '#79BBFF' }, { offset: 1, color: '#1E4FA5' }]
      }
    },
    label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#606266' }
  }]
}))

const successRateTrend = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    rate: Math.round((96.5 + Math.random() * 2.5) * 10) / 10,
    count: 25000 + Math.floor(Math.random() * 8000)
  }
})

const successRateTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['成功率', '验证次数'], right: 10 },
  grid: { left: 50, right: 50, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: successRateTrend.map(d => d.date), boundaryGap: false },
  yAxis: [
    { type: 'value', min: 94, max: 100, name: '成功率(%)', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
    { type: 'value', name: '次数', splitLine: { show: false } }
  ],
  series: [
    {
      name: '成功率', type: 'line', smooth: true, data: successRateTrend.map(d => d.rate),
      lineStyle: { color: '#1E4FA5', width: 3 }, itemStyle: { color: '#1E4FA5' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.35)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }]
        }
      }
    },
    {
      name: '验证次数', type: 'line', smooth: true, yAxisIndex: 1,
      data: successRateTrend.map(d => d.count),
      lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' }
    }
  ]
}))

interface CertItem {
  certType: string
  department: string
  holderCount: number
  onlineStatus: string
  verifyMethod: string
  verifyCount: number
  successRate: number
  lastUpdateTime: string
}

const certData = ref<CertItem[]>([
  { certType: '身份证电子副本', department: '公安局', holderCount: 456789, onlineStatus: '在线', verifyMethod: '人脸', verifyCount: 45678, successRate: 98.5, lastUpdateTime: '2026-06-18 10:30:15' },
  { certType: '驾驶证电子副本', department: '交警支队', holderCount: 234567, onlineStatus: '在线', verifyMethod: '二维码', verifyCount: 32145, successRate: 97.8, lastUpdateTime: '2026-06-18 09:45:22' },
  { certType: '社保卡电子副本', department: '人社局', holderCount: 345678, onlineStatus: '离线', verifyMethod: 'NFC', verifyCount: 28934, successRate: 99.1, lastUpdateTime: '2026-06-18 08:20:38' },
  { certType: '医保电子凭证', department: '医保局', holderCount: 567890, onlineStatus: '在线', verifyMethod: '二维码', verifyCount: 24567, successRate: 96.3, lastUpdateTime: '2026-06-18 07:55:12' },
  { certType: '居住证电子副本', department: '公安局', holderCount: 123456, onlineStatus: '离线', verifyMethod: '二维码', verifyCount: 18923, successRate: 95.7, lastUpdateTime: '2026-06-17 22:15:45' },
  { certType: '结婚证电子副本', department: '民政局', holderCount: 87654, onlineStatus: '在线', verifyMethod: '二维码', verifyCount: 12345, successRate: 98.2, lastUpdateTime: '2026-06-18 06:40:30' },
  { certType: '营业执照电子副本', department: '市场监管局', holderCount: 45678, onlineStatus: '离线', verifyMethod: '人脸', verifyCount: 8976, successRate: 94.5, lastUpdateTime: '2026-06-16 14:38:55' },
  { certType: '残疾证电子副本', department: '残联', holderCount: 23456, onlineStatus: '在线', verifyMethod: 'NFC', verifyCount: 5432, successRate: 97.6, lastUpdateTime: '2026-06-18 09:12:20' },
  { certType: '不动产证明', department: '自然资源局', holderCount: 156789, onlineStatus: '离线', verifyMethod: '二维码', verifyCount: 15876, successRate: 93.2, lastUpdateTime: '2026-06-10 16:42:50' },
  { certType: '出生医学证明', department: '卫健委', holderCount: 65432, onlineStatus: '在线', verifyMethod: '二维码', verifyCount: 5432, successRate: 98.8, lastUpdateTime: '2026-06-12 09:10:33' },
  { certType: '学历证明', department: '教育局', holderCount: 198765, onlineStatus: '在线', verifyMethod: '二维码', verifyCount: 8765, successRate: 96.9, lastUpdateTime: '2026-06-13 10:50:18' },
  { certType: '个税完税证明', department: '税务局', holderCount: 234567, onlineStatus: '在线', verifyMethod: '人脸', verifyCount: 9876, successRate: 97.4, lastUpdateTime: '2026-06-18 08:28:17' }
])

const filteredCertData = computed(() => {
  let list = [...certData.value]
  if (certSearch.value) {
    const kw = certSearch.value.toLowerCase()
    list = list.filter(c => c.certType.toLowerCase().includes(kw))
  }
  if (verifyMethodFilter.value) {
    list = list.filter(c => c.verifyMethod === verifyMethodFilter.value)
  }
  if (onlineStatusFilter.value) {
    list = list.filter(c => c.onlineStatus === onlineStatusFilter.value)
  }
  return list
})

interface VerifyRecord {
  verifyId: string
  certType: string
  verifyMethod: string
  verifyResult: string
  verifyTime: string
  deviceInfo: string
}

const recordData = ref<VerifyRecord[]>([
  { verifyId: 'VRF20260618001', certType: '身份证电子副本', verifyMethod: '人脸', verifyResult: '成功', verifyTime: '2026-06-18 10:28:35', deviceInfo: '华为 Mate 60 Pro / Android 14' },
  { verifyId: 'VRF20260618002', certType: '医保电子凭证', verifyMethod: '二维码', verifyResult: '成功', verifyTime: '2026-06-18 10:25:12', deviceInfo: '小米 14 / Android 14' },
  { verifyId: 'VRF20260618003', certType: '驾驶证电子副本', verifyMethod: '二维码', verifyResult: '失败', verifyTime: '2026-06-18 10:22:48', deviceInfo: 'iPhone 15 Pro / iOS 18' },
  { verifyId: 'VRF20260618004', certType: '社保卡电子副本', verifyMethod: 'NFC', verifyResult: '成功', verifyTime: '2026-06-18 10:18:33', deviceInfo: 'OPPO Find X7 / Android 14' },
  { verifyId: 'VRF20260618005', certType: '居住证电子副本', verifyMethod: '二维码', verifyResult: '成功', verifyTime: '2026-06-18 10:15:20', deviceInfo: 'vivo X100 / Android 14' },
  { verifyId: 'VRF20260618006', certType: '结婚证电子副本', verifyMethod: '二维码', verifyResult: '成功', verifyTime: '2026-06-18 10:12:45', deviceInfo: '华为 P60 / Android 13' },
  { verifyId: 'VRF20260618007', certType: '营业执照电子副本', verifyMethod: '人脸', verifyResult: '失败', verifyTime: '2026-06-18 10:08:17', deviceInfo: '三星 Galaxy S24 / Android 14' },
  { verifyId: 'VRF20260618008', certType: '残疾证电子副本', verifyMethod: 'NFC', verifyResult: '成功', verifyTime: '2026-06-18 10:05:52', deviceInfo: '小米 13 / Android 13' },
  { verifyId: 'VRF20260618009', certType: '身份证电子副本', verifyMethod: '人脸', verifyResult: '成功', verifyTime: '2026-06-18 10:02:30', deviceInfo: 'iPhone 14 / iOS 17' },
  { verifyId: 'VRF20260618010', certType: '个税完税证明', verifyMethod: '人脸', verifyResult: '成功', verifyTime: '2026-06-18 09:58:15', deviceInfo: '华为 Mate 50 / Android 13' },
  { verifyId: 'VRF20260618011', certType: '医保电子凭证', verifyMethod: '二维码', verifyResult: '失败', verifyTime: '2026-06-18 09:55:08', deviceInfo: '荣耀 Magic6 / Android 14' },
  { verifyId: 'VRF20260618012', certType: '学历证明', verifyMethod: '二维码', verifyResult: '成功', verifyTime: '2026-06-18 09:50:42', deviceInfo: '一加 12 / Android 14' },
  { verifyId: 'VRF20260618013', certType: '社保卡电子副本', verifyMethod: 'NFC', verifyResult: '成功', verifyTime: '2026-06-18 09:45:30', deviceInfo: 'iPhone 15 / iOS 18' },
  { verifyId: 'VRF20260618014', certType: '出生医学证明', verifyMethod: '二维码', verifyResult: '成功', verifyTime: '2026-06-18 09:42:18', deviceInfo: '小米 14 Ultra / Android 14' },
  { verifyId: 'VRF20260618015', certType: '驾驶证电子副本', verifyMethod: '二维码', verifyResult: '成功', verifyTime: '2026-06-18 09:38:55', deviceInfo: '华为 Nova 12 / Android 14' }
])

const filteredRecordData = computed(() => {
  let list = [...recordData.value]
  if (recordSearch.value) {
    const kw = recordSearch.value.toLowerCase()
    list = list.filter(r => r.verifyId.toLowerCase().includes(kw))
  }
  if (resultFilter.value) {
    list = list.filter(r => r.verifyResult === resultFilter.value)
  }
  return list
})

const handleCertDetail = (row: CertItem) => {
  ElMessage.info(`查看「${row.certType}」证照详情`)
}

const handleCertSync = (row: CertItem) => {
  ElMessage.success(`正在同步「${row.certType}」证照数据`)
}

const refreshData = () => {
  ElMessage.success('证照监控数据已刷新')
}

const handleExport = () => {
  ElMessage.info('正在导出证照监控报表...')
}

const formatNum = (n: number) => {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
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

.certs-container { padding: 0; }

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

.dept-tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  background: $primary-color; color: #fff; font-size: 11px; font-weight: 500; opacity: 0.9;
}

.pagination-wrapper { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
