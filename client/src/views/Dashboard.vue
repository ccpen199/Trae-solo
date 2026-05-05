<template>
  <Layout>
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon online">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ onlineDevices }}</div>
            <div class="stat-label">在线设备</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ avgTemperature }}°C</div>
            <div class="stat-label">平均温度</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeCameras }}</div>
            <div class="stat-label">活动摄像头</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ controlCount }}</div>
            <div class="stat-label">控制指令</div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="dashboard-section">
          <div class="section-header">
            <h3 class="section-title">设备概览</h3>
            <button class="btn btn-secondary" @click="goToDevices">查看全部</button>
          </div>
          <div class="device-list">
            <div v-for="device in recentDevices" :key="device.device_id" class="device-item">
              <div class="device-icon" :class="device.device_type">
                <div v-html="getDeviceIcon(device.device_type)"></div>
              </div>
              <div class="device-info">
                <div class="device-name">{{ device.device_name }}</div>
                <div class="device-type">{{ getDeviceTypeName(device.device_type) }}</div>
              </div>
              <span class="status-badge" :class="device.status === 'online' ? 'status-online' : 'status-offline'">
                {{ device.status === 'online' ? '在线' : '离线' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="dashboard-section">
          <div class="section-header">
            <h3 class="section-title">温度监测</h3>
            <button class="btn btn-secondary" @click="goToTemperature">查看详情</button>
          </div>
          <div class="temperature-overview">
            <div v-for="temp in temperatureData" :key="temp.deviceId" class="temperature-item">
              <div class="temp-header">
                <span class="temp-location">{{ temp.name }}</span>
                <span class="temp-target">目标: {{ temp.target }}°C</span>
              </div>
              <div class="temp-display">
                <span class="temp-current">{{ temp.current }}°C</span>
                <div class="temp-bar">
                  <div class="temp-bar-fill" :style="{ width: getTempBarWidth(temp.current) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">快速操作</h3>
        </div>
        <div class="quick-actions">
          <button v-if="isAdmin" class="action-btn" @click="toggleAllLights">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3a6 6 0 00-6 6c0 2.69 1.34 5.06 3.41 6.54A1 1 0 0110 17h4a1 1 0 01.59-.46C16.66 14.06 18 11.69 18 9a6 6 0 00-6-6z"/>
              <path d="M9 21h6M12 18v3"/>
            </svg>
            <span>{{ allLightsOn ? '全部关灯' : '全部开灯' }}</span>
          </button>
          <button v-if="isAdmin" class="action-btn" @click="goToControl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span>设备控制</span>
          </button>
          <button class="action-btn" @click="goToVideo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span>视频监控</span>
          </button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Layout from '@/components/Layout.vue';
import api from '@/utils/api';

const router = useRouter();
const authStore = useAuthStore();

const devices = ref([]);
const allLightsOn = ref(false);
let refreshInterval = null;

const isAdmin = computed(() => authStore.isAdmin);

const onlineDevices = computed(() => devices.value.filter(d => d.status === 'online').length);
const activeCameras = computed(() => devices.value.filter(d => d.device_type === 'camera' && d.status === 'online').length);
const controlCount = computed(() => 0);

const avgTemperature = computed(() => {
  const tempDevices = devices.value.filter(d => d.device_type === 'temperature');
  if (tempDevices.length === 0) return '--';
  
  let sum = 0;
  let count = 0;
  tempDevices.forEach(d => {
    if (d.latestData?.temperature?.value) {
      sum += parseFloat(d.latestData.temperature.value);
      count++;
    }
  });
  
  return count > 0 ? (sum / count).toFixed(1) : '--';
});

const recentDevices = computed(() => devices.value.slice(0, 5));

const temperatureData = computed(() => {
  return devices.value
    .filter(d => d.device_type === 'temperature')
    .map(d => ({
      deviceId: d.device_id,
      name: d.device_name,
      current: d.latestData?.temperature?.value || '--',
      target: d.latestData?.temperature?.metadata?.target || 25
    }));
});

function getDeviceIcon(type) {
  const icons = {
    led: {
      template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 00-6 6c0 2.69 1.34 5.06 3.41 6.54A1 1 0 0110 17h4a1 1 0 01.59-.46C16.66 14.06 18 11.69 18 9a6 6 0 00-6-6z"/><path d="M9 21h6M12 18v3"/></svg>'
    },
    temperature: {
      template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>'
    },
    camera: {
      template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
    },
    gateway: {
      template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="7"/><line x1="8" y1="2" x2="8" y2="7"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
    }
  };
  return icons[type]?.template || icons.gateway.template;
}

function getDeviceTypeName(type) {
  const names = {
    led: 'LED灯',
    temperature: '温度传感器',
    camera: '摄像头',
    gateway: '网关'
  };
  return names[type] || '未知设备';
}

function getTempBarWidth(temp) {
  const min = 10;
  const max = 35;
  const width = ((temp - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, width));
}

async function fetchDevices() {
  try {
    const response = await api.get('/devices');
    devices.value = response.data.devices || [];
  } catch (error) {
    console.error('获取设备列表失败:', error);
  }
}

function goToDevices() {
  router.push('/devices');
}

function goToTemperature() {
  router.push('/temperature');
}

function goToVideo() {
  router.push('/video');
}

function goToControl() {
  router.push('/control');
}

async function toggleAllLights() {
  const newStatus = allLightsOn.value ? 'off' : 'on';
  const ledDevices = devices.value.filter(d => d.device_type === 'led');
  
  for (const device of ledDevices) {
    try {
      await api.post('/control/led', {
        deviceId: device.device_id,
        status: newStatus
      });
    } catch (error) {
      console.error(`控制设备 ${device.device_id} 失败:`, error);
    }
  }
  
  allLightsOn.value = !allLightsOn.value;
  fetchDevices();
}

onMounted(() => {
  fetchDevices();
  refreshInterval = setInterval(fetchDevices, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
}

.stat-icon.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-icon.info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.purple {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.dashboard-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.device-item:hover {
  background: #f3f4f6;
}

.device-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-icon svg {
  width: 22px;
  height: 22px;
}

.device-icon.led {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.device-icon.temperature {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.device-icon.camera {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.device-icon.gateway {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.device-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-name {
  font-weight: 500;
  color: #1f2937;
}

.device-type {
  font-size: 13px;
  color: #6b7280;
}

.temperature-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.temperature-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.temp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.temp-location {
  font-weight: 500;
  color: #1f2937;
}

.temp-target {
  font-size: 13px;
  color: #6b7280;
}

.temp-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.temp-current {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  min-width: 80px;
}

.temp-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.temp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #ef4444);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .dashboard-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
}
</style>
