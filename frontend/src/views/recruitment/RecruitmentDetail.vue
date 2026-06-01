<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>纳新详情</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="card mb-20" v-if="campaign">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="活动标题">{{ campaign.title }}</el-descriptions-item>
        <el-descriptions-item label="所属社团">{{ campaign.club_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="campaign.status === 'active' ? 'success' : 'info'">
            {{ campaign.status === 'active' ? '进行中' : campaign.status === 'draft' ? '草稿' : '已结束' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ campaign.created_at }}</el-descriptions-item>
        <el-descriptions-item label="纳新描述" :span="2">{{ campaign.description }}</el-descriptions-item>
        <el-descriptions-item label="报名条件" :span="2">{{ campaign.requirements }}</el-descriptions-item>
        <el-descriptions-item label="面试安排" :span="2">{{ campaign.interview_info }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="flex-between mb-20">
      <h3>立即报名</h3>
      <div v-if="hasApplied">
        <el-tag :type="statusType(myApplication.status)">
          报名状态：{{ statusText(myApplication.status) }}
        </el-tag>
        <span style="margin-left: 10px; color: #999; font-size: 12px;">
          （录取后将自动加入社团）
        </span>
      </div>
      <el-button type="primary" @click="showApplyDialog = true" v-if="!hasApplied && campaign?.status === 'active'">我要报名</el-button>
    </div>

    <div class="card mb-20" v-if="isLeader">
      <div class="flex-between mb-20">
        <h3>报名列表</h3>
      </div>
      <el-table :data="applications" style="width: 100%">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="student_id" label="学号" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="reason" label="申请理由" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="success" link @click="updateStatus(row, 'interview')" v-if="row.status === 'pending'">安排面试</el-button>
            <el-button size="small" type="success" link @click="updateStatus(row, 'accepted')" v-if="row.status === 'pending' || row.status === 'interview'">录取</el-button>
            <el-button size="small" type="danger" link @click="updateStatus(row, 'rejected')" v-if="row.status !== 'accepted' && row.status !== 'rejected'">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showApplyDialog" title="报名纳新">
      <el-form :model="applyForm" label-width="80px">
        <el-form-item label="申请理由">
          <el-input v-model="applyForm.reason" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="applyForm.resume" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleApply">提交报名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { recruitment, clubs } from '@/api'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const campaignId = route.params.id

const campaign = ref(null)
const applications = ref([])
const myClubs = ref([])
const showApplyDialog = ref(false)
const applyForm = ref({ reason: '', resume: '' })

const hasApplied = computed(() => {
  return applications.value.some(a => a.user_id === userStore.user?.id)
})

const myApplication = computed(() => {
  return applications.value.find(a => a.user_id === userStore.user?.id)
})

const isLeader = computed(() => {
  if (userStore.isAdmin) return true
  return myClubs.value.some(c => c.id === campaign.value?.club_id && c.member_role === 'leader')
})

const loadMyClubs = async () => {
  try {
    const res = await clubs.my()
    myClubs.value = res.data
  } catch { }
}

const loadCampaign = async () => {
  const res = await recruitment.campaignDetail(campaignId)
  campaign.value = res.data
}

const loadApplications = async () => {
  try {
    const res = await recruitment.applications(campaignId)
    applications.value = res.data
  } catch { }
}

const handleApply = async () => {
  if (!applyForm.value.reason) {
    ElMessage.warning('请填写申请理由')
    return
  }
  try {
    await recruitment.apply(campaignId, applyForm.value)
    ElMessage.success('报名成功')
    showApplyDialog.value = false
    applyForm.value = { reason: '', resume: '' }
    loadApplications()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '报名失败')
  }
}

const updateStatus = async (row, status) => {
  try {
    await recruitment.updateApplicationStatus(row.id, { status })
    ElMessage.success('操作成功')
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
  loadMyClubs()
  loadCampaign()
  loadApplications()
})
</script>
