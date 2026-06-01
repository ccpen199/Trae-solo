<template>
  <div class="alerts">
    <div class="page-header">
      <h2>告警中心</h2>
    </div>
    
    <el-card>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="已确认" value="acknowledged" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="filters.severity" placeholder="全部" clearable>
            <el-option label="高危" value="high" />
            <el-option label="中危" value="medium" />
            <el-option label="低危" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="告警ID" width="160" />
        <el-table-column prop="alert_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.alert_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="severityType[row.severity]" size="small">{{ severityText[row.severity] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" show-overflow-tooltip min-width="250" />
        <el-table-column prop="config_name" label="配置" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'active'">
              <el-button size="small" type="primary" link @click="acknowledge(row.id)">
                确认
              </el-button>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { audit } from '@/api'

const list = ref([])
const loading = ref(false)

const filters = reactive({
  status: '',
  severity: ''
})

const severityType = {
  high: 'danger',
  medium: 'warning',
  low: 'info'
}

const severityText = {
  high: '高危',
  medium: '中危',
  low: '低危'
}

const statusType = {
  active: 'danger',
  acknowledged: 'warning',
  resolved: 'success'
}

const statusText = {
  active: '活跃',
  acknowledged: '已确认',
  resolved: '已解决'
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    const result = await audit.alerts(filters)
    list.value = result.alerts || []
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.severity = ''
  loadData()
}

const acknowledge = async (id) => {
  try {
    await ElMessageBox.confirm('确认此告警？', '确认')
    await audit.acknowledgeAlert(id)
    ElMessage.success('已确认')
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

.filter-form {
  margin-bottom: 20px;
}
</style>
