<template>
  <Layout>
    <div class="devices-page">
      <div class="page-header">
        <h2 class="page-subtitle">共 {{ devices.length }} 个设备</h2>
        <div class="filter-controls">
          <select v-model="filterType" class="form-input" style="width: auto;">
            <option value="">全部类型</option>
            <option value="gateway">网关</option>
            <option value="led">LED灯</option>
            <option value="temperature">温度传感器</option>
            <option value="camera">摄像头</option>
          </select>
        </div>
      </div>
      
      <div class="devices-grid">
        <div v-for="device in filteredDevices" :key="device.device_id" class="device-card">
          <div class="device-card-header">
            <div class="device-card-icon" :class="device.device_type">
              <div v-html="getDeviceIcon(device.device_type)"></div>
            </div>
            <span class="status-badge" :class="device.status === 'online' ? 'status-online' : 'status-offline'">
              {{ device.status === 'online' ? '在线' : '离线' }}
            </span>
          </div>
          
          <div class="device-card-body">
            <h3 class="device-card-name">{{ device.device_name }}</h3>
            <p class="device-card-type">{{ getDeviceTypeName(device.device_type) }}</p>
            <p class="device-card-id">{{ device.device_id }}</p>
          </div>
          
          <div v-if="device.latestData" class="device-card-data">
            <template v-if="device.device_type === 'led'">
              <div class="data-item">
                <span class="data-label">状态</span>
                <span class="data-value" :class="{ 'led-on': device.latestData.led_status?.value === 'on' }">
                  {{ device.latestData.led_status?.value === 'on' ? '开启' : '关闭' }}
                </span>
              </div>
              <div v-if="device.latestData.led_status?.metadata" class="data-item">
                <span class="data-label">亮度</span>
                <span class="data-value">{{ device.latestData.led_status.metadata.brightness }}%</span>
              </div>
            </template>
            
            <template v-else-if="device.device_type === 'temperature'">
              <div class="data-item">
                <span class="data-label">当前温度</span>
                <span class="data-value temp-value">{{ device.latestData.temperature?.value || '--' }}°C</span>
              </div>
              <div class="data-item">
                <span class="data-label">目标温度</span>
                <span class="data-value">{{ device.latestData.temperature?.metadata?.target || 25 }}°C</span>
              </div>
            </template>
            
            <template v-else-if="device.device_type === 'camera'">
              <div class="data-item">
                <span class="data-label">状态</span>
                <span class="data-value">就绪</span>
              </div>
            </template>
          </div>
          
          <div class="device-card-actions">
            <button v-if="isAdmin && device.device_type === 'led'" class="btn btn-secondary btn-sm" @click="toggleLed(device)">
              {{ device.latestData?.led_status?.value === 'on' ? '关灯' : '开灯' }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="viewDetails(device)">
              查看详情
            </button>
          </div>
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
const filterType = ref('');
let refreshInterval = null;

const isAdmin = computed(() => authStore.isAdmin);

const filteredDevices = computed(() => {
  if (!filterType.value) return devices.value;
  return devices.value.filter(d => d.device_type === filterType.value);
});

function getDeviceIcon(type) {
  const icons = {
    led: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 00-6 6c0 2.69 1.34 5.06 3.41 6.54A1 1 0 0110 17h4a1 1 0 01.59-.46C16.66 14.06 18 11.69 18 9a6 6 0 00-6-6z"/><path d="M9 21h6M12 18v3"/></svg>',
    temperature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    gateway: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="7"/><line x1="8" y1="2" x2="8" y2="7"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
  };
  return icons[type] || icons.gateway;
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

async function fetchDevices() {
  try {
    const response = await api.get('/devices');
    devices.value = response.data.devices || [];
  } catch (error) {
    console.error('获取设备列表失败:', error);
  }
}

async function toggleLed(device) {
  const newStatus = device.latestData?.led_status?.value === 'on' ? 'off' : 'on';
  try {
    await api.post('/control/led', {
      deviceId: device.device_id,
      status: newStatus
    });
    fetchDevices();
  } catch (error) {
    console.error('控制LED失败:', error);
  }
}

function viewDetails(device) {
  console.log('查看设备详情:', device);
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
.devices-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.device-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.device-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.device-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-card-icon svg {
  width: 24px;
  height: 24px;
}

.device-card-icon.led {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.device-card-icon.temperature {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.device-card-icon.camera {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.device-card-icon.gateway {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.device-card-body {
  margin-bottom: 16px;
}

.device-card-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.device-card-type {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.device-card-id {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.device-card-data {
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 16px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.data-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.data-label {
  font-size: 13px;
  color: #6b7280;
}

.data-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.data-value.led-on {
  color: #10b981;
}

.temp-value {
  color: #ef4444;
  font-size: 18px;
}

.device-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .devices-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .devices-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .devices-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
