<template>
  <div class="admin-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="运营概览" name="overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="admin-stat">
              <div class="admin-stat-label">总用户数</div>
              <div class="admin-stat-value">{{ adminStats?.total_users || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="admin-stat">
              <div class="admin-stat-label">总知识条目</div>
              <div class="admin-stat-value">{{ adminStats?.total_entries || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="admin-stat">
              <div class="admin-stat-label">总标签数</div>
              <div class="admin-stat-value">{{ adminStats?.total_tags || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="admin-stat">
              <div class="admin-stat-label">活跃设备</div>
              <div class="admin-stat-value">{{ adminStats?.active_devices || 0 }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header><h3>同步冲突统计</h3></template>
              <div class="conflict-stats">
                <div class="conflict-stat-item">
                  <span class="label">总冲突数</span>
                  <span class="value">{{ adminStats?.total_conflicts || 0 }}</span>
                </div>
                <div class="conflict-stat-item">
                  <span class="label">待处理冲突</span>
                  <span class="value warning">{{ adminStats?.pending_conflicts || 0 }}</span>
                </div>
                <div class="conflict-stat-item">
                  <span class="label">总分享数</span>
                  <span class="value">{{ adminStats?.total_shares || 0 }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><h3>条目类型分布</h3></template>
              <div class="type-distribution">
                <div v-for="item in adminStats?.entries_by_type || []" :key="item.type" class="type-item">
                  <div class="type-header">
                    <span>{{ getTypeName(item.type) }}</span>
                    <span>{{ item.count }}</span>
                  </div>
                  <el-progress :percentage="getPercentage(item.count)" :stroke-width="12" />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="logs">
        <el-card>
          <div class="logs-header">
            <h3>系统操作日志</h3>
            <el-button @click="loadLogs">刷新</el-button>
          </div>
          <el-table :data="logs" v-loading="loadingLogs">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="user_id" label="用户ID" width="80" />
            <el-table-column prop="action" label="操作" width="120">
              <template #default="{ row }">
                <el-tag :type="getActionType(row.action)">{{ getActionText(row.action) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target_type" label="目标类型" width="120" />
            <el-table-column prop="target_id" label="目标ID" width="80" />
            <el-table-column label="详情" min-width="250">
              <template #default="{ row }">
                <pre v-if="row.details" class="details-pre">{{ JSON.stringify(row.details, null, 2) }}</pre>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="ip_address" label="IP地址" width="130" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="数据库" name="database">
        <el-card>
          <template #header>
            <div class="db-header">
              <h3>数据库管理</h3>
              <el-button type="danger" @click="confirmExport">导出数据</el-button>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="数据库路径">data/app.sqlite</el-descriptions-item>
            <el-descriptions-item label="数据库类型">SQLite 3</el-descriptions-item>
            <el-descriptions-item label="总记录数">
              {{ (adminStats?.total_entries || 0) + (adminStats?.total_conflicts || 0) + (adminStats?.total_shares || 0) }}
            </el-descriptions-item>
            <el-descriptions-item label="上次备份">未设置</el-descriptions-item>
          </el-descriptions>
          <el-alert type="info" class="mt-4" :closable="false">
            所有核心操作均已记录到 operation_logs 表，可通过操作日志页面复查。
          </el-alert>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminStats, getOperationLogs } from '@/api'

const activeTab = ref('overview')
const adminStats = ref(null)
const logs = ref([])
const loadingLogs = ref(false)

function getTypeName(type) {
  const map = { note: '笔记', web_clipping: '网页剪藏', handwritten: '手写摘录', file: '文件' }
  return map[type] || type
}

function getActionType(action) {
  const map = { create: 'success', update: 'primary', delete: 'danger', create_share: 'warning', resolve_conflict: 'success', create_conflict: 'danger' }
  return map[action] || 'info'
}

function getActionText(action) {
  const map = { create: '创建', update: '更新', delete: '删除', create_share: '创建分享', resolve_conflict: '解决冲突', create_conflict: '产生冲突' }
  return map[action] || action
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function getPercentage(count) {
  const total = adminStats?.total_entries || 1
  return Math.round((count / total) * 100)
}

async function loadAdminStats() {
  try {
    adminStats.value = await getAdminStats()
  } catch (e) {
    ElMessage.error('加载统计失败')
  }
}

async function loadLogs() {
  loadingLogs.value = true
  try {
    logs.value = await getOperationLogs(200)
  } catch (e) {
    ElMessage.error('加载日志失败')
  } finally {
    loadingLogs.value = false
  }
}

async function confirmExport() {
  try {
    await ElMessageBox.confirm('确认导出数据库数据？将生成 SQLite 备份文件。', '导出确认', { type: 'info' })
    ElMessage.success('导出功能：请手动复制 data/app.sqlite 文件')
  } catch (e) {
    // cancel
  }
}

onMounted(() => {
  loadAdminStats()
  loadLogs()
})
</script>

<style scoped>
.admin-page {
}
.admin-stat {
  text-align: center;
}
.admin-stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}
.admin-stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.details-pre {
  margin: 0;
  max-height: 100px;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
}
.conflict-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.conflict-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}
.conflict-stat-item .label {
  color: #606266;
}
.conflict-stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}
.conflict-stat-item .value.warning {
  color: #e6a23c;
}
.type-distribution {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.type-item .type-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}
.db-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mt-4 {
  margin-top: 20px;
}
</style>
