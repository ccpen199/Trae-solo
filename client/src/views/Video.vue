<template>
  <Layout>
    <div class="video-page">
      <div class="page-header">
        <h2 class="page-subtitle">实时监控现场画面</h2>
      </div>
      
      <div class="cameras-grid">
        <div v-for="camera in cameras" :key="camera.deviceId" class="camera-card">
          <div class="camera-header">
            <h3 class="camera-name">{{ camera.name }}</h3>
            <span class="status-badge status-online">在线</span>
          </div>
          
          <div class="camera-view">
            <div class="video-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <p class="placeholder-text">点击刷新获取画面</p>
              <div v-if="camera.snapshot" class="snapshot-time">
                最近快照: {{ formatTime(camera.snapshot.created_at) }}
              </div>
            </div>
          </div>
          
          <div class="camera-controls">
            <button 
              class="btn btn-primary btn-sm" 
              @click="refreshSnapshot(camera)"
              :disabled="camera.refreshing"
            >
              <span v-if="camera.refreshing" class="loading"></span>
              <span v-else>刷新画面</span>
            </button>
            <button 
              v-if="isAdmin"
              class="btn btn-secondary btn-sm" 
              @click="toggleStreaming(camera)"
            >
              {{ camera.streaming ? '停止直播' : '开始直播' }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="snapshots-section card">
        <div class="section-header">
          <h3 class="section-title">快照历史</h3>
        </div>
        
        <div class="snapshots-grid">
          <div v-for="snapshot in snapshots" :key="snapshot.id" class="snapshot-item">
            <div class="snapshot-thumb">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div class="snapshot-info">
              <p class="snapshot-device">{{ getDeviceName(snapshot.device_id) }}</p>
              <p class="snapshot-time">{{ formatTime(snapshot.created_at) }}</p>
            </div>
          </div>
          <div v-if="snapshots.length === 0" class="empty-snapshots">
            <p>暂无快照记录</p>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Layout from '@/components/Layout.vue';
import api from '@/utils/api';

const authStore = useAuthStore();

const cameras = ref([]);
const snapshots = ref([]);

const isAdmin = computed(() => authStore.isAdmin);

function formatTime(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

function getDeviceName(deviceId) {
  const camera = cameras.value.find(c => c.deviceId === deviceId);
  return camera?.name || deviceId;
}

async function fetchCameras() {
  try {
    const devicesResponse = await api.get('/devices');
    const devices = devicesResponse.data.devices || [];
    
    const cameraDevices = devices.filter(d => d.device_type === 'camera');
    
    cameras.value = cameraDevices.map(d => ({
      deviceId: d.device_id,
      name: d.device_name,
      streaming: false,
      refreshing: false,
      snapshot: null
    }));
    
    if (cameras.value.length > 0) {
      const snapshotResponse = await api.get(`/video/history/${cameras.value[0].deviceId}?limit=10`);
      snapshots.value = snapshotResponse.data.snapshots || [];
    }
  } catch (error) {
    console.error('获取摄像头数据失败:', error);
  }
}

async function refreshSnapshot(camera) {
  camera.refreshing = true;
  try {
    const response = await api.post(`/video/snapshot/${camera.deviceId}`);
    camera.snapshot = response.data.snapshot;
    fetchCameras();
  } catch (error) {
    console.error('刷新快照失败:', error);
  } finally {
    camera.refreshing = false;
  }
}

function toggleStreaming(camera) {
  camera.streaming = !camera.streaming;
}

onMounted(() => {
  fetchCameras();
});
</script>

<style scoped>
.video-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.cameras-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.camera-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.camera-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.camera-view {
  margin-bottom: 16px;
}

.video-placeholder {
  aspect-ratio: 16/9;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  position: relative;
  overflow: hidden;
}

.video-placeholder svg {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
}

.placeholder-text {
  font-size: 14px;
}

.snapshot-time {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.camera-controls {
  display: flex;
  gap: 12px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.snapshots-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.snapshots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.snapshot-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snapshot-thumb {
  aspect-ratio: 16/9;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.snapshot-thumb svg {
  width: 32px;
  height: 32px;
}

.snapshot-info {
  padding: 0 4px;
}

.snapshot-device {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.snapshot-time {
  font-size: 12px;
  color: #6b7280;
}

.empty-snapshots {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

@media (max-width: 992px) {
  .cameras-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .snapshots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .snapshots-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .camera-controls {
    flex-direction: column;
  }
  
  .camera-controls button {
    justify-content: center;
  }
}
</style>
