<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><ScaleToBalance /></el-icon> 劳动争议调解
      </div>
    </div>

    <div class="card">
      <el-table :data="disputes" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="applicant_name" label="申请人" width="120" />
        <el-table-column prop="respondent_name" label="被申请人" min-width="180" />
        <el-table-column prop="dispute_type" label="争议类型" width="160" />
        <el-table-column label="争议金额" width="140">
          <template #default="{ row }">¥ {{ Number(row.dispute_amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <span :class="['tag-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openMediation(row)">
              <el-icon><EditPen /></el-icon> 调解
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && disputes.length === 0" description="暂无调解申请" />
    </div>

    <el-dialog v-model="showMediation" title="劳动争议调解处理" width="640px">
      <div v-if="current">
        <el-descriptions :column="2" border style="margin-bottom: 16px;">
          <el-descriptions-item label="申请编号" :span="2">{{ current.application_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ current.applicant_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ current.applicant_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="被申请人" :span="2">{{ current.respondent_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="争议类型">{{ current.dispute_type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="争议金额">¥ {{ Number(current.dispute_amount || 0).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="调解状态">
            <span :class="['tag-badge', statusClass(current.status)]">{{ statusText(current.status) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ current.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="争议描述" :span="2">
            <div style="white-space: pre-wrap; max-height: 120px; overflow-y: auto;">{{ current.description || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <el-form :model="mediationForm" label-width="100px">
          <el-form-item label="调解结果">
            <el-radio-group v-model="mediationForm.result">
              <el-radio label="success">调解成功</el-radio>
              <el-radio label="failed">调解失败</el-radio>
              <el-radio label="processing">继续调解</el-radio>
              <el-radio label="closed">结案</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="调解备注">
            <el-input v-model="mediationForm.comment" type="textarea" :rows="4" placeholder="请填写调解结果、处理意见等备注信息" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showMediation = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitMediation">提交调解结果</el-button>
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
const disputes = ref([])
const showMediation = ref(false)
const current = ref(null)
const mediationForm = ref({ result: '', comment: '' })

function statusText(s) {
  const map = { pending: '待受理', processing: '调解中', success: '调解成功', failed: '调解失败', closed: '已结案' }
  return map[s] || s
}
function statusClass(s) {
  const map = { pending: 'warning', processing: 'info', success: 'success', failed: 'danger', closed: 'gray' }
  return map[s] || 'gray'
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/admin/labor-disputes')
    disputes.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openMediation(row) {
  current.value = row
  mediationForm.value = {
    result: row.status === 'pending' ? 'processing' : (row.status === 'processing' ? 'success' : row.status),
    comment: row.mediation_result || ''
  }
  showMediation.value = true
}

async function submitMediation() {
  if (!current.value) return
  if (!mediationForm.value.result) {
    ElMessage.warning('请选择调解结果')
    return
  }
  submitting.value = true
  try {
    await api.post(`/admin/labor-disputes/mediate/${current.value.id}`, {
      result: mediationForm.value.result,
      comment: mediationForm.value.comment
    })
    ElMessage.success('调解结果已提交')
    showMediation.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
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
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
</style>
