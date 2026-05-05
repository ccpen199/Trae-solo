<template>
  <div class="prizes-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">我的奖品</h1>
      <p class="page-desc">查看您的中奖记录和领奖状态</p>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs card">
      <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
        <span class="tab-icon">📋</span>
        <span class="tab-text">全部</span>
        <span class="tab-count" v-if="stats.total > 0">{{ stats.total }}</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
        <span class="tab-icon">🎁</span>
        <span class="tab-text">待领取</span>
        <span class="tab-count" v-if="stats.pending > 0">{{ stats.pending }}</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'received' }" @click="activeTab = 'received'">
        <span class="tab-icon">✅</span>
        <span class="tab-text">已领取</span>
        <span class="tab-count" v-if="stats.received > 0">{{ stats.received }}</span>
      </div>
    </div>

    <!-- 奖品列表 -->
    <div class="prizes-list card">
      <div class="list-header">
        <span class="header-title">中奖记录</span>
        <span class="header-count">共 {{ pagination.total }} 条记录</span>
      </div>
      
      <div class="list-body" v-loading="loading">
        <div 
          v-for="prize in prizes" 
          :key="prize.id"
          class="prize-item"
          :class="prize.receiveStatus.toLowerCase()"
        >
          <div class="prize-icon" :class="prize.prizeType">
            <span v-if="prize.prizeType === 'POINTS'">💰</span>
            <span v-else-if="prize.prizeType === 'COUPON'">🎫</span>
            <span v-else-if="prize.prizeType === 'PHYSICAL'">🎁</span>
            <span v-else>😢</span>
          </div>
          
          <div class="prize-info">
            <div class="prize-name">{{ prize.prizeName }}</div>
            <div class="prize-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(prize.createdAt) }}
              </span>
              <span class="meta-item" v-if="prize.prizeType === 'POINTS'">
                <el-icon><Coin /></el-icon>
                +{{ prize.pointsValue }} 积分
              </span>
            </div>
            <div class="prize-status" :class="prize.receiveStatus.toLowerCase()">
              <span v-if="prize.receiveStatus === 'PENDING'" class="status-pending">
                <el-icon><Clock /></el-icon>
                待领取
              </span>
              <span v-else-if="prize.receiveStatus === 'RECEIVED'" class="status-received">
                <el-icon><CircleCheck /></el-icon>
                已领取
                <span v-if="prize.receiveTime">
                  {{ formatDate(prize.receiveTime) }}
                </span>
              </span>
              <span v-else class="status-expired">
                <el-icon><CircleClose /></el-icon>
                已过期
              </span>
            </div>
          </div>
          
          <div class="prize-action">
            <el-button
              v-if="prize.receiveStatus === 'PENDING' && prize.prizeType !== 'THANKYOU'"
              type="primary"
              size="small"
              :loading="receivingId === prize.id"
              @click="receivePrize(prize)"
            >
              {{ prize.prizeType === 'POINTS' ? '立即兑换' : '领取奖品' }}
            </el-button>
            <el-button
              v-else-if="prize.receiveStatus === 'RECEIVED'"
              size="small"
              disabled
            >
              已领取
            </el-button>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && prizes.length === 0">
          <el-empty description="暂无奖品记录" :image-size="100">
            <template #image>
              <div class="empty-icon">🎁</div>
            </template>
            <router-link to="/">
              <el-button type="primary">去参与活动</el-button>
            </router-link>
          </el-empty>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="list-footer" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchPrizes"
          @current-change="fetchPrizes"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserPrizes, receivePrize as receivePrizeApi } from '@/api/lottery'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('all')
const loading = ref(false)
const receivingId = ref(null)
const prizes = ref([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
})

const stats = computed(() => {
  let total = 0
  let pending = 0
  let received = 0
  
  prizes.value.forEach(p => {
    total++
    if (p.receiveStatus === 'PENDING') pending++
    else if (p.receiveStatus === 'RECEIVED') received++
  })
  
  return { total, pending, received }
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const fetchPrizes = async () => {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? null : activeTab.value.toUpperCase()
    const res = await getUserPrizes({
      status,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    })
    
    prizes.value = res.data.list || []
    pagination.value.total = res.data.total || 0
  } catch (err) {
    console.error('获取奖品列表失败:', err)
    ElMessage.error('获取奖品列表失败')
  } finally {
    loading.value = false
  }
}

const receivePrize = async (prize) => {
  receivingId.value = prize.id
  
  try {
    await receivePrizeApi(prize.id)
    ElMessage.success(prize.prizeType === 'POINTS' ? '兑换成功，积分已到账' : '领奖成功')
    
    // 更新本地状态
    prize.receiveStatus = 'RECEIVED'
    prize.receiveTime = new Date().toISOString()
    
    // 更新用户积分
    await userStore.updatePoints()
  } catch (err) {
    ElMessage.error(err.message || '领取失败')
  } finally {
    receivingId.value = null
  }
}

watch(activeTab, () => {
  pagination.value.page = 1
  fetchPrizes()
})

onMounted(() => {
  fetchPrizes()
})
</script>

<style scoped>
.prizes-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.page-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f5f7fa;
  color: #666;
}

.tab-item:hover {
  background: #f0f2ff;
  color: #667eea;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.tab-icon {
  font-size: 18px;
}

.tab-text {
  font-weight: 500;
}

.tab-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.tab-item.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
}

.prizes-list {
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-count {
  font-size: 13px;
  color: #999;
}

.list-body {
  padding: 12px 20px;
  min-height: 200px;
}

.prize-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.prize-item:last-child {
  margin-bottom: 0;
}

.prize-item:hover {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prize-item.pending {
  border-left: 3px solid #fa8c16;
}

.prize-item.received {
  border-left: 3px solid #52c41a;
  opacity: 0.85;
}

.prize-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.prize-icon.POINTS {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}

.prize-icon.COUPON {
  background: linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%);
}

.prize-icon.PHYSICAL {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}

.prize-icon.THANKYOU {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.prize-info {
  flex: 1;
  margin: 0 16px;
  min-width: 0;
}

.prize-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.prize-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.prize-status {
  font-size: 12px;
}

.status-pending {
  color: #fa8c16;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-received {
  color: #52c41a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-expired {
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.prize-action {
  flex-shrink: 0;
}

.empty-state {
  padding: 40px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.list-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .filter-tabs {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .tab-item {
    flex: 1;
    min-width: calc(50% - 6px);
    justify-content: center;
  }
  
  .prize-item {
    flex-wrap: wrap;
  }
  
  .prize-info {
    width: 100%;
    margin: 12px 0;
  }
  
  .prize-action {
    width: 100%;
  }
  
  .prize-action .el-button {
    width: 100%;
  }
}
</style>
