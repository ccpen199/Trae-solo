<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">活动审批</h2>
    <div class="card">
      <el-table :data="activities" style="width: 100%">
        <el-table-column prop="title" label="活动名称" />
        <el-table-column prop="club_name" label="所属社团" />
        <el-table-column prop="location" label="地点" />
        <el-table-column prop="budget" label="预算" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/activities/${row.id}`)">详情</el-button>
            <el-button type="success" link size="small" @click="approveActivity(row, 'approved')" v-if="row.status === 'pending'">
              通过
            </el-button>
            <el-button type="danger" link size="small" @click="openRejectDialog(row)" v-if="row.status === 'pending'">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showRejectDialogVisible" title="驳回原因">
      <el-input v-model="rejectNote" type="textarea" :rows="4" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="showRejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { activities as activitiesApi } from '@/api'

const activityList = ref([])
const showRejectDialogVisible = ref(false)
const currentActivity = ref(null)
const rejectNote = ref('')

const activities = computed(() => activityList.value.filter(a => a.status === 'pending' || a.status === 'approved' || a.status === 'rejected'))

const loadActivities = async () => {
  const res = await activitiesApi.list()
  activityList.value = res.data
}

const approveActivity = async (row, status) => {
  try {
    await activitiesApi.approve(row.id, { status, approval_note: '' })
    ElMessage.success('审批成功')
    loadActivities()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const openRejectDialog = (row) => {
  currentActivity.value = row
  rejectNote.value = ''
  showRejectDialogVisible.value = true
}

const confirmReject = async () => {
  try {
    await activitiesApi.approve(currentActivity.value.id, { status: 'rejected', approval_note: rejectNote.value })
    ElMessage.success('已驳回')
    showRejectDialogVisible.value = false
    loadActivities()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const statusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', ongoing: 'primary', completed: '' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回', ongoing: '进行中', completed: '已完成' }
  return map[status] || status
}

onMounted(loadActivities)
</script>
