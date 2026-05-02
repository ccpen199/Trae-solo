<template>
  <div class="schedule-list">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">船期管理</span>
        </div>
      </template>

      <el-table :data="schedules" stripe v-loading="loading">
        <el-table-column prop="vesselName" label="船名" min-width="150" />
        <el-table-column prop="voyageNo" label="航次" width="120" />
        <el-table-column prop="shippingLine" label="船公司" width="150" />
        <el-table-column prop="pol" label="装货港" width="100" />
        <el-table-column prop="pod" label="卸货港" width="100" />
        <el-table-column prop="etd" label="预计开船时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.etd) }}
          </template>
        </el-table-column>
        <el-table-column prop="eta" label="预计到港时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.eta) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { schedulesApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const schedules = ref([])

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const fetchSchedules = async () => {
  loading.value = true
  try {
    const result = await schedulesApi.getList({})
    if (result.success) {
      schedules.value = result.data?.list || []
    }
  } catch (error) {
    console.error('Fetch schedules error:', error)
    ElMessage.error('获取船期列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSchedules()
})
</script>

<style scoped>
.schedule-list {
  padding: 0;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}
</style>
