<template>
  <div class="scenes">
    <div class="container">
      <div class="page-header">
        <h2>智能场景</h2>
      </div>

      <div class="section">
        <div class="section-header">
          <h3 class="section-title">推荐场景</h3>
        </div>
        <p class="section-desc">一键启用，多个设备协同工作</p>
        
        <div class="scene-grid">
          <div
            v-for="scene in scenes"
            :key="scene.scene_id"
            class="scene-card card"
            :class="{ 'scene-active': activeScene === scene.scene_id }"
          >
            <div class="scene-icon">{{ getSceneIcon(scene.scene_id) }}</div>
            <div class="scene-name">{{ scene.name }}</div>
            <div class="scene-desc">{{ scene.config?.description || '' }}</div>
            
            <div class="scene-devices" v-if="scene.devices?.length > 0">
              <span class="devices-label">已绑定设备:</span>
              <span class="devices-count">{{ scene.devices.length }}个</span>
            </div>
            
            <div class="scene-devices" v-else>
              <span class="devices-label">缺失设备，点击添加虚拟设备体验</span>
            </div>

            <div class="scene-actions">
              <button class="btn btn-primary" @click="runScene(scene.scene_id)">
                执行场景
              </button>
              <button class="btn btn-secondary" @click="showAddDeviceModal(scene)">
                添加设备
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <h3>为「{{ currentScene?.name }}」添加设备</h3>
        <p class="modal-desc">选择要添加到此场景的虚拟设备</p>
        
        <div class="device-list">
          <label
            v-for="d in availableDevices"
            :key="d.device_id"
            class="device-item"
            :class="{ 'device-selected': currentScene?.devices?.includes(d.device_id) }"
          >
            <input
              type="checkbox"
              :checked="currentScene?.devices?.includes(d.device_id)"
              @change="toggleDevice(d.device_id)"
            />
            <span class="device-icon">{{ d.icon }}</span>
            <span class="device-name">{{ d.name }} <span class="virtual-badge">虚拟</span></span>
          </label>
          
          <div v-if="availableDevices.length === 0" class="empty-devices">
            <p>还没有虚拟设备，先去添加吧！</p>
            <button class="btn btn-primary" @click="$router.push('/add-device')">
              添加设备
            </button>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveScene">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const scenes = ref([])
const devices = ref([])
const showModal = ref(false)
const currentScene = ref(null)
const activeScene = ref(null)

const availableDevices = ref([])

const fetchScenes = async () => {
  try {
    const res = await fetch('/api/scenes')
    const data = await res.json()
    if (data.success) {
      scenes.value = data.data
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
      availableDevices.value = data.data.filter(d => d.is_virtual)
    }
  } catch (e) {
    console.error(e)
  }
}

const getSceneIcon = (sceneId) => {
  const icons = {
    'scene-home': '🏠',
    'scene-leave': '🚪',
    'scene-sleep': '🌙'
  }
  return icons[sceneId] || '✨'
}

const showAddDeviceModal = (scene) => {
  currentScene.value = JSON.parse(JSON.stringify(scene))
  if (!currentScene.value.devices) {
    currentScene.value.devices = []
  }
  showModal.value = true
}

const toggleDevice = (deviceId) => {
  const idx = currentScene.value.devices.indexOf(deviceId)
  if (idx > -1) {
    currentScene.value.devices.splice(idx, 1)
  } else {
    currentScene.value.devices.push(deviceId)
  }
}

const saveScene = async () => {
  try {
    const original = scenes.value.find(s => s.scene_id === currentScene.value.scene_id)
    const originalDevices = original.devices || []
    const newDevices = currentScene.value.devices || []
    
    for (const deviceId of newDevices) {
      if (!originalDevices.includes(deviceId)) {
        await fetch(`/api/scenes/${currentScene.value.scene_id}/devices/${deviceId}`, {
          method: 'POST'
        })
      }
    }
    
    for (const deviceId of originalDevices) {
      if (!newDevices.includes(deviceId)) {
        await fetch(`/api/scenes/${currentScene.value.scene_id}/devices/${deviceId}`, {
          method: 'DELETE'
        })
      }
    }
    
    showModal.value = false
    fetchScenes()
  } catch (e) {
    console.error(e)
  }
}

const runScene = async (sceneId) => {
  activeScene.value = sceneId
  try {
    await fetch(`/api/scenes/${sceneId}/run`, { method: 'POST' })
    setTimeout(() => {
      activeScene.value = null
      alert('场景执行完成！')
    }, 1500)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchScenes()
  fetchDevices()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
}

.section-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.scene-card {
  display: flex;
  flex-direction: column;
}

.scene-card.scene-active {
  border: 2px solid #ff6700;
  animation: pulse 1s ease-in-out infinite;
}

.scene-icon {
  font-size: 48px;
  margin-bottom: 12px;
  text-align: center;
}

.scene-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.scene-desc {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 16px;
}

.scene-devices {
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
  text-align: center;
}

.devices-label {
  margin-right: 4px;
}

.devices-count {
  color: #ff6700;
  font-weight: 500;
}

.scene-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.scene-actions .btn {
  flex: 1;
}

.modal-content h3 {
  margin-bottom: 8px;
  font-size: 18px;
}

.modal-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.device-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.device-item:hover {
  background: #f5f5f5;
}

.device-item.device-selected {
  background: #fff3e6;
}

.device-icon {
  font-size: 24px;
}

.device-name {
  flex: 1;
}

.empty-devices {
  text-align: center;
  padding: 24px;
}

.empty-devices p {
  color: #666;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
