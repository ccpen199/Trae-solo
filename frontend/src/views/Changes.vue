<template>
  <div class="changes">
    <div class="page-header">
      <h2>变更单管理</h2>
    </div>
    
    <el-card>
      <el-table :data="changes" v-loading="loading">
        <el-table-column prop="id" label="变更单ID" width="160" />
        <el-table-column prop="config_name" label="配置名称" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/configs/${row.config_id}`)">
              {{ row.config_name || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="change_type" label="变更类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ changeTypeMap[row.change_type] || row.change_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变更内容" min-width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="old-value">{{ row.old_value || '(空)' }}</span>
              <el-icon color="#3b82f6"><ArrowRight /></el-icon>
              <span class="new-value">{{ row.new_value }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="变更原因" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" v-if="canApprove">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" link @click="approve(row.id)">批准</el-button>
              <el-button size="small" type="danger" link @click="reject(row.id)">拒绝</el-button>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { configs } from '@/api'

const changes = ref([])
const loading = ref(false)
const canApprove = computed(() => true)

const statusType = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

const statusText = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝'
}

const changeTypeMap = {
  url: 'URL',
  method: '请求方法',
  timeout: '超时时间',
  secret_key: '密钥',
  headers: '请求头',
  retry_count: '重试次数'
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    const allConfigs = await configs.list()
    const allChanges = []
    
    for (const c of allConfigs) {
      const detail = await configs.get(c.id)
      if (detail.changeHistory) {
        detail.changeHistory.forEach(ch => {
          allChanges.push({ ...ch, config_name: c.name })
        })
      }
    }
    
    changes.value = allChanges.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const approve = async (id) => {
  try {
    await ElMessageBox.confirm('确定批准此变更？', '确认')
    await configs.approveChange(id)
    ElMessage.success('已批准')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.error || '操作失败')
  }
}

const reject = async (id) => {
  try {
    await ElMessageBox.confirm('确定拒绝此变更？', '确认')
    await configs.rejectChange(id)
    ElMessage.success('已拒绝')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.error || '操作失败')
  }
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

.old-value {
  color: #ef4444;
  text-decoration: line-through;
}

.new-value {
  color: #10b981;
  font-weight: 600;
}
</style>
