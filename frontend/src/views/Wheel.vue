<template>
  <div class="wheel-page">
    <!-- 活动信息头部 -->
    <div class="activity-header card" v-if="activity">
      <div class="header-left">
        <h1 class="activity-name">{{ activity.name }}</h1>
        <p class="activity-desc">{{ activity.description }}</p>
        <div class="activity-info">
          <div class="info-item">
            <el-icon><Coin /></el-icon>
            <span>消耗: {{ activity.pointsCost }} 积分/次</span>
          </div>
          <div class="info-item">
            <el-icon><Timer /></el-icon>
            <span>机会: 每日 {{ activity.maxChances }} 次</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>参与: {{ activity.participantCount }} 人</span>
          </div>
          <div class="info-item">
            <el-icon><Trophy /></el-icon>
            <span>中奖: {{ activity.winnerCount }} 人</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="countdown" v-if="countdownEndTime > 0">
          <div class="countdown-label">活动倒计时</div>
          <div class="countdown-value">{{ countdownText }}</div>
        </div>
      </div>
    </div>

    <div class="wheel-content">
      <!-- 转盘区域 -->
      <div class="wheel-section card">
        <div class="wheel-container">
          <!-- 转盘指针 -->
          <div class="wheel-pointer">
            <el-icon><ArrowDown /></el-icon>
          </div>
          
          <!-- 转盘 -->
          <div class="wheel" :class="{ 'spinning': isSpinning }" :style="wheelStyle">
            <div class="wheel-inner">
              <div 
                v-for="(prize, index) in displayPrizes" 
                :key="index"
                class="wheel-sector"
                :style="getSectorStyle(index)"
              >
                <div class="sector-content" :style="getSectorContentStyle(index)">
                  <div class="sector-text" :style="getSectorTextStyle(index)">{{ prize.name }}</div>
                </div>
              </div>
            </div>
            <!-- 转盘中心按钮 -->
            <div class="wheel-center" @click="startSpin" :class="{ disabled: isSpinning || !userStore.isLoggedIn }">
              <span v-if="!isSpinning">{{ userStore.isLoggedIn ? '开始' : '登录' }}</span>
              <span v-else>抽奖中</span>
            </div>
          </div>
        </div>

        <!-- 抽奖信息 -->
        <div class="spin-info" v-if="userStore.isLoggedIn">
          <div class="info-row">
            <span class="info-label">当前积分</span>
            <span class="info-value">{{ userStore.userInfo?.points || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">消耗积分</span>
            <span class="info-value">{{ activity?.pointsCost || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">剩余机会</span>
            <span class="info-value highlight">{{ remainingChances }}</span>
          </div>
        </div>
        <div class="spin-info" v-else>
          <p class="login-tip">请先登录后参与抽奖</p>
        </div>
      </div>

      <!-- 奖品列表和中奖公告 -->
      <div class="info-section">
        <!-- 奖品列表 -->
        <div class="prizes-card card">
          <div class="card-header">
            <h3 class="section-title">
              <el-icon><Present /></el-icon>
              奖品列表
            </h3>
          </div>
          <div class="card-body">
            <div class="prizes-list">
              <div 
                v-for="(prize, index) in displayPrizes" 
                :key="index"
                class="prize-item"
              >
                <div class="prize-icon" :class="prize.type">
                  <span v-if="prize.type === 'POINTS'">💰</span>
                  <span v-else-if="prize.type === 'COUPON'">🎫</span>
                  <span v-else-if="prize.type === 'PHYSICAL'">🎁</span>
                  <span v-else>😢</span>
                </div>
                <div class="prize-info">
                  <div class="prize-name">{{ prize.name }}</div>
                  <div class="prize-meta">
                    <span class="probability">概率: {{ (prize.probability * 100).toFixed(0) }}%</span>
                    <span class="stock" v-if="prize.type !== 'THANKYOU'">
                      剩余: {{ prize.stock - prize.used }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中奖公告 -->
        <div class="winners-card card">
          <div class="card-header">
            <h3 class="section-title">
              <el-icon><Bell /></el-icon>
              中奖公告
            </h3>
          </div>
          <div class="card-body">
            <div class="winners-list" v-if="recentWinners.length > 0">
              <div 
                v-for="(winner, index) in recentWinners" 
                :key="index"
                class="winner-item"
              >
                <el-avatar :size="28" class="winner-avatar">
                  {{ winner.username?.charAt(0) || 'U' }}
                </el-avatar>
                <div class="winner-info">
                  <span class="winner-name">{{ maskName(winner.username) }}</span>
                  <span class="winner-prize">获得了 {{ winner.prizeName }}</span>
                </div>
              </div>
            </div>
            <div class="empty-winners" v-else>
              <el-empty description="暂无中奖记录" :image-size="80" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中奖弹窗 -->
    <el-dialog
      v-model="showResultDialog"
      :title="isWinner ? '🎉 恭喜中奖' : '😢 很遗憾'"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="result-content">
        <div class="result-icon" :class="{ winner: isWinner }">
          <span v-if="isWinner">🏆</span>
          <span v-else>💨</span>
        </div>
        <div class="result-prize" v-if="isWinner">
          <div class="prize-name">{{ resultPrize?.name }}</div>
          <div class="prize-type" v-if="resultPrize?.type === 'POINTS'">
            +{{ resultPrize?.pointsValue }} 积分
          </div>
        </div>
        <div class="result-text" v-else>
          <p>很遗憾，您没有中奖</p>
          <p class="tip">再接再厉，好运就在下一次！</p>
        </div>
        <div class="result-extra" v-if="isWinner">
          <p v-if="resultPrize?.type === 'POINTS'">积分已自动发放到您的账户</p>
          <p v-else>请在"我的奖品"中查看和领取</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleContinue" v-if="remainingChances > 0">
            继续抽奖 (剩余 {{ remainingChances }} 次)
          </el-button>
          <el-button type="primary" @click="showResultDialog = false">
            {{ remainingChances > 0 ? '稍后再抽' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 积分不足弹窗 -->
    <el-dialog
      v-model="showPointsDialog"
      title="积分不足"
      width="360px"
    >
      <div class="points-dialog-content">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>您的积分不足，无法参与本次抽奖</p>
        <p class="tip">当前积分: {{ userStore.userInfo?.points || 0 }}，需要: {{ activity?.pointsCost || 0 }}</p>
      </div>
      <template #footer>
        <el-button @click="showPointsDialog = false">关闭</el-button>
        <router-link to="/">
          <el-button type="primary">去获取积分</el-button>
        </router-link>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getActiveActivity, getRecentWinners } from '@/api/activity'
import { spinWheel } from '@/api/lottery'

const router = useRouter()
const userStore = useUserStore()

const activity = ref(null)
const recentWinners = ref([])
const isSpinning = ref(false)
const showResultDialog = ref(false)
const showPointsDialog = ref(false)
const isWinner = ref(false)
const resultPrize = ref(null)
const remainingChances = ref(3)
const currentRotation = ref(0)
const targetRotation = ref(0)

// 倒计时
const countdownEndTime = ref(0)
const countdownText = ref('')

// 转盘样式
const wheelStyle = computed(() => ({
  transform: `rotate(${currentRotation.value}deg)`,
  transition: isSpinning.value ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
}))

const displayPrizes = computed(() => {
  if (!activity.value || !activity.value.prizes) return []
  return activity.value.prizes.sort((a, b) => a.sortOrder - b.sortOrder)
})

const sectorCount = computed(() => displayPrizes.value.length)

const getSectorStyle = (index) => {
  const count = sectorCount.value
  const angle = 360 / count
  const rotate = index * angle
  const skew = 90 - angle
  
  return {
    transform: `rotate(${rotate}deg) skewY(${skew}deg)`,
    background: index % 2 === 0 ? '#fff0f5' : '#e6f7ff',
  }
}

const getSectorContentStyle = (index) => {
  const count = sectorCount.value
  const angle = 360 / count
  const skew = 90 - angle
  const paddingTop = count > 4 ? '15%' : '20%'
  
  return {
    transform: `skewY(${-skew}deg)`,
    paddingTop,
    marginTop: '10px',
  }
}

const getSectorTextStyle = (index) => {
  const count = sectorCount.value
  const angle = 360 / count
  const totalRotate = index * angle + angle / 2
  
  return {
    transform: `translateX(-50%) rotate(-${totalRotate}deg)`,
    textAlign: 'center',
  }
}

const maskName = (name) => {
  if (!name) return '***'
  if (name.length <= 2) return name.charAt(0) + '*'
  return name.charAt(0) + '*'.repeat(Math.min(name.length - 2, 4)) + name.charAt(name.length - 1)
}

// 获取活动数据
const fetchActivity = async () => {
  try {
    const res = await getActiveActivity('wheel')
    activity.value = res.data.activity
    recentWinners.value = res.data.recentWinners || []
    
    // 设置倒计时
    if (activity.value.endTime) {
      countdownEndTime.value = new Date(activity.value.endTime).getTime()
    }
    
    // 初始化剩余机会
    remainingChances.value = activity.value.maxChances
  } catch (err) {
    console.error('获取活动失败:', err)
    ElMessage.error('获取活动信息失败')
  }
}

// 更新倒计时
const updateCountdown = () => {
  if (countdownEndTime.value <= 0) return
  
  const now = Date.now()
  const diff = countdownEndTime.value - now
  
  if (diff <= 0) {
    countdownText.value = '活动已结束'
    return
  }
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((diff % (60 * 1000)) / 1000)
  
  if (days > 0) {
    countdownText.value = `${days}天 ${hours}时 ${minutes}分`
  } else {
    countdownText.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}

// 开始抽奖
const startSpin = async () => {
  if (isSpinning.value) return
  
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (remainingChances.value <= 0) {
    ElMessage.warning('今日抽奖机会已用完')
    return
  }
  
  if ((userStore.userInfo?.points || 0) < (activity.value?.pointsCost || 0)) {
    showPointsDialog.value = true
    return
  }
  
  isSpinning.value = true
  
  try {
    // 先调用后端接口
    const res = await spinWheel()
    
    // 计算旋转角度
    const prizeIndex = displayPrizes.value.findIndex(p => p.id === res.data.prize.id)
    const sectorAngle = 360 / sectorCount.value
    
    // 目标角度：多转几圈 + 定位到对应奖品
    const spins = 5 // 转5圈
    const targetAngle = (360 * spins) + (prizeIndex * sectorAngle) + (sectorAngle / 2)
    
    targetRotation.value = currentRotation.value + targetAngle
    
    // 开始旋转动画
    currentRotation.value = targetRotation.value
    
    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, 4000))
    
    // 显示结果
    isWinner.value = res.data.isWinner
    resultPrize.value = res.data.prize
    remainingChances.value = res.data.remainingChances
    showResultDialog.value = true
    
    // 更新用户积分
    await userStore.updatePoints()
    
    // 刷新中奖公告
    if (isWinner.value) {
      setTimeout(fetchWinners, 500)
    }
  } catch (err) {
    if (err.message === 'INSUFFICIENT_POINTS') {
      showPointsDialog.value = true
    } else {
      ElMessage.error(err.message || '抽奖失败')
    }
  } finally {
    isSpinning.value = false
  }
}

const fetchWinners = async () => {
  try {
    const res = await getRecentWinners('wheel', 20)
    recentWinners.value = res.data || []
  } catch (err) {
    console.error('获取中奖记录失败:', err)
  }
}

const handleContinue = () => {
  showResultDialog.value = false
  // 可以自动开始下一次
  // startSpin()
}

let countdownTimer = null

onMounted(() => {
  fetchActivity()
  countdownTimer = setInterval(updateCountdown, 1000)
})

watch(() => userStore.isLoggedIn, (val) => {
  if (val && activity.value) {
    remainingChances.value = activity.value.maxChances
  }
})

</script>

<style scoped>
.wheel-page {
  max-width: 1000px;
  margin: 0 auto;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
  color: white;
}

.activity-name {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.activity-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 16px 0;
}

.activity-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.9;
}

.countdown {
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 24px;
  border-radius: 12px;
}

.countdown-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.countdown-value {
  font-size: 20px;
  font-weight: bold;
  font-family: monospace;
}

.wheel-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.wheel-section {
  padding: 24px;
}

.wheel-container {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto 24px;
}

.wheel-pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  position: relative;
  box-shadow: 0 0 0 8px #667eea, 0 0 0 12px #764ba2, 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.wheel-inner {
  width: 100%;
  height: 100%;
  position: relative;
}

.wheel-sector {
  position: absolute;
  width: 50%;
  height: 50%;
  left: 50%;
  top: 0;
  transform-origin: 0% 100%;
  overflow: hidden;
}

.sector-content {
  position: absolute;
  left: -100%;
  width: 200%;
  height: 200%;
  text-align: center;
  transform-origin: 50% 100%;
  padding-top: 10%;
}

.sector-text {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: center center;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  width: 80px;
  line-height: 1.2;
  white-space: normal;
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 5;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
}

.wheel-center:hover:not(.disabled) {
  transform: translate(-50%, -50%) scale(1.1);
}

.wheel-center.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-info {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.info-value.highlight {
  color: #fa8c16;
  font-size: 16px;
}

.login-tip {
  text-align: center;
  color: #999;
  margin: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
  margin: 0;
}

.prizes-list,
.winners-list {
  max-height: 280px;
  overflow-y: auto;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.prize-item:last-child {
  border-bottom: none;
}

.prize-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.prize-icon.POINTS {
  background: #fff7e6;
}

.prize-icon.COUPON {
  background: #f0f5ff;
}

.prize-icon.PHYSICAL {
  background: #f6ffed;
}

.prize-icon.THANKYOU {
  background: #f5f5f5;
}

.prize-info {
  flex: 1;
  min-width: 0;
}

.prize-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.prize-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.winners-card {
  margin-top: 24px;
}

.winner-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.winner-item:last-child {
  border-bottom: none;
}

.winner-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.winner-info {
  flex: 1;
  min-width: 0;
}

.winner-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
}

.winner-prize {
  font-size: 12px;
  color: #999;
}

.empty-winners {
  padding: 20px 0;
}

.result-content {
  text-align: center;
  padding: 20px 0;
}

.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: #f5f5f5;
}

.result-icon.winner {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
}

.result-prize {
  margin-bottom: 12px;
}

.result-prize .prize-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.result-prize .prize-type {
  font-size: 16px;
  color: #52c41a;
  font-weight: 600;
}

.result-text p {
  margin: 0 0 8px 0;
  color: #666;
}

.result-text .tip {
  font-size: 13px;
  color: #999;
}

.result-extra {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.result-extra p {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.points-dialog-content {
  text-align: center;
  padding: 20px;
}

.warning-icon {
  font-size: 48px;
  color: #faad14;
  margin-bottom: 16px;
}

.points-dialog-content p {
  margin: 0 0 8px 0;
  color: #333;
}

.points-dialog-content .tip {
  font-size: 13px;
  color: #999;
}

@media (max-width: 900px) {
  .wheel-content {
    grid-template-columns: 1fr;
  }
  
  .info-section {
    order: -1;
  }
  
  .activity-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-right {
    align-self: center;
  }
}
</style>
