<template>
  <div class="audits-container">
    <div class="page-header">
      <h1 class="page-title">审计管理</h1>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="card">
          <template #header>
            <span>可审计项目</span>
          </template>
          <el-table :data="projects" style="width: 100%" v-loading="loading">
            <el-table-column prop="title" label="项目名称" />
            <el-table-column prop="ngo_name" label="执行机构" width="150" />
            <el-table-column label="金额进度" width="180">
              <template #default="scope">
                <div style="font-size: 12px">
                  <span>¥{{ formatAmount(scope.row.current_amount) }}</span>
                  <span style="color: #909399"> / ¥{{ formatAmount(scope.row.target_amount) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusName(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="viewProject(scope.row.id)">
                  查看详情
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  v-if="scope.row.status === 'fundraising' || scope.row.status === 'in_progress'"
                  @click="handleStartAudit(scope.row)"
                >
                  开始审计
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="projects.length === 0 && !loading" description="暂无项目数据" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card">
          <template #header>
            <span>审计日志</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in auditLogs"
              :key="log.id"
              :timestamp="log.timestamp ? new Date(log.timestamp).toLocaleString() : ''"
              placement="top"
            >
              <h4 style="margin: 0; font-size: 14px">{{ log.actor_name }}</h4>
              <p style="margin: 5px 0; font-size: 12px; color: #909399">
                {{ getLogActionName(log.action) }}
              </p>
              <el-tag :type="getRoleTagType(log.actor_role)" size="small">
                {{ getRoleName(log.actor_role) }}
              </el-tag>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="auditLogs.length === 0" description="暂无审计日志" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="auditDialogVisible" title="完成审计" width="600px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input :value="currentProject?.title" disabled />
        </el-form-item>
        <el-form-item label="审计结论">
          <el-input 
            v-model="auditForm.report_summary" 
            type="textarea" 
            :rows="6"
            placeholder="请输入审计结论和建议"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="auditLoading" @click="submitCompleteAudit">
          完成审计并生成白皮书
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="whitePaperDialogVisible" title="审计白皮书" width="700px">
      <div v-if="whitePaper">
        <h3 style="margin-bottom: 16px">{{ whitePaper.title }}</h3>
        <el-divider />
        <div 
          class="white-paper-content"
          v-html="formatWhitePaperContent(whitePaper.content)"
        ></div>
        <el-divider />
        <div style="display: flex; justify-content: space-between; align-items: center">
          <el-text type="info" size="small">
            文档哈希：{{ whitePaper.document_hash }}
          </el-text>
          <el-text type="info" size="small">
            生成时间：{{ whitePaper.created_at ? new Date(whitePaper.created_at).toLocaleString() : '-' }}
          </el-text>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectApi, auditApi } from '@/api'

const router = useRouter()

const projects = ref([])
const auditLogs = ref([])
const loading = ref(false)

const auditDialogVisible = ref(false)
const auditLoading = ref(false)
const currentProject = ref(null)
const auditForm = reactive({
  report_summary: ''
})

const whitePaperDialogVisible = ref(false)
const whitePaper = ref(null)

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getStatusType = (status) => {
  const types = {
    'pending': 'info',
    'fundraising': 'primary',
    'in_progress': 'warning',
    'completed': 'success'
  }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    'pending': '待审核',
    'fundraising': '募集中',
    'in_progress': '执行中',
    'completed': '已结项'
  }
  return names[status] || status
}

const getLogActionName = (action) => {
  const actions = {
    'login': '登录系统',
    'create_project': '创建项目',
    'approve_project': '审核项目',
    'donate': '进行捐赠',
    'create_task': '创建任务',
    'assign_task': '分配任务',
    'upload_voucher': '上传凭证',
    'approve_task': '审核任务',
    'create_payment': '发起支付',
    'create_audit': '开始审计',
    'complete_audit': '完成审计',
    'add_milestone': '添加里程碑'
  }
  return actions[action] || action
}

const getRoleTagType = (role) => {
  const types = {
    'donor': 'success',
    'ngo': 'primary',
    'executor': 'warning',
    'auditor': 'danger'
  }
  return types[role] || 'info'
}

const getRoleName = (role) => {
  const roles = {
    'donor': '捐赠人',
    'ngo': '公益机构',
    'executor': '执行人',
    'auditor': '审计师'
  }
  return roles[role] || role
}

const formatWhitePaperContent = (content) => {
  if (!content) return ''
  return content
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^- (.*$)/gm, '<p style="margin: 8px 0; padding-left: 20px">• $1</p>')
    .replace(/\n\n/g, '</p><p>')
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const result = await projectApi.list()
    if (result.success) {
      projects.value = result.projects
    }
  } catch (error) {
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

const fetchAuditLogs = async () => {
  try {
    const result = await auditApi.getLogs()
    if (result.success) {
      auditLogs.value = result.logs.slice(0, 10)
    }
  } catch (error) {
    console.error('获取审计日志失败:', error)
  }
}

const viewProject = (id) => {
  router.push(`/projects/${id}`)
}

const handleStartAudit = async (project) => {
  try {
    await ElMessageBox.confirm(`确定要开始审计项目"${project.title}"吗？`, '确认开始', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await auditApi.create({
      project_id: project.id
    })
    
    if (result.success) {
      ElMessage.success('审计已开始')
      currentProject.value = project
      auditForm.report_summary = '经审计，该项目财务记录完整，凭证齐全，符合公益项目透明化要求。'
      auditDialogVisible.value = true
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

const submitCompleteAudit = async () => {
  if (!auditForm.report_summary) {
    ElMessage.warning('请输入审计结论')
    return
  }

  auditLoading.value = true
  try {
    const createResult = await auditApi.create({
      project_id: currentProject.value.id
    })
    
    if (!createResult.success) {
      ElMessage.error(createResult.message || '创建审计失败')
      return
    }

    const completeResult = await auditApi.complete(createResult.audit_id, {
      report_summary: auditForm.report_summary
    })
    
    if (completeResult.success) {
      ElMessage.success('审计已完成，白皮书已生成')
      auditDialogVisible.value = false
      
      if (completeResult.white_paper_id) {
        const wpResult = await auditApi.getWhitePaper(completeResult.white_paper_id)
        if (wpResult.success) {
          whitePaper.value = wpResult.white_paper
          whitePaperDialogVisible.value = true
        }
      }
      
      fetchProjects()
      fetchAuditLogs()
    } else {
      ElMessage.error(completeResult.message || '完成审计失败')
    }
  } catch (error) {
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    auditLoading.value = false
  }
}

onMounted(() => {
  fetchProjects()
  fetchAuditLogs()
})
</script>

<style scoped>
.white-paper-content {
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.white-paper-content h1 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #303133;
}

.white-paper-content h3 {
  font-size: 16px;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #409EFF;
}
</style>
