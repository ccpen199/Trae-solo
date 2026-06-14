<template>
  <div class="home-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <el-icon size="32" color="#409eff"><Van /></el-icon>
            <span>FastTrust</span>
          </div>
          <div class="user-info">
            <span>{{ userStore.user?.name || userStore.user?.phone }}</span>
            <el-tag :type="getUserTypeTag()">{{ getUserTypeText() }}</el-tag>
            <el-button @click="handleLogout" size="small">退出</el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="page-container">
          <div class="welcome-section">
            <h1>欢迎使用 FastTrust 同城即时交付平台</h1>
            <p>高信任度同城即时服务平台，为您提供非标物品（宠物、生鲜、证件、药品等）与非标服务（跑腿办事、小时工、应急代办）的撮合调度。</p>
          </div>

          <el-row :gutter="20" class="stats-row">
            <el-col :span="8">
              <el-card shadow="hover">
                <el-statistic title="今日任务" :value="stats.todayTasks">
                  <template #prefix>
                    <el-icon><Document /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <el-statistic title="进行中任务" :value="stats.activeTasks">
                  <template #prefix>
                    <el-icon><Loading /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover">
                <el-statistic title="已完成任务" :value="stats.completedTasks">
                  <template #prefix>
                    <el-icon><CircleCheck /></el-icon>
                  </template>
                </el-statistic>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" class="action-row">
            <el-col :span="24">
              <el-card>
                <template #header>
                  <span>快捷操作</span>
                </template>
                <div class="action-buttons">
                  <el-button v-if="userStore.isClient" type="primary" size="large" @click="$router.push('/tasks/create')">
                    <el-icon><Plus /></el-icon>
                    发布新任务
                  </el-button>
                  <el-button v-if="userStore.isClient" type="default" size="large" @click="$router.push('/tasks')">
                    <el-icon><List /></el-icon>
                    我的任务
                  </el-button>
                  <el-button v-if="userStore.isCourier" type="success" size="large" @click="$router.push('/courier/大厅')">
                    <el-icon><Shop /></el-icon>
                    接单大厅
                  </el-button>
                  <el-button v-if="userStore.isCourier" type="default" size="large" @click="$router.push('/tasks')">
                    <el-icon><List /></el-icon>
                    我的任务
                  </el-button>
                  <el-button v-if="userStore.isAdmin" type="warning" size="large" @click="$router.push('/admin')">
                    <el-icon><Setting /></el-icon>
                    管理后台
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" class="recent-row">
            <el-col :span="24">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>最近任务</span>
                    <el-button link type="primary" @click="$router.push('/tasks')">查看更多</el-button>
                  </div>
                </template>
                <el-table :data="recentTasks" style="width: 100%">
                  <el-table-column prop="id" label="任务ID" width="80" />
                  <el-table-column prop="pickup_address" label="取货地址" :show-overflow-tooltip="true" />
                  <el-table-column prop="delivery_address" label="送货地址" :show-overflow-tooltip="true" />
                  <el-table-column prop="final_price" label="价格" width="100">
                    <template #default="{ row }">
                      ¥{{ row.final_price }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                      <span :class="['status-badge', `status-${row.status}`]">
                        {{ getStatusText(row.status) }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="{ row }">
                      {{ formatDate(row.created_at) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                      <el-button link type="primary" @click="$router.push(`/tasks/${row.id}`)">
                        查看
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { taskApi } from '@/api/modules'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  todayTasks: 0,
  activeTasks: 0,
  completedTasks: 0
})

const recentTasks = ref([])

const getUserTypeText = () => {
  const typeMap = {
    client: '委托人',
    courier: '接单人',
    admin: '管理员'
  }
  return typeMap[userStore.userType] || '用户'
}

const getUserTypeTag = () => {
  const tagMap = {
    client: '',
    courier: 'success',
    admin: 'warning'
  }
  return tagMap[userStore.userType] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待接单',
    accepted: '已接单',
    picked_up: '已取货',
    in_transit: '配送中',
    completed: '已完成',
    exception: '异常',
    cancelled: '已取消',
    failed: '失败'
  }
  return statusMap[status] || status
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

const loadTasks = async () => {
  try {
    const res = await taskApi.list()
    if (res.success) {
      recentTasks.value = res.tasks.slice(0, 5)

      const today = new Date().toDateString()
      stats.value.todayTasks = res.tasks.filter(t => new Date(t.created_at).toDateString() === today).length
      stats.value.activeTasks = res.tasks.filter(t => ['accepted', 'picked_up', 'in_transit'].includes(t.status)).length
      stats.value.completedTasks = res.tasks.filter(t => t.status === 'completed').length
    }
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}

.el-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 0;
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.welcome-section h1 {
  margin: 0 0 15px;
  font-size: 28px;
}

.welcome-section p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.stats-row {
  margin-bottom: 20px;
}

.action-row {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
