<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <div class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filters.module" placeholder="模块" clearable style="width: 150px;" @change="loadData">
          <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
        </el-select>
        <el-select v-model="filters.operation" placeholder="操作" clearable style="width: 150px;" @change="loadData">
          <el-option v-for="o in operations" :key="o" :label="o" :value="o" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="成功" :value="1" />
          <el-option label="失败" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user_name" label="操作人" width="100" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="operation" label="操作" width="120" />
        <el-table-column prop="target_type" label="目标类型" width="100" />
        <el-table-column prop="target_id" label="目标ID" width="80" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180" />
        <el-table-column label="详情" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openDetailDialog(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex-between mt-20">
        <span>共 {{ total }} 条记录</span>
        <el-pagination 
          :current-page="page" 
          :page-size="pageSize" 
          :total="total"
          @current-change="handlePageChange"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="操作人">{{ currentLog.user_name || '系统' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ currentLog.operation }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标类型" :span="1">{{ currentLog.target_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目标ID" :span="1">{{ currentLog.target_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP地址" :span="1">{{ currentLog.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="1">{{ currentLog.created_at }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre style="margin: 0; max-height: 150px; overflow-y: auto; background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 12px;">{{ formatJson(currentLog.request_params) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="返回结果" :span="2">
          <pre style="margin: 0; max-height: 150px; overflow-y: auto; background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 12px;">{{ formatJson(currentLog.response_result) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import api from '../api'

const list = ref([])
const modules = ref([])
const operations = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentLog = ref(null)

const filters = reactive({
  module: '',
  operation: '',
  status: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/logs', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        module: filters.module,
        operation: filters.operation,
        status: filters.status
      }
    })
    list.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadModules = async () => {
  try {
    const res = await api.get('/logs/modules')
    modules.value = res.data.modules
    operations.value = res.data.operations
  } catch (e) {
    console.error(e)
  }
}

const resetFilters = () => {
  filters.module = ''
  filters.operation = ''
  filters.status = ''
  page.value = 1
  loadData()
}

const handlePageChange = (p) => {
  page.value = p
  loadData()
}

const openDetailDialog = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

const formatJson = (str) => {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

onMounted(() => {
  loadData()
  loadModules()
})
</script>
