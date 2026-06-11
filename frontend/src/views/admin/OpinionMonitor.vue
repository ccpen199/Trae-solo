<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><ChatDotRound /></el-icon> 舆情监测
      </div>
      <el-button type="primary" :loading="crawling" @click="handleCrawl">
        <el-icon><Promotion /></el-icon> 一键抓取
      </el-button>
    </div>

    <div class="warning-stats">
      <div class="warn-card high">
        <div class="warn-icon"><el-icon :size="28"><Warning /></el-icon></div>
        <div class="warn-info">
          <div class="warn-num">{{ summary.high || 0 }}</div>
          <div class="warn-label">高等级预警</div>
        </div>
      </div>
      <div class="warn-card medium">
        <div class="warn-icon"><el-icon :size="28"><Bell /></el-icon></div>
        <div class="warn-info">
          <div class="warn-num">{{ summary.medium || 0 }}</div>
          <div class="warn-label">中等级预警</div>
        </div>
      </div>
      <div class="warn-card low">
        <div class="warn-icon"><el-icon :size="28"><InfoFilled /></el-icon></div>
        <div class="warn-info">
          <div class="warn-num">{{ summary.low || 0 }}</div>
          <div class="warn-label">一般预警</div>
        </div>
      </div>
      <div class="warn-card total">
        <div class="warn-icon"><el-icon :size="28"><DataAnalysis /></el-icon></div>
        <div class="warn-info">
          <div class="warn-num">{{ summary.total || 0 }}</div>
          <div class="warn-label">舆情总数</div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="card chart-card">
        <div class="section-title">舆情平台分布</div>
        <div ref="platformChartRef" class="chart-box"></div>
      </div>
      <div class="card chart-card">
        <div class="section-title">预警等级分布</div>
        <div ref="levelChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="card">
      <div class="filter-row">
        <el-tabs v-model="filterPlatform" @tab-change="loadData" class="filter-tabs">
          <el-tab-pane label="全部平台" name="all" />
          <el-tab-pane label="微博" name="weibo" />
          <el-tab-pane label="微信" name="wechat" />
          <el-tab-pane label="抖音" name="douyin" />
          <el-tab-pane label="知乎" name="zhihu" />
          <el-tab-pane label="小红书" name="xiaohongshu" />
          <el-tab-pane label="今日头条" name="toutiao" />
        </el-tabs>
        <div class="filter-right">
          <el-select v-model="filterLevel" placeholder="预警等级" style="width: 140px;" clearable @change="loadData">
            <el-option label="高等级" value="high" />
            <el-option label="中等级" value="medium" />
            <el-option label="一般" value="low" />
          </el-select>
          <el-select v-model="filterHandled" placeholder="处置状态" style="width: 140px;" clearable @change="loadData">
            <el-option label="已处置" value="1" />
            <el-option label="未处置" value="0" />
          </el-select>
        </div>
      </div>

      <el-table :data="opinions" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="{ row }">
            <span class="platform-tag" :class="platformClass(row.platform)">{{ row.platform }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="summary" label="摘要" min-width="260" show-overflow-tooltip />
        <el-table-column prop="sentiment" label="情感倾向" width="100">
          <template #default="{ row }">
            <span :class="['tag-badge', sentimentClass(row.sentiment)]">{{ row.sentiment || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="warning_level" label="预警等级" width="100">
          <template #default="{ row }">
            <span :class="['tag-badge', levelClass(row.warning_level)]">{{ levelText(row.warning_level) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="published_at" label="发布时间" width="170" />
        <el-table-column label="处置状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.handled" type="success" size="small">已处置</el-tag>
            <el-tag v-else type="warning" size="small">未处置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openHandle(row)">
              <el-icon><EditPen /></el-icon> 处置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && opinions.length === 0" description="暂无舆情数据" />
    </div>

    <el-dialog v-model="showHandle" title="舆情处置" width="560px">
      <div v-if="current">
        <el-descriptions :column="1" border style="margin-bottom: 16px;" size="small">
          <el-descriptions-item label="标题">{{ current.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ current.platform || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预警等级">
            <span :class="['tag-badge', levelClass(current.warning_level)]">{{ levelText(current.warning_level) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="处置备注">
            <el-input v-model="handleForm.comment" type="textarea" :rows="4" placeholder="请填写处置备注、处理方式等信息" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showHandle = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHandle">确认处置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'
import * as echarts from 'echarts'

const router = useRouter()
const loading = ref(false)
const crawling = ref(false)
const submitting = ref(false)
const opinions = ref([])
const summary = ref({ high: 0, medium: 0, low: 0, total: 0 })
const filterPlatform = ref('all')
const filterLevel = ref('')
const filterHandled = ref('')
const showHandle = ref(false)
const current = ref(null)
const handleForm = ref({ comment: '' })

const platformChartRef = ref(null)
const levelChartRef = ref(null)
let platformChart = null
let levelChart = null

function levelText(l) {
  const map = { high: '高', medium: '中', low: '一般' }
  return map[l] || (l || '-')
}
function levelClass(l) {
  const map = { high: 'danger', medium: 'warning', low: 'info' }
  return map[l] || 'gray'
}
function sentimentClass(s) {
  if (s === '正面') return 'success'
  if (s === '负面') return 'danger'
  if (s === '中性') return 'info'
  return 'gray'
}
function platformClass(p) {
  const map = {
    '微博': 'weibo', '微信': 'wechat', '抖音': 'douyin',
    '知乎': 'zhihu', '小红书': 'xiaohongshu', '今日头条': 'toutiao'
  }
  return map[p] || ''
}

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterPlatform.value !== 'all') params.platform = filterPlatform.value
    if (filterLevel.value) params.level = filterLevel.value
    if (filterHandled.value !== '') params.handled = filterHandled.value
    const [listRes, summaryRes] = await Promise.all([
      api.get('/admin/public-opinions', { params }),
      api.get('/admin/public-opinions/summary')
    ])
    opinions.value = listRes.data.data || []
    const s = summaryRes.data.data || {}
    summary.value = {
      high: s.high || 0,
      medium: s.medium || 0,
      low: s.low || 0,
      total: s.total || opinions.value.length
    }
    initPlatformChart(s.platformData)
    initLevelChart({ high: summary.value.high, medium: summary.value.medium, low: summary.value.low })
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleCrawl() {
  crawling.value = true
  try {
    await api.post('/admin/public-opinions/crawl')
    ElMessage.success('舆情抓取任务已启动')
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '抓取失败')
  } finally {
    crawling.value = false
  }
}

function openHandle(row) {
  current.value = row
  handleForm.value = { comment: row.handle_comment || '' }
  showHandle.value = true
}

async function submitHandle() {
  if (!current.value) return
  submitting.value = true
  try {
    await api.post(`/admin/public-opinions/handle/${current.value.id}`, {
      comment: handleForm.value.comment
    })
    ElMessage.success('处置完成')
    showHandle.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '处置失败')
  } finally {
    submitting.value = false
  }
}

function initPlatformChart(platformData) {
  if (!platformChartRef.value) return
  platformChart = echarts.init(platformChartRef.value)
  const data = platformData && platformData.length ? platformData : [
    { value: 120, name: '微博' },
    { value: 80, name: '微信' },
    { value: 60, name: '抖音' },
    { value: 45, name: '知乎' },
    { value: 35, name: '小红书' },
    { value: 50, name: '今日头条' }
  ]
  platformChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
    color: ['#ef4444', '#22c55e', '#111827', '#3b82f6', '#ec4899', '#f97316'],
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '42%'],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data
    }]
  })
}

function initLevelChart(levelData) {
  if (!levelChartRef.value) return
  levelChart = echarts.init(levelChartRef.value)
  levelChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['高等级', '中等级', '一般'], axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280', fontSize: 12 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280', fontSize: 12 } },
    series: [{
      type: 'bar',
      data: [
        { value: levelData.high || 0, itemStyle: { color: '#ef4444', borderRadius: [6, 6, 0, 0] } },
        { value: levelData.medium || 0, itemStyle: { color: '#f59e0b', borderRadius: [6, 6, 0, 0] } },
        { value: levelData.low || 0, itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] } }
      ],
      barWidth: '45%',
      label: { show: true, position: 'top', fontSize: 12, color: '#1f2937', fontWeight: 600 }
    }]
  })
}

function handleResize() {
  platformChart?.resize()
  levelChart?.resize()
}

function goBack() {
  router.push('/admin')
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  platformChart?.dispose()
  levelChart?.dispose()
})
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
.warning-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.warn-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.warn-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.warn-card.high .warn-icon { background: linear-gradient(135deg, #dc2626, #ef4444); }
.warn-card.medium .warn-icon { background: linear-gradient(135deg, #d97706, #f59e0b); }
.warn-card.low .warn-icon { background: linear-gradient(135deg, #2563eb, #3b82f6); }
.warn-card.total .warn-icon { background: linear-gradient(135deg, #059669, #10b981); }
.warn-num {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}
.warn-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card {
  margin-bottom: 0;
}
.chart-box {
  width: 100%;
  height: 280px;
}
.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-tabs {
  margin-bottom: 0 !important;
}
.filter-right {
  display: flex;
  gap: 12px;
  align-items: center;
}
.platform-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  background: #f3f4f6;
  color: #4b5563;
}
.platform-tag.weibo { background: #fee2e2; color: #dc2626; }
.platform-tag.wechat { background: #dcfce7; color: #16a34a; }
.platform-tag.douyin { background: #f3f4f6; color: #111827; }
.platform-tag.zhihu { background: #dbeafe; color: #2563eb; }
.platform-tag.xiaohongshu { background: #fce7f3; color: #db2777; }
.platform-tag.toutiao { background: #ffedd5; color: #ea580c; }
@media (max-width: 768px) {
  .warning-stats { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
</style>
