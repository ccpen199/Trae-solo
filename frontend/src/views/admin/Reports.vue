<template>
  <div class="reports-page">
    <div class="page-header">
      <h1>行业研究报告生成器</h1>
      <p>自动提取TOP10特征与竞争格局分析，一键生成行业研究报告</p>
    </div>

    <div class="card">
      <div class="section-header">
        <h3>生成新报告</h3>
      </div>
      <el-form :inline="true" :model="generateForm">
        <el-form-item label="榜单分类">
          <el-select v-model="generateForm.category_id" placeholder="选择榜单分类" style="width:240px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告周期">
          <el-input v-model="generateForm.period" placeholder="如 2024-Q1" style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleGenerate" :loading="generating">
            <el-icon><Document /></el-icon>生成报告
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="currentReport" class="card report-preview">
      <div class="section-header">
        <h3>{{ currentReport.title }}</h3>
      </div>

      <el-row :gutter="20" class="report-section">
        <el-col :span="12">
          <div class="feature-card">
            <h4>TOP10 特征分析</h4>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="平均经营年限">{{ currentReport.top10Features?.avgEstablishedYears }}年</el-descriptions-item>
              <el-descriptions-item label="市场集中度(CR3)">{{ currentReport.top10Features?.marketConcentration }}%</el-descriptions-item>
              <el-descriptions-item label="品牌等级分布">
                <div class="tag-cloud">
                  <el-tag v-for="(count, level) in currentReport.top10Features?.levelDistribution" :key="level" size="small" type="info">{{ level }}级: {{ count }}家</el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="区域分布">
                <div class="tag-cloud">
                  <el-tag v-for="(count, region) in currentReport.top10Features?.regionalDistribution" :key="region" size="small">{{ region }}: {{ count }}家</el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="关键趋势">
                <ul class="trend-list">
                  <li v-for="(trend, i) in currentReport.top10Features?.keyTrends" :key="i">{{ trend }}</li>
                </ul>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="feature-card">
            <h4>竞争格局分析</h4>
            <p class="landscape-text">{{ currentReport.competitionAnalysis?.competitiveLandscape }}</p>
            <el-descriptions :column="1" border size="small" class="competition-desc">
              <el-descriptions-item label="市场领导者">
                <div v-for="l in currentReport.competitionAnalysis?.marketLeaders" :key="l.name" class="leader-item">
                  <strong>{{ l.name }}</strong> - {{ l.advantage }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="行业机遇">
                <ul class="trend-list">
                  <li v-for="(o, i) in currentReport.competitionAnalysis?.opportunities" :key="i">{{ o }}</li>
                </ul>
              </el-descriptions-item>
              <el-descriptions-item label="行业挑战">
                <ul class="trend-list">
                  <li v-for="(t, i) in currentReport.competitionAnalysis?.threats" :key="i">{{ t }}</li>
                </ul>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>
      </el-row>

      <el-divider />
      <div class="report-content">
        <h4>报告全文</h4>
        <div class="markdown-content" v-html="renderMarkdown(currentReport.content)"></div>
      </div>
    </div>

    <div class="card">
      <div class="section-header">
        <h3>历史报告</h3>
      </div>
      <el-table :data="reports" v-loading="reportLoading" stripe>
        <el-table-column prop="title" label="报告标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="period" label="周期" width="120" />
        <el-table-column prop="created_at" label="生成时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewReport(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { rankingAPI } from '@/utils/api'

const generating = ref(false)
const reportLoading = ref(false)
const categories = ref([])
const reports = ref([])
const currentReport = ref(null)

const generateForm = reactive({
  category_id: '',
  period: '2024-Q1'
})

async function loadCategories() {
  try {
    const res = await rankingAPI.getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function loadReports() {
  reportLoading.value = true
  try {
    const res = await rankingAPI.getReports()
    reports.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    reportLoading.value = false
  }
}

async function handleGenerate() {
  if (!generateForm.category_id) {
    ElMessage.warning('请选择榜单分类')
    return
  }
  generating.value = true
  try {
    const res = await rankingAPI.generateReport(generateForm.category_id, { period: generateForm.period })
    currentReport.value = res.data?.report || null
    ElMessage.success('报告生成成功')
    loadReports()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '报告生成失败')
  } finally {
    generating.value = false
  }
}

async function viewReport(row) {
  try {
    const res = await rankingAPI.getReportDetail(row.id)
    currentReport.value = res.data || null
  } catch (e) {
    console.error(e)
  }
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>')
}

onMounted(() => {
  loadCategories()
  loadReports()
})
</script>

<style scoped>
.reports-page { padding-bottom: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #1f2f3d; margin-bottom: 8px; }
.page-header p { color: #606266; font-size: 14px; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 { font-size: 18px; font-weight: 600; color: #1f2f3d; }
.feature-card h4 { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
.trend-list { padding-left: 16px; margin: 0; }
.trend-list li { font-size: 13px; color: #606266; line-height: 1.8; }
.landscape-text { font-size: 14px; color: #303133; line-height: 1.8; margin-bottom: 12px; padding: 12px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid #409eff; }
.leader-item { font-size: 13px; color: #606266; line-height: 1.8; }
.markdown-content { font-size: 14px; line-height: 1.8; color: #303133; }
.markdown-content :deep(h1) { font-size: 22px; margin: 16px 0 8px; }
.markdown-content :deep(h2) { font-size: 18px; margin: 14px 0 6px; }
.markdown-content :deep(h3) { font-size: 16px; margin: 12px 0 4px; }
</style>
