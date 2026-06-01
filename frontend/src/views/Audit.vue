<template>
  <div>
    <div class="page-header">
      <span class="page-title">审核工作台</span>
      <div>
        <el-tag :type="getStageType(userStage)" size="large">
          {{ getStageText(userStage) }}
        </el-tag>
      </div>
    </div>

    <el-alert 
      v-if="userRole === 'admin'"
      type="info"
      style="margin-bottom: 20px"
      show-icon
    >
      管理员账号可查看所有阶段的审核任务
    </el-alert>

    <el-card>
      <el-table :data="filteredApplications" border stripe empty-text="暂无待审核任务">
        <el-table-column prop="id" label="申请编号" width="90" />
        <el-table-column prop="project_unit" label="项目单位" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="amount" label="申请金额" width="130">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ Number(row.amount).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="申请说明" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
            <el-button 
              link 
              type="success" 
              size="small" 
              v-if="canAudit(row)"
              @click="openAuditDialog(row, 'approve')"
            >通过</el-button>
            <el-button 
              link 
              type="warning" 
              size="small"
              v-if="canAudit(row)"
              @click="openAuditDialog(row, 'return')"
            >退回补正</el-button>
            <el-button 
              link 
              type="danger" 
              size="small"
              v-if="canAudit(row)"
              @click="openAuditDialog(row, 'reject')"
            >拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="auditDialogVisible" :title="getAuditTitle()" width="500px">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核意见">
          <el-input 
            v-model="auditForm.opinion" 
            type="textarea" 
            :rows="4" 
            :placeholder="getOpinionPlaceholder()"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button :type="auditForm.action === 'approve' ? 'success' : 'warning'" @click="submitAudit">
          确认{{ auditForm.action === 'approve' ? '通过' : auditForm.action === 'return' ? '退回' : '拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applicationsApi, auditApi } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const { userRole, currentUser } = useUserStore()

const applications = ref([])
const auditDialogVisible = ref(false)
const currentApplication = ref(null)

const auditForm = ref({
  action: 'approve',
  opinion: ''
})

const userStage = computed(() => {
  if (userRole.value === 'admin') return 'business'
  return userRole.value
})

const filteredApplications = computed(() => {
  if (userRole.value === 'admin') {
    return applications.value.filter(a => a.status === 'pending')
  }
  return applications.value.filter(a => 
    a.current_stage === userRole.value && a.status === 'pending'
  )
})

const canAudit = (row) => {
  if (row.status !== 'pending') return false
  if (userRole.value === 'admin') return true
  return row.current_stage === userRole.value
}

const getStatusType = (status) => {
  const types = { pending: 'info', correction: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}
const getStatusText = (status) => {
  const texts = { pending: '待审核', correction: '待补正', approved: '已通过', rejected: '已拒绝' }
  return texts[status] || status
}

const getStageType = (stage) => {
  const types = { business: 'primary', finance: 'warning', leader: 'danger' }
  return types[stage] || 'info'
}
const getStageText = (stage) => {
  const texts = { business: '业务审核', finance: '财务审核', leader: '领导审批', admin: '系统管理员' }
  return texts[stage] || stage
}

const viewDetail = (row) => {
  router.push(`/applications/${row.id}`)
}

const openAuditDialog = (row, action) => {
  currentApplication.value = row
  auditForm.value = { action, opinion: '' }
  auditDialogVisible.value = true
}

const getAuditTitle = () => {
  const titles = { approve: '审核通过', return: '退回补正', reject: '拒绝申请' }
  return titles[auditForm.value.action]
}

const getOpinionPlaceholder = () => {
  const placeholders = { 
    approve: '请输入审核意见（可选）', 
    return: '请输入退回原因', 
    reject: '请输入拒绝原因' 
  }
  return placeholders[auditForm.value.action]
}

const submitAudit = async () => {
  if (auditForm.value.action !== 'approve' && !auditForm.value.opinion) {
    ElMessage.warning('请输入审核意见')
    return
  }
  
  try {
    let result
    const data = {
      stage: currentApplication.value.current_stage,
      auditor: currentUser.value.name,
      opinion: auditForm.value.opinion
    }
    
    if (auditForm.value.action === 'approve') {
      result = await auditApi.approve(currentApplication.value.id, data)
    } else if (auditForm.value.action === 'return') {
      result = await auditApi.return(currentApplication.value.id, data)
    } else {
      result = await auditApi.reject(currentApplication.value.id, data)
    }
    
    ElMessage.success(result.message)
    auditDialogVisible.value = false
    loadApplications()
  } catch (error) {
    ElMessage.error(error.error || '操作失败')
  }
}

const loadApplications = async () => {
  try {
    applications.value = await applicationsApi.list()
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  loadApplications()
})
</script>
