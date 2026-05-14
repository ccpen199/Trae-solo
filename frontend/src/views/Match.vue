<template>
  <div class="match-page">
    <div v-if="state === 'idle'" class="idle-state">
      <div class="match-icon">
        <el-icon :size="80"><Connection /></el-icon>
      </div>
      <h1>寻找灵魂伴侣</h1>
      <p>点击下方按钮开始匹配</p>
      <el-button type="primary" size="large" class="start-btn" @click="startMatch">
        开始随机匹配
      </el-button>
      <el-button text @click="showFilter = true">筛选条件</el-button>
    </div>

    <div v-else-if="state === 'matching'" class="matching-state">
      <div class="matching-animation">
        <div class="pulse-ring"></div>
        <div class="pulse-ring delay-1"></div>
        <div class="pulse-ring delay-2"></div>
        <div class="center-icon">
          <el-icon :size="50"><Connection /></el-icon>
        </div>
      </div>
      <h2>正在为你匹配...</h2>
      <p class="tips">{{ currentTip }}</p>
    </div>

    <div v-else-if="state === 'success'" class="success-state">
      <div class="fireworks">
        <div v-for="i in 12" :key="i" class="spark" :style="{ '--i': i }"></div>
      </div>
      <div class="matched-user">
        <div class="user-avatar" :style="{ background: getAvatarColor(matchedUser.id) }">
          {{ getAvatarEmoji(matchedUser.id) }}
        </div>
        <h2>匹配成功！</h2>
        <p>{{ matchedUser.gender === 'male' ? '♂' : '♀' }} {{ matchedUser.age || '?' }}岁 · {{ matchedUser.constellation }}</p>
        <div class="planet-tag" :style="{ background: matchedUser.planet?.color }">{{ matchedUser.planet?.name }}</div>
      </div>
      <div class="actions">
        <el-button size="large" @click="resetMatch">再匹配一次</el-button>
        <el-button type="primary" size="large" @click="goToChat">开始聊天</el-button>
      </div>
    </div>

    <div v-else-if="state === 'failed'" class="failed-state">
      <div class="sad-icon">
        <el-icon :size="60"><Search /></el-icon>
      </div>
      <h2>暂未找到合适的人</h2>
      <p>换个筛选条件试试吧</p>
      <el-button type="primary" size="large" @click="resetMatch">重试</el-button>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/')">
        <el-icon><Planet /></el-icon>
        <span>星球</span>
      </div>
      <div class="nav-item" @click="$router.push('/square')">
        <el-icon><Document /></el-icon>
        <span>广场</span>
      </div>
      <div class="nav-item match-btn active">
        <el-icon><Connection /></el-icon>
        <span>匹配</span>
      </div>
      <div class="nav-item" @click="$router.push('/messages')">
        <el-icon><ChatDotRound /></el-icon>
        <span>消息</span>
      </div>
    </div>

    <el-dialog v-model="showFilter" title="筛选条件" width="350px">
      <el-form :model="filterForm" label-width="80px">
        <el-form-item label="年龄">
          <el-input v-model.number="filterForm.minAge" placeholder="最小" style="width: 100px" />
          <span style="margin: 0 10px">-</span>
          <el-input v-model.number="filterForm.maxAge" placeholder="最大" style="width: 100px" />
        </el-form-item>
        <el-form-item label="星座">
          <el-select v-model="filterForm.constellation" placeholder="选择星座" clearable style="width: 100%">
            <el-option v-for="c in constellations" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="filterForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
            <el-radio value="">不限</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetFilter">重置</el-button>
        <el-button type="primary" @click="applyFilter">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Connection, Search, Planet, Document, ChatDotRound } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()

const state = ref('idle')
const showFilter = ref(false)
const matchedUser = ref(null)
const currentTip = ref('寻找志同道合的灵魂...')

const filterForm = reactive({
  minAge: null,
  maxAge: null,
  constellation: '',
  gender: ''
})

const constellations = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
]

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const avatarEmojis = ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻']

const tips = [
  '寻找志同道合的灵魂...',
  '正在穿越星球...',
  '发现有趣的灵魂...',
  '匹配中，请稍候...',
  '正在连接宇宙...'
]

let tipInterval = null

const getAvatarColor = (id) => avatarColors[(id - 1) % avatarColors.length]
const getAvatarEmoji = (id) => avatarEmojis[(id - 1) % avatarEmojis.length]

const startMatch = () => {
  state.value = 'matching'
  
  let tipIndex = 0
  tipInterval = setInterval(() => {
    tipIndex = (tipIndex + 1) % tips.length
    currentTip.value = tips[tipIndex]
  }, 1500)

  setTimeout(async () => {
    clearInterval(tipInterval)
    try {
      const res = await request.post('/match/random', filterForm)
      if (res.data.matched) {
        matchedUser.value = res.data.user
        state.value = 'success'
      } else {
        state.value = 'failed'
      }
    } catch (e) {
      state.value = 'failed'
    }
  }, 3000)
}

const resetMatch = () => {
  state.value = 'idle'
  matchedUser.value = null
}

const applyFilter = () => {
  showFilter.value = false
}

const resetFilter = () => {
  filterForm.minAge = null
  filterForm.maxAge = null
  filterForm.constellation = ''
  filterForm.gender = ''
}

const goToChat = () => {
  router.push(`/chat/${matchedUser.value.id}`)
}
</script>

<style scoped>
.match-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 80px;
}

.idle-state, .matching-state, .success-state, .failed-state {
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: white;
  text-align: center;
}

.match-icon {
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.idle-state h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.idle-state p {
  opacity: 0.9;
  margin-bottom: 40px;
}

.start-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 15px 50px;
  font-size: 18px;
  border-radius: 50px;
  font-weight: 600;
  margin-bottom: 15px;
}

.idle-state .el-button--text {
  color: rgba(255, 255, 255, 0.8);
}

.matching-animation {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 40px;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-out infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.6s;
}

.pulse-ring.delay-2 {
  animation-delay: 1.2s;
}

@keyframes pulse {
  0% {
    width: 100px;
    height: 100px;
    opacity: 1;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

.center-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.matching-state h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.tips {
  opacity: 0.8;
}

.success-state {
  position: relative;
  overflow: hidden;
}

.fireworks {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
}

.spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: sparkle 1s ease-out infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes sparkle {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + cos(var(--i) * 30deg) * 150px), calc(-50% + sin(var(--i) * 30deg) * 150px)) scale(0);
    opacity: 0;
  }
}

.matched-user {
  position: relative;
  z-index: 1;
}

.matched-user .user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.matched-user h2 {
  font-size: 32px;
  margin-bottom: 10px;
}

.matched-user p {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 15px;
}

.planet-tag {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.success-state .actions {
  display: flex;
  gap: 15px;
  margin-top: 50px;
}

.success-state .actions .el-button {
  padding: 15px 30px;
  border-radius: 50px;
  font-weight: 600;
}

.success-state .actions .el-button:first-child {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
}

.success-state .actions .el-button:last-child {
  background: white;
  color: #667eea;
  border: none;
}

.sad-icon {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.failed-state h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.failed-state p {
  opacity: 0.8;
  margin-bottom: 30px;
}

.failed-state .el-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 12px 40px;
  border-radius: 50px;
  font-weight: 600;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.nav-item.active {
  color: #667eea;
}

.nav-item.match-btn {
  color: #667eea;
}

.nav-item.match-btn .el-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -8px;
}
</style>
