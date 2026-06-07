<template>
  <div class="traceability-page">
    <div class="page-header">
      <h1>数据溯源看板</h1>
      <p>追踪每条数据的来源、采集时间和原始信息，确保数据可复查</p>
    </div>

    <div class="card search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="记录类型">
          <el-select v-model="searchForm.record_type" placeholder="选择类型" clearable style="width:160px">
            <el-option label="品牌" value="brand" />
            <el-option label="品牌网店" value="brand_shop" />
            <el-option label="品牌舆情" value="brand_sentiment" />
          </el-select>
        </el-form-item>
        <el-form-item label="记录ID">
          <el-input v-model="searchForm.record_id" placeholder="输入记录ID" style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询溯源
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="traceData.length > 0" class="card">
      <div class="trace-summary">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="记录类型">{{ searchForm.record_type }}</el-descriptions-item>
          <el-descriptions-item label="记录ID">{{ searchForm.record_id }}</el-descriptions-item>
          <el-descriptions-item label="溯源记录数">{{ traceData.length }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-timeline class="trace-timeline">
        <el-timeline-item
          v-for="(item, index) in traceData"
          :key="index"
          :timestamp="formatDate(item.fetched_at)"
          placement="top"
          :type="getSourceType(item.source_type)"
        >
          <div class="trace-card">
            <div class="trace-card-header">
              <el-tag :type="getSourceType(item.source_type)" size="small">{{ item.source_name }}</el-tag>
              <span class="trace-type-badge">{{ item.source_type }}</span>
            </div>
            <div class="trace-card-body" v-if="item.raw_data">
              <pre class="raw-data">{{ formatRawData(item.raw_data) }}</pre>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div v-else-if="searched" class="card empty-state">
      <el-empty description="未找到溯源数据，请检查查询条件" />
    </div>

    <div class="card">
      <div class="section-header">
        <h3>数据源状态</h3>
      </div>
      <el-table :data="dataSources" v-loading="sourceLoading" stripe>
        <el-table-column prop="source_name" label="数据源" min-width="150" />
        <el-table-column prop="source_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.source_type === 'api' ? 'primary' : 'warning'" size="small">{{ row.source_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="api_endpoint" label="端点" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sync_status" label="同步状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.sync_status === 'success' ? 'success' : row.sync_status === 'running' ? 'warning' : 'info'" size="small">
              {{ row.sync_status === 'success' ? '成功' : row.sync_status === 'running' ? '运行中' : '空闲' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_sync_at" label="最近同步" width="180">
          <template #default="{ row }">
            {{ formatDate(row.last_sync_at) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { adminAPI } from '@/utils/api'

const searchForm = reactive({
  record_type: '',
  record_id: ''
})

const traceData = ref([])
const dataSources = ref([])
const sourceLoading = ref(false)
const searched = ref(false)

async function handleSearch() {
  if (!searchForm.record_type || !searchForm.record_id) {
    ElMessage.warning('请选择记录类型并输入记录ID')
    return
  }
  try {
    const res = await adminAPI.getTraceability(searchForm)
    traceData.value = res.data || []
    searched.value = true
  } catch (e) {
    console.error(e)
    traceData.value = []
  }
}

async function loadDataSources() {
  sourceLoading.value = true
  try {
    const res = await adminAPI.getDataSources()
    dataSources.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    sourceLoading.value = false
  }
}

function getSourceType(type) {
  const map = { api: 'primary', crawler: 'warning' }
  return map[type] || 'info'
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function formatRawData(data) {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.stringify(parsed, null, 2)
  } catch {
    return data
  }
}

onMounted(() => {
  loadDataSources()
})
</script>

<style scoped>
.traceability-page { padding-bottom: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #1f2f3d; margin-bottom: 8px; }
.page-header p { color: #606266; font-size: 14px; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
.search-card { margin-bottom: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 { font-size: 18px; font-weight: 600; color: #1f2f3d; }
.trace-summary { margin-bottom: 24px; }
.trace-timeline { padding: 16px 0; }
.trace-card { background: #f8f9fa; border-radius: 8px; padding: 16px; }
.trace-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.trace-type-badge { font-size: 12px; color: #909399; }
.raw-data { background: #f0f2f5; padding: 12px; border-radius: 6px; max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; font-size: 12px; font-family: 'SF Mono',Monaco,monospace; margin: 0; }
.empty-state { padding: 40px; text-align: center; }
</style>
