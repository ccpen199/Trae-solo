<template>
  <div class="data-sources-page">
    <div class="page-header">
      <h1>数据源管理</h1>
      <p>管理多源数据采集渠道，监控同步状态</p>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="loadDataSources">
        <el-icon><Refresh /></el-icon>刷新状态
      </el-button>
      <el-button type="warning" @click="handleRunCollection" :loading="collecting">
        <el-icon><Coin /></el-icon>全量采集
      </el-button>
      <el-button @click="handleCheckUpdates">
        <el-icon><Bell /></el-icon>检查更新
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :lg="12" :md="24" v-for="source in dataSources" :key="source.id">
        <div class="source-card card">
          <div class="source-header">
            <div class="source-info">
              <div class="source-icon" :style="{ background: getSourceColor(source.source_type) }">
                <el-icon :size="20" color="#fff">
                  <Monitor v-if="source.source_type === 'api'" />
                  <ChatDotRound v-else />
                </el-icon>
              </div>
              <div>
                <h4>{{ source.source_name }}</h4>
                <p>{{ source.source_type === 'api' ? 'API 接口' : '网络爬虫' }}</p>
              </div>
            </div>
            <el-tag :type="getStatusType(source.sync_status)" size="small">
              {{ source.sync_status === 'success' ? '同步成功' : source.sync_status === 'running' ? '同步中' : '空闲' }}
            </el-tag>
          </div>

          <div class="source-detail">
            <div class="detail-item">
              <span class="detail-label">端点地址</span>
              <span class="detail-value">{{ source.api_endpoint || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">最近同步</span>
              <span class="detail-value">{{ formatDate(source.last_sync_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">活跃状态</span>
              <el-tag :type="source.is_active ? 'success' : 'info'" size="small">
                {{ source.is_active ? '活跃' : '停用' }}
              </el-tag>
            </div>
          </div>

          <div class="source-actions">
            <el-button type="primary" size="small" @click="handleCollectOne(source)" :disabled="!source.is_active">触发采集</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Wallet, Bell, Monitor, ChatDotRound } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { adminAPI } from '@/utils/api'

const dataSources = ref([])
const collecting = ref(false)

async function loadDataSources() {
  try {
    const res = await adminAPI.getDataSources()
    dataSources.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function handleRunCollection() {
  ElMessageBox.confirm('确定要启动全量数据采集吗？', '提示', { type: 'warning' })
    .then(async () => {
      collecting.value = true
      try {
        await adminAPI.runCollection()
        ElMessage.success('全量采集任务已启动')
        loadDataSources()
      } catch (e) {
        console.error(e)
      } finally {
        collecting.value = false
      }
    }).catch(() => {})
}

async function handleCollectOne(source) {
  try {
    ElMessage.info(`开始从 ${source.source_name} 采集数据...`)
  } catch (e) {
    console.error(e)
  }
}

async function handleCheckUpdates() {
  try {
    await adminAPI.checkUpdates()
    ElMessage.success('更新检查完成')
  } catch (e) {
    console.error(e)
  }
}

function getStatusType(status) {
  const map = { success: 'success', running: 'warning', idle: 'info' }
  return map[status] || 'info'
}

function getSourceColor(type) {
  return type === 'api' ? 'linear-gradient(135deg, #409eff, #1890ff)' : 'linear-gradient(135deg, #e6a23c, #f56c6c)'
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  loadDataSources()
})
</script>

<style scoped>
.data-sources-page { padding-bottom: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #1f2f3d; margin-bottom: 8px; }
.page-header p { color: #606266; font-size: 14px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
.source-card { transition: all 0.3s; }
.source-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.source-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.source-info { display: flex; align-items: center; gap: 12px; }
.source-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.source-info h4 { font-size: 16px; font-weight: 600; color: #1f2f3d; margin: 0 0 2px 0; }
.source-info p { font-size: 13px; color: #909399; margin: 0; }
.source-detail { margin-bottom: 16px; }
.detail-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f2f5; }
.detail-item:last-child { border-bottom: none; }
.detail-label { color: #909399; font-size: 13px; }
.detail-value { color: #303133; font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.source-actions { display: flex; justify-content: flex-end; }
</style>
