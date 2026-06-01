<template>
  <div class="admin-drivers">
    <el-card>
      <template #header>
        <span>司机审核</span>
      </template>
      <el-table :data="drivers" v-loading="loading">
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="driver_license" label="驾驶证号" width="150" />
        <el-table-column prop="rating" label="评分" width="80">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="接单量" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="success" @click="verify(row, 'verified')">通过</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="danger" @click="verify(row, 'rejected')">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { driverAPI } from '@/api'

const drivers = ref([])
const loading = ref(false)

const loadDrivers = async () => {
  loading.value = true
  const res = await driverAPI.list({})
  if (res.success) {
    drivers.value = res.data
  }
  loading.value = false
}

const verify = async (row, status) => {
  ElMessageBox.confirm(`确认${status === 'verified' ? '通过' : '拒绝'}该司机认证？`, '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: status === 'verified' ? 'success' : 'warning'
  }).then(async () => {
    const res = await driverAPI.verify(row.id, status)
    if (res.success) {
      ElMessage.success('操作成功')
      loadDrivers()
    }
  })
}

const getStatusType = (status) => {
  const types = { pending: 'warning', verified: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审核', verified: '已通过', rejected: '已拒绝' }
  return texts[status] || status
}

onMounted(() => {
  loadDrivers()
})
</script>
