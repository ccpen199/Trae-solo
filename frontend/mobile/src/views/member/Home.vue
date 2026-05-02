<template>
  <div class="member-home">
    <div class="member-card">
      <div class="card-header">
        <div class="member-info">
          <h3>{{ memberInfo?.name || '会员' }}</h3>
          <p class="member-level">{{ memberInfo?.level || '普通会员' }}</p>
        </div>
        <div class="member-avatar">
          <el-avatar size="60" :src="avatarUrl">{{ memberInfo?.name?.charAt(0) || '会' }}</el-avatar>
        </div>
      </div>
      <div class="card-body">
        <div class="info-item">
          <span>会员卡号</span>
          <span>{{ memberInfo?.memberCode || '暂无' }}</span>
        </div>
        <div class="info-item">
          <span>注册时间</span>
          <span>{{ memberInfo?.createdAt ? formatDate(memberInfo.createdAt) : '暂无' }}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" @click="router.push('/member/points')">
        <div class="stat-icon">
          <el-icon><Star /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ memberInfo?.pointsBalance || 0 }}</div>
          <div class="stat-label">积分</div>
        </div>
      </div>
      <div class="stat-card" @click="router.push('/member/balance')">
        <div class="stat-icon">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ memberInfo?.storedBalance?.toFixed(2) || '0.00' }}</div>
          <div class="stat-label">储值</div>
        </div>
      </div>
      <div class="stat-card" @click="router.push('/member/coupons')">
        <div class="stat-icon">
          <el-icon><Ticket /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ couponCount || 0 }}</div>
          <div class="stat-label">优惠券</div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h3>快捷服务</h3>
      <div class="action-grid">
        <div class="action-item" @click="router.push('/member/records')">
          <el-icon><Document /></el-icon>
          <span>消费记录</span>
        </div>
        <div class="action-item" @click="handleRecharge">
          <el-icon><Top /></el-icon>
          <span>储值充值</span>
        </div>
        <div class="action-item" @click="handlePointsRedeem">
          <el-icon><Right /></el-icon>
          <span>积分兑换</span>
        </div>
        <div class="action-item" @click="handleFeedback">
          <el-icon><ChatLineRound /></el-icon>
          <span>意见反馈</span>
        </div>
      </div>
    </div>

    <div class="activity-section">
      <h3>最新活动</h3>
      <div class="activity-list">
        <div class="activity-item">
          <div class="activity-content">
            <h4>会员专享折扣</h4>
            <p>全场商品9折优惠</p>
          </div>
          <div class="activity-tag">进行中</div>
        </div>
        <div class="activity-item">
          <div class="activity-content">
            <h4>积分翻倍</h4>
            <p>周末消费积分翻倍</p>
          </div>
          <div class="activity-tag">即将开始</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElDialog, ElInput, ElButton } from 'element-plus'
import { Star, Wallet, Ticket, Document, Top, Right, ChatLineRound } from '@element-plus/icons-vue'

const router = useRouter()
const couponCount = ref(0)
const rechargeDialogVisible = ref(false)
const redeemDialogVisible = ref(false)
const rechargeAmount = ref('')
const pointsToRedeem = ref('')

const memberInfo = computed(() => {
  const member = localStorage.getItem('memberInfo')
  return member ? JSON.parse(member) : null
})

const avatarUrl = computed(() => {
  return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait%20friendly&image_size=square'
})

onMounted(() => {
  loadCouponCount()
})

const loadCouponCount = async () => {
  if (!memberInfo.value?.id) return
  
  try {
    const response = await axios.get(`/api/member/${memberInfo.value.id}/coupons`)
    if (response.data.success) {
      couponCount.value = response.data.data.length
    }
  } catch (error) {
    console.error('加载优惠券数量失败:', error)
  }
}

const handleRecharge = () => {
  rechargeDialogVisible.value = true
}

const handlePointsRedeem = () => {
  redeemDialogVisible.value = true
}

const handleFeedback = () => {
  ElMessage.info('意见反馈功能开发中')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.member-home {
  padding-bottom: 20px;
}

.member-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.member-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.member-level {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.card-body {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: #f0f9eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-icon .el-icon {
  font-size: 20px;
  color: #67c23a;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.quick-actions {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
  transition: all 0.3s ease;
}

.action-item:hover {
  color: #409EFF;
}

.action-item .el-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.action-item span {
  font-size: 12px;
  text-align: center;
}

.activity-section {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content h4 {
  margin: 0 0 3px 0;
  font-size: 14px;
  color: #333;
}

.activity-content p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.activity-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f9eb;
  color: #67c23a;
}

.activity-tag:nth-child(2) {
  background: #fef0f0;
  color: #f56c6c;
}
</style>