<template>
  <div class="profile-page">
    <div class="page-header">
      <h2 class="page-title">我的信息</h2>
      <div class="header-actions">
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="user-card">
          <div class="user-avatar-section">
            <el-avatar :size="100" style="background: linear-gradient(135deg, #667eea, #764ba2); font-size: 40px;">
              {{ user?.real_name?.charAt(0) || user?.username?.charAt(0) }}
            </el-avatar>
            <h3>{{ user?.real_name || user?.username }}</h3>
            <el-tag :type="roleTagType" size="large">{{ roleText }}</el-tag>
            <el-tag v-if="user?.status === 'verified'" type="success" effect="dark">已认证</el-tag>
            <el-tag v-else type="warning" effect="dark">待审核</el-tag>
          </div>
          <el-divider />
          <div class="user-info">
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ user?.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">手机号</span>
              <span class="value">{{ user?.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">身份证</span>
              <span class="value">{{ user?.id_card || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间</span>
              <span class="value">{{ user?.created_at }}</span>
            </div>
          </div>
        </el-card>
        
        <el-card class="stats-card" style="margin-top: 20px;">
          <template #header>
            <span style="font-weight: 600;">快捷入口</span>
          </template>
          <div class="quick-grid">
            <div class="quick-item" @click="$router.push('/profile/rooms')">
              <el-icon size="28"><House /></el-icon>
              <span>房号绑定</span>
            </div>
            <div class="quick-item" @click="$router.push('/profile/orders')">
              <el-icon size="28"><List /></el-icon>
              <span>订单记录</span>
            </div>
            <div class="quick-item" @click="$router.push('/profile/coupons')">
              <el-icon size="28"><Ticket /></el-icon>
              <span>优惠券</span>
            </div>
            <div class="quick-item" @click="$router.push('/profile/announcements')">
              <el-icon size="28"><Bell /></el-icon>
              <span>公告通知</span>
            </div>
            <div class="quick-item" @click="$router.push('/profile/visitors')">
              <el-icon size="28"><UserFilled /></el-icon>
              <span>访客记录</span>
            </div>
            <div class="quick-item" @click="$router.push('/access')">
              <el-icon size="28"><Key /></el-icon>
              <span>门禁认证</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="stat-mini">
              <div class="stat-mini-item">
                <div class="stat-mini-icon blue">
                  <el-icon><ShoppingCart /></el-icon>
                </div>
                <div class="stat-mini-info">
                  <div class="stat-mini-value">{{ orderStats.total }}</div>
                  <div class="stat-mini-label">全部订单</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-mini">
              <div class="stat-mini-item">
                <div class="stat-mini-icon green">
                  <el-icon><Wallet /></el-icon>
                </div>
                <div class="stat-mini-info">
                  <div class="stat-mini-value">{{ orderStats.paid }}</div>
                  <div class="stat-mini-label">已完成</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-mini">
              <div class="stat-mini-item">
                <div class="stat-mini-icon orange">
                  <el-icon><Ticket /></el-icon>
                </div>
                <div class="stat-mini-info">
                  <div class="stat-mini-value">{{ couponStats.unused }}</div>
                  <div class="stat-mini-label">可用优惠券</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-mini">
              <div class="stat-mini-item">
                <div class="stat-mini-icon purple">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="stat-mini-info">
                  <div class="stat-mini-value">{{ visitorStats.total }}</div>
                  <div class="stat-mini-label">访客记录</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-card class="section-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span style="font-weight: 600;">最近订单</span>
              <el-button type="primary" link @click="$router.push('/profile/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading" size="small" stripe>
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column prop="product_name" label="商品" />
            <el-table-column label="金额" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ row.total_amount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">
                  {{ { pending: '待支付', paid: '已支付', completed: '已完成', cancelled: '已取消' }[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="180" />
          </el-table>
        </el-card>
        
        <el-card class="section-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span style="font-weight: 600;">我的房号</span>
              <el-button type="primary" link @click="$router.push('/profile/rooms')">
                管理
              </el-button>
            </div>
          </template>
          <div v-if="userRooms.length === 0" class="empty-state">
            暂无绑定房号
          </div>
          <div v-else class="room-list">
            <div v-for="room in userRooms" :key="room.id" class="room-item">
              <el-icon><House /></el-icon>
              <div class="room-info">
                <div class="room-name">{{ room.building_name }} {{ room.unit_number }}</div>
                <div class="room-meta">
                  <el-tag :type="room.bind_status === 'verified' ? 'success' : 'warning'" size="small">
                    {{ room.bind_status === 'verified' ? '已认证' : '审核中' }}
                  </el-tag>
                  <span>{{ room.relation === 'owner' ? '业主' : '租户' }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getOrders, getCoupons, getVisitors, getUserRooms } from '../api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const user = computed(() => userStore.user)
const recentOrders = ref([])
const userRooms = ref([])

const orderStats = reactive({ total: 0, paid: 0 })
const couponStats = reactive({ unused: 0 })
const visitorStats = reactive({ total: 0 })

const roleText = computed(() => {
  const map = {
    admin: '管理员',
    property: '物业管理员',
    resident: '住户',
    merchant: '商户'
  }
  return map[userStore.userRole] || '住户'
})

const roleTagType = computed(() => {
  const map = {
    admin: 'danger',
    property: 'warning',
    resident: 'success',
    merchant: 'info'
  }
  return map[userStore.userRole] || 'success'
})

async function loadData() {
  loading.value = true
  try {
    const [ordersRes, couponsRes, visitorsRes, roomsRes] = await Promise.all([
      getOrders({ user_id: userStore.userId, limit: 5 }),
      getCoupons({ user_id: userStore.userId }),
      getVisitors({ host_user_id: userStore.userId }),
      getUserRooms({ user_id: userStore.userId })
    ])
    
    recentOrders.value = ordersRes.data
    userRooms.value = roomsRes.data
    
    orderStats.total = ordersRes.data.length
    orderStats.paid = ordersRes.data.filter(o => o.status === 'paid' || o.status === 'completed').length
    couponStats.unused = couponsRes.data.filter(c => c.status === 'unused' && !c.is_expired).length
    visitorStats.total = visitorsRes.data.length
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.user-card, .stats-card, .section-card, .stat-mini {
  border: none;
  border-radius: 12px;
}

.user-avatar-section {
  text-align: center;
  padding: 20px 0;
}

.user-avatar-section h3 {
  margin: 15px 0 10px;
  font-size: 20px;
}

.user-avatar-section .el-tag {
  margin-right: 5px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.info-item .label {
  color: #909399;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.quick-item {
  text-align: center;
  padding: 15px 5px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.quick-item:hover {
  background: #e8f4ff;
  color: #409eff;
}

.quick-item span {
  font-size: 13px;
}

.stat-mini-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-mini-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-mini-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-mini-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-mini-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-mini-icon.purple { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.stat-mini-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-mini-label {
  font-size: 13px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #909399;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.room-info {
  flex: 1;
}

.room-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #909399;
}
</style>
