<template>
  <div class="brand-compare-page">
    <div class="container">
      <div class="page-header">
        <h1>品牌对比</h1>
        <p>多维度数据对比，直观分析品牌差异</p>
      </div>

      <el-tabs v-model="activeMainTab" class="main-tabs">
        <el-tab-pane label="新建对比" name="new">
          <div class="card brand-selector" v-loading="brandsLoading">
            <h3 class="section-title">
              <el-icon color="#409eff"><Plus /></el-icon>
              选择对比品牌（最多5个）
            </h3>
            <div class="selector-content">
              <el-select
                v-model="searchBrandKeyword"
                filterable
                remote
                placeholder="搜索品牌名称..."
                style="width: 300px; margin-right: 12px"
                :remote-method="searchBrands"
                :loading="searching"
                @change="addBrand"
              >
                <el-option
                  v-for="brand in searchedBrands"
                  :key="brand.id"
                  :label="brand.name"
                  :value="brand.id"
                >
                  <div class="brand-option">
                    <img :src="brand.logo" class="option-logo" @error="handleLogoError" />
                    <span>{{ brand.name }}</span>
                    <el-tag size="small" :type="getLevelTagType(brand.level)">{{ brand.level }}级</el-tag>
                  </div>
                </el-option>
              </el-select>
              <el-button @click="clearAll" :disabled="compareBrands.length === 0">
                清空全部
              </el-button>
              <el-button type="primary" @click="saveComparison" :disabled="compareBrands.length < 2" :loading="saving">
                <el-icon><Document /></el-icon>
                保存对比
              </el-button>
            </div>
            <div class="selected-brands" v-if="compareBrands.length > 0">
              <div
                v-for="brand in compareBrands"
                :key="brand.id"
                class="selected-brand-card"
              >
                <img :src="brand.logo" :alt="brand.name" class="brand-logo" @error="handleLogoError" />
                <div class="brand-info">
                  <h4 class="brand-name">{{ brand.name }}</h4>
                  <span :class="['badge-level', `badge-level-${brand.level}`]">{{ brand.level }}级</span>
                </div>
                <el-button type="danger" text @click="removeBrand(brand.id)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="empty-select" v-else>
              <el-empty description="请选择要对比的品牌，最多可选择5个" :image-size="80">
                <template #description>
                  <div class="empty-guide">
                    <p>💡 从上方搜索框选择品牌，至少选择2个品牌开始对比</p>
                    <p>🔍 支持按品牌名称模糊搜索</p>
                    <p>📊 可对比品牌实力、产品质量、创新能力等5个维度</p>
                  </div>
                </template>
              </el-empty>
            </div>
          </div>

          <div class="quick-compare" v-if="compareBrands.length === 0">
            <h3 class="section-title">
              <el-icon color="#67c23a"><DataLine /></el-icon>
              快速对比（从历史记录选择）
            </h3>
            <div class="quick-compare-list" v-if="historyList.length > 0" v-loading="historyLoading">
              <div
                v-for="item in historyList.slice(0, 4)"
                :key="item.id"
                class="quick-compare-card"
                @click="loadComparison(item)"
              >
                <div class="quick-compare-header">
                  <span class="quick-compare-category">{{ item.category_name || '综合对比' }}</span>
                  <span class="quick-compare-time">{{ formatTime(item.created_at) }}</span>
                </div>
                <div class="quick-compare-brands">
                  <span v-for="(brandName, idx) in getBrandNames(item.brand_ids)" :key="idx" class="quick-brand-tag">
                    {{ brandName }}
                  </span>
                </div>
                <div class="quick-compare-action">
                  <span>点击加载对比 →</span>
                </div>
              </div>
            </div>
            <div class="empty-history" v-else-if="!historyLoading">
              <el-empty description="暂无历史对比记录" :image-size="60">
                <template #description>
                  <p>开始您的第一次品牌对比吧！</p>
                </template>
              </el-empty>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="对比历史" name="history">
          <div class="card">
            <h3 class="section-title">
              <el-icon color="#e6a23c"><Document /></el-icon>
              历史对比记录
            </h3>
            <div class="history-list" v-loading="historyLoading">
              <div
                v-for="item in historyList"
                :key="item.id"
                class="history-item"
              >
                <div class="history-header">
                  <div class="history-title">
                    <el-tag size="small" type="info">{{ item.category_name || '综合对比' }}</el-tag>
                    <span class="history-time">{{ formatTime(item.created_at) }}</span>
                  </div>
                  <div class="history-actions">
                    <el-button size="small" type="primary" @click="loadComparison(item)">
                      查看详情
                    </el-button>
                  </div>
                </div>
                <div class="history-brands">
                  <span>对比品牌：</span>
                  <el-tag
                    v-for="(brandName, idx) in getBrandNames(item.brand_ids)"
                    :key="idx"
                    size="small"
                    class="history-brand-tag"
                  >
                    {{ brandName }}
                  </el-tag>
                </div>
              </div>
              <div class="empty-history" v-if="historyList.length === 0 && !historyLoading">
                <el-empty description="暂无历史对比记录" :image-size="100">
                  <template #description>
                    <div class="empty-guide">
                      <p>📝 您的品牌对比记录会保存在这里</p>
                      <p>🔄 随时可以重新查看和分析历史对比结果</p>
                      <p>切换到「新建对比」标签开始第一次对比吧！</p>
                    </div>
                  </template>
                </el-empty>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template v-if="compareBrands.length >= 2">
        <el-tabs v-model="activeTab" class="compare-tabs">
          <el-tab-pane label="数据对比" name="table">
            <div class="card">
              <h3 class="section-title">
                <el-icon color="#67c23a"><Grid /></el-icon>
                详细数据对比
              </h3>
              <div class="table-container" v-loading="loading">
                <el-table :data="comparisonRows" class="comparison-table" border stripe>
                  <el-table-column prop="label" label="对比项" min-width="140" fixed="left">
                    <template #default="{ row }">
                      <strong>{{ row.label }}</strong>
                    </template>
                  </el-table-column>
                  <el-table-column
                    v-for="brand in compareBrands"
                    :key="brand.id"
                    :label="brand.name"
                    min-width="160"
                    align="center"
                    :class-name="{ 'highlight-row': isHighest(row, brand.id) }"
                  >
                    <template #default="{ row }">
                      <span v-if="row.isScore && row.values[brand.id]" :class="getScoreClass(row, brand.id)">
                        {{ row.values[brand.id] }}
                      </span>
                      <span v-else-if="row.values[brand.id] !== undefined && row.values[brand.id] !== null">
                        {{ row.values[brand.id] }}
                      </span>
                      <span v-else class="no-data">-</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="图表对比" name="chart">
            <div class="card">
              <h3 class="section-title">
                <el-icon color="#e6a23c"><DataAnalysis /></el-icon>
                雷达图对比
              </h3>
              <div ref="radarChartRef" class="chart-container-large"></div>
            </div>
            <el-row :gutter="20">
              <el-col :sm="12">
                <div class="card">
                  <h3 class="section-title">
                    <el-icon color="#f56c6c"><DataLine /></el-icon>
                    综合得分柱状图
                  </h3>
                  <div ref="barChartRef" class="chart-container"></div>
                </div>
              </el-col>
              <el-col :sm="12">
                <div class="card">
                  <h3 class="section-title">
                    <el-icon color="#909399"><PieChart /></el-icon>
                    维度占比分析
                  </h3>
                  <div ref="pieChartRef" class="chart-container"></div>
                </div>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>

        <div class="card" v-if="compareBrands.length > 0">
          <h3 class="section-title">
            <el-icon color="#667eea"><Document /></el-icon>
            对比总结
          </h3>
          <div class="summary-content" v-loading="loading">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="品牌数量">
                {{ compareBrands.length }} 个品牌
              </el-descriptions-item>
              <el-descriptions-item label="综合得分最高">
                <span class="highlight">{{ summary.highestScore?.name || '-' }}</span>
                <el-tag type="success">{{ summary.highestScore?.score || '-' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="品牌实力最强">
                <span class="highlight">{{ summary.bestPower?.name || '-' }}</span>
                <el-tag type="primary">{{ summary.bestPower?.score || '-' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="产品质量最佳">
                <span class="highlight">{{ summary.bestQuality?.name || '-' }}</span>
                <el-tag type="success">{{ summary.bestQuality?.score || '-' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创新能力最强">
                <span class="highlight">{{ summary.bestInnovation?.name || '-' }}</span>
                <el-tag type="warning">{{ summary.bestInnovation?.score || '-' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="发展潜力最大">
                <span class="highlight">{{ summary.bestPotential?.name || '-' }}</span>
                <el-tag type="info">{{ summary.bestPotential?.score || '-' }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </template>

      <div class="empty-state" v-else>
        <el-empty description="请至少选择2个品牌进行对比" :image-size="120" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Close, Grid, DataAnalysis, DataLine, PieChart, Document
} from '@element-plus/icons-vue'
import { brandAPI, rankingAPI } from '@/utils/api'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const route = useRoute()

const loading = ref(false)
const brandsLoading = ref(false)
const searching = ref(false)
const saving = ref(false)
const historyLoading = ref(false)

const searchBrandKeyword = ref('')
const searchedBrands = ref([])
const compareBrands = ref([])
const historyList = ref([])
const activeTab = ref('table')
const activeMainTab = ref('new')

const allBrandsCache = ref({})

const radarChartRef = ref(null)
const barChartRef = ref(null)
const pieChartRef = ref(null)

let radarChart = null
let barChart = null
let pieChart = null

const dimensions = [
  { key: 'powerScore', name: '品牌实力' },
  { key: 'qualityScore', name: '产品质量' },
  { key: 'innovationScore', name: '创新能力' },
  { key: 'responsibilityScore', name: '社会责任' },
  { key: 'potentialScore', name: '发展潜力' }
]

const chartColors = ['#667eea', '#67c23a', '#e6a23c', '#f56c6c', '#909399']

const comparisonRows = computed(() => {
  const rows = [
    { label: '品牌等级', isScore: false, values: {} },
    { label: '所属行业', isScore: false, values: {} },
    { label: '所在地区', isScore: false, values: {} },
    { label: '创立年份', isScore: false, values: {} },
    { label: '综合评分', isScore: true, values: {}, key: 'score' },
    { label: '品牌实力', isScore: true, values: {}, key: 'powerScore' },
    { label: '产品质量', isScore: true, values: {}, key: 'qualityScore' },
    { label: '创新能力', isScore: true, values: {}, key: 'innovationScore' },
    { label: '社会责任', isScore: true, values: {}, key: 'responsibilityScore' },
    { label: '发展潜力', isScore: true, values: {}, key: 'potentialScore' },
    { label: '行业排名', isScore: false, values: {}, isRank: true },
    { label: '全国排名', isScore: false, values: {}, isRank: true },
    { label: '粉丝总数', isScore: false, values: {} },
    { label: '好评率', isScore: false, values: {} },
    { label: '正面评价占比', isScore: true, values: {}, key: 'positiveRate' }
  ]

  compareBrands.value.forEach(brand => {
    rows[0].values[brand.id] = brand.level ? brand.level + '级' : '-'
    rows[1].values[brand.id] = brand.industry || '-'
    rows[2].values[brand.id] = [brand.country, brand.city].filter(Boolean).join(' · ') || '-'
    rows[3].values[brand.id] = brand.foundedYear || '-'
    rows[4].values[brand.id] = brand.score?.toFixed(1) || '-'
    rows[5].values[brand.id] = brand.powerScore?.toFixed(1) || '-'
    rows[6].values[brand.id] = brand.qualityScore?.toFixed(1) || '-'
    rows[7].values[brand.id] = brand.innovationScore?.toFixed(1) || '-'
    rows[8].values[brand.id] = brand.responsibilityScore?.toFixed(1) || '-'
    rows[9].values[brand.id] = brand.potentialScore?.toFixed(1) || '-'
    rows[10].values[brand.id] = brand.industryRank ? '#' + brand.industryRank : '-'
    rows[11].values[brand.id] = brand.countryRank ? '#' + brand.countryRank : '-'
    rows[12].values[brand.id] = brand.totalFollowers?.toLocaleString() || '-'
    rows[13].values[brand.id] = brand.goodRate ? brand.goodRate + '%' : '-'
    rows[14].values[brand.id] = brand.sentiment?.positive ? brand.sentiment.positive + '%' : '-'
  })

  return rows
})

const summary = computed(() => {
  const brands = compareBrands.value
  if (brands.length === 0) return {}

  const getBest = (key) => {
    let best = null
    brands.forEach(b => {
      const val = b[key] || 0
      if (!best || val > (best[key] || 0)) {
        best = { ...b, score: val?.toFixed(1) }
      }
    })
    return best
  }

  return {
    highestScore: getBest('score'),
    bestPower: getBest('powerScore'),
    bestQuality: getBest('qualityScore'),
    bestInnovation: getBest('innovationScore'),
    bestPotential: getBest('potentialScore')
  }
})

function isHighest(row, brandId) {
  if (!row.isScore || !row.values[brandId]) return false
  const values = Object.entries(row.values)
    .filter(([, v]) => v && v !== '-')
    .map(([id, v]) => ({ id, value: parseFloat(v) }))
  if (values.length < 2) return false
  const max = Math.max(...values.map(v => v.value))
  return parseFloat(row.values[brandId]) === max
}

function getScoreClass(row, brandId) {
  return isHighest(row, brandId) ? 'highest-score' : ''
}

function getLevelTagType(level) {
  const types = { S: 'warning', A: 'success', B: 'primary', C: 'info' }
  return types[level] || 'info'
}

async function searchBrands(keyword) {
  if (!keyword) {
    searchedBrands.value = []
    return
  }
  searching.value = true
  try {
    const res = await brandAPI.getList({ keyword, pageSize: 10 })
    searchedBrands.value = res.data?.data || []
  } catch (e) {
    console.error(e)
  } finally {
    searching.value = false
  }
}

async function addBrand(brandId) {
  if (compareBrands.value.length >= 5) {
    ElMessage.warning('最多只能对比5个品牌')
    searchBrandKeyword.value = ''
    return
  }
  if (compareBrands.value.some(b => b.id == brandId)) {
    ElMessage.warning('该品牌已添加')
    searchBrandKeyword.value = ''
    return
  }
  
  loading.value = true
  try {
    const res = await brandAPI.getDetail(brandId)
    compareBrands.value.push(res.data)
    searchBrandKeyword.value = ''
    nextTick(() => {
      initCharts()
    })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function removeBrand(brandId) {
  compareBrands.value = compareBrands.value.filter(b => b.id != brandId)
  nextTick(() => {
    initCharts()
  })
}

function clearAll() {
  compareBrands.value = []
  searchBrandKeyword.value = ''
}

function initCharts() {
  if (compareBrands.value.length < 2) return

  initRadarChart()
  initBarChart()
  initPieChart()
}

function initRadarChart() {
  if (!radarChartRef.value) return
  if (radarChart) radarChart.dispose()
  
  radarChart = echarts.init(radarChartRef.value)
  
  const indicator = dimensions.map(dim => ({
    name: dim.name,
    max: 100
  }))
  
  const seriesData = compareBrands.value.map((brand, idx) => ({
    name: brand.name,
    value: dimensions.map(dim => brand[dim.key] || 0),
    itemStyle: { color: chartColors[idx] },
    areaStyle: { opacity: 0.15 }
  }))
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: {
      data: compareBrands.value.map(b => b.name),
      bottom: 0
    },
    radar: {
      indicator,
      shape: 'polygon',
      splitNumber: 5,
      axisName: { color: '#606266', fontSize: 13 },
      splitLine: { lineStyle: { color: '#dcdfe6' } },
      splitArea: {
        show: true,
        areaStyle: { color: ['#fafafa', '#f5f7fa'] }
      }
    },
    series: [{ type: 'radar', data: seriesData }]
  }
  
  radarChart.setOption(option)
}

function initBarChart() {
  if (!barChartRef.value) return
  if (barChart) barChart.dispose()
  
  barChart = echarts.init(barChartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: compareBrands.value.map(b => b.name),
      axisLabel: { interval: 0, rotate: 0 }
    },
    yAxis: { type: 'value', max: 100 },
    series: [{
      type: 'bar',
      data: compareBrands.value.map((b, idx) => ({
        value: b.score || 0,
        itemStyle: { color: chartColors[idx] }
      })),
      barWidth: '40%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}'
      }
    }]
  }
  
  barChart.setOption(option)
}

function initPieChart() {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  
  pieChart = echarts.init(pieChartRef.value)
  
  const firstBrand = compareBrands.value[0]
  
  const data = dimensions.map((dim, idx) => ({
    name: dim.name,
    value: firstBrand[dim.key] || 0,
    itemStyle: { color: chartColors[idx] }
  })).filter(d => d.value > 0)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}分 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data
    }],
    title: {
      text: `${firstBrand.name} 维度分布`,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, color: '#606266' }
    }
  }
  
  pieChart.setOption(option)
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

function formatTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function getBrandNames(brandIds) {
  if (!brandIds || !Array.isArray(brandIds)) return []
  return brandIds.map(id => {
    const brand = compareBrands.value.find(b => b.id == id) || allBrandsCache.value[id]
    return brand?.name || `品牌${id}`
  })
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await rankingAPI.getCompareHistory({ limit: 20 })
    historyList.value = res.data?.data || []
    
    historyList.value.forEach(item => {
      if (item.comparison_data && Array.isArray(item.comparison_data)) {
        item.comparison_data.forEach(b => {
          allBrandsCache.value[b.id] = b
        })
      }
    })
  } catch (e) {
    console.error('Failed to load history:', e)
  } finally {
    historyLoading.value = false
  }
}

async function saveComparison() {
  if (compareBrands.value.length < 2) {
    ElMessage.warning('请至少选择2个品牌')
    return
  }
  
  saving.value = true
  try {
    const brandIds = compareBrands.value.map(b => b.id)
    await rankingAPI.compare({
      brand_ids: brandIds,
      save: true
    })
    ElMessage.success('对比记录已保存')
    await loadHistory()
  } catch (e) {
    console.error('Failed to save comparison:', e)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function loadComparison(item) {
  if (!item.brand_ids || item.brand_ids.length < 2) {
    ElMessage.warning('对比数据不完整')
    return
  }
  
  brandsLoading.value = true
  compareBrands.value = []
  
  try {
    for (const id of item.brand_ids.slice(0, 5)) {
      const cached = allBrandsCache.value[id]
      if (cached) {
        compareBrands.value.push(cached)
      } else {
        const res = await brandAPI.getDetail(id)
        compareBrands.value.push(res.data)
      }
    }
    
    activeMainTab.value = 'new'
    
    nextTick(() => {
      initCharts()
    })
    
    ElMessage.success('已加载对比数据')
  } catch (e) {
    console.error('Failed to load comparison:', e)
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    brandsLoading.value = false
  }
}

async function loadInitialBrands() {
  const brandIds = route.query.brandIds?.split(',').filter(Boolean) || []
  if (brandIds.length > 0) {
    brandsLoading.value = true
    try {
      for (const id of brandIds.slice(0, 5)) {
        const res = await brandAPI.getDetail(id)
        compareBrands.value.push(res.data)
      }
      nextTick(() => {
        initCharts()
      })
    } catch (e) {
      console.error(e)
    } finally {
      brandsLoading.value = false
    }
  }
}

watch(compareBrands, () => {
  nextTick(() => {
    initCharts()
  })
}, { deep: true })

onMounted(() => {
  loadInitialBrands()
  loadHistory()
  
  window.addEventListener('resize', () => {
    radarChart?.resize()
    barChart?.resize()
    pieChart?.resize()
  })
})
</script>

<style scoped>
.brand-compare-page {
  padding-bottom: 40px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 20px;
}

.brand-selector {
  margin-bottom: 24px;
}

.selector-content {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.selected-brands {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.selected-brand-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  min-width: 220px;
}

.selected-brand-card .brand-logo {
  width: 48px;
  height: 48px;
}

.brand-info {
  flex: 1;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 4px;
}

.brand-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

.empty-select {
  padding: 20px 0;
}

.compare-tabs {
  margin-bottom: 24px;
}

.table-container {
  overflow-x: auto;
}

.comparison-table {
  min-width: 800px;
}

.comparison-table :deep(.el-table th) {
  background: #f5f7fa;
  font-weight: 600;
  text-align: center;
}

.comparison-table :deep(.highlight-row) {
  background: #f0f9ff !important;
}

.highest-score {
  color: #409eff;
  font-weight: 700;
}

.no-data {
  color: #c0c4cc;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.summary-content {
  margin-top: 16px;
}

.highlight {
  font-weight: 600;
  color: #1f2f3d;
  margin-right: 12px;
}

@media (max-width: 768px) {
  .selector-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .selector-content .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .selected-brands {
    flex-direction: column;
  }
  
  .selected-brand-card {
    min-width: auto;
    width: 100%;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .chart-container-large {
    height: 300px;
  }
}

.main-tabs {
  margin-bottom: 24px;
}

.quick-compare {
  margin-bottom: 24px;
}

.quick-compare-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.quick-compare-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-compare-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.quick-compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quick-compare-category {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.quick-compare-time {
  color: #909399;
  font-size: 12px;
}

.quick-compare-brands {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.quick-brand-tag {
  background: #f5f7fa;
  color: #606266;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.quick-compare-action {
  text-align: right;
  color: #409eff;
  font-size: 13px;
  font-weight: 500;
}

.history-list {
  min-height: 200px;
}

.history-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;
  transition: all 0.3s ease;
}

.history-item:hover {
  border-color: #dcdfe6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-time {
  color: #909399;
  font-size: 13px;
}

.history-brands {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.history-brand-tag {
  margin-right: 4px;
}

.empty-guide {
  color: #909399;
  font-size: 14px;
  line-height: 1.8;
}

.empty-guide p {
  margin: 4px 0;
}

.empty-history {
  padding: 40px 0;
}
</style>
