<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>纳新报名审批</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待处理" name="pending">
        <div class="card">
          <el-table :data="pendingApplications" style="width: 100%">
            <el-table-column prop="club_name" label="所属社团" />
            <el-table-column prop="campaign_title" label="纳新活动" />
            <el-table-column prop="name" label="申请人" />
            <el-table-column prop="student_id" label="学号" />
            <el-table-column prop="reason" label="申请理由" show-overflow-tooltip />
            <el-table-column prop="applied_at" label="申请时间" />
            <el-table-column label="操作" width="250">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="updateStatus(row, 'interview')">安排面试</el-button>
                <el-button size="small" type="success" link @click="updateStatus(row, 'accepted')">录取</el-button>
                <el-button size="small" type="danger" link @click="updateStatus(row, 'rejected')">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingApplications.length === 0" description="暂无待处理申请" />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="已处理" name="processed">
        <div class="card">
          <el-table :data="processedApplications" style="width: 100%">
            <el-table-column prop="club_name" label="所属社团" />
            <el-table-column prop="campaign_title" label="纳新活动" />
            <el-table-column prop="name" label="申请人" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applied_at" label="申请时间" />
          </el-table>
          <el-empty v-if="processedApplications.length === 0" description="暂无已处理申请" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showInterviewDialog" title="安排面试">
      <el-form :model="interviewForm" label-width="80px">
        <el-form-item label="面试时间">
          <el-date-picker v-model="interviewForm.interview_time" type="datetime" placeholder="选择面试时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInterviewDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmInterview">确认安排</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { recruitment, clubs } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const activeTab = ref('pending')
const applications = ref([])
const myClubs = ref([])
const showInterviewDialog = ref(false)
const currentApplication = ref(null)
const interviewForm = ref({ interview_time: null })

const pendingApplications = computed(() => {
  return applications.value.filter(a => a.status === 'pending' || a.status === 'interview')
})

const processedApplications = computed(() => {
  return applications.value.filter(a => a.status === 'accepted' || a.status === 'rejected')
})

const loadMyClubs = async () => {
  try {
    const res = await clubs.my()
    myClubs.value = res.data
  } catch { }
}

const loadApplications = async () => {
  try {
    const allApps = []
    if (userStore.isAdmin) {
      const campaignsRes = await recruitment.campaigns({})
      for (const c of campaignsRes.data) {
        try {
          const appsRes = await recruitment.applications(c.id)
          appsRes.data.forEach(a => {
            a.club_name = c.club_name
            a.campaign_title = c.title
            allApps.push(a)
          })
        } catch { }
      }
    } else {
      for (const club of myClubs.value) {
        if (club.member_role === 'leader') {
          const campaignsRes = await recruitment.campaigns({ club_id: club.id })
          for (const c of campaignsRes.data) {
            try {
              const appsRes = await recruitment.applications(c.id)
              appsRes.data.forEach(a => {
                a.club_name = club.name
                a.campaign_title = c.title
                allApps.push(a)
              })
            } catch { }
          }
        }
      }
    }
    applications.value = allApps.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
  } catch (err) {
    console.error(err)
  }
}

const updateStatus = async (row, status) => {
  if (status === 'interview') {
    currentApplication.value = row
    interviewForm.value = { interview_time: null }
    showInterviewDialog.value = true
    return
  }

  try {
    const action = status === 'accepted' ? '录取' : '拒绝'
    await ElMessageBox.confirm(`确定要${action}该申请吗？`, '提示', { type: 'warning' })
    await recruitment.updateApplicationStatus(row.id, { status })
    ElMessage.success(`${action}成功`)
    loadApplications()
  } catch { }
}

const confirmInterview = async () => {
  try {
    await recruitment.updateApplicationStatus(currentApplication.value.id, {
      status: 'interview',
      interview_time: interviewForm.value.interview_time
    })
    ElMessage.success('面试已安排')
    showInterviewDialog.value = false
    loadApplications()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const statusType = (status) => {
  const map = { pending: 'warning', interview: 'primary', accepted: 'success', rejected: 'danger' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待处理', interview: '面试中', accepted: '已录取', rejected: '已拒绝' }
  return map[status] || status
}

onMounted(() => {
  loadMyClubs().then(loadApplications)
})
</script>
