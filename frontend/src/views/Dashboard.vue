<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
        <div class="stat-value">{{ stats.totalOrders }}</div>
        <div class="stat-label">总订单数</div>
      </div>
      <div class="stat-icon blue">
        <el-icon :size="40"><Document /></el-icon>
      </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
        <div class="stat-value">{{ stats.pendingOrders }}</div>
        <div class="stat-label">待处理订单</div>
      </div>
      <div class="stat-icon orange">
        <el-icon :size="40"><Clock /></el-icon>
      </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
        <div class="stat-value">{{ stats.issuedOrders }}</div>
        <div class="stat-label">已出票</div>
      </div>
      <div class="stat-icon green">
        <el-icon :size="40"><Check /></el-icon>
      </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
        <div class="stat-value">¥{{ stats.totalAmount.toFixed(2) }}</div>
        <div class="stat-label">总金额</div>
      </div>
      <div class="stat-icon purple">
        <el-icon :size="40"><Wallet /></el-icon>
      </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <el-button type="primary" size="large" @click="$router.push('/flights')" style="width: 100%; height: 80px">
                <div>
                  <el-icon :size="24"><Document /></el-icon>
                  <div style="margin-top: 5px">查询航班</div>
                </div>
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="success" size="large" @click="$router.push('/orders')" style="width: 100%; height: 80px">
                <div>
                  <el-icon :size="24"><List /></el-icon>
                  <div style="margin-top: 5px">订单管理</div>
                </div>
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="warning" size="large" @click="$router.push('/tickets')" style="width: 100%; height: 80px">
                <div>
                  <el-icon :size="24"><Ticket /></el-icon>
                  <div style="margin-top: 5px">机票查询</div>
                </div>
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统状态</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前用户">{{ userStore.userName }}</el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag :type="roleTagType">{{ roleName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="待办事项">
              <el-badge :value="userStore.todoCount" class="item">
                <span>待处理任务</span>
              </el-badge>
            </el-descriptions-item>
            <el-descriptions-item label="可访问页面">
              <div v-for="page in visiblePages" :key="page" style="margin: 2px 0">
                <el-tag size="small" type="info">{{ pageNames[page] || page }}</el-tag>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>订单状态说明</span>
          </template>
          <el-timeline>
            <el-timeline-item timestamp="待查询航班" type="info">
              <p>旅客提交订票申请，等待代理查询航班信息</p>
            </el-timeline-item>
            <el-timeline-item timestamp="待选座选舱" type="warning">
              <p>航班信息已确认，等待选择舱位和票价</p>
            </el-timeline-item>
            <el-timeline-item timestamp="待支付出票" type="primary">
              <p>舱位已锁定，等待支付（15分钟内完成）</p>
            </el-timeline-item>
            <el-timeline-item timestamp="行程通知" type="success">
              <p>支付完成，已出票</p>
            </el-timeline-item>
            <el-timeline-item timestamp="待改签退票" type="danger">
              <p>申请退改签，等待审批</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { 
  Document, Clock, Check, Wallet, List, Ticket
} from '@element-plus/icons-vue'

const userStore = useUserStore()

const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  issuedOrders: 0,
  totalAmount: 0
})

const roleName = computed(() => {
  const roleMap = {
    admin: '管理员',
    passenger: '旅客',
    agent: '代理',
    customer_service: '客服',
    airline: '航司'
  }
  return roleMap[userStore.userRole] || userStore.userRole
})

const roleTagType = computed(() => {
  const typeMap = {
    admin: 'danger',
    passenger: 'success',
    agent: 'primary',
    customer_service: 'warning',
    airline: 'info'
  }
  return typeMap[userStore.userRole] || 'info'
})

const visiblePages = computed(() => {
  return userStore.permissions?.visiblePages || []
})

const pageNames = {
  dashboard: '仪表盘',
  flights: '航班查询',
  orders: '订单管理',
  my_orders: '我的订单',
  tickets: '机票管理',
  reports: '报表',
  users: '用户管理',
  settings: '系统设置',
  rebook_refund: '退改签审批'
}

onMounted(async () => {
  if (!userStore.permissions) {
    await userStore.fetchPermissions()
    await userStore.fetchTodoCount()
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.stat-icon {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.item {
  margin-right: 20px;
}
</style>
