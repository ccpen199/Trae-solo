<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>社团详情</h2>
      <div>
        <el-button @click="$router.back()">返回</el-button>
        <el-button type="primary" @click="$router.push(`/funds/${club.id}`)" v-if="isMember">经费管理</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本信息" name="info">
        <div class="card" v-if="club">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="社团名称">{{ club.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType(club.status)">{{ statusText(club.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="负责人">{{ club.leader_name }}</el-descriptions-item>
            <el-descriptions-item label="指导老师">{{ club.teacher_name }}</el-descriptions-item>
            <el-descriptions-item label="成员规模">{{ club.member_count }}/{{ club.max_members }}</el-descriptions-item>
            <el-descriptions-item label="年审状态">
              <el-tag :type="club.annual_review_passed ? 'success' : 'danger'">
                {{ club.annual_review_passed ? '通过' : '未通过' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="活动方向" :span="2">{{ club.activity_direction }}</el-descriptions-item>
            <el-descriptions-item label="社团描述" :span="2">{{ club.description }}</el-descriptions-item>
            <el-descriptions-item label="社团章程" :span="2">{{ club.charter }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="成员管理" name="members">
        <div class="card">
          <div class="flex-between mb-20">
            <h3>成员列表</h3>
            <el-button type="primary" @click="showRecruitment = true" v-if="isLeader">发起纳新</el-button>
          </div>
          <el-table :data="members" style="width: 100%">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="student_id" label="学号" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                <el-tag size="small" :type="row.role === 'leader' ? 'success' : 'info'">
                  {{ row.role === 'leader' ? '负责人' : row.role === 'vice_leader' ? '副负责人' : '成员' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="join_date" label="加入时间" />
            <el-table-column label="操作" width="150" v-if="isLeader">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleRemove(row)" v-if="row.role !== 'leader'">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="年审记录" name="reviews">
        <div class="card">
          <div class="flex-between mb-20">
            <h3>年审记录</h3>
            <el-button type="primary" @click="showSubmitReview = true" v-if="isLeader">提交年审</el-button>
          </div>
          <el-table :data="reviews" style="width: 100%">
            <el-table-column prop="year" label="年度" />
            <el-table-column prop="report" label="年审报告" show-overflow-tooltip />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'passed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'">
                  {{ row.status === 'passed' ? '通过' : row.status === 'failed' ? '未通过' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="review_note" label="审核意见" show-overflow-tooltip />
            <el-table-column prop="reviewer_name" label="审核人" />
            <el-table-column prop="submitted_at" label="提交时间" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="变更历史" name="history">
        <div class="card">
          <el-table :data="history" style="width: 100%">
            <el-table-column prop="user_name" label="用户" />
            <el-table-column prop="action" label="操作">
              <template #default="{ row }">
                <el-tag size="small">{{ actionText(row.action) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="old_role" label="原角色" />
            <el-table-column prop="new_role" label="新角色" />
            <el-table-column prop="operator_name" label="操作人" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showSubmitReview" title="提交年审">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="年度">
          <el-input v-model="reviewForm.year" type="number" />
        </el-form-item>
        <el-form-item label="年审报告">
          <el-input v-model="reviewForm.report" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubmitReview = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReview">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecruitment" title="发起纳新">
      <el-form :model="recruitmentForm" label-width="100px">
        <el-form-item label="纳新标题">
          <el-input v-model="recruitmentForm.title" />
        </el-form-item>
        <el-form-item label="纳新描述">
          <el-input v-model="recruitmentForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="报名条件">
          <el-input v-model="recruitmentForm.requirements" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="面试安排">
          <el-input v-model="recruitmentForm.interview_info" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecruitment = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRecruitment">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { clubs, recruitment } from '@/api'
import { useUserStore } from '@/store/user'

const route = useRoute()
const userStore = useUserStore()
const clubId = route.params.id

const activeTab = ref('info')
const club = ref(null)
const members = ref([])
const reviews = ref([])
const history = ref([])
const showSubmitReview = ref(false)
const showRecruitment = ref(false)

const reviewForm = ref({ year: new Date().getFullYear(), report: '' })
const recruitmentForm = ref({ title: '', description: '', requirements: '', interview_info: '' })

const isLeader = computed(() => {
  return userStore.isAdmin || members.value.some(m => m.user_id === userStore.user?.id && m.role === 'leader')
})

const isMember = computed(() => {
  return members.value.some(m => m.user_id === userStore.user?.id)
})

const loadClub = async () => {
  const res = await clubs.detail(clubId)
  club.value = res.data
}

const loadMembers = async () => {
  const res = await clubs.members(clubId)
  members.value = res.data
}

const loadReviews = async () => {
  const res = await clubs.reviews(clubId)
  reviews.value = res.data
}

const loadHistory = async () => {
  const res = await clubs.history(clubId)
  history.value = res.data
}

const handleRemove = async (row) => {
  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', { type: 'warning' })
    await clubs.removeMember(clubId, row.user_id)
    ElMessage.success('已移除成员')
    loadMembers()
  } catch { }
}

const handleSubmitReview = async () => {
  if (!reviewForm.value.year || !reviewForm.value.report) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await clubs.submitReview(clubId, reviewForm.value)
    ElMessage.success('年审提交成功')
    showSubmitReview.value = false
    reviewForm.value = { year: new Date().getFullYear(), report: '' }
    loadReviews()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '提交失败')
  }
}

const handleCreateRecruitment = async () => {
  if (!recruitmentForm.value.title) {
    ElMessage.warning('请填写纳新标题')
    return
  }
  try {
    await recruitment.createCampaign({ club_id: clubId, ...recruitmentForm.value })
    ElMessage.success('纳新活动创建成功')
    showRecruitment.value = false
    recruitmentForm.value = { title: '', description: '', requirements: '', interview_info: '' }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '创建失败')
  }
}

const statusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'info' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回', suspended: '已暂停' }
  return map[status] || status
}

const actionText = (action) => {
  const map = { join: '加入', remove: '移除', change_leader: '更换负责人' }
  return map[action] || action
}

onMounted(() => {
  loadClub()
  loadMembers()
  loadReviews()
  loadHistory()
})
</script>
