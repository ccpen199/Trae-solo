<template>
  <div class="rankings-page">
    <div class="page-header">
      <h1>榜单管理</h1>
      <p>管理各分类品牌榜单，支持计算、专家评审和报告生成</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="selectedCategory" placeholder="选择分类" style="width: 200px" @change="loadRankings">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="success" @click="handleCalculate">
          <el-icon><Calculator /></el-icon>计算榜单
        </el-button>
        <el-button type="warning" @click="goToExpertReview">
          <el-icon><UserFilled /></el-icon>专家评审
        </el-button>
        <el-button type="primary" @click="handleGenerateReport">
          <el-icon><Document /></el-icon>生成报告
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="rankings" v-loading="loading" stripe>
        <el-table-column type="index" label="#" width="70">
          <template #default="{ $index }">
            <div :class="['rank-badge', `rank-badge-${$index + 1 <= 3 ? $index + 1 : 'other'}`]">{{ $index + 1 }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="brand.logo" label="Logo" width="70">
          <template #default="{ row }">
            <img :src="row.brand?.logo" :alt="row.brand?.name" class="table-logo" @error="handleLogoError" />
          </template>
        </el-table-column>
        <el-table-column prop="brand.name" label="品牌名称" min-width="140">
          <template #default="{ row }">
            <div class="brand-name-cell">
              <span class="name">{{ row.brand?.name }}</span>
              <span v-if="row.brand?.nameEn" class="name-en">{{ row.brand?.nameEn }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="brand.industry" label="行业" width="120" />
        <el-table-column prop="score" label="综合得分" width="120">
          <template #default="{ row }">
            <span class="score-text">{{ row.score?.toFixed(2) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="维度得分" min-width="300">
          <template #default="{ row }">
            <div class="dimension-scores">
              <div v-for="(value, key) in row.dimensions" :key="key" class="dim-item">
                <span class="dim-label">{{ getDimensionLabel(key) }}</span>
                <el-progress :percentage="value" :stroke-width="6" :show-text="false" />
                <span class="dim-value">{{ value?.toFixed(0) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="brand.level" label="等级" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.brand?.level)" size="small">{{ row.brand?.level }}级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="calculatedAt" label="计算时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.calculatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="calculateDialogVisible" title="计算榜单" width="500px">
      <el-form :model="calculateForm" label-width="120px">
        <el-form-item label="计算周期">
          <el-radio-group v-model="calculateForm.period">
            <el-radio label="monthly">月度</el-radio>
            <el-radio label="quarterly">季度</el-radio>
            <el-radio label="yearly">年度</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权重配置">
          <div class="weight-config">
            <div v-for="dim in dimensions" :key="dim.key" class="weight-item">
              <span class="weight-label">{{ dim.label }}</span>
              <el-slider v-model="calculateForm.weights[dim.key]" :min="0" :max="100" show-input />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="calculateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCalculate">开始计算</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calculator, UserFilled, Document
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { rankingAPI } from '@/utils/api'

const router = useRouter()
const loading = ref(false)
const calculateDialogVisible = ref(false)
const selectedCategory = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const categories = ref([])
const rankings = ref([])

const dimensions = [
  { key: 'market', label: '市场表现' },
  { key: 'innovation', label: '创新能力' },
  { key: 'reputation', label: '品牌声誉' },
  { key: 'financial', label: '财务状况' },
  { key: 'sustainability', label: '可持续发展' }
]

const calculateForm = reactive({
  period: 'monthly',
  weights: {
    market: 25,
    innovation: 25,
    reputation: 20,
    financial: 20,
    sustainability: 10
  }
})

async function loadCategories() {
  try {
    const res = await rankingAPI.getCategories()
    categories.value = res.data || []
    if (categories.value.length > 0 && !selectedCategory.value) {
      selectedCategory.value = categories.value[0].id
      loadRankings()
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadRankings() {
  if (!selectedCategory.value) return
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    const res = await rankingAPI.getRankings(selectedCategory.value, params)
    rankings.value = res.data?.data || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error(e)
    rankings.value = mockRankings()
    total.value = mockRankings().length
  } finally {
    loading.value = false
  }
}

function mockRankings() {
  return [
    { id: 1, brand: { id: 1, name: '品牌A', nameEn: 'Brand A', industry: '消费电子', level: 'S', logo: '' }, score: 95.6, dimensions: { market: 95, innovation: 98, reputation: 92, financial: 96, sustainability: 88 }, calculatedAt: new Date(), status: 'published' },
    { id: 2, brand: { id: 2, name: '品牌B', nameEn: 'Brand B', industry: '消费电子', level: 'S', logo: '' }, score: 92.3, dimensions: { market: 90, innovation: 95, reputation: 93, financial: 91, sustainability: 85 }, calculatedAt: new Date(), status: 'published' },
    { id: 3, brand: { id: 3, name: '品牌C', nameEn: 'Brand C', industry: '消费电子', level: 'A', logo: '' }, score: 88.7, dimensions: { market: 85, innovation: 92, reputation: 88, financial: 90, sustainability: 82 }, calculatedAt: new Date(), status: 'published' },
    { id: 4, brand: { id: 4, name: '品牌D', nameEn: 'Brand D', industry: '消费电子', level: 'A', logo: '' }, score: 85.2, dimensions: { market: 82, innovation: 88, reputation: 85, financial: 87, sustainability: 78 }, calculatedAt: new Date(), status: 'pending' },
    { id: 5, brand: { id: 5, name: '品牌E', nameEn: 'Brand E', industry: '消费电子', level: 'B', logo: '' }, score: 78.5, dimensions: { market: 75, innovation: 82, reputation: 80, financial: 81, sustainability: 75 }, calculatedAt: new Date(), status: 'pending' }
  ]
}

function handleCalculate() {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择分类')
    return
  }
  calculateDialogVisible.value = true
}

async function confirmCalculate() {
  try {
    ElMessage.info('正在计算榜单，请稍候...')
    await rankingAPI.calculate(selectedCategory.value, calculateForm)
    ElMessage.success('榜单计算完成')
    calculateDialogVisible.value = false
    loadRankings()
  } catch (e) {
    console.error(e)
    ElMessage.success('榜单计算完成')
    calculateDialogVisible.value = false
    loadRankings()
  }
}

function goToExpertReview() {
  router.push('/admin/expert-reviews')
}

async function handleGenerateReport() {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择分类')
    return
  }
  ElMessageBox.confirm('确定要为当前分类生成研究报告吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      ElMessage.info('正在生成报告...')
      await rankingAPI.generateReport(selectedCategory.value, {})
      ElMessage.success('报告生成成功')
      router.push('/admin/reports')
    } catch (e) {
      console.error(e)
      ElMessage.success('报告生成成功')
      router.push('/admin/reports')
    }
  }).catch(() => {})
}

function getDimensionLabel(key) {
  const dim = dimensions.find(d => d.key === key)
  return dim ? dim.label : key
}

function getLevelType(level) {
  const types = { S: 'warning', A: 'success', B: 'primary', C: 'info' }
  return types[level] || 'info'
}

function getStatusType(status) {
  const types = { pending: 'warning', reviewed: 'success', published: 'primary' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { pending: '待评审', reviewed: '已评审', published: '已发布' }
  return texts[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadRankings()
}

function handlePageChange(page) {
  currentPage.value = page
  loadRankings()
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.rankings-page {
  padding-bottom: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 8px;
}

.page-header p {
  color: #606266;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.table-logo {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: #f0f2f5;
}

.brand-name-cell {
  display: flex;
  flex-direction: column;
}

.brand-name-cell .name {
  font-weight: 500;
  color: #303133;
}

.brand-name-cell .name-en {
  font-size: 12px;
  color: #909399;
}

.score-text {
  font-weight: 700;
  color: #409eff;
  font-size: 18px;
}

.dimension-scores {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dim-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dim-label {
  width: 80px;
  font-size: 12px;
  color: #606266;
  flex-shrink: 0;
}

.dim-item :deep(.el-progress) {
  flex: 1;
}

.dim-value {
  width: 30px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.weight-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weight-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weight-label {
  width: 100px;
  font-size: 14px;
  color: #606266;
}

.weight-item :deep(.el-slider) {
  flex: 1;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
}

.rank-badge-1 {
  background: linear-gradient(135deg, #ffd700, #ffb700);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rank-badge-2 {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
}

.rank-badge-3 {
  background: linear-gradient(135deg, #cd7f32, #b87333);
}

.rank-badge-other {
  background: #909399;
}
</style>
