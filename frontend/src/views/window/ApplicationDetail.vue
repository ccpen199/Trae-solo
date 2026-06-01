<template>
  <div class="application-detail">
    <el-card v-if="application">
      <template #header>
        <div class="card-header">
          <h2>申请详情 - {{ application.application_no }}</h2>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-descriptions :column="2" border class="mb-20">
        <el-descriptions-item label="申请编号">{{ application.application_no }}</el-descriptions-item>
        <el-descriptions-item label="办理事项">{{ application.service_name }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ application.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ application.id_card }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ application.phone }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ application.department }}</el-descriptions-item>
        <el-descriptions-item label="申请状态">
          <el-tag :type="getStatusType(application.status)">{{ getStatusText(application.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ application.created_at }}</el-descriptions-item>
      </el-descriptions>

      <h3>材料清单</h3>
      <el-table :data="application.materials" border class="mb-20">
        <el-table-column prop="material_name" label="材料名称" />
        <el-table-column label="使用方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getUsageType(row)">{{ getUsageText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reuse_reason" label="复用依据">
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
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              v-if="row.file_name"
              size="small"
              @click="downloadMaterial(row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="actions">
        <el-button type="primary" size="large" @click="handleAccept">
          受理申请
        </el-button>
        <el-button size="large" @click="handleReject">
          驳回申请
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const application = ref(null)

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

const handleAccept = async () => {
  try {
    await api.updateApplicationStatus(application.value.id, 'processing')
    ElMessage.success('已受理')
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
