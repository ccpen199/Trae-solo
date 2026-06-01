<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>活动中心</h2>
      <el-button type="primary" @click="showCreateDialog = true" v-if="myClubs.length > 0">发布活动</el-button>
    </div>

    <div class="card">
      <el-table :data="activityList" style="width: 100%">
        <el-table-column prop="title" label="活动名称" />
        <el-table-column prop="club_name" label="所属社团" />
        <el-table-column prop="location" label="活动地点" />
        <el-table-column prop="budget" label="预算" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/activities/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreateDialog" title="发布活动" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="所属社团">
          <el-select v-model="createForm.club_id" style="width: 100%">
            <el-option v-for="c in myLeaderClubs" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动名称">
          <el-input v-model="createForm.title" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="活动计划">
          <el-input v-model="createForm.plan" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="活动地点">
          <el-input v-model="createForm.location" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="createForm.start_time" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="createForm.end_time" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input-number v-model="createForm.budget" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="需要审批">
          <el-switch v-model="createForm.needs_approval" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { activities as activitiesApi, clubs } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const activityList = ref([])
const myClubs = ref([])
const showCreateDialog = ref(false)

const createForm = ref({
  club_id: null,
  title: '',
  description: '',
  plan: '',
  location: '',
  start_time: '',
  end_time: '',
  budget: 0,
  needs_approval: false
})

const myLeaderClubs = computed(() => {
  return myClubs.value.filter(c => c.member_role === 'leader' || userStore.isAdmin)
})

const loadActivities = async () => {
  const res = await activitiesApi.list()
  activityList.value = res.data
}

const loadMyClubs = async () => {
  const res = await clubs.my()
  myClubs.value = res.data
}

const handleCreate = async () => {
  if (!createForm.value.club_id || !createForm.value.title) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await activitiesApi.create(createForm.value)
    ElMessage.success('活动发布成功')
    showCreateDialog.value = false
    createForm.value = { club_id: null, title: '', description: '', plan: '', location: '', start_time: '', end_time: '', budget: 0, needs_approval: false }
    loadActivities()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '发布失败')
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
  loadActivities()
  loadMyClubs()
})
</script>
