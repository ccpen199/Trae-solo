<template>
  <div class="progress-page">
    <el-card>
      <template #header>
        <span>进度列表</span>
      </template>
      
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadProgress">
            <el-option label="待触发" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadProgress">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="progressList" stripe v-loading="loading">
        <el-table-column prop="task_name" label="任务名称" />
        <el-table-column prop="current_count" label="当前进度" />
        <el-table-column prop="target_count" label="目标" />
        <el-table-column label="完成率" width="200">
          <template #default="{ row }">
            <el-progress :percentage="Math.min(100, Math.round(row.current_count / row.target_count * 100))" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'primary'" size="small">
              {{ row.status === 'completed' ? '已完成' : row.current_count > 0 ? '进行中' : '待触发' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { progressApi } from '../api'

const progressList = ref([])
const loading = ref(false)
const filters = ref({
  status: ''
})

const loadProgress = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    
    const result = await progressApi.getUserProgress(params)
    progressList.value = result.data
  } catch (error) {
    console.error('加载进度失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProgress()
})
</script>

<style scoped>
.filter-form {
  margin-bottom: 16px;
}
</style>
