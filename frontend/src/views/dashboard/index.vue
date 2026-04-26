<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #409eff, #66b1ff)">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.totalOrders }}</div>
            <div class="stats-label">订单总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #67c23a, #85ce61)">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.pendingOrders }}</div>
            <div class="stats-label">待处理订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #e6a23c, #ebb563)">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">¥{{ stats.totalAmount.toFixed(2) }}</div>
            <div class="stats-label">总金额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #f56c6c, #f78989)">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.exceptionCount }}</div>
            <div class="stats-label">异常数量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="recent-orders-card">
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" text @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" stripe style="width: 100%">
            <el-table-column prop="orderNo" label="订单号" width="180" />
            <el-table-column prop="productName" label="产品名称" />
            <el-table-column prop="expectedWeight" label="预计重量(kg)" width="120">
              <template #default="{ row }">
                {{ row.expectedWeight.toNumber?.() || row.expectedWeight }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text @click="viewOrder(row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="quick-actions-card">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <div
              v-if="userStore.isBuyer"
              class="action-item"
              @click="createOrder"
            >
              <el-icon size="32" color="#409eff"><Plus /></el-icon>
              <span>创建订单</span>
            </div>
            <div
              v-if="userStore.isFarmer"
              class="action-item"
              @click="goToSubOrders"
            >
              <el-icon size="32" color="#67c23a"><List /></el-icon>
              <span>子订单管理</span>
            </div>
            <div class="action-item" @click="goToAccount">
              <el-icon size="32" color="#e6a23c"><User /></el-icon>
              <span>账户中心</span>
            </div>
            <div class="action-item" @click="goToColdChain">
              <el-icon size="32" color="#f56c6c"><Monitor /></el-icon>
              <span>冷链监控</span>
            </div>
          </div>
        </el-card>

        <el-card class="notifications-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>最近通知</span>
              <el-badge :value="notificationStore.unreadCount" class="item">
                <el-button type="primary" text>未读</el-button>
              </el-badge>
            </div>
          </template>
          <div class="notification-list">
            <div
              v-for="notification in recentNotifications"
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.isRead }"
            >
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-content">{{ notification.content }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
            <el-empty v-if="recentNotifications.length === 0" description="暂无通知" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { orderApi } from '@/api/order'
import type { Order, OrderStatus } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const recentOrders = ref<Order[]>([])
const recentNotifications = ref<any[]>([])

const stats = computed(() => ({
  totalOrders: recentOrders.value.length,
  pendingOrders: recentOrders.value.filter(o => 
    ['PENDING_PREPAYMENT', 'PREPAYMENT_PAID', 'IN_COLLECTION', 'IN_TRANSPORT'].includes(o.status)
  ).length,
  totalAmount: recentOrders.value.reduce((sum, o) => 
    sum + (o.actualAmount?.toNumber?.() || o.expectedAmount?.toNumber?.() || 0), 0
  ),
  exceptionCount: recentOrders.value.filter(o => 
    o.status === 'EXCEPTION_HANDLING'
  ).length,
}))

const statusMap: Record<OrderStatus, { text: string; type: string }> = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING_PREPAYMENT: { text: '待预付', type: 'warning' },
  PREPAYMENT_PAID: { text: '已预付', type: '' },
  IN_COLLECTION: { text: '采集中', type: 'primary' },
  QUALITY_CHECKED: { text: '质检完成', type: '' },
  IN_TRANSPORT: { text: '运输中', type: 'primary' },
  DELIVERED: { text: '已到货', type: 'success' },
  SETTLED: { text: '已结算', type: 'success' },
  CANCELLED: { text: '已取消', type: 'danger' },
  EXCEPTION_HANDLING: { text: '异常处理', type: 'danger' },
  STORAGE_TRANSFERRED: { text: '货权转移', type: 'warning' },
}

const getStatusType = (status: OrderStatus) => statusMap[status]?.type || ''
const getStatusText = (status: OrderStatus) => statusMap[status]?.text || status

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')

const loadRecentOrders = async () => {
  try {
    const orders = await orderApi.getList()
    recentOrders.value = orders.slice(0, 10)
  } catch (error) {
    console.error('Failed to load orders:', error)
  }
}

const loadNotifications = async () => {
  try {
    await notificationStore.fetchUnreadCount()
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
}

const viewOrder = (id: string) => router.push(`/orders/${id}`)
const goToOrders = () => router.push('/orders')
const createOrder = () => router.push('/orders/create')
const goToSubOrders = () => router.push('/suborders')
const goToAccount = () => router.push('/account')
const goToColdChain = () => router.push('/cold-chain')

onMounted(() => {
  loadRecentOrders()
  loadNotifications()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-row {
    margin-bottom: 20px;
  }

  .stats-card {
    .el-card__body {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stats-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 28px;
    }

    .stats-info {
      .stats-value {
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }

      .stats-label {
        font-size: 14px;
        color: #999;
        margin-top: 4px;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .quick-actions-card {
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
        background-color: #f5f7fa;
      }

      span {
        margin-top: 8px;
        font-size: 14px;
        color: #333;
      }
    }
  }

  .notification-list {
    max-height: 280px;
    overflow-y: auto;
  }

  .notification-item {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &.unread {
      background-color: #fafafa;
      margin: 0 -20px;
      padding: 12px 20px;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .notification-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }

  .notification-content {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .notification-time {
    font-size: 12px;
    color: #999;
  }
}
</style>
