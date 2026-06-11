<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Wallet /></el-icon> 技能培训补贴审核
      </div>
      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="loadData">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="pending">待审</el-radio-button>
          <el-radio-button label="approved">通过</el-radio-button>
          <el-radio-button label="rejected">驳回</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="card">
      <el-table :data="subsidies" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="enterprise_name" label="企业名称" min-width="200" />
        <el-table-column prop="training_name" label="培训名称" min-width="180" />
        <el-table-column prop="training_type" label="类型" width="140" />
        <el-table-column prop="trainee_count" label="参训人数" width="100" />
        <el-table-column label="申请金额" width="140">
          <template #default="{ row }">¥ {{ Number(row.apply_amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="核定金额" width="140" v-if="filterStatus.value !== 'pending'">
          <template #default="{ row }">
            <span v-if="row.approved_amount != null">¥ {{ Number(row.approved_amount).toLocaleString() }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="primary" link @click="openApprove(row)">
              <el-icon><EditPen /></el-icon> 审核
            </el-button>
            <el-button v-else size="small" type="primary" link @click="viewDetail(row)">
              <el-icon><View /></el-icon> 详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && subsidies.length === 0" description="暂无补贴申请" />
    </div>

    <el-dialog v-model="showApprove" title="技能培训补贴审核" width="600px">
      <div v-if="current">
        <el-descriptions :column="2" border style="margin-bottom: 16px;">
          <el-descriptions-item label="企业名称" :span="2">{{ current.enterprise_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="培训名称">{{ current.training_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="培训类型">{{ current.training_type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="参训人数">{{ current.trainee_count || 0 }} 人</el-descriptions-item>
          <el-descriptions-item label="申请金额">¥ {{ Number(current.apply_amount || 0).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="培训开始时间">{{ current.start_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="培训结束时间">{{ current.end_date || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="approveForm" label-width="100px">
          <el-form-item label="核定金额">
            <el-input-number v-model="approveForm.approved_amount" :min="0" :precision="2" style="width: 200px" />
            <span style="margin-left:8px; color:#6b7280;">元</span>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input v-model="approveForm.comment" type="textarea" :rows="3" placeholder="请填写审核意见" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showApprove = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitApprove('rejected')">驳回</el-button>
        <el-button type="success" :loading="submitting" @click="submitApprove('approved')">通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="补贴申请详情" width="560px">
      <el-descriptions :column="2" border v-if="current">
        <el-descriptions-item label="企业名称" :span="2">{{ current.enterprise_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="培训名称">{{ current.training_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="培训类型">{{ current.training_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="参训人数">{{ current.trainee_count || 0 }} 人</el-descriptions-item>
        <el-descriptions-item label="申请金额">¥ {{ Number(current.apply_amount || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="核定金额">
          <span v-if="current.approved_amount != null">¥ {{ Number(current.approved_amount).toLocaleString() }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <span :class="['tag-badge', statusClass(current.status)]">{{ statusText(current.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核意见" v-if="current.review_comment" :span="2">
          {{ current.review_comment }}
        </el-descriptions-item>
      </el-descriptions>
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
const subsidies = ref([])
const showApprove = ref(false)
const showDetail = ref(false)
const current = ref(null)
const approveForm = ref({ approved_amount: 0, comment: '' })

function statusText(s) {
  const map = { pending: '待审', approved: '通过', rejected: '驳回' }
  return map[s] || s
}
function statusClass(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[s] || 'gray'
}

async function loadData() {
  loading.value = true
  try {
    const params = filterStatus.value !== 'all' ? { status: filterStatus.value } : {}
    const res = await api.get('/admin/training-subsidies', { params })
    subsidies.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openApprove(row) {
  current.value = row
  approveForm.value = { approved_amount: row.apply_amount || 0, comment: '' }
  showApprove.value = true
}

function viewDetail(row) {
  current.value = row
  showDetail.value = true
}

async function submitApprove(action) {
  if (!current.value) return
  if (action === 'approved' && !approveForm.value.approved_amount) {
    ElMessage.warning('请填写核定金额')
    return
  }
  submitting.value = true
  try {
    await api.post(`/admin/training-subsidies/approve/${current.value.id}`, {
      result: action,
      approved_amount: approveForm.value.approved_amount,
      comment: approveForm.value.comment
    })
    ElMessage.success(action === 'approved' ? '审核通过' : '已驳回')
    showApprove.value = false
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
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
