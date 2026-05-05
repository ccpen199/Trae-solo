<template>
  <div>
    <div class="page-header">
      <h2>审计日志</h2>
      <div class="description">查看系统操作日志，保证诊断过程、参数变更和操作人员都可追溯</div>
    </div>

    <el-card shadow="hover">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action_type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="导出" value="export" />
            <el-option label="导入" value="import" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="全部模块" clearable style="width: 150px">
            <el-option label="车辆档案" value="vehicles" />
            <el-option label="数据采集" value="data_collection" />
            <el-option label="故障诊断" value="faults" />
            <el-option label="标定管理" value="calibration" />
            <el-option label="用户管理" value="users" />
            <el-option label="认证" value="auth" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px;">
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="action_type" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="getActionType(scope.row.action_type)" size="small">
              {{ getActionText(scope.row.action_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120">
          <template #default="scope">
            <el-tag size="small">{{ getModuleText(scope.row.module) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="200" />
        <el-table-column prop="entity_type" label="对象类型" width="120" />
        <el-table-column prop="entity_id" label="对象ID" width="100" />
        <el-table-column prop="user_name" label="操作人" width="100" />
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="详情" width="80">
          <template #default="scope">
            <el-button type="primary" link @click="showDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="showDetailDialog"
      title="日志详情"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionType(currentLog?.action_type)">
            {{ getActionText(currentLog?.action_type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模块">
          {{ getModuleText(currentLog?.module) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作描述">
          {{ currentLog?.description }}
        </el-descriptions-item>
        <el-descriptions-item label="对象类型">
          {{ currentLog?.entity_type || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="对象ID">
          {{ currentLog?.entity_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog?.user_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatTime(currentLog?.created_at) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px;">
        <h4 style="margin-bottom: 10px;">详细数据：</h4>
        <pre style="background: #f5f7fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">
{{ JSON.stringify(currentLog?.old_values, null, 2) || '{}' }}
        </pre>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '../utils/request'

const loading = ref(false)
const showDetailDialog = ref(false)
const currentLog = ref(null)
const logs = ref([])

const searchForm = reactive({
  action_type: '',
  module: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getActionType = (type) => {
  const types = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'danger',
    export: 'info',
    import: 'primary',
  }
  return types[type] || 'info'
}

const getActionText = (type) => {
  const texts = {
    login: '登录',
    logout: '登出',
    create: '创建',
    update: '更新',
    delete: '删除',
    export: '导出',
    import: '导入',
  }
  return texts[type] || type
}

const getModuleText = (module) => {
  const texts = {
    vehicles: '车辆档案',
    data_collection: '数据采集',
    faults: '故障诊断',
    calibration: '标定管理',
    users: '用户管理',
    auth: '认证',
  }
  return texts[module] || module
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    }
    const data = await request.get('/reports/audit-logs', { params })
    logs.value = data.logs
    pagination.total = data.pagination.total
  } catch (err) {
    console.error('获取审计日志失败:', err)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.action_type = ''
  searchForm.module = ''
  pagination.page = 1
  fetchLogs()
}

const showDetail = (row) => {
  currentLog.value = row
  showDetailDialog.value = true
}

onMounted(() => {
  fetchLogs()
})
</script>
