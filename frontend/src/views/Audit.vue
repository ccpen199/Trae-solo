<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="page-title">审计日志 (Audit Logs)</span>
        </div>
      </template>
      
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-select v-model="filterAction" placeholder="操作类型" clearable @change="loadLogs">
            <el-option label="创建规则" value="CREATE_RULE" />
            <el-option label="更新规则" value="UPDATE_RULE_TOPOLOGY" />
            <el-option label="推送测试" value="PUSH_TO_TEST" />
            <el-option label="激活上线" value="ACTIVATE_RULE" />
            <el-option label="开始回测" value="START_BACKTEST" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterOperator" placeholder="操作人" clearable @change="loadLogs">
            <el-option label="策略员" value="策略员" />
            <el-option label="web" value="web" />
            <el-option label="system" value="system" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="loadLogs">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>

      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="id" label="日志ID" width="180" />
        <el-table-column prop="operator" label="操作人" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.operator || 'system' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_role" label="角色" width="100">
          <template #default="{ row }">
            {{ row.operator_role || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="180">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource_type" label="资源类型" width="100">
          <template #default="{ row }">
            {{ row.resource_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="resource_id" label="资源ID" width="150">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain" size="small">{{ row.resource_id || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.details">
              <el-button type="primary" link size="small" @click="showDetail(row)">
                查看详情
              </el-button>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="130">
          <template #default="{ row }">
            {{ row.ip_address || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>

    <el-card class="page-card" style="margin-top: 20px;">
      <template #header>
        <span>审计统计</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-section">
            <div class="stat-title">操作分布</div>
            <div v-if="stats.actionCounts && stats.actionCounts.length > 0" class="action-stats">
              <div v-for="stat in stats.actionCounts" :key="stat.action" class="action-stat-item">
                <span class="action-name">{{ getActionLabel(stat.action) }}</span>
                <el-progress :percentage="getActionPercentage(stat.count)" :stroke-width="10" />
                <span class="action-count">{{ stat.count }} 次</span>
              </div>
            </div>
            <el-empty v-else description="暂无统计数据" :image-size="40" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-section">
            <div class="stat-title">操作人分布</div>
            <div v-if="stats.operatorCounts && stats.operatorCounts.length > 0" class="operator-stats">
              <div v-for="stat in stats.operatorCounts" :key="stat.operator" class="operator-stat-item">
                <el-avatar :size="36">{{ stat.operator?.charAt(0) || 'S' }}</el-avatar>
                <div class="operator-info">
                  <div class="operator-name">{{ stat.operator || 'system' }}</div>
                  <div class="operator-count">{{ stat.count }} 次操作</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无统计数据" :image-size="40" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-section">
            <div class="stat-title">最近7天活动</div>
            <div v-if="stats.recentActivity && stats.recentActivity.length > 0" class="activity-stats">
              <div v-for="activity in stats.recentActivity" :key="activity.date" class="activity-item">
                <span class="activity-date">{{ activity.date }}</span>
                <el-progress 
                  :percentage="getActivityPercentage(activity.count)" 
                  :stroke-width="8"
                  color="#409EFF"
                />
                <span class="activity-count">{{ activity.count }} 次</span>
              </div>
            </div>
            <el-empty v-else description="暂无统计数据" :image-size="40" />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="500px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator || 'system' }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionTagType(currentLog.action)" size="small">
            {{ getActionLabel(currentLog.action) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源类型">{{ currentLog.resource_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资源ID">{{ currentLog.resource_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.created_at }}</el-descriptions-item>
      </el-descriptions>
      <el-divider v-if="currentLog?.details">详细信息</el-divider>
      <div v-if="currentLog?.details" class="log-detail-json">
        <pre>{{ JSON.stringify(currentLog.details, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../utils/api'

const logs = ref([])
const loading = ref(false)
const filterAction = ref('')
const filterOperator = ref('')
const detailVisible = ref(false)
const currentLog = ref(null)

const stats = reactive({
  actionCounts: [],
  operatorCounts: [],
  recentActivity: []
})

const getActionTagType = (action) => {
  if (action?.includes('CREATE') || action?.includes('START')) return 'success'
  if (action?.includes('UPDATE')) return 'primary'
  if (action?.includes('PUSH') || action?.includes('ACTIVATE')) return 'warning'
  return 'info'
}

const getActionLabel = (action) => {
  const map = {
    'CREATE_RULE': '创建规则',
    'UPDATE_RULE_TOPOLOGY': '更新规则拓扑',
    'PUSH_TO_TEST': '推送到测试环境',
    'ACTIVATE_RULE': '激活规则上线',
    'START_BACKTEST': '开始回测'
  }
  return map[action] || action
}

const totalActionCount = computed(() => {
  if (!stats.actionCounts) return 0
  return stats.actionCounts.reduce((sum, item) => sum + (item.count || 0), 0)
})

const maxActivityCount = computed(() => {
  if (!stats.recentActivity || stats.recentActivity.length === 0) return 1
  return Math.max(...stats.recentActivity.map(a => a.count))
})

const getActionPercentage = (count) => {
  if (totalActionCount.value === 0) return 0
  return Math.round((count / totalActionCount.value) * 100)
}

const getActivityPercentage = (count) => {
  if (maxActivityCount.value === 0) return 0
  return Math.round((count / maxActivityCount.value) * 100)
}

const loadLogs = async () => {
  loading.value = true
  try {
    let url = '/audit'
    const params = []
    if (filterAction.value) params.push(`action=${filterAction.value}`)
    if (filterOperator.value) params.push(`operator=${filterOperator.value}`)
    if (params.length > 0) url += '?' + params.join('&')
    
    const res = await api.get(url)
    if (res.data.success) {
      logs.value = res.data.data
    }
  } catch (e) {
    console.error('加载日志失败', e)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await api.get('/audit/stats')
    if (res.data.success) {
      stats.actionCounts = res.data.data.actionCounts || []
      stats.operatorCounts = res.data.data.operatorCounts || []
      stats.recentActivity = res.data.data.recentActivity || []
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const showDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-section {
  padding: 10px;
}

.stat-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.action-stats, .operator-stats, .activity-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-name {
  font-size: 13px;
  color: #606266;
}

.action-count {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.operator-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.operator-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.operator-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.operator-count {
  font-size: 12px;
  color: #909399;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-date {
  font-size: 13px;
  color: #606266;
  width: 80px;
  flex-shrink: 0;
}

.activity-count {
  font-size: 12px;
  color: #909399;
  width: 50px;
  flex-shrink: 0;
}

.log-detail-json {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
}

.log-detail-json pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
