<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <h2>欢迎回来，{{ userStore.userName }}</h2>
      <p class="role-info">
        您当前的角色：
        <el-tag :type="roleTagType" size="large">
          {{ userStore.getRoleName(userStore.currentRole!) }}
        </el-tag>
      </p>
      <p class="date-info">{{ currentDate }}</p>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" v-for="stat in stats" :key="stat.label">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
            <el-icon class="stat-icon" :style="{ color: stat.iconColor }">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <el-progress
            v-if="stat.showProgress"
            :percentage="stat.progress"
            :color="stat.progressColor"
            :stroke-width="6"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :md="12">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-tag type="danger">{{ todoList.length }}</el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in todoList"
              :key="index"
              :type="item.type"
              :timestamp="item.time"
              placement="top"
            >
              <el-card shadow="hover" class="todo-card" @click="handleTodoClick(item)">
                <div class="todo-title">
                  <el-tag :type="item.tagType" size="small">{{ item.category }}</el-tag>
                  <span>{{ item.title }}</span>
                </div>
                <p class="todo-desc">{{ item.description }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>最近通知</span>
              <el-button type="primary" text @click="goToNotifications">查看全部</el-button>
            </div>
          </template>
          <el-list>
            <el-list-item
              v-for="(notification, index) in recentNotifications"
              :key="index"
              class="notification-item"
            >
              <el-avatar :size="36" :style="{ backgroundColor: notification.avatarBg }">
                <el-icon>
                  <component :is="notification.icon" />
                </el-icon>
              </el-avatar>
              <el-list-item-content class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ notification.title }}</span>
                  <span class="notification-time">{{ notification.time }}</span>
                </div>
                <p class="notification-message">{{ notification.message }}</p>
              </el-list-item-content>
              <el-tag v-if="!notification.isRead" type="danger" size="small">未读</el-tag>
            </el-list-item>
          </el-list>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row" v-if="showRoleSpecificContent">
      <el-col :xs="24" :md="12" v-if="userStore.isDesigner || userStore.isAdmin">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>款式状态分布</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="草稿" :span="1">
                <el-tag type="info">{{ mockStyleStats.draft }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="待打版" :span="1">
                <el-tag type="warning">{{ mockStyleStats.pendingPattern }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="打版中" :span="1">
                <el-tag type="primary">{{ mockStyleStats.patternInProgress }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="待确认" :span="1">
                <el-tag type="danger">{{ mockStyleStats.pendingConfirm }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="已确认" :span="1">
                <el-tag type="success">{{ mockStyleStats.confirmed }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="已完成" :span="1">
                <el-tag type="success" effect="plain">{{ mockStyleStats.completed }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" v-if="userStore.isFactory || userStore.isAdmin">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>生产进度概览</span>
            </div>
          </template>
          <el-table :data="mockProductionProgress" stripe>
            <el-table-column prop="styleName" label="款式" min-width="150" />
            <el-table-column prop="orderQuantity" label="数量" width="80" />
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :status="row.progressStatus" />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.statusType" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Role } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const currentDate = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))

const roleTagType = computed(() => {
  const typeMap: Record<Role, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    designer: 'primary',
    pattern_maker: 'success',
    purchaser: 'warning',
    factory: 'danger',
    admin: 'info',
  }
  return userStore.currentRole ? typeMap[userStore.currentRole] : 'info'
})

const stats = computed(() => [
  {
    label: '待处理款式',
    value: 12,
    icon: 'Picture',
    iconColor: '#409eff',
    showProgress: true,
    progress: 60,
    progressColor: '#409eff',
  },
  {
    label: '进行中订单',
    value: 8,
    icon: 'Document',
    iconColor: '#67c23a',
    showProgress: true,
    progress: 45,
    progressColor: '#67c23a',
  },
  {
    label: '待采购物料',
    value: 25,
    icon: 'Box',
    iconColor: '#e6a23c',
    showProgress: true,
    progress: 30,
    progressColor: '#e6a23c',
  },
  {
    label: '待处理异常',
    value: 3,
    icon: 'Warning',
    iconColor: '#f56c6c',
    showProgress: false,
  },
])

const todoList = ref([
  {
    category: '款式',
    tagType: 'primary',
    title: '确认新款打版结果',
    description: '款式 SS25001 打版已完成，等待您的确认',
    time: '今天 10:30',
    type: 'primary',
    link: '/styles/1',
  },
  {
    category: '打版',
    tagType: 'success',
    title: '接收新打版任务',
    description: '款式 SS25002 已提交打版，请尽快开始',
    time: '今天 09:15',
    type: 'success',
    link: '/patterns/2',
  },
  {
    category: '采购',
    tagType: 'warning',
    title: '跟进物料到货',
    description: '采购订单 PO250001 预计今天到货，请确认',
    time: '昨天 16:00',
    type: 'warning',
    link: '/purchases/1',
  },
  {
    category: '生产',
    tagType: 'danger',
    title: '上报生产异常',
    description: '生产工单 WO250001 发现面料色差问题',
    time: '昨天 14:30',
    type: 'danger',
    link: '/production/issues/1',
  },
])

const recentNotifications = ref([
  {
    title: '款式打版完成',
    message: '款式 SS25001 的打版工作已完成，等待确认',
    time: '10分钟前',
    icon: 'DocumentChecked',
    avatarBg: '#67c23a',
    isRead: false,
  },
  {
    title: '物料入库通知',
    message: '采购订单 PO250001 的面料已入库',
    time: '30分钟前',
    icon: 'Box',
    avatarBg: '#409eff',
    isRead: false,
  },
  {
    title: '生产进度更新',
    message: '生产工单 WO250001 已完成裁剪工序',
    time: '1小时前',
    icon: 'Connection',
    avatarBg: '#e6a23c',
    isRead: true,
  },
  {
    title: '异常问题提醒',
    message: '生产工单 WO250002 存在工艺疑问',
    time: '2小时前',
    icon: 'WarningFilled',
    avatarBg: '#f56c6c',
    isRead: false,
  },
])

const showRoleSpecificContent = computed(() => {
  return userStore.isDesigner || userStore.isPatternMaker || userStore.isPurchaser || userStore.isFactory || userStore.isAdmin
})

const mockStyleStats = ref({
  draft: 5,
  pendingPattern: 8,
  patternInProgress: 12,
  pendingConfirm: 3,
  confirmed: 15,
  completed: 25,
})

const mockProductionProgress = ref([
  {
    styleName: 'SS25001-春季连衣裙',
    orderQuantity: 500,
    progress: 75,
    progressStatus: '' as const,
    status: '生产中',
    statusType: 'primary',
  },
  {
    styleName: 'SS25002-休闲外套',
    orderQuantity: 300,
    progress: 100,
    progressStatus: 'success' as const,
    status: '已完成',
    statusType: 'success',
  },
  {
    styleName: 'SS25003-商务衬衫',
    orderQuantity: 800,
    progress: 30,
    progressStatus: '' as const,
    status: '生产中',
    statusType: 'primary',
  },
])

const handleTodoClick = (item: typeof todoList.value[0]) => {
  router.push(item.link)
}

const goToNotifications = () => {
  router.push('/notifications')
}
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 0;
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #fff;
  
  h2 {
    margin: 0 0 10px 0;
    font-size: 24px;
  }
  
  .role-info {
    margin: 0 0 5px 0;
    font-size: 14px;
    opacity: 0.9;
  }
  
  .date-info {
    margin: 0;
    font-size: 14px;
    opacity: 0.8;
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .stat-info {
    display: flex;
    flex-direction: column;
    
    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 4px;
    }
  }
  
  .stat-icon {
    font-size: 40px;
  }
}

.content-row {
  margin-bottom: 20px;
}

.content-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.todo-card {
  cursor: pointer;
  margin-bottom: 10px;
  
  .todo-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    
    span:last-child {
      font-weight: 500;
    }
  }
  
  .todo-desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.notification-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  
  &:last-child {
    border-bottom: none;
  }
}

.notification-content {
  margin-left: 12px;
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    .notification-title {
      font-weight: 500;
    }
    
    .notification-time {
      font-size: 12px;
      color: #c0c4cc;
    }
  }
  
  .notification-message {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.chart-placeholder {
  padding: 10px 0;
}
</style>
