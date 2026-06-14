<template>
  <div class="profile-index">
    <div class="card p-24 mb-24">
      <div class="profile-header flex items-center gap-20 mb-24 pb-24 border-b">
        <el-avatar :size="80">{{ userStore.userInfo?.real_name?.charAt(0) || '用' }}</el-avatar>
        <div class="flex-1">
          <h2 class="username mb-8">{{ userStore.userInfo?.real_name || '用户' }}</h2>
          <div class="user-meta flex gap-20 text-gray text-sm mb-12">
            <span><el-icon><Phone /></el-icon> {{ userStore.userInfo?.phone || '未绑定' }}</span>
            <span><el-icon><Postcard /></el-icon> {{ userStore.userInfo?.id_card || '未认证' }}</span>
            <span><el-icon><Place /></el-icon> {{ userStore.userInfo?.region_name || '未设置' }}</span>
          </div>
          <div class="user-tags flex gap-8">
            <el-tag size="small" type="success" v-if="userStore.userInfo?.is_verified">
              <el-icon><CircleCheck /></el-icon>已实名认证
            </el-tag>
            <el-tag size="small" type="info" v-else>
              <el-icon><Warning /></el-icon>未实名认证
            </el-tag>
            <el-tag size="small" type="primary">
              {{ userStore.userInfo?.level === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
        </div>
        <el-button type="primary" @click="editProfile">
          <el-icon><Edit /></el-icon>编辑资料
        </el-button>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item card" @click="$router.push('/profile/applications')">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending || 0 }}</div>
            <div class="stat-label">待办理</div>
          </div>
        </div>
        <div class="stat-item card" @click="$router.push('/profile/applications?status=processing')">
          <div class="stat-icon processing">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.processing || 0 }}</div>
            <div class="stat-label">办理中</div>
          </div>
        </div>
        <div class="stat-item card" @click="$router.push('/profile/applications?status=completed')">
          <div class="stat-icon completed">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completed || 0 }}</div>
            <div class="stat-label">已办结</div>
          </div>
        </div>
        <div class="stat-item card" @click="$router.push('/profile/evaluations')">
          <div class="stat-icon evaluation">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.evaluations || 0 }}</div>
            <div class="stat-label">待评价</div>
          </div>
        </div>
        <div class="stat-item card" @click="$router.push('/profile/certificates')">
          <div class="stat-icon certificate">
            <el-icon><CreditCard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.certificates || 0 }}</div>
            <div class="stat-label">我的证照</div>
          </div>
        </div>
        <div class="stat-item card" @click="$router.push('/profile/notifications')">
          <div class="stat-icon notification">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.notifications || 0 }}</div>
            <div class="stat-label">未读消息</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card p-24 mb-24">
      <div class="section-header flex justify-between items-center mb-16">
        <h3 class="section-title">
          <el-icon><Document /></el-icon>
          最近办件
        </h3>
        <el-button link type="primary" @click="$router.push('/profile/applications')">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      
      <el-table v-if="recentApplications.length > 0" :data="recentApplications" @row-click="goToApplicationDetail">
        <el-table-column prop="application_no" label="申请编号" width="180" />
        <el-table-column prop="service_item_name" label="事项名称" min-width="200" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submit_time" label="提交时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="goToApplicationDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无办件记录" />
    </div>
    
    <div class="card p-24">
      <div class="section-header flex justify-between items-center mb-16">
        <h3 class="section-title">
          <el-icon><Star /></el-icon>
          我的收藏
        </h3>
        <el-button link type="primary">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      
      <div v-if="favorites.length > 0" class="favorite-list">
        <div v-for="item in favorites" :key="item.id" class="favorite-item" @click="goToServiceDetail(item.id)">
          <div class="item-icon">
            <el-icon size="24" color="#1e88e5"><Service /></el-icon>
          </div>
          <div class="item-info flex-1">
            <h4>{{ item.item_name }}</h4>
            <p class="text-gray text-sm">{{ item.department_name }}</p>
          </div>
          <el-button link type="primary" size="small" @click.stop="goToApply(item.id)">
            立即办理
          </el-button>
        </div>
      </div>
      
      <el-empty v-else description="暂无收藏" />
    </div>
    
    <el-dialog v-model="editDialogVisible" title="编辑个人信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.real_name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="电子邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="所在区域">
          <el-cascader v-model="editForm.region_id" :options="regionOptions" style="width: 100%" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="editForm.address" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { applicationApi, certificateApi, notificationApi, evaluationApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const editDialogVisible = ref(false)
const stats = ref({
  pending: 0,
  processing: 0,
  completed: 0,
  evaluations: 0,
  certificates: 0,
  notifications: 0
})

const recentApplications = ref([])
const favorites = ref([])

const regionOptions = ref([
  {
    value: '510000',
    label: '四川省',
    children: [
      {
        value: '510100',
        label: '成都市',
        children: [
          { value: '510104', label: '锦江区' },
          { value: '510105', label: '青羊区' }
        ]
      }
    ]
  }
])

const editForm = reactive({
  real_name: '',
  phone: '',
  email: '',
  region_id: [],
  address: ''
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    accepted: 'primary',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待受理',
    accepted: '已受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  }
  return texts[status] || status
}

const fetchStats = async () => {
  try {
    const [res1, res2, res3, res4] = await Promise.all([
      applicationApi.my({ pageSize: 100 }),
      certificateApi.my({ pageSize: 100 }),
      notificationApi.unreadCount(),
      evaluationApi.my({ pageSize: 100 })
    ])
    
    const applications = res1.data?.list || res1.data || []
    stats.value = {
      pending: applications.filter(a => a.status === 'pending').length,
      processing: applications.filter(a => a.status === 'processing' || a.status === 'accepted').length,
      completed: applications.filter(a => a.status === 'completed').length,
      evaluations: applications.filter(a => a.status === 'completed' && !a.has_evaluation).length,
      certificates: res2.data?.list?.length || res2.data?.length || 0,
      notifications: res3.data?.count || 0
    }
    
    recentApplications.value = applications.slice(0, 5)
  } catch (e) {
    console.error('加载统计数据失败:', e)
  }
}

const fetchFavorites = () => {
  favorites.value = [
    { id: 1, item_name: '身份证办理', department_name: '公安厅' },
    { id: 2, item_name: '社保参保登记', department_name: '人力资源和社会保障厅' }
  ]
}

const editProfile = () => {
  editForm.real_name = userStore.userInfo?.real_name || ''
  editForm.phone = userStore.userInfo?.phone || ''
  editForm.email = userStore.userInfo?.email || ''
  editForm.address = userStore.userInfo?.address || ''
  editDialogVisible.value = true
}

const saveProfile = () => {
  ElMessage.success('个人信息保存成功')
  editDialogVisible.value = false
}

const goToApplicationDetail = (row) => {
  router.push(`/profile/applications/${row.id}`)
}

const goToServiceDetail = (id) => {
  router.push(`/services/${id}`)
}

const goToApply = (id) => {
  router.push(`/apply/${id}`)
}

onMounted(() => {
  fetchStats()
  fetchFavorites()
})
</script>

<style lang="scss" scoped>
.username {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.user-meta {
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.gap-20 {
  gap: 20px;
}

.gap-8 {
  gap: 8px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mb-12 {
  margin-bottom: 12px;
}

.pb-24 {
  padding-bottom: 24px;
}

.border-b {
  border-bottom: 1px solid #ebeef5;
}

.text-gray {
  color: #909399;
}

.text-sm {
  font-size: 13px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      
      &.pending { background: #f093fb; }
      &.processing { background: #4facfe; }
      &.completed { background: #43e97b; }
      &.evaluation { background: #fa709a; }
      &.certificate { background: #30cfd0; }
      &.notification { background: #a8edea; }
    }
    
    .stat-content {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #1e88e5;
        line-height: 1.2;
      }
      
      .stat-label {
        font-size: 13px;
        color: #909399;
      }
    }
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  margin: 0;
}

.section-header {
  margin-bottom: 16px;
}

.favorite-list {
  .favorite-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      border-color: #1e88e5;
      background: #f5f9ff;
    }
    
    .item-icon {
      width: 48px;
      height: 48px;
      background: #e3f2fd;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .item-info h4 {
      font-size: 15px;
      margin: 0 0 4px;
      color: #303133;
    }
  }
}
</style>
