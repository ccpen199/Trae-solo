<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">欢迎回来，{{ userStore.user?.name }}！</h2>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <div class="card text-center">
          <el-icon size="40" color="#409EFF"><OfficeBuilding /></el-icon>
          <div style="font-size: 32px; font-weight: bold; margin: 10px 0">{{ overview.clubCount }}</div>
          <div style="color: #666">社团总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card text-center">
          <el-icon size="40" color="#67C23A"><User /></el-icon>
          <div style="font-size: 32px; font-weight: bold; margin: 10px 0">{{ overview.studentCount }}</div>
          <div style="color: #666">学生用户</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card text-center">
          <el-icon size="40" color="#E6A23C"><Calendar /></el-icon>
          <div style="font-size: 32px; font-weight: bold; margin: 10px 0">{{ overview.activityCount }}</div>
          <div style="color: #666">已批活动</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card text-center">
          <el-icon size="40" color="#F56C6C"><Bell /></el-icon>
          <div style="font-size: 32px; font-weight: bold; margin: 10px 0">{{ overview.pendingClubs }}</div>
          <div style="color: #666">待审批社团</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <div class="flex-between mb-20">
            <h3>我的社团</h3>
            <el-button type="primary" link @click="$router.push('/my-clubs')">查看全部</el-button>
          </div>
          <el-table :data="myClubs" style="width: 100%">
            <el-table-column prop="name" label="社团名称" />
            <el-table-column prop="member_role" label="我的角色">
              <template #default="{ row }">
                <el-tag size="small" :type="row.member_role === 'leader' ? 'success' : 'info'">
                  {{ row.member_role === 'leader' ? '负责人' : '成员' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="member_count" label="成员数" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="$router.push(`/clubs/${row.id}`)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <div class="flex-between mb-20">
            <h3>最新活动</h3>
            <el-button type="primary" link @click="$router.push('/activities')">查看全部</el-button>
          </div>
          <el-table :data="recentActivities" style="width: 100%">
            <el-table-column prop="title" label="活动名称" />
            <el-table-column prop="club_name" label="所属社团" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag size="small" :type="statusType(row.status)">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="$router.push(`/activities/${row.id}`)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { stats, clubs, activities } from '@/api'
import { OfficeBuilding, User, Calendar, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const overview = ref({ clubCount: 0, studentCount: 0, activityCount: 0, pendingClubs: 0 })
const myClubs = ref([])
const allClubs = ref([])
const recentActivities = ref([])

const displayClubs = computed(() => {
  if (userStore.isAdmin) {
    return allClubs.value.slice(0, 3)
  }
  return myClubs.value.slice(0, 3)
})

const loadData = async () => {
  try {
    const promises = [
      stats.overview(),
      clubs.my().catch(() => ({ data: [] })),
      activities.list({ status: 'approved' })
    ]
    if (userStore.isAdmin) {
      promises.push(clubs.list({ status: 'approved' }).catch(() => ({ data: [] })))
    }
    const [overviewRes, myClubsRes, activitiesRes, allClubsRes] = await Promise.all(promises)
    overview.value = overviewRes.data
    myClubs.value = myClubsRes.data || []
    recentActivities.value = activitiesRes.data.slice(0, 5)
    if (allClubsRes) {
      allClubs.value = allClubsRes.data || []
    }
  } catch (err) {
    console.error(err)
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

onMounted(loadData)
</script>
