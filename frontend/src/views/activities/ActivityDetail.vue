<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>活动详情</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="card mb-20" v-if="activity">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="活动名称">{{ activity.title }}</el-descriptions-item>
        <el-descriptions-item label="所属社团">{{ activity.club_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(activity.status)">{{ statusText(activity.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预算">¥{{ activity.budget }}</el-descriptions-item>
        <el-descriptions-item label="实际花费">¥{{ activity.actual_cost || 0 }}</el-descriptions-item>
        <el-descriptions-item label="活动地点">{{ activity.location }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ activity.start_time }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ activity.end_time }}</el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">{{ activity.description }}</el-descriptions-item>
        <el-descriptions-item label="活动计划" :span="2">{{ activity.plan }}</el-descriptions-item>
        <el-descriptions-item label="活动总结" :span="2">{{ activity.summary || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2" v-if="activity.approval_note">
          {{ activity.approval_note }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="flex-between mb-20">
      <h3>签到记录 ({{ signins.length }}人)</h3>
      <div>
        <el-button type="success" @click="handleSignin" v-if="activity?.status === 'ongoing'">
          立即签到
        </el-button>
        <el-button type="primary" @click="updateActivityStatus('ongoing')" v-if="isLeader && activity?.status === 'approved'">
          开始活动
        </el-button>
        <el-button type="success" @click="showSummaryDialog = true" v-if="isLeader && activity?.status === 'ongoing'">
          结束活动
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="signins" style="width: 100%">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="student_id" label="学号" />
        <el-table-column prop="signin_time" label="签到时间" />
      </el-table>
    </div>

    <el-dialog v-model="showSummaryDialog" title="活动总结">
      <el-form :model="summaryForm" label-width="80px">
        <el-form-item label="活动总结">
          <el-input v-model="summaryForm.summary" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="实际花费">
          <el-input-number v-model="summaryForm.actual_cost" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSummaryDialog = false">取消</el-button>
        <el-button type="primary" @click="handleComplete">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { activities, clubs } from '@/api'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const activityId = route.params.id

const activity = ref(null)
const signins = ref([])
const myClubs = ref([])
const showSummaryDialog = ref(false)
const summaryForm = ref({ summary: '', actual_cost: 0 })

const isLeader = computed(() => {
  return userStore.isAdmin || myClubs.value.some(c => c.id === activity.value?.club_id && c.member_role === 'leader')
})

const loadActivity = async () => {
  const res = await activities.detail(activityId)
  activity.value = res.data
}

const loadSignins = async () => {
  try {
    const res = await activities.signins(activityId)
    signins.value = res.data
  } catch { }
}

const loadMyClubs = async () => {
  try {
    const res = await clubs.my()
    myClubs.value = res.data
  } catch { }
}

const handleSignin = async () => {
  try {
    await activities.signin(activityId)
    ElMessage.success('签到成功')
    loadSignins()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '签到失败')
  }
}

const updateActivityStatus = async (status) => {
  try {
    await activities.updateStatus(activityId, { status })
    ElMessage.success('操作成功')
    loadActivity()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const handleComplete = async () => {
  try {
    await activities.updateStatus(activityId, {
      status: 'completed',
      ...summaryForm.value
    })
    ElMessage.success('活动已完成')
    showSummaryDialog.value = false
    loadActivity()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const statusType = (status) => {
  const map = { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', ongoing: 'primary', completed: '' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', ongoing: '进行中', completed: '已完成' }
  return map[status] || status
}

onMounted(() => {
  loadActivity()
  loadSignins()
  loadMyClubs()
})
</script>
