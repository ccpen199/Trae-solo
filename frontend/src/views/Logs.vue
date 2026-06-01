<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">调用日志</h2>
        <div>
          <el-input v-model="keyword" placeholder="搜索请求/响应" size="small" style="width:220px" clearable />
          <el-select v-model="filter.app_id" placeholder="应用" size="small" style="width:140px; margin-left:8px" clearable>
            <el-option v-for="a in apps" :key="a.id" :label="a.app_name" :value="a.id" />
          </el-select>
          <el-select v-model="filter.status" placeholder="状态" size="small" style="width:110px; margin-left:8px" clearable>
            <el-option label="success" value="success" />
            <el-option label="failed" value="failed" />
            <el-option label="running" value="running" />
          </el-select>
        </div>
      </div>
      <el-divider />
      <el-table :data="rows" size="small" stripe>
        <el-table-column prop="app_name" label="应用" width="140" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="duration_ms" label="耗时(ms)" width="100" />
        <el-table-column prop="started_at" label="开始" width="180" />
        <el-table-column prop="finished_at" label="结束" width="180" />
        <el-table-column prop="request_payload" label="请求" show-overflow-tooltip />
        <el-table-column prop="response_payload" label="响应" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { LogAPI, AppAPI } from '../api'

const rows = ref([])
const apps = ref([])
const keyword = ref('')
const filter = ref({ app_id: '', status: '' })
async function load() {
  const params = { keyword: keyword.value }
  if (filter.value.app_id) params.app_id = filter.value.app_id
  if (filter.value.status) params.status = filter.value.status
  const res = await LogAPI.list(params)
  if (res?.code === 0) rows.value = res.data
}
async function loadApps() {
  const res = await AppAPI.list({})
  if (res?.code === 0) apps.value = res.data
}
onMounted(() => { load(); loadApps() })
watch([keyword, filter], load, { deep: true })
</script>
