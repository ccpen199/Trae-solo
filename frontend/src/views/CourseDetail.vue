<template>
  <div class="course-detail-page" :class="{ 'is-landscape': isLandscape }">
    <LoadingState v-if="loading" />
    <template v-else>
      <div class="video-section" :class="{ 'fullscreen': isLandscape }" @click="togglePlay">
        <div class="video-placeholder">
          <div v-if="!isStarted" class="start-hint">
            <div class="start-icon">🏃</div>
            <p>点击下方"开始训练"按钮</p>
          </div>
          <div v-else>
            <div v-if="!isPlaying" class="play-btn">
              <van-icon name="play" size="40" />
            </div>
            <div v-else class="video-progress">
              <van-progress :percentage="actionProgress" color="#ffffff" stroke-width="8" />
            </div>
            <div class="video-info">
              <span class="action-name">{{ currentAction?.name || course?.title }}</span>
              <span class="action-time">{{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}</span>
            </div>
            <div v-if="isPlaying" class="countdown">
              <div class="countdown-number">{{ Math.max(0, totalTime - currentTime) }}</div>
              <div class="countdown-label">秒</div>
            </div>
          </div>
        </div>
      
        <div class="video-controls">
        <van-icon name="arrow-left" size="24" @click.stop="goBack" class="back-btn" />
        <van-icon 
          :name="isLocked ? 'unlock' : 'lock'" 
          size="24" 
          @click.stop="toggleLock" 
          class="lock-btn" 
        />
        <van-icon 
          :name="isLandscape ? 'expand' : 'expand'" 
          size="24" 
          @click.stop="toggleFullscreen" 
          class="fullscreen-btn" 
        />
      </div>
    </div>
    
    <div v-if="!isLandscape" class="content-section">
      <div class="course-header">
        <h1>{{ course?.title }}</h1>
        <div class="course-meta">
          <span>⏱ {{ course?.duration || 0 }}分钟</span>
          <span>🔥 {{ course?.calories || 0 }}千卡</span>
          <span>🎯 {{ course?.difficulty || '初级' }}</span>
        </div>
        <p class="course-desc">{{ course?.description }}</p>
      </div>
      
      <div class="actions-section">
        <h3>动作列表</h3>
        <div class="actions-list">
          <div
            v-for="(action, index) in course?.actions || []"
            :key="action.id || index"
            class="action-item"
            :class="{ active: currentActionIndex === index, completed: index < currentActionIndex }"
            @click="selectAction(index)"
          >
            <div class="action-no">
              <van-icon v-if="index < currentActionIndex" name="checked" size="16" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="action-info">
              <h4>{{ action.name }}</h4>
              <span class="action-duration">{{ action.duration || 30 }}秒</span>
            </div>
            <div v-if="index === currentActionIndex" class="action-status">
              进行中
            </div>
          </div>
        </div>
      </div>
      
      <div class="bottom-controls">
        <van-button
          v-if="!isStarted"
          type="primary"
          size="large"
          block
          round
          class="start-btn"
          @click="startCourse"
        >
          开始训练
        </van-button>
        <template v-else>
          <van-button
            type="default"
            size="large"
            round
            class="nav-btn"
            @click="prevAction"
            :disabled="currentActionIndex === 0"
          >
            上一个
          </van-button>
          <van-button
            type="primary"
            size="large"
            round
            class="pause-btn"
            @click="togglePlay"
          >
            {{ isPlaying ? '暂停' : '继续' }}
          </van-button>
          <van-button
            type="default"
            size="large"
            round
            class="nav-btn"
            @click="nextAction"
            :disabled="currentActionIndex === (course?.actions?.length || 0) - 1"
          >
            下一个
          </van-button>
        </template>
      </div>
    </div>
    
    <van-popup v-model:show="showComplete" position="center" round>
      <div class="complete-popup">
        <div class="complete-icon">🎉</div>
        <h3>恭喜完成训练！</h3>
        <div class="complete-stats">
          <div class="complete-stat">
            <div class="complete-value">{{ course?.actions?.length || 0 }}</div>
            <div class="complete-label">个动作</div>
          </div>
          <div class="complete-stat">
            <div class="complete-value">{{ course?.duration || 0 }}</div>
            <div class="complete-label">分钟</div>
          </div>
          <div class="complete-stat">
            <div class="complete-value">{{ course?.calories || 0 }}</div>
            <div class="complete-label">千卡</div>
          </div>
        </div>
        <van-button block type="primary" @click="saveAndExit">
          完成
        </van-button>
      </div>
    </van-popup>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { courseApi } from '../api'
import LoadingState from '../components/LoadingState.vue'

const router = useRouter()
const route = useRoute()

const course = ref(null)
const isStarted = ref(false)
const isPlaying = ref(false)
const isLocked = ref(false)
const isLandscape = ref(false)
const showComplete = ref(false)
const currentActionIndex = ref(0)
const currentTime = ref(0)
const loading = ref(true)

let playInterval = null

const currentAction = computed(() => {
  return course.value?.actions?.[currentActionIndex.value]
})

const totalTime = computed(() => {
  return (currentAction.value?.duration || 30)
})

const actionProgress = computed(() => {
  if (totalTime.value === 0) return 0
  return Math.round((currentTime.value / totalTime.value) * 100)
})

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

async function loadCourse() {
  loading.value = true
  try {
    const data = await courseApi.getDetail(route.params.id)
    course.value = data?.course
  } catch (err) {
    console.error('加载课程失败:', err)
  } finally {
    loading.value = false
  }
}

function startCourse() {
  isStarted.value = true
  isPlaying.value = true
  currentTime.value = 0
  startTimer()
  showToast('开始训练')
}

function startTimer() {
  if (playInterval) clearInterval(playInterval)
  
  playInterval = setInterval(() => {
    if (isPlaying.value) {
      currentTime.value++
      
      if (currentTime.value >= totalTime.value) {
        nextAction()
      }
    }
  }, 1000)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value && isStarted.value) {
    startTimer()
  }
}

function selectAction(index) {
  currentActionIndex.value = index
  currentTime.value = 0
  if (isPlaying.value) {
    startTimer()
  }
}

function prevAction() {
  if (currentActionIndex.value > 0) {
    currentActionIndex.value--
    currentTime.value = 0
    if (isPlaying.value) {
      startTimer()
    }
  }
}

function nextAction() {
  if (currentActionIndex.value < (course.value?.actions?.length || 0) - 1) {
    currentActionIndex.value++
    currentTime.value = 0
    if (isPlaying.value) {
      startTimer()
    }
  } else {
    isPlaying.value = false
    if (playInterval) clearInterval(playInterval)
    showComplete.value = true
  }
}

function toggleLock() {
  isLocked.value = !isLocked.value
  showToast(isLocked.value ? '已锁定' : '已解锁')
}

function toggleFullscreen() {
  isLandscape.value = !isLandscape.value
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function goBack() {
  if (isLandscape.value) {
    toggleFullscreen()
  } else {
    router.back()
  }
}

async function saveAndExit() {
  try {
    await courseApi.updateProgress({
      courseId: course.value.id,
      progress: 100
    })
    showToast('训练进度已保存')
  } catch (err) {
    console.error('保存失败:', err)
  }
  
  showComplete.value = false
  router.back()
}

onMounted(() => {
  loadCourse()
})

onUnmounted(() => {
  if (playInterval) clearInterval(playInterval)
})
</script>

<style lang="less" scoped>
.course-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  
  &.is-landscape {
    flex-direction: row;
  }
}

.video-section {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 220px;
  color: white;
  flex-shrink: 0;
  
  &.fullscreen {
    flex: 1;
    height: 100vh;
  }
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.play-btn {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  cursor: pointer;
  z-index: 10;
}

.video-progress {
  position: absolute;
  bottom: 60px;
  left: 20px;
  right: 20px;
  z-index: 5;
}

.video-info {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 14px;
}

.action-name {
  font-weight: 500;
}

.video-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.back-btn,
.lock-btn,
.fullscreen-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.course-header {
  padding: 20px;
  background: white;
}

.course-header h1 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #333;
}

.course-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.course-desc {
  font-size: 14px;
  color: #999;
  line-height: 1.6;
}

.actions-section {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.actions-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  
  &.active {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }
  
  &.completed {
    opacity: 0.7;
  }
}

.action-no {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  
  :deep(.van-icon) {
    color: #52c41a;
  }
}

.action-item.active .action-no {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-info {
  flex: 1;
}

.action-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.action-duration {
  font-size: 13px;
  color: #999;
}

.action-status {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.bottom-controls {
  padding: 16px 20px 32px;
  background: white;
  display: flex;
  gap: 12px;
}

.start-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  font-weight: 600;
}

.nav-btn {
  flex: 1;
}

.pause-btn {
  flex: 2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.complete-popup {
  padding: 30px;
  text-align: center;
}

.complete-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.complete-popup h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #333;
}

.complete-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.complete-stat {
  text-align: center;
}

.complete-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.complete-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.start-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.start-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.start-hint p {
  font-size: 16px;
  opacity: 0.9;
}

.countdown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1;
}

.countdown-number {
  font-size: 72px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.countdown-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}
</style>
