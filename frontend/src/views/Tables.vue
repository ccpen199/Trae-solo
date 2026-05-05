<template>
  <div class="tables-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>桌台管理</span>
          <el-button type="primary">添加桌台</el-button>
        </div>
      </template>
      
      <el-table :data="tables" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="桌台名称" />
        <el-table-column prop="capacity" label="容纳人数" width="120" />
        <el-table-column prop="status" label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary">编辑</el-button>
            <el-button size="small" :type="row.status === 'occupied' ? 'success' : 'warning'">
              {{ row.status === 'occupied' ? '清台' : '占用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const loading = ref(false)
const tables = ref([])

const getStatusType = (status) => {
  const map = {
    available: 'success',
    occupied: 'danger',
    reserved: 'warning',
    cleaning: 'info',
    maintenance: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    available: '空闲',
    occupied: '占用',
    reserved: '预订',
    cleaning: '清洁中',
    maintenance: '维护'
  }
  return map[status] || status
}

const fetchTables = async () => {
  loading.value = true
  try {
    const res = await api.table.getList()
    tables.value = res.data || []
  } catch (error) {
    console.error('Fetch tables error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTables()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
