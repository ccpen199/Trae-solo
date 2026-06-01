<template>
  <div class="application-detail">
    <el-card v-if="application">
      <template #header>
        <div class="card-header">
          <h2>审批详情 - {{ application.application_no }}</h2>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-descriptions :column="2" border class="mb-20">
        <el-descriptions-item label="申请编号">{{ application.application_no }}</el-descriptions-item>
        <el-descriptions-item label="办理事项">{{ application.service_name }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ application.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ application.id_card }}</el-descriptions-item>
        <el-descriptions-item label="申请状态">
          <el-tag :type="getStatusType(application.status)">{{ getStatusText(application.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ application.created_at }}</el-descriptions-item>
      </el-descriptions>

      <h3>材料审核</h3>
      <el-table :data="application.materials" border class="mb-20">
        <el-table-column prop="material_name" label="材料名称" />
        <el-table-column label="使用方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getUsageType(row)">{{ getUsageText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reuse_reason" label="复用依据" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.reuse_reason">{{ row.reuse_reason }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="file_name" label="文件名">
          <template #default="{ row }">
            <span v-if="row.file_name">{{ row.file_name }}</span>
            <span v-else class="text-gray">未上传</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'correction_needed' ? 'danger' : 'success'">
              {{ row.status === 'correction_needed' ? '需补正' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.file_name"
              size="small"
              @click="downloadMaterial(row)"
            >
              查看
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="requestCorrection(row)"
            >
              要求补正
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="actions">
        <el-button type="success" size="large" @click="handleApprove">
          通过审批
        </el-button>
        <el-button type="danger" size="large" @click="handleReject">
          驳回申请
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="showCorrectionDialog" title="要求补正" width="500px">
      <el-form :model="correctionForm" label-width="100px">
        <el-form-item label="材料名称">
          <el-input v-model="correctionForm.material_name" disabled />
        </el-form-item>
        <el-form-item label="补正原因" required>
          <el-input
            v-model="correctionForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请说明补正原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCorrectionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCorrection">确认补正</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const application = ref(null)
const showCorrectionDialog = ref(false)
const correctionForm = ref({
  application_material_id: '',
  material_name: '',
  reason: ''
})

const loadApplication = async () => {
  try {
    const res = await api.getApplication(route.params.id)
    application.value = res.data
  } catch (err) {
    ElMessage.error('加载失败：' + err.message)
  }
}

const downloadMaterial = (row) => {
  if (row.material_id) {
    api.downloadMaterial(row.material_id)
  }
}

const requestCorrection = (row) => {
  correctionForm.value = {
    application_material_id: row.id,
    material_name: row.material_name,
    reason: ''
  }
  showCorrectionDialog.value = true
}

const submitCorrection = async () => {
  if (!correctionForm.value.reason) {
    ElMessage.warning('请填写补正原因')
    return
  }

  try {
    await api.createCorrection({
      application_material_id: correctionForm.value.application_material_id,
      application_id: application.value.id,
      reason: correctionForm.value.reason
    })
    ElMessage.success('补正要求已发送')
    showCorrectionDialog.value = false
    loadApplication()
  } catch (err) {
    ElMessage.error('操作失败：' + err.message)
  }
}

const handleApprove = async () => {
  try {
    await api.updateApplicationStatus(application.value.id, 'approved')
    ElMessage.success('审批通过')
    loadApplication()
  } catch (err) {
    ElMessage.error('操作失败：' + err.message)
  }
}

const handleReject = async () => {
  try {
    await api.updateApplicationStatus(application.value.id, 'rejected')
    ElMessage.success('已驳回')
    loadApplication()
  } catch (err) {
    ElMessage.error('操作失败：' + err.message)
  }
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    approved: 'success',
    rejected: 'danger',
    correction: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待受理',
    processing: '处理中',
    approved: '已通过',
    rejected: '已驳回',
    correction: '需补正'
  }
  return map[status] || status
}

const getUsageType = (row) => {
  if (row.usage_type === 'reuse') return 'success'
  if (row.usage_type === 'renew' || row.usage_type === 'resign') return 'warning'
  return 'info'
}

const getUsageText = (row) => {
  const map = {
    reuse: '复用',
    renew: '更新',
    resign: '重签',
    new: '新提交'
  }
  return map[row.usage_type] || row.usage_type
}

onMounted(() => {
  loadApplication()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}

.mb-20 {
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 15px;
  font-size: 16px;
}

.text-gray {
  color: #909399;
}

.actions {
  margin-top: 30px;
  text-align: center;
}
</style>
