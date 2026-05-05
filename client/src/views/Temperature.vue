<template>
  <Layout>
    <div class="temperature-page">
      <div class="page-header">
        <h2 class="page-subtitle">实时监控温度变化</h2>
      </div>
      
      <div class="temperature-cards">
        <div v-for="sensor in temperatureSensors" :key="sensor.deviceId" class="temp-card">
          <div class="temp-card-header">
            <h3 class="temp-location">{{ sensor.name }}</h3>
            <span class="status-badge status-online">在线</span>
          </div>
          
          <div class="temp-display">
            <div class="temp-current">
              <span class="temp-value">{{ sensor.current }}°C</span>
              <span class="temp-label">当前温度</span>
            </div>
            
            <div class="temp-target">
              <span class="target-value">{{ sensor.target }}°C</span>
              <span class="target-label">目标温度</span>
            </div>
          </div>
          
          <div class="temp-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getProgressPercent(sensor.current, sensor.target) + '%' }"
              ></div>
            </div>
            <div class="progress-labels">
              <span>10°C</span>
              <span>目标</span>
              <span>35°C</span>
            </div>
          </div>
          
          <div v-if="isAdmin" class="temp-controls">
            <div class="control-group">
              <label class="control-label">设置目标温度</label>
              <div class="control-inputs">
                <button class="btn btn-secondary" @click="adjustTemp(sensor, -1)">-</button>
                <input 
                  type="number" 
                  v-model.number="sensor.target" 
                  class="form-input temp-input"
                  min="15" 
                  max="30"
                  @change="setTargetTemp(sensor)"
                />
                <button class="btn btn-secondary" @click="adjustTemp(sensor, 1)">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="history-section card">
        <div class="section-header">
          <h3 class="section-title">温度历史记录</h3>
          <div class="history-controls">
            <select v-model="selectedSensor" class="form-input" style="width: auto;">
              <option value="">全部设备</option>
              <option v-for="s in temperatureSensors" :key="s.deviceId" :value="s.deviceId">
                {{ s.name }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="history-table">
          <table v-if="historyData.length > 0">
            <thead>
              <tr>
                <th>设备</th>
                <th>当前温度</th>
                <th>目标温度</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in historyData" :key="record.id">
                <td>{{ getDeviceName(record.device_id) }}</td>
                <td class="temp-value">{{ record.temperature }}°C</td>
                <td>{{ record.target_temperature || 25 }}°C</td>
                <td>{{ formatTime(record.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <p>暂无历史数据</p>
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

const temperatureSensors = ref([]);
const historyData = ref([]);
const selectedSensor = ref('');
let refreshInterval = null;

const isAdmin = computed(() => authStore.isAdmin);

function getProgressPercent(current, target) {
  const min = 10;
  const max = 35;
  const range = max - min;
  return Math.min(100, Math.max(0, ((current - min) / range) * 100));
}

function getDeviceName(deviceId) {
  const sensor = temperatureSensors.value.find(s => s.deviceId === deviceId);
  return sensor?.name || deviceId;
}

function formatTime(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

async function fetchTemperatureData() {
  try {
    const devicesResponse = await api.get('/devices');
    const devices = devicesResponse.data.devices || [];
    
    const tempDevices = devices.filter(d => d.device_type === 'temperature');
    
    temperatureSensors.value = tempDevices.map(d => ({
      deviceId: d.device_id,
      name: d.device_name,
      current: parseFloat(d.latestData?.temperature?.value) || 25,
      target: d.latestData?.temperature?.metadata?.target || 25
    }));
    
    const deviceId = selectedSensor.value || temperatureSensors.value[0]?.deviceId;
    if (deviceId) {
      const historyResponse = await api.get(`/temperature/history/${deviceId}?limit=50`);
      historyData.value = historyResponse.data.history || [];
    }
  } catch (error) {
    console.error('获取温度数据失败:', error);
  }
}

function adjustTemp(sensor, delta) {
  const newTarget = Math.max(15, Math.min(30, sensor.target + delta));
  sensor.target = newTarget;
  setTargetTemp(sensor);
}

async function setTargetTemp(sensor) {
  try {
    await api.post('/control/temperature', {
      deviceId: sensor.deviceId,
      targetTemperature: sensor.target
    });
    fetchTemperatureData();
  } catch (error) {
    console.error('设置目标温度失败:', error);
  }
}

onMounted(() => {
  fetchTemperatureData();
  refreshInterval = setInterval(fetchTemperatureData, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.temperature-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.temperature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.temp-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.temp-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.temp-location {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.temp-display {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.temp-current {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.temp-value {
  font-size: 48px;
  font-weight: 700;
  color: #ef4444;
}

.temp-label {
  font-size: 13px;
  color: #6b7280;
}

.temp-target {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: flex-end;
}

.target-value {
  font-size: 28px;
  font-weight: 600;
  color: #667eea;
}

.target-label {
  font-size: 13px;
  color: #6b7280;
}

.temp-progress {
  margin-bottom: 20px;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #ef4444);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
}

.temp-controls {
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.control-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temp-input {
  width: 80px;
  text-align: center;
}

.history-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.history-controls {
  display: flex;
  gap: 12px;
}

.history-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  font-weight: 600;
  color: #6b7280;
  font-size: 13px;
  text-transform: uppercase;
}

td {
  font-size: 14px;
  color: #1f2937;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .temperature-cards {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .temp-display {
    flex-direction: column;
    gap: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
