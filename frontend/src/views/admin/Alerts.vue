<template>
  <div class="alerts-page">
    <div class="page-header">
      <h1>知识更新预警</h1>
      <p>政策变动、新品上市等事件触发专题修订提醒</p>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="filterStatus" @change="loadAlerts">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="pending">待处理</el-radio-button>
        <el-radio-button label="processed">已处理</el-radio-button>
      </el-radio-group>
      <el-button type="warning" @click="handleCheckUpdates" :loading="checking">
        <el-icon><Refresh /></el-icon>检查更新
      </el-button>
    </div>

    <div class="card">
      <el-table :data="alerts" v-loading="loading" stripe>
        <el-table-column prop="alert_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.alert_type === 'policy' ? 'danger' : 'success'" size="small">
              {{ row.alert_type === 'policy' ? '政策变动' : '新品上市' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="预警标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="is_processed" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_processed ? 'success' : 'danger'" size="small">
              {{ row.is_processed ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="触发时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button v-if="!row.is_processed" type="primary" link size="small" @click="handleProcess(row)">标记已处理</el-button>
            <el-button v-if="row.related_topic_id" type="success" link size="small" @click="goToTopic(row)">查看专题</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card">
      <div class="section-header">
        <h3>预警统计</h3>
      </div>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-card danger">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">待处理预警</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card success">
            <div class="stat-value">{{ processedCount }}</div>
            <div class="stat-label">已处理预警</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card primary">
            <div class="stat-value">{{ alerts.length }}</div>
            <div class="stat-label">总预警数</div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { knowledgeAPI, adminAPI } from '@/utils/api'

const router = useRouter()
const loading = ref(false)
const checking = ref(false)
const alerts = ref([])
const filterStatus = ref('pending')

const pendingCount = computed(() => alerts.value.filter(a => !a.is_processed).length)
const processedCount = computed(() => alerts.value.filter(a => a.is_processed).length)

async function loadAlerts() {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value === 'pending') params.is_processed = 0
    else if (filterStatus.value === 'processed') params.is_processed = 1
    const res = await knowledgeAPI.getAlerts(params)
    alerts.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleProcess(row) {
  try {
    await knowledgeAPI.processAlert(row.id)
    ElMessage.success('已标记为已处理')
    loadAlerts()
  } catch (e) {
    console.error(e)
  }
}

async function handleCheckUpdates() {
  checking.value = true
  try {
    await adminAPI.checkUpdates()
    ElMessage.success('更新检查完成')
    loadAlerts()
  } catch (e) {
    console.error(e)
  } finally {
    checking.value = false
  }
}

function goToTopic(row) {
  router.push(`/knowledge/${row.related_topic_id}`)
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.alerts-page { padding-bottom: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #1f2f3d; margin-bottom: 8px; }
.page-header p { color: #606266; font-size: 14px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 { font-size: 18px; font-weight: 600; color: #1f2f3d; }
.stat-card { background: #fff; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-card .stat-value { font-size: 36px; font-weight: 700; margin-bottom: 8px; }
.stat-card .stat-label { color: #909399; font-size: 14px; }
.stat-card.primary .stat-value { color: #409eff; }
.stat-card.success .stat-value { color: #67c23a; }
.stat-card.danger .stat-value { color: #f56c6c; }
</style>
