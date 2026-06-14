<template>
  <div class="admin-audit">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>骑手行为合规审计日志</h3>
          <div class="filter-area">
            <el-input v-model="filterCourier" placeholder="骑手ID" style="width: 150px" @change="loadLogs" />
            <el-select v-model="filterAction" placeholder="操作类型" style="width: 150px" @change="loadLogs" clearable>
              <el-option label="登录" value="login" />
              <el-option label="接单" value="accept_task" />
              <el-option label="资质审核" value="license_verify" />
              <el-option label="人脸验证" value="face_verify" />
              <el-option label="管理员更新" value="admin_update" />
            </el-select>
            <el-button @click="loadLogs">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="courier_id" label="骑手ID" width="120" />
        <el-table-column prop="courier.name" label="骑手姓名" width="150">
          <template #default="{ row }">
            {{ row.courier?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="action_type" label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ getActionText(row.action_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action_detail" label="操作详情" :show-overflow-tooltip="true" />
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && logs.length === 0" description="暂无审计日志" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/modules'

const loading = ref(false)
const logs = ref([])
const filterCourier = ref('')
const filterAction = ref('')

const getActionText = (action) => {
  const map = {
    login: '登录',
    accept_task: '接单',
    license_verify: '资质审核',
    face_verify: '人脸验证',
    admin_update: '管理员更新'
  }
  return map[action] || action
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterCourier.value) {
      params.courier_id = filterCourier.value
    }
    if (filterAction.value) {
      params.action_type = filterAction.value
    }

    const res = await adminApi.auditLogs.list(params)
    if (res.success) {
      logs.value = res.logs
    }
  } catch (error) {
    console.error('加载审计日志失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.card-header h3 {
  margin: 0;
}

.filter-area {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
