<template>
  <div class="expert-reviews-page">
    <div class="page-header">
      <h1>专家评审协同</h1>
      <p>人工修正榜单权重，确保排名公平性与专业度</p>
    </div>

    <div class="card">
      <div class="section-header">
        <h3>评审记录</h3>
      </div>
      <el-table :data="reviews" v-loading="loading" stripe>
        <el-table-column prop="expert_name" label="评审专家" width="120" />
        <el-table-column prop="brand_name" label="品牌" min-width="120" />
        <el-table-column prop="category_name" label="榜单分类" min-width="150" />
        <el-table-column prop="rank_position" label="当前排名" width="100" align="center">
          <template #default="{ row }">
            <span :class="['rank-badge', `rank-badge-${row.rank_position <= 3 ? row.rank_position : 'other'}`]">{{ row.rank_position }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="final_score" label="当前得分" width="100">
          <template #default="{ row }">
            <span class="score-text">{{ row.final_score?.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="adjustment_value" label="调整值" width="100">
          <template #default="{ row }">
            <span :class="row.adjustment_value > 0 ? 'positive' : row.adjustment_value < 0 ? 'negative' : ''">
              {{ row.adjustment_value > 0 ? '+' : '' }}{{ row.adjustment_value?.toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="调整原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="reviewed_at" label="评审时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.reviewed_at) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card">
      <div class="section-header">
        <h3>发起评审</h3>
      </div>
      <el-form :model="reviewForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="榜单分类" prop="category_id">
              <el-select v-model="reviewForm.category_id" placeholder="选择榜单" style="width:100%" @change="loadCategoryRankings">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌排名" prop="ranking_id">
              <el-select v-model="reviewForm.ranking_id" placeholder="选择品牌排名" style="width:100%">
                <el-option v-for="r in categoryRankings" :key="r.id" :label="第{{ r.rank_position }}名 - {{ r.brand_name }}（{{ r.final_score?.toFixed(1) }}分）" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="调整值" prop="adjustment_value">
              <el-input-number v-model="reviewForm.adjustment_value" :min="-50" :max="50" :step="0.5" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="reviewForm.reason" type="textarea" :rows="3" placeholder="请详细说明调整原因" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交评审</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { adminAPI, rankingAPI } from '@/utils/api'

const loading = ref(false)
const reviews = ref([])
const categories = ref([])
const categoryRankings = ref([])
const formRef = ref(null)

const reviewForm = reactive({
  category_id: '',
  ranking_id: '',
  adjustment_value: 0,
  reason: ''
})

const rules = {
  category_id: [{ required: true, message: '请选择榜单', trigger: 'change' }],
  ranking_id: [{ required: true, message: '请选择品牌排名', trigger: 'change' }],
  adjustment_value: [{ required: true, message: '请输入调整值', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

async function loadReviews() {
  loading.value = true
  try {
    const res = await adminAPI.getExpertReviews()
    reviews.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await rankingAPI.getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function loadCategoryRankings(categoryId) {
  if (!categoryId) { categoryRankings.value = []; return }
  try {
    const res = await rankingAPI.getRankings(categoryId, { limit: 20 })
    categoryRankings.value = res.data?.rankings || []
  } catch (e) {
    console.error(e)
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await rankingAPI.expertReview(reviewForm.ranking_id, {
          adjustment_value: reviewForm.adjustment_value,
          reason: reviewForm.reason
        })
        ElMessage.success('评审提交成功')
        reviewForm.category_id = ''
        reviewForm.ranking_id = ''
        reviewForm.adjustment_value = 0
        reviewForm.reason = ''
        categoryRankings.value = []
        loadReviews()
      } catch (e) {
        console.error(e)
      }
    }
  })
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  loadReviews()
  loadCategories()
})
</script>

<style scoped>
.expert-reviews-page { padding-bottom: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #1f2f3d; margin-bottom: 8px; }
.page-header p { color: #606266; font-size: 14px; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 { font-size: 18px; font-weight: 600; color: #1f2f3d; }
.score-text { font-weight: 600; color: #409eff; }
.positive { color: #67c23a; font-weight: 600; }
.negative { color: #f56c6c; font-weight: 600; }
.rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; font-weight: 700; font-size: 12px; color: #fff; }
.rank-badge-1 { background: linear-gradient(135deg,#ffd700,#ffb700); }
.rank-badge-2 { background: linear-gradient(135deg,#c0c0c0,#a8a8a8); }
.rank-badge-3 { background: linear-gradient(135deg,#cd7f32,#b87333); }
.rank-badge-other { background: #909399; }
</style>
