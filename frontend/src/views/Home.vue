<template>
  <div class="home">
    <div class="container">
      <div class="page-header">
        <h2>我的设备</h2>
        <button class="btn btn-primary add-btn" @click="$router.push('/add-device')" ref="addBtnRef">
          + 添加设备
        </button>
        <div class="guide-tooltip" v-if="showGuide" ref="guideRef">
          👋 点击这里添加虚拟设备体验智能生活！
          <button class="close-guide" @click="closeGuide">×</button>
        </div>
      </div>

      <div v-if="devices.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <p>还没有设备，点击右上角添加虚拟设备开始体验吧！</p>
      </div>

      <div class="device-grid" v-else>
        <div
          v-for="device in devices"
          :key="device.device_id"
          class="device-card card"
          :class="{ 'virtual-device': device.is_virtual }"
          @click="goToDevice(device.device_id)"
        >
          <div class="device-icon">{{ device.icon }}</div>
          <div class="device-name">
            {{ device.name }}
            <span v-if="device.is_virtual" class="virtual-badge">虚拟</span>
          </div>
          <div class="device-status">{{ device.status === 'online' ? '在线' : '离线' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const devices = ref([])
const showGuide = ref(false)
const addBtnRef = ref(null)
const guideRef = ref(null)

const fetchUserState = async () => {
  try {
    const res = await fetch('/api/user/state')
    const data = await res.json()
    if (data.success && !data.data.guide_shown) {
      showGuide.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchDevices = async () => {
  try {
    const res = await fetch('/api/devices')
    const data = await res.json()
    if (data.success) {
      devices.value = data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const closeGuide = async () => {
  showGuide.value = false
  try {
    await fetch('/api/user/guide-complete', { method: 'POST' })
  } catch (e) {
    console.error(e)
  }
}

const goToDevice = (id) => {
  router.push(`/device/${id}`)
}

onMounted(() => {
  fetchUserState()
  fetchDevices()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
}

.add-btn {
  position: relative;
}

.close-guide {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: 12px;
  padding: 0 4px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-state p {
  color: #666;
  font-size: 16px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.device-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.device-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.device-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.device-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

.device-status {
  font-size: 14px;
  color: #666;
}
</style>
