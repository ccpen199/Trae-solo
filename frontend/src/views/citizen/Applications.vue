<template>
  <div class="citizen-applications">
    <el-card>
      <template #header>
        <h2>办理记录</h2>
      </template>

      <el-table :data="applications" v-loading="loading">
        <el-table-column prop="application_no" label="申请编号" width="180" />
        <el-table-column prop="service_name" label="办理事项" />
        <el-table-column prop="applicant_name" label="申请人" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const applications = ref([])

const getCurrentApplicant = () => {
  const saved = localStorage.getItem('currentApplicant')
  return saved ? JSON.parse(saved) : null
}

const loadApplications = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) return

  loading.value = true
  try {
    const res = await api.getApplications({ applicant_id: applicant.id })
    applications.value = res.data
  } catch (err) {
    ElMessage.error('加载失败：' + err.message)
  } finally {
    loading.value = false
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

onMounted(() => {
  loadApplications()
})
</script>
