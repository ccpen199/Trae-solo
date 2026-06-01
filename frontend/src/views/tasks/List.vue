<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">挽回任务</h2>
      <div>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
        <el-button type="primary" @click="openExportDialog">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select v-model="filters.priority" placeholder="优先级" clearable style="width: 120px;" @change="loadData">
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
          <el-option label="紧急" value="urgent" />
        </el-select>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="task_no" label="任务编号" width="150" />
        <el-table-column prop="customer_name" label="客户名称" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/customers/${row.customer_id}`)">{{ row.customer_name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="task_title" label="任务标题" min-width="180" />
        <el-table-column prop="task_type" label="类型" width="100" />
        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ getPriorityText(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="负责人" width="100" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="['status-badge', `status-${row.status}`]">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日期" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/tasks/${row.id}`)">详情</el-button>
            <el-button type="primary" size="small" link @click="handleSubmit(row)" v-if="row.status === 'pending'">提交</el-button>
            <el-button type="primary" size="small" link @click="openExecuteDialog(row)" v-if="row.status === 'processing'">执行</el-button>
            <el-button type="primary" size="small" link @click="openReviewDialog(row)" v-if="['completed', 'failed'].includes(row.status)">复核</el-button>
            <el-button type="danger" size="small" link @click="handleClose(row)" v-if="['pending', 'processing'].includes(row.status)">关闭</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="客户" prop="customer_id">
          <el-select v-model="form.customer_id" style="width: 100%;" filterable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型" prop="task_type">
          <el-select v-model="form.task_type" style="width: 100%;">
            <el-option label="电话回访" value="phone" />
            <el-option label="上门拜访" value="visit" />
            <el-option label="优惠活动" value="discount" />
            <el-option label="专属客服" value="service" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务标题" prop="task_title">
          <el-input v-model="form.task_title" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.task_description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="form.assignee_id" style="width: 100%;">
            <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority">
            <el-radio value="low">低</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="urgent">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="form.due_date" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="executeDialogVisible" title="执行任务" width="500px">
      <el-form :model="executeForm" label-width="100px">
        <el-form-item label="执行结果">
          <el-radio-group v-model="executeForm.execution_result">
            <el-radio value="success">成功</el-radio>
            <el-radio value="failed">失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="执行备注">
          <el-input v-model="executeForm.execution_remark" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="挽回效果">
          <el-input v-model="executeForm.recovery_effect" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="挽回金额">
          <el-input-number v-model="executeForm.recovered_amount" :min="0" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="executeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleExecute">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="复核任务" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复核结果">
          <el-radio-group v-model="reviewForm.result">
            <el-radio value="pass">通过</el-radio>
            <el-radio value="reject">退回补正</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核意见">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleReview">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search } from '@element-plus/icons-vue'
import api from '../../api'

const route = useRoute()
const list = ref([])
const customers = ref([])
const users = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const executeDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const currentTask = ref(null)

const filters = reactive({
  status: '',
  priority: ''
})

const form = reactive({
  customer_id: null,
  assessment_id: null,
  task_type: 'phone',
  task_title: '',
  task_description: '',
  assignee_id: null,
  priority: 'medium',
  due_date: ''
})

const executeForm = reactive({
  execution_result: 'success',
  execution_remark: '',
  recovery_effect: '',
  recovered_amount: 0
})

const reviewForm = reactive({
  result: 'pass',
  remark: ''
})

const rules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  task_type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  task_title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/tasks', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        status: filters.status,
        priority: filters.priority
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

const loadCustomers = async () => {
  try {
    const res = await api.get('/customers', { params: { pageSize: 1000 } })
    customers.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

const loadUsers = async () => {
  try {
    const res = await api.get('/config/users')
    users.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.priority = ''
  page.value = 1
  loadData()
}

const handlePageChange = (p) => {
  page.value = p
  loadData()
}

const openCreateDialog = () => {
  dialogTitle.value = '新建任务'
  if (route.query.customerId) {
    form.customer_id = parseInt(route.query.customerId)
  }
  if (route.query.assessmentId) {
    form.assessment_id = parseInt(route.query.assessmentId)
  }
  form.task_title = ''
  form.task_description = ''
  form.assignee_id = null
  form.priority = 'medium'
  form.due_date = ''
  dialogVisible.value = true
}

const handleSubmitCreate = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await api.post('/tasks', form)
      ElMessage.success('创建成功')
      dialogVisible.value = false
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      submitLoading.value = false
    }
  })
}

const handleSubmit = async (row) => {
  try {
    await api.post(`/tasks/${row.id}/submit`)
    ElMessage.success('提交成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

const openExecuteDialog = (row) => {
  currentTask.value = row
  executeForm.execution_result = 'success'
  executeForm.execution_remark = ''
  executeForm.recovery_effect = ''
  executeForm.recovered_amount = 0
  executeDialogVisible.value = true
}

const handleExecute = async () => {
  if (!currentTask.value) return
  submitLoading.value = true
  try {
    await api.post(`/tasks/${currentTask.value.id}/execute`, executeForm)
    ElMessage.success('执行完成')
    executeDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const openReviewDialog = (row) => {
  currentTask.value = row
  reviewForm.result = 'pass'
  reviewForm.remark = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  if (!currentTask.value) return
  submitLoading.value = true
  try {
    if (reviewForm.result === 'pass') {
      await api.post(`/tasks/${currentTask.value.id}/review`, reviewForm)
      ElMessage.success('复核通过')
    } else {
      await api.post(`/tasks/${currentTask.value.id}/reject`, reviewForm)
      ElMessage.success('已退回补正')
    }
    reviewDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const handleClose = (row) => {
  ElMessageBox.confirm('确定要关闭此任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.post(`/tasks/${row.id}/close`)
      ElMessage.success('已关闭')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const openExportDialog = async () => {
  try {
    const res = await api.get('/statistics/export', {
      params: { type: 'tasks' },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `挽回任务数据_${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const getPriorityType = (priority) => {
  const types = { low: 'info', medium: 'warning', high: 'danger', urgent: 'danger' }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return texts[priority] || priority
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return texts[status] || status
}

onMounted(() => {
  loadData()
  loadCustomers()
  loadUsers()
  if (route.query.create === '1') {
    setTimeout(() => openCreateDialog(), 500)
  }
})
</script>
