<template>
  <div class="egg-page">
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

    <div class="egg-content">
      <!-- 砸蛋区域 -->
      <div class="egg-section card">
        <div class="egg-container">
          <div class="egg-row">
            <div 
              v-for="(egg, index) in eggs" 
              :key="index"
              class="egg-item"
              :class="{ 
                'selected': selectedIndex === index,
                'broken': brokenIndexes.includes(index),
                'hitting': isHitting && selectedIndex === index
              }"
              @click="hitEgg(index)"
            >
              <div class="egg-wrapper">
                <div class="egg-outer">
                  <div class="egg-inner">
                    <span class="egg-icon">🥚</span>
                  </div>
                </div>
                <div class="egg-light"></div>
              </div>
              <div class="egg-number">{{ index + 1 }}</div>
              
              <!-- 砸开后的奖品 -->
              <div class="egg-prize" v-if="brokenIndexes.includes(index) && eggResults[index]">
                <div class="prize-icon">
                  <span v-if="eggResults[index].isWinner">🎉</span>
                  <span v-else>💨</span>
                </div>
                <div class="prize-name">{{ eggResults[index].prize?.name }}</div>
              </div>
            </div>
          </div>
          
          <!-- 锤子 -->
          <div class="hammer" :class="{ 'swinging': isHitting }">
            <span class="hammer-icon">🔨</span>
          </div>
        </div>

        <!-- 抽奖信息 -->
        <div class="hit-info" v-if="userStore.isLoggedIn">
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
          <div class="info-row" v-if="brokenIndexes.length > 0">
            <span class="info-label">已砸次数</span>
            <span class="info-value">{{ brokenIndexes.length }}</span>
          </div>
        </div>
        <div class="hit-info" v-else>
          <p class="login-tip">请先登录后参与抽奖</p>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons" v-if="userStore.isLoggedIn">
          <el-button 
            type="warning" 
            size="large"
            :disabled="remainingChances <= 0 || isHitting"
            @click="resetEggs"
            v-if="brokenIndexes.length > 0 && brokenIndexes.length < 3"
          >
            再砸一次
          </el-button>
          <el-button 
            type="primary" 
            size="large"
            @click="resetAllEggs"
            v-if="remainingChances > 0 && brokenIndexes.length >= 3"
          >
            重新开始 (剩余 {{ remainingChances }} 次)
          </el-button>
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
          <p v-if="resultPrize?.type === 'POINTS'">
            <el-button type="primary" size="small" @click="redeemPrize">
              立即兑换积分
            </el-button>
            <span style="margin-left: 12px; font-size: 13px; color: #999;">
              或稍后在"我的奖品"中领取
            </span>
          </p>
          <p v-else>请在"我的奖品"中查看和领取</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleContinue" v-if="brokenIndexes.length < 3 && remainingChances > 0">
            继续砸蛋 (本局剩余 {{ 3 - brokenIndexes.length }} 次)
          </el-button>
          <el-button type="primary" @click="showResultDialog = false">
            确定
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getActiveActivity, getRecentWinners } from '@/api/activity'
import { hitEgg as hitEggApi, redeemPointsPrize } from '@/api/lottery'

const router = useRouter()
const userStore = useUserStore()

const activity = ref(null)
const recentWinners = ref([])
const isHitting = ref(false)
const showResultDialog = ref(false)
const showPointsDialog = ref(false)
const isWinner = ref(false)
const resultPrize = ref(null)
const currentResultPrizeId = ref(null)
const remainingChances = ref(5)
const selectedIndex = ref(-1)

// 倒计时
const countdownEndTime = ref(0)
const countdownText = ref('')

// 金蛋状态
const eggs = ref([1, 2, 3])
const brokenIndexes = ref([])
const eggResults = ref({})

const displayPrizes = computed(() => {
  if (!activity.value || !activity.value.prizes) return []
  return activity.value.prizes.sort((a, b) => a.sortOrder - b.sortOrder)
})

const maskName = (name) => {
  if (!name) return '***'
  if (name.length <= 2) return name.charAt(0) + '*'
  return name.charAt(0) + '*'.repeat(Math.min(name.length - 2, 4)) + name.charAt(name.length - 1)
}

// 获取活动数据
const fetchActivity = async () => {
  try {
    const res = await getActiveActivity('egg')
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

// 砸蛋
const hitEgg = async (index) => {
  if (isHitting.value) return
  if (brokenIndexes.value.includes(index)) return
  
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (brokenIndexes.value.length >= 3) {
    ElMessage.warning('本局已砸完3次，请点击"重新开始"继续')
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
  
  selectedIndex.value = index
  isHitting.value = true
  
  try {
    // 先调用后端接口
    const res = await hitEggApi()
    
    // 等待砸蛋动画
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 标记为砸开
    brokenIndexes.value.push(index)
    
    // 记录结果
    eggResults.value[index] = {
      isWinner: res.data.isWinner,
      prize: res.data.prize,
    }
    
    // 显示结果
    isWinner.value = res.data.isWinner
    resultPrize.value = res.data.prize
    currentResultPrizeId.value = res.data.userPrizeId
    remainingChances.value = res.data.remainingChances
    
    // 更新用户积分
    await userStore.updatePoints()
    
    // 显示弹窗
    showResultDialog.value = true
    
    // 刷新中奖公告
    if (res.data.isWinner) {
      setTimeout(fetchWinners, 500)
    }
  } catch (err) {
    if (err.message === 'INSUFFICIENT_POINTS') {
      showPointsDialog.value = true
    } else {
      ElMessage.error(err.message || '砸蛋失败')
    }
  } finally {
    isHitting.value = false
  }
}

// 兑换积分奖品
const redeemPrize = async () => {
  if (!currentResultPrizeId.value) return
  
  try {
    await redeemPointsPrize(currentResultPrizeId.value)
    ElMessage.success('兑换成功，积分已到账')
    showResultDialog.value = false
    await userStore.updatePoints()
  } catch (err) {
    ElMessage.error(err.message || '兑换失败')
  }
}

const fetchWinners = async () => {
  try {
    const res = await getRecentWinners('egg', 20)
    recentWinners.value = res.data || []
  } catch (err) {
    console.error('获取中奖记录失败:', err)
  }
}

// 重置砸蛋（同一轮再砸）
const resetEggs = () => {
  // 不重置，继续砸剩下的
}

// 重新开始新一轮
const resetAllEggs = () => {
  brokenIndexes.value = []
  eggResults.value = {}
  selectedIndex.value = -1
}

const handleContinue = () => {
  showResultDialog.value = false
}

let countdownTimer = null

onMounted(() => {
  fetchActivity()
  countdownTimer = setInterval(updateCountdown, 1000)
})
</script>

<style scoped>
.egg-page {
  max-width: 1000px;
  margin: 0 auto;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(250, 140, 22, 0.95) 0%, rgba(255, 77, 79, 0.95) 100%);
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

.egg-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.egg-section {
  padding: 24px;
}

.egg-container {
  position: relative;
  padding: 40px 20px;
  min-height: 280px;
}

.egg-row {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.egg-item {
  position: relative;
  width: 120px;
  height: 140px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.egg-item:hover:not(.broken) {
  transform: translateY(-8px);
}

.egg-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.egg-outer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: linear-gradient(145deg, #ffd700 0%, #ffb347 50%, #ff8c00 100%);
  box-shadow: 
    0 8px 25px rgba(255, 140, 0, 0.4),
    inset 0 -15px 30px rgba(0, 0, 0, 0.1),
    inset 0 15px 30px rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.egg-inner {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.egg-icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.egg-light {
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 20%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 50%;
  transform: rotate(-30deg);
}

.egg-number {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.egg-item.broken .egg-outer {
  opacity: 0.3;
  transform: scale(0.8);
}

.egg-item.broken .egg-icon {
  opacity: 0;
}

.egg-prize {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  animation: bounce 0.5s ease-out;
}

.egg-prize .prize-icon {
  font-size: 36px;
  margin-bottom: 4px;
}

.egg-prize .prize-name {
  font-size: 12px;
  color: #333;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 8px;
  border-radius: 4px;
}

.egg-item.hitting .egg-outer {
  animation: shake 0.3s ease-in-out;
}

.hammer {
  position: absolute;
  top: -30px;
  right: 50%;
  transform: translateX(50%) rotate(-30deg);
  font-size: 48px;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
}

.hammer.swinging {
  opacity: 1;
  animation: hammerSwing 0.8s ease-in-out;
}

@keyframes hammerSwing {
  0% {
    transform: translateX(50%) rotate(-60deg);
    opacity: 1;
  }
  50% {
    transform: translateX(50%) rotate(30deg);
  }
  100% {
    transform: translateX(50%) rotate(-30deg);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

@keyframes bounce {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.hit-info {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
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

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 16px;
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
  background: linear-gradient(135deg, #fa8c16 0%, #ff4d4f 100%);
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
  .egg-content {
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
  
  .egg-row {
    gap: 20px;
  }
  
  .egg-item {
    width: 100px;
    height: 120px;
  }
}
</style>
