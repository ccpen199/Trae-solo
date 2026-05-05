<template>
  <div class="approval-detail-container">
    <el-card v-if="loading">
      <el-skeleton :rows="10" animated />
    </el-card>
    
    <el-card v-else-if="approval">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>审批详情</span>
          <div>
            <router-link to="/approval/list">
              <el-button>返回列表</el-button>
            </router-link>
          </div>
        </div>
      </template>
      
      <el-steps :active="getActiveStep()" align-center finish-status="success">
        <el-step title="提交申请" :description="getStepStatus(1)" />
        <el-step title="部门审批" :description="getStepStatus(2)" />
        <el-step title="人事审批" :description="getStepStatus(3)" />
        <el-step title="校长审批" :description="getStepStatus(4)" />
        <el-step title="完成" :description="getStepStatus(5)" />
      </el-steps>
      
      <el-row :gutter="20" style="margin-top: 40px;">
        <el-col :span="18">
          <el-descriptions title="审批信息" :column="3" border>
            <el-descriptions-item label="审批类型">{{ approval.type_label }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(approval.status)">
                {{ approval.status_label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="进度">{{ approval.progress }}</el-descriptions-item>
            <el-descriptions-item label="预计转正日期">{{ approval.expect_regular_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDate(approval.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(approval.updated_at) }}</el-descriptions-item>
          </el-descriptions>
          
          <el-descriptions title="教师信息" :column="3" border style="margin-top: 20px;">
            <el-descriptions-item label="教师姓名">{{ approval.teacher_name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ approval.gender || '-' }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ approval.department_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ approval.position || '-' }}</el-descriptions-item>
            <el-descriptions-item label="入职日期">{{ approval.entry_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getTeacherStatusType(approval.teacher_status)">
                {{ approval.teacher_status_label }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-card style="margin-top: 20px;">
            <template #header>
              <span>审批历史</span>
            </template>
            
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in approval.history"
                :key="item.id"
                :timestamp="formatDate(item.action_time)"
                :type="getTimelineType(item.action)"
                :icon="getTimelineIcon(item.action)"
                placement="top"
              >
                <el-card shadow="never">
                  <h4 style="margin: 0; font-weight: bold;">
                    {{ item.approver }}
                    <el-tag :type="getActionType(item.action)" size="small" style="margin-left: 10px;">
                      {{ item.action_label }}
                    </el-tag>
                  </h4>
                  <p style="margin: 5px 0 0; color: #909399; font-size: 12px;">
                    部门: {{ item.department }} | 步骤: 第 {{ item.step }} 步
                  </p>
                  <p v-if="item.comment" style="margin: 10px 0 0; color: #606266;">
                    意见: {{ item.comment }}
                  </p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            
            <el-empty v-if="!approval.history || approval.history.length === 0" description="暂无审批记录" />
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card>
            <template #header>
              <span>当前状态</span>
            </template>
            
            <div class="status-info">
              <el-tag :type="getStatusType(approval.status)" size="large" style="width: 100%; text-align: center;">
                {{ approval.status_label }}
              </el-tag>
              
              <div class="step-info" style="margin-top: 20px;">
                <div class="step-item">
                  <span class="step-label">当前步骤</span>
                  <span class="step-value">第 {{ approval.current_step }} 步</span>
                </div>
                <div class="step-item">
                  <span class="step-label">总步骤</span>
                  <span class="step-value">{{ approval.total_steps }} 步</span>
                </div>
                <div class="step-item">
                  <span class="step-label">完成度</span>
                  <span class="step-value">{{ Math.round((approval.current_step / approval.total_steps) * 100) }}%</span>
                </div>
              </div>
            </div>
          </el-card>
          
          <el-card v-if="approval.status === 'pending'" style="margin-top: 20px;">
            <template #header>
              <span>快捷操作</span>
            </template>
            
            <el-button type="primary" style="width: 100%; margin-bottom: 10px;" @click="processApproval('approve')">
              <el-icon><CircleCheck /></el-icon>
              通过审批
            </el-button>
            
            <el-button type="danger" style="width: 100%;" @click="processApproval('reject')">
              <el-icon><CircleClose /></el-icon>
              驳回审批
            </el-button>
          </el-card>
          
          <el-card style="margin-top: 20px;">
            <template #header>
              <span>相关操作</span>
            </template>
            
            <router-link :to="`/teacher/detail/${approval.teacher_id}`" style="display: block;">
              <el-button style="width: 100%; margin-bottom: 10px;">
                <el-icon><User /></el-icon>
                查看教师详情
              </el-button>
            </router-link>
            
            <router-link to="/approval/list" style="display: block;">
              <el-button style="width: 100%;">
                <el-icon><ArrowLeft /></el-icon>
                返回审批列表
              </el-button>
            </router-link>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <el-card v-else>
      <el-empty description="审批记录不存在" />
    </el-card>
    
    <el-dialog
      v-model="processDialogVisible"
      :title="processAction === 'approve' ? '通过审批' : '驳回审批'"
      width="500px"
    >
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="审批人">
          <el-input v-model="processForm.approver" placeholder="请输入审批人姓名" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="processForm.department" placeholder="请输入审批部门" />
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="processForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见（选填）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button :type="processAction === 'approve' ? 'primary' : 'danger'" @click="submitProcess" :loading="processing">
          {{ processAction === 'approve' ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const processing = ref(false)
const processDialogVisible = ref(false)
const processAction = ref('approve')

const approval = ref(null)

const processForm = reactive({
  approver: '',
  department: '',
  comment: ''
})

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || 'info'
}

const getTeacherStatusType = (status) => {
  const map = {
    'probation': 'warning',
    'regular': 'success',
    'resigned': 'info',
    'fired': 'danger'
  }
  return map[status] || 'info'
}

const getActionType = (action) => {
  const map = {
    'submit': 'info',
    'approve': 'success',
    'reject': 'danger',
    'complete': 'primary'
  }
  return map[action] || 'info'
}

const getTimelineType = (action) => {
  const map = {
    'submit': 'primary',
    'approve': 'success',
    'reject': 'danger',
    'complete': 'success'
  }
  return map[action] || 'info'
}

const getTimelineIcon = (action) => {
  if (action === 'approve' || action === 'complete') return 'CircleCheck'
  if (action === 'reject') return 'CircleClose'
  return 'Document'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const getActiveStep = () => {
  if (!approval.value) return 0
  
  if (approval.value.status === 'approved') return 5
  if (approval.value.status === 'rejected') return approval.value.current_step
  return approval.value.current_step
}

const getStepStatus = (step) => {
  if (!approval.value) return ''
  
  const activeStep = getActiveStep()
  
  if (step > activeStep) return '待处理'
  if (step === activeStep) {
    if (approval.value.status === 'approved') return '已完成'
    if (approval.value.status === 'rejected') return '已驳回'
    return '处理中'
  }
  return '已完成'
}

const loadApproval = async () => {
  let id = route.params.id || route.query.id
  if (!id) return
  
  loading.value = true
  
  try {
    const res = await api.get(`/approvals/${id}`)
    if (res.success) {
      approval.value = res.data
    }
  } catch (error) {
    console.error('加载审批详情失败:', error)
  } finally {
    loading.value = false
  }
}

const processApproval = (action) => {
  processAction.value = action
  processForm.approver = ''
  processForm.department = ''
  processForm.comment = ''
  processDialogVisible.value = true
}

const submitProcess = async () => {
  if (!approval.value?.id) {
    ElMessage.error('审批信息不完整')
    return
  }
  
  processing.value = true
  
  try {
    const res = await api.post(`/approvals/${approval.value.id}/process`, {
      action: processAction.value,
      approver: processForm.approver.trim() || '系统管理员',
      department: processForm.department.trim() || '管理部门',
      comment: processForm.comment || undefined
    })
    
    if (res.success) {
      ElMessage.success(res.message || '审批操作成功')
      processDialogVisible.value = false
      loadApproval()
    }
  } catch (error) {
    console.error('处理审批失败:', error)
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadApproval()
})
</script>

<style scoped>
.approval-detail-container {
  width: 100%;
}

.status-info {
  text-align: center;
  padding: 10px 0;
}

.step-info {
  text-align: left;
}

.step-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.step-label {
  color: #909399;
}

.step-value {
  font-weight: bold;
  color: #606266;
}

:deep(.el-timeline-item__tail) {
  border-left: 2px solid #e4e7ed;
}
</style>
