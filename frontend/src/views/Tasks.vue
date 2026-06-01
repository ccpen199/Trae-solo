<template>
  <div class="tasks-page">
    <div class="page-header">
      <h1 class="page-title">续签任务</h1>
      <div style="display: flex; gap: 10px;">
        <el-button type="warning" @click="checkExpiring">
          <el-icon><Warning /></el-icon>
          扫描到期证书
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="filters.status" placeholder="任务状态" style="width: 150px" clearable @change="loadTasks">
          <el-option label="待处理" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已失败" value="failed" />
        </el-select>
        <el-input v-model="filters.assignee" placeholder="负责人" style="width: 150px" clearable @input="loadTasks" />
      </div>

      <el-table :data="tasks" v-loading="loading" stripe>
        <el-table-column prop="common_name" label="证书域名" width="180">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.common_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="task_type" label="任务类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.task_type === 'renewal' ? '续签' : row.task_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="trigger_days" label="触发阈值" width="100">
          <template #default="{ row }">
            <span>{{ row.trigger_days }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="days_left" label="剩余天数" width="100">
          <template #default="{ row }">
            <span v-if="row.days_left !== null" :class="getDaysClass(row.days_left)" class="days-badge">
              {{ row.days_left }}天
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="100" />
        <el-table-column prop="validation_status" label="验证" width="100">
          <template #default="{ row }">
            <span :class="getStatusClass(row.validation_status)" class="status-tag">
              {{ getStatusText(row.validation_status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="issue_status" label="签发" width="100">
          <template #default="{ row }">
            <span :class="getStatusClass(row.issue_status)" class="status-tag">
              {{ getStatusText(row.issue_status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deploy_status" label="部署" width="100">
          <template #default="{ row }">
            <span :class="getStatusClass(row.deploy_status)" class="status-tag">
              {{ getStatusText(row.deploy_status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="verify_status" label="回归" width="100">
          <template #default="{ row }">
            <span :class="getStatusClass(row.verify_status)" class="status-tag">
              {{ getStatusText(row.verify_status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="总状态" width="100">
          <template #default="{ row }">
            <span :class="getTaskStatusClass(row.status)" class="status-tag">
              {{ getTaskStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handleUpdate(row)">更新状态</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="任务详情" width="700px">
      <div v-if="currentTask">
        <div class="detail-item">
          <span class="detail-label">证书域名</span>
          <span class="detail-value">{{ currentTask.common_name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">关联域名</span>
          <span class="detail-value">{{ currentTask.full_domain }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">业务归属</span>
          <span class="detail-value">{{ currentTask.business_owner || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">负责人</span>
          <span class="detail-value">{{ currentTask.assignee || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">到期时间</span>
          <span class="detail-value">{{ formatDate(currentTask.expiry_date) }}</span>
        </div>

        <div class="task-steps">
          <h4 style="margin-bottom: 16px;">续签进度</h4>
          <div class="task-step">
            <div :class="['step-number', currentTask.validation_status]">1</div>
            <div class="step-content">
              <div class="step-title">域名验证</div>
              <div class="step-status">{{ getStatusText(currentTask.validation_status) }}</div>
            </div>
          </div>
          <div class="task-step">
            <div :class="['step-number', currentTask.issue_status]">2</div>
            <div class="step-content">
              <div class="step-title">证书签发</div>
              <div class="step-status">{{ getStatusText(currentTask.issue_status) }}</div>
            </div>
          </div>
          <div class="task-step">
            <div :class="['step-number', currentTask.deploy_status]">3</div>
            <div class="step-content">
              <div class="step-title">部署上线</div>
              <div class="step-status">{{ getStatusText(currentTask.deploy_status) }}</div>
            </div>
          </div>
          <div class="task-step">
            <div :class="['step-number', currentTask.verify_status]">4</div>
            <div class="step-content">
              <div class="step-title">回归检查</div>
              <div class="step-status">{{ getStatusText(currentTask.verify_status) }}</div>
            </div>
          </div>
        </div>

        <div v-if="currentTask.failure_reason" class="detail-item">
          <span class="detail-label">失败原因</span>
          <span class="detail-value" style="color: #f56c6c;">{{ currentTask.failure_reason }}</span>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="updateVisible" title="更新任务状态" width="500px">
      <el-form :model="updateForm" label-width="100px">
        <el-form-item label="更新阶段">
          <el-select v-model="updateForm.field" style="width: 100%;">
            <el-option label="域名验证" value="validation" />
            <el-option label="证书签发" value="issue" />
            <el-option label="部署上线" value="deploy" />
            <el-option label="回归检查" value="verify" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="updateForm.status" style="width: 100%;">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="updateForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" title="创建任务" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="选择证书" prop="cert_id">
          <el-select v-model="form.cert_id" style="width: 100%;" filterable @change="onCertChange">
            <el-option 
              v-for="c in certList" 
              :key="c.id" 
              :label="c.common_name" 
              :value="c.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="触发阈值" prop="trigger_days">
          <el-input-number v-model="form.trigger_days" :min="1" :max="90" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="form.assignee" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Warning } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const submitting = ref(false)
const tasks = ref([])
const certList = ref([])
const detailVisible = ref(false)
const updateVisible = ref(false)
const dialogVisible = ref(false)
const currentTask = ref(null)
const formRef = ref(null)

const filters = ref({
  status: '',
  assignee: ''
})

const form = ref({
  cert_id: null,
  domain_id: null,
  task_type: 'renewal',
  trigger_days: 30,
  assignee: ''
})

const updateForm = ref({
  field: 'validation',
  status: 'completed',
  notes: ''
})

const rules = {
  cert_id: [{ required: true, message: '请选择证书', trigger: 'change' }]
}

const getDaysClass = (days) => {
  if (days <= 7) return 'days-critical'
  if (days <= 30) return 'days-warning'
  return 'days-normal'
}

const getStatusClass = (status) => {
  const map = {
    'pending': 'status-pending',
    'in_progress': 'status-in-progress',
    'completed': 'status-completed',
    'failed': 'status-failed'
  }
  return map[status] || 'status-pending'
}

const getStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'failed': '失败'
  }
  return map[status] || status
}

const getTaskStatusClass = (status) => {
  const map = {
    'pending': 'status-pending',
    'in_progress': 'status-in-progress',
    'completed': 'status-completed',
    'failed': 'status-failed'
  }
  return map[status] || 'status-pending'
}

const getTaskStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'failed': '已失败'
  }
  return map[status] || status
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleString('zh-CN') : '-'
}

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await api.get('/tasks', { params: filters.value })
    tasks.value = res.data.tasks
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadCerts = async () => {
  try {
    const res = await api.get('/certificates')
    certList.value = res.data.certificates
  } catch (e) {
    console.error(e)
  }
}

const checkExpiring = async () => {
  try {
    const res = await api.post('/tasks/check-expiring')
    ElMessage.success(`扫描完成，创建了 ${res.data.created_tasks.length} 个新任务`)
    loadTasks()
  } catch (e) {
    console.error(e)
  }
}

const onCertChange = (certId) => {
  const cert = certList.value.find(c => c.id === certId)
  if (cert) {
    form.value.domain_id = cert.domain_id
  }
}

const handleAdd = () => {
  form.value = {
    cert_id: null,
    domain_id: null,
    task_type: 'renewal',
    trigger_days: 30,
    assignee: ''
  }
  dialogVisible.value = true
}

const handleView = async (row) => {
  try {
    const res = await api.get(`/tasks/${row.id}`)
    currentTask.value = res.data.task
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const handleUpdate = (row) => {
  currentTask.value = row
  updateForm.value = {
    field: 'validation',
    status: 'completed',
    notes: ''
  }
  updateVisible.value = true
}

const submitUpdate = async () => {
  submitting.value = true
  try {
    await api.post(`/tasks/${currentTask.value.id}/update-status`, updateForm.value)
    ElMessage.success('状态更新成功')
    updateVisible.value = false
    loadTasks()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    await api.post('/tasks', form.value)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    loadTasks()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadTasks()
  loadCerts()
})
</script>

<style scoped>
.tasks-page {
  padding: 0;
}
</style>
