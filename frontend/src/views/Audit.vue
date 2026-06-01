<template>
  <div class="audit">
    <div class="page-header">
      <h2>操作审计</h2>
    </div>
    
    <el-card>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部" clearable>
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="执行" value="execute" />
            <el-option label="审批" value="approve_change" />
            <el-option label="拒绝" value="reject_change" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="filters.resource_type" placeholder="全部" clearable>
            <el-option label="应用" value="application" />
            <el-option label="配置" value="config" />
            <el-option label="任务" value="task" />
            <el-option label="变更单" value="change_order" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="日志ID" width="200" />
        <el-table-column prop="user_name" label="操作人" width="120" />
        <el-table-column prop="action" label="操作" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ actionText[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource_type" label="资源类型" width="120">
          <template #default="{ row }">
            {{ resourceText[row.resource_type] || row.resource_type }}
          </template>
        </el-table-column>
        <el-table-column prop="resource_id" label="资源ID" width="150" />
        <el-table-column prop="details" label="详情" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP" width="120" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { audit as auditApi } from '@/api'

const list = ref([])
const loading = ref(false)

const filters = reactive({
  action: '',
  resource_type: ''
})

const actionText = {
  create: '创建',
  update: '更新',
  delete: '删除',
  execute: '执行',
  retry: '重试',
  approve_change: '批准变更',
  reject_change: '拒绝变更',
  request_change: '申请变更'
}

const resourceText = {
  application: '应用',
  environment: '环境',
  config: '配置',
  task: '任务',
  change_order: '变更单',
  alert: '告警',
  exception: '异常'
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    const result = await auditApi.logs(filters)
    list.value = result.logs || []
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.action = ''
  filters.resource_type = ''
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.filter-form {
  margin-bottom: 20px;
}
</style>
