<template>
  <div class="project-detail-container">
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card v-if="project" class="project-info-card">
      <template #header>
        <div class="card-header">
          <h2>{{ project.title }}</h2>
          <el-tag :type="getStatusType(project.status)" size="large">
            {{ getStatusName(project.status) }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="执行机构">{{ project.ngo_name }}</el-descriptions-item>
        <el-descriptions-item label="目标金额">¥{{ formatAmount(project.target_amount) }}</el-descriptions-item>
        <el-descriptions-item label="已募集">
          <span style="color: #409EFF; font-weight: 600">¥{{ formatAmount(project.current_amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ project.start_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ project.end_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ project.category || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>项目详情</el-divider>
      <p class="project-description">{{ project.description }}</p>

      <el-divider>募集进度</el-divider>
      <el-progress 
        :percentage="Math.min(100, Math.round((project.current_amount / project.target_amount) * 100))"
        :stroke-width="20"
        :text-inside="true"
        :status="project.status === 'completed' ? 'success' : ''"
      />

      <div v-if="project.status === 'fundraising' && userRole === 'donor'" style="margin-top: 20px">
        <el-button type="primary" size="large" @click="handleDonate">立即捐赠</el-button>
      </div>
    </el-card>

    <el-card v-if="milestones.length > 0" class="card" style="margin-top: 20px">
      <template #header>项目里程碑</template>
      <el-timeline>
        <el-timeline-item
          v-for="milestone in milestones"
          :key="milestone.id"
          :type="milestone.status === 'completed' ? 'success' : 'primary'"
          :timestamp="milestone.deadline || ''"
          placement="top"
        >
          <el-card>
            <h4>{{ milestone.name }}</h4>
            <p>{{ milestone.description }}</p>
            <p>目标金额：¥{{ formatAmount(milestone.target_amount) }}</p>
            <el-tag :type="getStatusType(milestone.status)">
              {{ getStatusName(milestone.status) }}
            </el-tag>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-card v-if="tasks.length > 0" class="card" style="margin-top: 20px">
      <template #header>执行任务</template>
      <el-table :data="tasks" style="width: 100%">
        <el-table-column prop="name" label="任务名称" />
        <el-table-column prop="executor_name" label="执行人" width="120">
          <template #default="scope">
            {{ scope.row.executor_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="scope">
            {{ scope.row.amount ? '¥' + formatAmount(scope.row.amount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="vendor_name" label="供应商" width="150">
          <template #default="scope">
            {{ scope.row.vendor_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTaskStatusType(scope.row.status)">
              {{ getTaskStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="donateDialogVisible" title="捐赠" width="400px">
      <el-form :model="donateForm" label-width="80px">
        <el-form-item label="捐赠金额">
          <el-input-number 
            v-model="donateForm.amount" 
            :min="1" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="donateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="donateLoading" @click="submitDonate">确认捐赠</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { projectApi, donationApi } from '@/api'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const project = ref(null)
const milestones = ref([])
const tasks = ref([])

const donateDialogVisible = ref(false)
const donateLoading = ref(false)
const donateForm = ref({
  amount: 100
})

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

const getTaskStatusType = (status) => {
  const types = {
    'pending': 'info',
    'in_progress': 'primary',
    'submitted': 'warning',
    'approved': 'success'
  }
  return types[status] || 'info'
}

const getTaskStatusName = (status) => {
  const names = {
    'pending': '待分配',
    'in_progress': '执行中',
    'submitted': '已提交',
    'approved': '已完成'
  }
  return names[status] || status
}

const goBack = () => {
  router.back()
}

const fetchProjectDetail = async () => {
  try {
    const result = await projectApi.get(route.params.id)
    if (result.success) {
      project.value = result.project
      milestones.value = result.milestones
      tasks.value = result.tasks
    }
  } catch (error) {
    ElMessage.error('获取项目详情失败')
  }
}

const handleDonate = () => {
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
      project_id: project.value.id,
      amount: donateForm.value.amount
    })
    
    if (result.success) {
      ElMessage.success({
        message: `捐赠成功！捐赠编号：${result.track_id}，证书编号：${result.certificate_no}`,
        duration: 5000
      })
      donateDialogVisible.value = false
      fetchProjectDetail()
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
  fetchProjectDetail()
})
</script>

<style scoped>
.project-info-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .project-description {
    color: #606266;
    line-height: 1.8;
    white-space: pre-wrap;
  }
}
</style>
