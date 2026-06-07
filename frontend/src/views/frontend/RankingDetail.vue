<template>
  <div class="ranking-detail-page">
    <div class="container">
      <el-breadcrumb separator="/" class="breadcrumb-nav">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/rankings' }">榜单中心</el-breadcrumb-item>
        <el-breadcrumb-item>{{ category.name }}</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="card ranking-header-card" v-loading="loading">
        <div class="ranking-header">
          <div class="ranking-info">
            <div class="ranking-icon" :style="{ background: category.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }">
              <el-icon :size="32"><Trophy /></el-icon>
            </div>
            <div>
              <h1 class="ranking-title">{{ category.name }}</h1>
              <p class="ranking-desc">{{ category.description || '专业维度评分，权威排名' }}</p>
              <div class="ranking-meta">
                <span><el-icon><Trophy /></el-icon>共 {{ rankings.length }} 个品牌</span>
                <span><el-icon><Clock /></el-icon>更新于 {{ formatDateTime(category.updatedAt) }}</span>
                <span><el-icon><View /></el-icon>{{ category.viewCount || 0 }} 次浏览</span>
              </div>
            </div>
          </div>
          <div class="ranking-actions">
            <el-button type="primary" @click="generateReport" :loading="generating">
              <el-icon><Document /></el-icon>生成报告
            </el-button>
            <el-button @click="goCompare">
              <el-icon><DataAnalysis /></el-icon>品牌对比
            </el-button>
          </div>
        </div>
      </div>

      <el-row :gutter="20">
        <el-col :lg="14">
          <div class="card">
            <h3 class="section-title">
              <el-icon color="#409eff"><Trophy /></el-icon>
              TOP{{ rankings.length }} 品牌排名
            </h3>
            <div class="ranking-list" v-loading="loading">
              <div
                class="ranking-item"
                v-for="(item, index) in rankings"
                :key="item.brandId || item.id"
                @click="goBrandDetail(item.brandId || item.id)"
              >
                <span :class="['rank-badge', index < 3 ? `rank-badge-${index + 1}` : 'rank-badge-other']">{{ index + 1 }}</span>
                <img :src="item.logo" :alt="item.name" class="brand-logo" @error="handleLogoError" />
                <div class="brand-info">
                  <h4 class="brand-name">{{ item.name }}</h4>
                  <span :class="['badge-level', `badge-level-${item.level}`]">{{ item.level }}级</span>
                  <span class="brand-industry">{{ item.industry }}</span>
                </div>
                <div class="score-info">
                  <div class="score-value">{{ item.score?.toFixed(1) || '0.0' }}</div>
                  <div class="score-label">综合得分</div>
                </div>
                <el-button type="primary" text size="small">
                  详情 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-if="!loading && rankings.length === 0" description="暂无排名数据" />
          </div>
        </el-col>

        <el-col :lg="10">
          <div class="card">
            <h3 class="section-title">
              <el-icon color="#67c23a"><DataAnalysis /></el-icon>
              TOP3 雷达图对比
            </h3>
            <div ref="radarChartRef" class="chart-container"></div>
            <div class="dimension-legend">
              <div class="legend-item" v-for="dim in dimensions" :key="dim.key">
                <span class="legend-dot" :style="{ background: dim.color }"></span>
                <span class="legend-label">{{ dim.name }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">
              <el-icon color="#e6a23c"><DataLine /></el-icon>
              各维度分数
            </h3>
            <el-table :data="rankings.slice(0, 10)" size="small" v-loading="loading" class="dimension-table">
              <el-table-column prop="name" label="品牌" min-width="100">
                <template #default="{ row }">
                  <span class="table-brand-name">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column
                v-for="dim in dimensions"
                :key="dim.key"
                :prop="dim.key"
                :label="dim.name"
                min-width="80"
                align="center"
              >
                <template #default="{ row }">
                  <span class="dim-score">{{ row[dim.key]?.toFixed(1) || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="card">
            <h3 class="section-title">
              <el-icon color="#f56c6c"><InfoFilled /></el-icon>
              评选规则说明
            </h3>
            <div class="rules-content">
              <p><strong>1. 数据来源：</strong>品牌官方信息、工商公开数据、主流电商平台、社交媒体舆情等。</p>
              <p><strong>2. 评价维度：</strong>品牌实力、产品质量、创新能力、社会责任、发展潜力五大维度。</p>
              <p><strong>3. 计算方法：</strong>采用层次分析法(AHP)确定各维度权重，加权计算得出综合得分。</p>
              <p><strong>4. 更新频率：</strong>每月自动更新一次，重大事件实时调整。</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showReportDialog" title="生成榜单报告" width="500px">
      <el-form label-width="100px">
        <el-form-item label="报告类型">
          <el-radio-group v-model="reportForm.type">
            <el-radio value="summary">摘要版</el-radio>
            <el-radio value="full">完整版</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含内容">
          <el-checkbox-group v-model="reportForm.includes">
            <el-checkbox label="ranking">TOP10排名</el-checkbox>
            <el-checkbox label="analysis">维度分析</el-checkbox>
            <el-checkbox label="trend">趋势预测</el-checkbox>
            <el-checkbox label="comparison">对比分析</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="联系方式" v-if="reportForm.type === 'full'">
          <el-input v-model="reportForm.email" placeholder="请输入邮箱，用于接收完整版报告" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :loading="submitting">生成报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Trophy, Clock, View, Document, DataAnalysis, ArrowRight,
  DataLine, InfoFilled
} from '@element-plus/icons-vue'
import { rankingAPI } from '@/utils/api'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const categoryId = route.params.categoryId

const loading = ref(false)
const generating = ref(false)
const submitting = ref(false)
const showReportDialog = ref(false)
const radarChartRef = ref(null)
let radarChart = null

const category = ref({})
const rankings = ref([])

const dimensions = [
  { key: 'powerScore', name: '品牌实力', color: '#667eea' },
  { key: 'qualityScore', name: '产品质量', color: '#67c23a' },
  { key: 'innovationScore', name: '创新能力', color: '#e6a23c' },
  { key: 'responsibilityScore', name: '社会责任', color: '#f56c6c' },
  { key: 'potentialScore', name: '发展潜力', color: '#909399' }
]

const reportForm = reactive({
  type: 'summary',
  includes: ['ranking', 'analysis'],
  email: ''
})

async function loadCategory() {
  try {
    const res = await rankingAPI.getCategories({ id: categoryId })
    const list = res.data?.data || []
    category.value = list.find(c => c.id == categoryId) || list[0] || {}
  } catch (e) {
    console.error(e)
  }
}

async function loadRankings() {
  loading.value = true
  try {
    const res = await rankingAPI.getRankings(categoryId, { pageSize: 50 })
    rankings.value = res.data?.data || []
    if (rankings.value.length > 0) {
      nextTick(() => {
        initRadarChart()
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function initRadarChart() {
  if (!radarChartRef.value) return
  
  if (radarChart) {
    radarChart.dispose()
  }
  
  radarChart = echarts.init(radarChartRef.value)
  
  const top3 = rankings.value.slice(0, 3)
  const colors = ['#667eea', '#67c23a', '#e6a23c']
  
  const indicator = dimensions.map(dim => ({
    name: dim.name,
    max: 100
  }))
  
  const seriesData = top3.map((item, idx) => ({
    name: item.name,
    value: dimensions.map(dim => item[dim.key] || 0),
    itemStyle: { color: colors[idx] },
    areaStyle: { opacity: 0.1 }
  }))
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: top3.map(item => item.name),
      bottom: 0
    },
    radar: {
      indicator,
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#606266',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#fafafa', '#f5f7fa']
        }
      }
    },
    series: [{
      type: 'radar',
      data: seriesData
    }]
  }
  
  radarChart.setOption(option)
  
  window.addEventListener('resize', () => {
    radarChart?.resize()
  })
}

function generateReport() {
  showReportDialog.value = true
}

async function submitReport() {
  if (reportForm.type === 'full' && !reportForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  submitting.value = true
  try {
    const res = await rankingAPI.generateReport(categoryId, reportForm)
    ElMessage.success(res.data?.message || '报告生成成功')
    showReportDialog.value = false
    if (res.data?.downloadUrl) {
      window.open(res.data.downloadUrl, '_blank')
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function goCompare() {
  const brandIds = rankings.slice(0, 3).map(r => r.brandId || r.id).join(',')
  router.push({ path: '/rankings/compare', query: { brandIds } })
}

function goBrandDetail(id) {
  router.push(`/brands/${id}`)
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

onMounted(() => {
  loadCategory()
  loadRankings()
})
</script>

<style scoped>
.ranking-detail-page {
  padding-bottom: 40px;
}

.ranking-header-card {
  margin-bottom: 24px;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.ranking-info {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex: 1;
}

.ranking-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.ranking-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2f3d;
  margin: 0 0 6px;
}

.ranking-desc {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px;
}

.ranking-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 13px;
}

.ranking-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ranking-actions {
  display: flex;
  gap: 12px;
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

.ranking-list {
  max-height: 600px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  margin-bottom: 8px;
}

.ranking-item:hover {
  background: #f5f7fa;
}

.brand-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.brand-name {
  font-size: 15px;
  font-weight: 500;
  color: #1f2f3d;
  margin: 0;
}

.brand-industry {
  font-size: 12px;
  color: #909399;
}

.score-info {
  text-align: center;
  margin-right: 12px;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.dimension-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-label {
  font-size: 13px;
  color: #606266;
}

.dimension-table {
  margin-top: 8px;
}

.dim-score {
  font-weight: 500;
  color: #1f2f3d;
}

.table-brand-name {
  font-weight: 500;
  color: #1f2f3d;
}

.rules-content p {
  color: #606266;
  line-height: 1.8;
  margin: 0 0 8px;
}

.rules-content strong {
  color: #1f2f3d;
}

@media (max-width: 768px) {
  .ranking-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .ranking-info {
    flex-direction: column;
  }
  
  .ranking-item {
    flex-wrap: wrap;
  }
  
  .score-info {
    order: -1;
    width: 100%;
    text-align: left;
    margin-bottom: 8px;
  }
  
  .dimension-table {
    overflow-x: auto;
  }
}
</style>
