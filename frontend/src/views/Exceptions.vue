<template>
  <div class="exceptions">
    <div class="page-header">
      <h2>异常处理</h2>
    </div>
    
    <el-card>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="处理状态">
          <el-select v-model="filters.handled" placeholder="全部" clearable>
            <el-option label="待处理" :value="false" />
            <el-option label="已处理" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="异常ID" width="160" />
        <el-table-column prop="config_name" label="配置名称" width="150" />
        <el-table-column prop="app_name" label="应用" width="120" />
        <el-table-column prop="error_type" label="错误类型" width="150">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.error_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" show-overflow-tooltip min-width="200" />
        <el-table-column prop="handled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.handled ? 'success' : 'warning'" size="small">
              {{ row.handled ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发生时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleException(row)">
              {{ row.handled ? '查看' : '处理' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showHandleDialog" title="处理异常" width="700px">
      <div v-if="currentException">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="异常ID">{{ currentException.id }}</el-descriptions-item>
          <el-descriptions-item label="错误类型">{{ currentException.error_type }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">{{ currentException.error_message }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider>原始请求</el-divider>
        <pre class="json-preview">{{ currentException.original_request || '{}' }}</pre>
        
        <el-divider>处理信息</el-divider>
        <el-form label-width="100px">
          <el-form-item label="补偿动作">
            <el-input v-model="handleForm.compensation_action" type="textarea" :rows="3" placeholder="记录补偿措施" />
          </el-form-item>
          <el-form-item label="人工备注">
            <el-input v-model="handleForm.manual_remark" type="textarea" :rows="3" placeholder="备注说明" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showHandleDialog = false">关闭</el-button>
        <el-button type="primary" @click="submitHandle" :disabled="currentException?.handled">
          标记已处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { audit } from '@/api'

const list = ref([])
const loading = ref(false)
const showHandleDialog = ref(false)
const currentException = ref(null)

const filters = reactive({
  handled: ''
})

const handleForm = reactive({
  compensation_action: '',
  manual_remark: ''
})

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.handled !== '') {
      params.handled = filters.handled
    }
    const result = await audit.exceptions(params)
    list.value = result.exceptions || []
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.handled = ''
  loadData()
}

const handleException = (row) => {
  currentException.value = row
  handleForm.compensation_action = row.compensation_action || ''
  handleForm.manual_remark = row.manual_remark || ''
  showHandleDialog.value = true
}

const submitHandle = async () => {
  try {
    await audit.handleException(currentException.value.id, handleForm)
    ElMessage.success('处理成功')
    showHandleDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '处理失败')
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

.json-preview {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  margin: 0;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: auto;
  font-size: 12px;
}
</style>
