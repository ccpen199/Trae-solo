<template>
  <div class="device-detail">
    <div class="container">
      <div class="page-header">
        <button class="btn btn-secondary back-btn" @click="$router.back()">← 返回</button>
        <h2>
          {{ device?.name || '设备详情' }}
          <span v-if="device?.is_virtual" class="virtual-badge">虚拟</span>
        </h2>
        <button v-if="device?.is_virtual" class="btn btn-secondary" @click="deleteDevice">删除设备</button>
      </div>

      <div v-if="device" class="device-content">
        <div class="card device-panel" :class="{ 'virtual-device': device.is_virtual }">
          <div class="animation-container">
            <div
              class="animation-icon"
              :class="animationClass"
            >{{ device.icon }}</div>
          </div>
          
          <div class="device-status-text">
            <span v-if="isPlaying">运行中...</span>
            <span v-else-if="lastResult">上次运行: {{ lastResult.message }}</span>
            <span v-else>设备就绪</span>
          </div>

          <div v-if="device.is_virtual" class="device-controls">
            <button v-if="!isPlaying" class="btn btn-primary" @click="startAnimation">
              ▶ 模拟运行
            </button>
            <button v-else class="btn btn-secondary" @click="pauseAnimation">
              ⏸ 暂停
            </button>
            <button class="btn btn-primary" @click="goToPurchase">
              🛒 购买实物
            </button>
          </div>
        </div>

        <div class="card config-panel">
          <h3>设备配置</h3>
          <div class="config-list">
            <div v-for="(value, key) in device.config" :key="key" class="config-item">
              <span class="config-label">{{ getConfigLabel(key) }}</span>
              <span class="config-value">{{ formatConfigValue(key, value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const device = ref(null)
const isPlaying = ref(false)
const lastResult = ref(null)
const animationTimer = ref(null)

const animationClass = computed(() => {
  if (!isPlaying.value) return {}
  const type = device.value?.type
  if (type === 'vacuum') return { 'animation-spin': true }
  if (type === 'purifier') return { 'animation-wave': true }
  if (type === 'lock') return { 'animation-lock': true }
  return { 'animation-playing': true }
})

const fetchDevice = async () => {
  try {
    const res = await fetch('/api/devices')
    const data = await res.json()
    if (data.success) {
      device.value = data.data.find(d => d.device_id === route.params.id)
      if (device.value?.last_run_result) {
        lastResult.value = device.value.last_run_result
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const startAnimation = async () => {
  try {
    await fetch(`/api/devices/${device.value.device_id}/run`, { method: 'POST' })
    isPlaying.value = true
    
    animationTimer.value = setTimeout(() => {
      completeAnimation()
    }, 3000)
  } catch (e) {
    console.error(e)
  }
}

const pauseAnimation = async () => {
  try {
    await fetch(`/api/devices/${device.value.device_id}/pause`, { method: 'POST' })
    isPlaying.value = false
    if (animationTimer.value) {
      clearTimeout(animationTimer.value)
    }
  } catch (e) {
    console.error(e)
  }
}

const completeAnimation = async () => {
  isPlaying.value = false
  const results = {
    lock: { message: '门已锁好 ✓', battery: 85 },
    purifier: { message: '空气已净化 ✓', pm25: 28 },
    vacuum: { message: '清扫完成 ✓', area: 45 }
  }
  const result = results[device.value.type] || { message: '运行完成 ✓' }
  lastResult.value = result
  
  try {
    await fetch(`/api/devices/${device.value.device_id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    })
  } catch (e) {
    console.error(e)
  }
}

const deleteDevice = async () => {
  if (!confirm('确定要删除这个虚拟设备吗？')) return
  try {
    await fetch(`/api/devices/${device.value.device_id}`, { method: 'DELETE' })
    router.push('/')
  } catch (e) {
    console.error(e)
  }
}

const goToPurchase = async () => {
  try {
    const res = await fetch(`/api/devices/${device.value.device_id}/purchase`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      alert('感谢您的关注！真实商品购买链接已记录。')
    }
  } catch (e) {
    console.error(e)
  }
}

const getConfigLabel = (key) => {
  const labels = {
    lockStatus: '锁状态',
    battery: '电量',
    autoLock: '自动上锁',
    pm25: 'PM2.5',
    mode: '工作模式',
    fanSpeed: '风速',
    filterLife: '滤芯寿命',
    cleaningArea: '清扫面积',
    waterLevel: '水量'
  }
  return labels[key] || key
}

const formatConfigValue = (key, value) => {
  const units = {
    battery: '%',
    pm25: 'μg/m³',
    fanSpeed: '档',
    filterLife: '%',
    cleaningArea: 'm²',
    waterLevel: '级'
  }
  if (typeof value === 'boolean') return value ? '开启' : '关闭'
  return value + (units[key] || '')
}

onMounted(() => {
  fetchDevice()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  display: flex;
  align-items: center;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-content {
  display: grid;
  gap: 24px;
}

.device-panel {
  text-align: center;
  padding: 40px 24px;
}

.device-status-text {
  font-size: 16px;
  color: #666;
  margin: 24px 0;
}

.device-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.config-panel h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.config-list {
  display: grid;
  gap: 16px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.config-item:last-child {
  border-bottom: none;
}

.config-label {
  color: #666;
}

.config-value {
  font-weight: 500;
}
</style>
