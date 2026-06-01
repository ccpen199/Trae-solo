<template>
  <div class="logs-page">
    <div class="page-header">
      <h1 class="page-title">变更记录</h1>
      <el-button @click="loadLogs">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="filters.type" placeholder="变更类型" style="width: 150px" clearable @change="loadLogs">
          <el-option label="域名" value="domain" />
          <el-option label="证书" value="certificate" />
          <el-option label="续签" value="renewal" />
          <el-option label="DNS" value="dns" />
          <el-option label="部署" value="deployment" />
        </el-select>
        <el-input v-model="filters.operator" placeholder="操作人" style="width: 150px" clearable @input="loadLogs" />
        <el-select v-model="filters.action" placeholder="操作动作" style="width: 150px" clearable @change="loadLogs">
          <el-option label="创建" value="创建" />
          <el-option label="更新" value="更新" />
          <el-option label="删除" value="删除" />
          <el-option label="签发" value="签发" />
          <el-option label="部署" value="部署" />
        </el-select>
      </div>

      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="change_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.change_type)" size="small">
              {{ getTypeText(row.change_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="100" />
        <el-table-column prop="full_domain" label="域名" width="180">
          <template #default="{ row }">
            {{ row.full_domain || row.common_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="row.status === 'success' ? 'status-completed' : 'status-failed'" class="status-tag">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadLogs"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="变更详情" width="700px">
      <div v-if="currentLog">
        <div class="detail-item">
          <span class="detail-label">变更类型</span>
          <span class="detail-value">{{ getTypeText(currentLog.change_type) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">操作动作</span>
          <span class="detail-value">{{ currentLog.action }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">关联域名</span>
          <span class="detail-value">{{ currentLog.full_domain || currentLog.common_name || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">操作人</span>
          <span class="detail-value">{{ currentLog.operator }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">操作时间</span>
          <span class="detail-value">{{ formatDate(currentLog.created_at) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <span :class="currentLog.status === 'success' ? 'status-completed' : 'status-failed'" class="status-tag">
              {{ currentLog.status === 'success' ? '成功' : '失败' }}
            </span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">描述</span>
          <span class="detail-value">{{ currentLog.description || '-' }}</span>
        </div>
        <div v-if="currentLog.old_value" class="detail-item">
          <span class="detail-label">旧值</span>
          <span class="detail-value" style="color: #f56c6c; font-family: monospace; font-size: 12px;">
            {{ formatJson(currentLog.old_value) }}
          </span>
        </div>
        <div v-if="currentLog.new_value" class="detail-item">
          <span class="detail-label">新值</span>
          <span class="detail-value" style="color: #67c23a; font-family: monospace; font-size: 12px;">
            {{ formatJson(currentLog.new_value) }}
          </span>
        </div>
        <div v-if="currentLog.rollback_action" class="detail-item">
          <span class="detail-label">回滚方案</span>
          <span class="detail-value" style="color: #e6a23c;">{{ currentLog.rollback_action }}</span>
        </div>
        <div v-if="currentLog.failure_reason" class="detail-item">
          <span class="detail-label">失败原因</span>
          <span class="detail-value" style="color: #f56c6c;">{{ currentLog.failure_reason }}</span>
        </div>
        <div v-if="currentLog.screenshot_path" class="detail-item">
          <span class="detail-label">验证截图</span>
          <span class="detail-value">{{ currentLog.screenshot_path }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const logs = ref([])
const detailVisible = ref(false)
const currentLog = ref(null)
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)

const filters = ref({
  type: '',
  action: '',
  operator: ''
})

const getTypeTag = (type) => {
  const map = {
    'domain': 'primary',
    'certificate': 'success',
    'renewal': 'warning',
    'dns': 'info',
    'deployment': 'danger'
  }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = {
    'domain': '域名',
    'certificate': '证书',
    'renewal': '续签',
    'dns': 'DNS',
    'deployment': '部署'
  }
  return map[type] || type
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleString('zh-CN') : '-'
}

const formatJson = (str) => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await api.get('/logs', { 
      params: { 
        ...filters.value,
        page: currentPage.value,
        pageSize: pageSize.value
      } 
    })
    logs.value = res.data.logs
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleView = async (row) => {
  try {
    const res = await api.get(`/logs/${row.id}`)
    currentLog.value = res.data.log
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.logs-page {
  padding: 0;
}
</style>
