<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-button type="text" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">任务详情 - {{ task?.task_no || '' }}</h2>
      </div>
      <div>
        <el-button type="primary" @click="handleSubmit" v-if="task?.status === 'pending'">提交执行</el-button>
        <el-button type="primary" @click="openExecuteDialog" v-if="task?.status === 'processing'">执行任务</el-button>
        <el-button type="primary" @click="openReviewDialog" v-if="['completed', 'failed'].includes(task?.status)">复核</el-button>
        <el-button type="danger" @click="handleClose" v-if="['pending', 'processing'].includes(task?.status)">关闭任务</el-button>
      </div>
    </div>

    <el-descriptions :column="4" border class="card-wrapper" v-loading="loading">
      <el-descriptions-item label="任务编号">{{ task?.task_no }}</el-descriptions-item>
      <el-descriptions-item label="客户名称">
        <el-link type="primary" @click="$router.push(`/customers/${task?.customer_id}`)">
          {{ task?.customer_name }}
        </el-link>
      </el-descriptions-item>
      <el-descriptions-item label="任务类型">{{ task?.task_type }}</el-descriptions-item>
      <el-descriptions-item label="优先级">
        <el-tag :type="getPriorityType(task?.priority)" size="small">{{ getPriorityText(task?.priority) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="任务标题" :span="4">{{ task?.task_title }}</el-descriptions-item>
      <el-descriptions-item label="任务描述" :span="4">{{ task?.task_description }}</el-descriptions-item>
      <el-descriptions-item label="负责人">{{ task?.assignee_name || '未分配' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <span :class="['status-badge', `status-${task?.status}`]">{{ getStatusText(task?.status) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="截止日期">{{ task?.due_date || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建人">{{ task?.creator_name }}</el-descriptions-item>
      <el-descriptions-item label="执行结果" :span="2" v-if="task?.execution_result">
        {{ task?.execution_result === 'success' ? '成功' : '失败' }}
      </el-descriptions-item>
      <el-descriptions-item label="执行时间" :span="2" v-if="task?.execution_time">
        {{ task?.execution_time }}
      </el-descriptions-item>
      <el-descriptions-item label="执行备注" :span="4" v-if="task?.execution_remark">
        {{ task?.execution_remark }}
      </el-descriptions-item>
      <el-descriptions-item label="挽回效果" :span="2" v-if="task?.recovery_effect">
        {{ task?.recovery_effect }}
      </el-descriptions-item>
      <el-descriptions-item label="挽回金额" :span="2" v-if="task?.recovered_amount">
        ¥{{ task?.recovered_amount.toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">{{ task?.created_at }}</el-descriptions-item>
      <el-descriptions-item label="版本" :span="2">v{{ task?.version }}</el-descriptions-item>
    </el-descriptions>

    <div class="card-wrapper">
      <div class="detail-section-title">操作记录</div>
      <el-timeline>
        <el-timeline-item
          v-for="item in operations"
          :key="item.id"
          :timestamp="item.operation_time"
          placement="top"
          :type="getOperationType(item.operation_type)"
        >
          <div class="flex-between">
            <strong>{{ getOperationText(item.operation_type) }}</strong>
            <span>{{ item.operator_name || '系统' }}</span>
          </div>
          <p v-if="item.before_status || item.after_status">
            {{ item.before_status ? getStatusText(item.before_status) : '' }} 
            {{ item.before_status && item.after_status ? ' → ' : '' }}
            {{ item.after_status ? getStatusText(item.after_status) : '' }}
          </p>
          <p v-if="item.remark" style="color: #606266;">{{ item.remark }}</p>
        </el-timeline-item>
      </el-timeline>
    </div>

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
import { ArrowLeft } from '@element-plus/icons-vue'
import api from '../../api'

const route = useRoute()
const taskId = route.params.id
const loading = ref(false)
const submitLoading = ref(false)
const task = ref({})
const operations = ref([])
const executeDialogVisible = ref(false)
const reviewDialogVisible = ref(false)

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

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get(`/tasks/${taskId}`)
    task.value = res.data.task
    operations.value = res.data.operations
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await api.post(`/tasks/${taskId}/submit`)
    ElMessage.success('提交成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

const openExecuteDialog = () => {
  executeForm.execution_result = 'success'
  executeForm.execution_remark = ''
  executeForm.recovery_effect = ''
  executeForm.recovered_amount = 0
  executeDialogVisible.value = true
}

const handleExecute = async () => {
  submitLoading.value = true
  try {
    await api.post(`/tasks/${taskId}/execute`, executeForm)
    ElMessage.success('执行完成')
    executeDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const openReviewDialog = () => {
  reviewForm.result = 'pass'
  reviewForm.remark = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  submitLoading.value = true
  try {
    if (reviewForm.result === 'pass') {
      await api.post(`/tasks/${taskId}/review`, reviewForm)
      ElMessage.success('复核通过')
    } else {
      await api.post(`/tasks/${taskId}/reject`, reviewForm)
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

const handleClose = () => {
  ElMessageBox.confirm('确定要关闭此任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.post(`/tasks/${taskId}/close`)
      ElMessage.success('已关闭')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
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

const getOperationType = (type) => {
  const types = {
    create: 'primary',
    submit: 'warning',
    execute: 'primary',
    review: 'success',
    reject: 'danger',
    close: 'info'
  }
  return types[type] || ''
}

const getOperationText = (type) => {
  const texts = {
    create: '创建任务',
    submit: '提交执行',
    execute: '执行任务',
    review: '复核通过',
    reject: '退回补正',
    close: '关闭任务'
  }
  return texts[type] || type
}

onMounted(() => {
  loadData()
})
</script>
