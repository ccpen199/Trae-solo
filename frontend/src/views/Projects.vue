<template>
  <div class="projects-container">
    <div class="page-header">
      <h1 class="page-title">项目列表</h1>
      <el-tabs v-model="activeTab" class="project-tabs" @tab-click="handleTabChange">
        <el-tab-pane label="全部项目" name="all" />
        <el-tab-pane label="募集中" name="fundraising" />
        <el-tab-pane label="执行中" name="in_progress" />
        <el-tab-pane label="已结项" name="completed" />
      </el-tabs>
    </div>

    <el-row :gutter="20">
      <el-col :span="8" v-for="project in projects" :key="project.id">
        <el-card class="project-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="project-title">{{ project.title }}</span>
              <el-tag :type="getStatusType(project.status)" size="small">
                {{ getStatusName(project.status) }}
              </el-tag>
            </div>
          </template>
          <div class="project-content">
            <div class="project-description">
              {{ project.description.substring(0, 100) }}{{ project.description.length > 100 ? '...' : '' }}
            </div>
            <div class="project-stats">
              <div class="stat-item">
                <span class="stat-label">目标金额</span>
                <span class="stat-value">¥{{ formatAmount(project.target_amount) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已募集</span>
                <span class="stat-value highlight">¥{{ formatAmount(project.current_amount) }}</span>
              </div>
            </div>
            <div class="progress-section">
              <el-progress 
                :percentage="Math.min(100, Math.round((project.current_amount / project.target_amount) * 100))"
                :stroke-width="12"
                :color="getProgressColor(project.status)"
              />
              <div class="progress-info">
                <span>{{ project.ngo_name }}</span>
                <span>{{ Math.round((project.current_amount / project.target_amount) * 100) }}%</span>
              </div>
            </div>
            <div class="card-actions">
              <el-button type="primary" @click="viewProject(project.id)">查看详情</el-button>
              <el-button 
                type="success" 
                v-if="project.status === 'fundraising' && userRole === 'donor'"
                @click="handleDonate(project)"
              >
                立即捐赠
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="projects.length === 0 && loading === false" description="暂无项目数据" />

    <el-dialog v-model="donateDialogVisible" title="捐赠" width="400px">
      <el-form :model="donateForm" label-width="80px">
        <el-form-item label="项目名称">
          <el-input :value="selectedProject?.title" disabled />
        </el-form-item>
        <el-form-item label="捐赠金额">
          <el-input-number 
            v-model="donateForm.amount" 
            :min="1" 
            :precision="2"
            style="width: 100%"
            placeholder="请输入捐赠金额"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="donateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="donateLoading" @click="submitDonate">确认捐赠</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="certificateDialogVisible" title="🎉 电子捐赠证书" width="500px" :close-on-click-modal="false">
      <div class="certificate-container">
        <div class="certificate-header">
          <el-icon :size="48" color="#E6A23C"><Star /></el-icon>
          <h2>捐赠证书</h2>
        </div>
        <div class="certificate-body">
          <p class="thank-you">感谢您的爱心捐赠！</p>
          <el-divider />
          <el-descriptions :column="1" border size="large">
            <el-descriptions-item label="捐赠人">
              <span class="highlight-text">{{ certificateData?.donor_name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="项目名称">
              <span class="highlight-text">{{ certificateData?.project_title }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="捐赠金额">
              <span class="amount-text">¥{{ formatAmount(certificateData?.amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="证书编号">
              <el-tag type="success" size="large">{{ certificateData?.certificate_no }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="溯源编号">
              <el-tag type="info" size="large">{{ certificateData?.track_id }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="签发时间">
              {{ certificateData?.issued_at ? new Date(certificateData.issued_at).toLocaleString() : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="certificate-footer">
          <p class="tip">此证书具有唯一溯源编号，可在"我的捐赠"中随时查看</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="certificateDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { projectApi, donationApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('all')
const projects = ref([])
const loading = ref(false)

const donateDialogVisible = ref(false)
const donateLoading = ref(false)
const selectedProject = ref(null)
const donateForm = ref({
  amount: 100
})

const certificateDialogVisible = ref(false)
const certificateData = ref(null)

const userRole = computed(() => userStore.user?.role)

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

const getProgressColor = (status) => {
  const colors = {
    'fundraising': '#409EFF',
    'in_progress': '#E6A23C',
    'completed': '#67C23A'
  }
  return colors[status] || '#909399'
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? null : activeTab.value
    const result = await projectApi.list(status)
    if (result.success) {
      projects.value = result.projects
    }
  } catch (error) {
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  fetchProjects()
}

const viewProject = (id) => {
  router.push(`/projects/${id}`)
}

const handleDonate = (project) => {
  selectedProject.value = project
  donateForm.value.amount = 100
  donateDialogVisible.value = true
}

const submitDonate = async () => {
  if (!donateForm.value.amount || donateForm.value.amount < 1) {
    ElMessage.warning('请输入有效的捐赠金额')
    return
  }

  donateLoading.value = true
  try {
    const result = await donationApi.create({
      project_id: selectedProject.value.id,
      amount: donateForm.value.amount
    })
    
    if (result.success) {
      donateDialogVisible.value = false
      
      const trackResult = await donationApi.track(result.track_id)
      if (trackResult.success) {
        certificateData.value = {
          ...trackResult.donation,
          certificate_no: trackResult.certificate?.certificate_no,
          issued_at: trackResult.certificate?.issued_at
        }
        certificateDialogVisible.value = true
      } else {
        ElMessage.success({
          message: `捐赠成功！证书编号：${result.certificate_no}`,
          duration: 5000
        })
      }
      
      fetchProjects()
    } else {
      ElMessage.error(result.message || '捐赠失败')
    }
  } catch (error) {
    ElMessage.error('捐赠失败，请稍后重试')
  } finally {
    donateLoading.value = false
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.project-tabs {
  margin-right: 20px;
}

.project-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-content {
  padding: 10px 0;
}

.project-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  min-height: 60px;
}

.project-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stat-value.highlight {
  color: #409EFF;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.certificate-container {
  text-align: center;
}

.certificate-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.certificate-header h2 {
  margin: 15px 0 0;
  font-size: 24px;
  color: #303133;
}

.thank-you {
  font-size: 18px;
  color: #606266;
  margin-bottom: 15px;
}

.highlight-text {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
}

.amount-text {
  font-size: 24px;
  font-weight: 700;
  color: #E6A23C;
}

.certificate-footer {
  margin-top: 20px;
}

.certificate-footer .tip {
  font-size: 12px;
  color: #909399;
}
</style>
