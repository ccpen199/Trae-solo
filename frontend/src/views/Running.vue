<template>
  <div class="running-page" :class="{ 'is-running': isRunning, 'is-paused': isPaused }">
    <div class="map-container">
      <div class="map-placeholder">
        <div class="map-icon">{{ currentTypeIcon }}</div>
        <p v-if="!locationGranted" class="location-hint">请允许获取位置权限以记录运动轨迹</p>
        <p v-else class="location-hint">位置追踪已开启</p>
      </div>
      
      <div class="settings-btn" @click="showSettings = true">
        <van-icon name="setting-o" size="24" />
      </div>
      
      <div class="music-btn" @click="showMusic = true">
        <van-icon name="music-o" size="24" />
      </div>
    </div>
    
    <div class="stats-container">
      <div class="stats-row">
        <div class="stat-block">
          <div class="stat-big-value">{{ distance.toFixed(2) }}</div>
          <div class="stat-big-label">公里</div>
        </div>
        <div class="stat-block">
          <div class="stat-big-value">{{ formatTime(duration) }}</div>
          <div class="stat-big-label">用时</div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-small-block">
          <div class="stat-small-value">{{ calories }}</div>
          <div class="stat-small-label">千卡</div>
        </div>
        <div class="stat-small-block">
          <div class="stat-small-value">{{ pace }}</div>
          <div class="stat-small-label">配速</div>
        </div>
        <div class="stat-small-block">
          <div class="stat-small-value">{{ stepCount }}</div>
          <div class="stat-small-label">步数</div>
        </div>
      </div>
    </div>
    
    <div class="controls-container">
      <div v-if="!isRunning && !isPaused" class="start-controls">
        <div class="type-selector">
          <div 
            v-for="type in workoutTypes" 
            :key="type.value"
            class="type-item"
            :class="{ active: currentType === type.value }"
            @click="currentType = type.value"
          >
            <div class="type-icon">{{ type.icon }}</div>
            <div class="type-name">{{ type.name }}</div>
          </div>
        </div>
        
        <van-button 
          type="primary" 
          size="large" 
          round
          class="start-btn"
          @click="startWorkout"
        >
          开始运动
        </van-button>
      </div>
      
      <div v-else class="running-controls">
        <van-button 
          type="default" 
          size="large" 
          round
          class="control-btn"
          @click="togglePause"
        >
          {{ isPaused ? '继续' : '暂停' }}
        </van-button>
        
        <div 
          class="end-btn"
          @click="tryEndWorkout"
          @touchstart="startLongPress"
          @touchend="endLongPress"
          @mousedown="startLongPress"
          @mouseup="endLongPress"
          @mouseleave="cancelLongPress"
        >
          <div class="end-progress" :style="{ transform: `rotate(${longPressProgress * 3.6}deg)` }"></div>
          <div class="end-icon">
            <van-icon name="stop" size="20" />
          </div>
          <span class="end-text">长按结束</span>
        </div>
        
        <van-button 
          type="default" 
          size="large" 
          round
          class="control-btn"
          @click="toggleLock"
        >
          <van-icon :name="isLocked ? 'unlock' : 'lock'" />
        </van-button>
      </div>
    </div>
    
    <van-popup v-model:show="showSettings" position="bottom" round>
      <div class="settings-popup">
        <h3>运动设置</h3>
        <van-cell-group inset>
          <van-switch-cell v-model="autoPause" title="自动暂停" />
          <van-switch-cell v-model="voiceFeedback" title="语音反馈" />
          <van-cell title="目标设置" is-link @click="showGoalSetting" />
        </van-cell-group>
        <van-button block type="default" @click="showSettings = false" class="close-btn">
          关闭
        </van-button>
      </div>
    </van-popup>
    
    <van-popup v-model:show="showMusic" position="bottom" round>
      <div class="music-popup">
        <h3>音乐播放</h3>
        <div class="music-list">
          <div class="music-item" @click="playMusic(1)">
            <span>🎵</span>
            <span>运动激励音乐</span>
          </div>
          <div class="music-item" @click="playMusic(2)">
            <span>🎧</span>
            <span>慢跑舒缓音乐</span>
          </div>
          <div class="music-item" @click="playMusic(3)">
            <span>🔊</span>
            <span>动感单车音乐</span>
          </div>
        </div>
        <van-button block type="default" @click="showMusic = false" class="close-btn">
          关闭
        </van-button>
      </div>
    </van-popup>
    
    <van-popup v-model:show="showResult" position="center" round>
      <div class="result-popup">
        <div class="result-icon">🎉</div>
        <h3>运动完成！</h3>
        <div class="result-stats">
          <div class="result-stat">
            <div class="result-value">{{ distance.toFixed(2) }}</div>
            <div class="result-label">公里</div>
          </div>
          <div class="result-stat">
            <div class="result-value">{{ formatTime(duration) }}</div>
            <div class="result-label">用时</div>
          </div>
          <div class="result-stat">
            <div class="result-value">{{ calories }}</div>
            <div class="result-label">千卡</div>
          </div>
        </div>
        <van-button block type="primary" @click="saveAndExit">
          保存并返回
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { workoutApi } from '../api'

const router = useRouter()

const workoutTypes = [
  { value: 'running', name: '跑步', icon: '🏃' },
  { value: 'walking', name: '行走', icon: '🚶' },
  { value: 'cycling', name: '骑行', icon: '🚴' }
]

const currentType = ref('running')
const isRunning = ref(false)
const isPaused = ref(false)
const isLocked = ref(false)
const locationGranted = ref(false)
const showSettings = ref(false)
const showMusic = ref(false)
const showResult = ref(false)
const autoPause = ref(true)
const voiceFeedback = ref(true)

const distance = ref(0)
const duration = ref(0)
const calories = ref(0)
const pace = ref('0\'00"')
const stepCount = ref(0)

let timerInterval = null
let longPressTimer = null
let longPressStartTime = 0
const longPressProgress = ref(0)

const currentTypeIcon = computed(() => {
  return workoutTypes.find(t => t.value === currentType.value)?.icon || '🏃'
})

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function requestLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      () => {
        locationGranted.value = true
        showToast('位置权限获取成功')
      },
      () => {
        locationGranted.value = false
        showToast('位置权限获取失败，请手动开启')
      }
    )
  } else {
    locationGranted.value = true
    showToast('位置权限已模拟开启')
  }
}

function startWorkout() {
  requestLocation()
  isRunning.value = true
  isPaused.value = false
  
  timerInterval = setInterval(() => {
    if (!isPaused.value) {
      duration.value++
      
      if (currentType.value === 'running') {
        distance.value += 0.0025
        stepCount.value += 3
        calories.value += 0.15
      } else if (currentType.value === 'walking') {
        distance.value += 0.0012
        stepCount.value += 2
        calories.value += 0.08
      } else {
        distance.value += 0.005
        calories.value += 0.2
      }
      
      if (distance.value > 0) {
        const paceSeconds = (duration.value / 60) / distance.value
        const paceMin = Math.floor(paceSeconds)
        const paceSec = Math.round((paceSeconds - paceMin) * 60)
        pace.value = `${paceMin}'${paceSec.toString().padStart(2, '0')}"`
      }
    }
  }, 1000)
  
  showToast('开始记录运动')
}

function togglePause() {
  isPaused.value = !isPaused.value
  showToast(isPaused.value ? '运动已暂停' : '继续运动')
}

function toggleLock() {
  isLocked.value = !isLocked.value
  showToast(isLocked.value ? '屏幕已锁定' : '屏幕已解锁')
}

function startLongPress() {
  longPressStartTime.value = Date.now()
  longPressProgress.value = 0
  
  longPressTimer = setInterval(() => {
    const elapsed = Date.now() - longPressStartTime.value
    longPressProgress.value = Math.min((elapsed / 2000) * 100, 100)
    
    if (longPressProgress.value >= 100) {
      endLongPress()
      endWorkout()
    }
  }, 50)
}

function endLongPress() {
  if (longPressTimer) {
    clearInterval(longPressTimer)
    longPressTimer = null
  }
  longPressProgress.value = 0
}

function cancelLongPress() {
  endLongPress()
}

function tryEndWorkout() {
}

function endWorkout() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  
  isRunning.value = false
  isPaused.value = false
  showResult.value = true
}

async function saveAndExit() {
  try {
    await workoutApi.create({
      type: currentType.value,
      distance: distance.value,
      duration: duration.value,
      calories: Math.round(calories.value),
      pace: pace.value,
      start_time: new Date(Date.now() - duration.value * 1000).toISOString(),
      end_time: new Date().toISOString()
    })
    showToast('运动记录已保存')
  } catch (err) {
    console.error('保存失败:', err)
  }
  
  showResult.value = false
  router.back()
}

function showGoalSetting() {
  showToast('目标设置功能开发中')
}

function playMusic(id) {
  showToast('音乐播放功能开发中')
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (longPressTimer) clearInterval(longPressTimer)
})
</script>

<style lang="less" scoped>
.running-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 200px;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}

.map-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.location-hint {
  font-size: 14px;
  opacity: 0.7;
}

.settings-btn,
.music-btn {
  position: absolute;
  top: 16px;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.settings-btn {
  right: 16px;
}

.music-btn {
  right: 72px;
}

.stats-container {
  padding: 20px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-block {
  text-align: center;
}

.stat-big-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.stat-big-label {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 4px;
}

.stat-small-block {
  text-align: center;
  flex: 1;
}

.stat-small-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-small-label {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

.controls-container {
  padding: 20px 20px 40px;
}

.type-selector {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s;
  
  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: scale(1.05);
  }
}

.type-icon {
  font-size: 32px;
}

.type-name {
  font-size: 14px;
}

.start-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 18px;
  font-weight: 600;
}

.running-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.control-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.end-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 77, 79, 0.2);
  border: 3px solid #ff4d4f;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

.end-progress {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top-color: #ff4d4f;
  top: -4px;
  left: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
}

.end-icon {
  width: 40px;
  height: 40px;
  background: #ff4d4f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.end-text {
  font-size: 12px;
  margin-top: 4px;
}

.settings-popup,
.music-popup {
  padding: 20px;
}

.settings-popup h3,
.music-popup h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 18px;
}

.music-list {
  margin-bottom: 20px;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.close-btn {
  margin-top: 16px;
}

.result-popup {
  padding: 30px;
  text-align: center;
}

.result-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.result-popup h3 {
  font-size: 24px;
  margin-bottom: 24px;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.result-stat {
  text-align: center;
}

.result-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.result-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
</style>
