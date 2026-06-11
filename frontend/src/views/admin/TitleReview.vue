<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Medal /></el-icon> 职称申报在线预审
      </div>
      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="loadData">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="pending">待审</el-radio-button>
          <el-radio-button label="approved">已通过</el-radio-button>
          <el-radio-button label="rejected">已驳回</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="card">
      <el-table :data="applications" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="apply_title" label="申报职称" width="120" />
        <el-table-column prop="apply_category" label="类别" width="140" />
        <el-table-column prop="education" label="学历" width="100" />
        <el-table-column prop="work_years" label="工作年限" width="100">
          <template #default="{ row }">{{ row.work_years }} 年</template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="180" />
        <el-table-column prop="review_status" label="状态" width="120">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.review_status)]">{{ statusText(row.review_status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openReview(row)">
              <el-icon><EditPen /></el-icon> 审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && applications.length === 0" description="暂无申报记录" />
    </div>

    <el-dialog v-model="showReview" title="职称申报审核" width="640px">
      <div v-if="current">
        <el-descriptions :column="2" border style="margin-bottom: 16px;">
          <el-descriptions-item label="姓名">{{ current.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证">{{ current.id_card || '-' }}</el-descriptions-item>
          <el-descriptions-item label="现有职称">{{ current.current_title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申报职称">{{ current.apply_title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申报类别">{{ current.apply_category || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最高学历">{{ current.education || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工作年限">{{ current.work_years }} 年</el-descriptions-item>
          <el-descriptions-item label="申报时间">{{ current.created_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title" style="margin-bottom: 12px;">申报材料</div>
        <div v-if="parseMaterials(current.materials).length" class="materials-list">
          <div v-for="(mat, idx) in parseMaterials(current.materials)" :key="idx" class="material-item">
            <el-icon style="margin-right:6px; color:#1d4ed8;"><Paperclip /></el-icon>
            <span>{{ mat.name }}</span>
            <span v-if="mat.url" class="mat-url">{{ mat.url }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无材料" :image-size="60" />

        <el-form :model="reviewForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="审核意见">
            <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请填写审核意见" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitReview('rejected')">驳回</el-button>
        <el-button type="success" :loading="submitting" @click="submitReview('approved')">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const filterStatus = ref('all')
const applications = ref([])
const showReview = ref(false)
const current = ref(null)
const reviewForm = ref({ comment: '' })

function statusText(s) {
  const map = { pending: '待审', approved: '已通过', rejected: '已驳回' }
  return map[s] || s
}
function statusClass(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[s] || 'gray'
}
function parseMaterials(m) {
  try { return typeof m === 'string' ? JSON.parse(m) : (m || []) } catch { return [] }
}

async function loadData() {
  loading.value = true
  try {
    const params = filterStatus.value !== 'all' ? { status: filterStatus.value } : {}
    const res = await api.get('/admin/title-applications', { params })
    applications.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openReview(row) {
  current.value = row
  reviewForm.value = { comment: row.review_comment || '' }
  showReview.value = true
}

async function submitReview(action) {
  if (!current.value) return
  submitting.value = true
  try {
    await api.post(`/admin/title-applications/review/${current.value.id}`, {
      result: action,
      comment: reviewForm.value.comment
    })
    ElMessage.success(action === 'approved' ? '审核通过' : '已驳回')
    showReview.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '审核失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/admin')
}

onMounted(loadData)
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
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
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.material-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 13px;
}
.mat-url {
  color: #1d4ed8;
  margin-left: 12px;
  font-size: 12px;
}
</style>
