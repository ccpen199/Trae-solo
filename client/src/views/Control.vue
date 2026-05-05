<template>
  <Layout>
    <div class="control-page">
      <div class="page-header">
        <h2 class="page-subtitle">控制所有设备参数和状态</h2>
      </div>
      
      <div class="control-sections">
        <div class="control-section card">
          <div class="section-header">
            <h3 class="section-title">LED 灯光控制</h3>
          </div>
          <div class="led-grid">
            <div v-for="led in ledDevices" :key="led.deviceId" class="led-card">
              <div class="led-header">
                <h4 class="led-name">{{ led.name }}</h4>
                <span 
                  class="status-badge" 
                  :class="led.status === 'on' ? 'status-online' : 'status-offline'"
                >
                  {{ led.status === 'on' ? '已开启' : '已关闭' }}
                </span>
              </div>
              
              <div class="led-preview">
                <div 
                  class="led-indicator" 
                  :class="led.status === 'on' ? 'active' : ''"
                  :style="{ backgroundColor: led.status === 'on' ? led.color : '#9ca3af' }"
                ></div>
              </div>
              
              <div class="led-controls">
                <div class="control-row">
                  <label class="control-label">开关</label>
                  <div class="switch" :class="led.status === 'on' ? 'active' : ''" @click="toggleLed(led)">
                    <div class="switch-slider"></div>
                  </div>
                </div>
                
                <div class="control-row">
                  <label class="control-label">亮度 {{ led.brightness }}%</label>
                  <input 
                    type="range" 
                    v-model.number="led.brightness" 
                    min="0" 
                    max="100" 
                    @change="updateLed(led)"
                    class="range-input"
                  />
                </div>
                
                <div class="control-row">
                  <label class="control-label">颜色</label>
                  <div class="color-picker">
                    <button 
                      v-for="color in colorOptions" 
                      :key="color.value"
                      class="color-option"
                      :class="{ active: led.color === color.value }"
                      :style="{ backgroundColor: color.value }"
                      @click="selectColor(led, color.value)"
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="control-section card">
          <div class="section-header">
            <h3 class="section-title">温度参数设置</h3>
          </div>
          <div class="temperature-grid">
            <div v-for="sensor in temperatureSensors" :key="sensor.deviceId" class="temp-control-card">
              <div class="temp-header">
                <h4 class="temp-name">{{ sensor.name }}</h4>
              </div>
              
              <div class="temp-display">
                <span class="current-temp">{{ sensor.current }}°C</span>
                <span class="temp-label">当前温度</span>
              </div>
              
              <div class="temp-control">
                <label class="control-label">目标温度设置</label>
                <div class="temp-input-group">
                  <button class="btn btn-secondary" @click="adjustTemp(sensor, -1)">-</button>
                  <input 
                    type="number" 
                    v-model.number="sensor.target" 
                    min="15" 
                    max="30" 
                    class="form-input temp-value-input"
                    @change="setTargetTemp(sensor)"
                  />
                  <button class="btn btn-secondary" @click="adjustTemp(sensor, 1)">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="control-section card">
          <div class="section-header">
            <h3 class="section-title">视频控制</h3>
          </div>
          <div class="video-grid">
            <div v-for="camera in cameraDevices" :key="camera.deviceId" class="video-control-card">
              <div class="video-header">
                <h4 class="video-name">{{ camera.name }}</h4>
              </div>
              
              <div class="video-controls">
                <button 
                  class="btn btn-primary" 
                  @click="takeSnapshot(camera)"
                  :disabled="camera.snapshotting"
                >
                  <span v-if="camera.snapshotting">拍摄中...</span>
                  <span v-else>拍摄快照</span>
                </button>
                <button 
                  class="btn" 
                  :class="camera.recording ? 'btn-danger' : 'btn-secondary'"
                  @click="toggleRecording(camera)"
                >
                  <span v-if="camera.recording">停止录制</span>
                  <span v-else>开始录制</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="control-section card">
          <div class="section-header">
            <h3 class="section-title">控制历史记录</h3>
          </div>
          <div class="history-table">
            <table v-if="controlHistory.length > 0">
              <thead>
                <tr>
                  <th>设备</th>
                  <th>操作类型</th>
                  <th>参数</th>
                  <th>操作者</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in controlHistory" :key="record.id">
                  <td>{{ record.device_id }}</td>
                  <td>
                    <span class="command-type">{{ getCommandTypeLabel(record.command) }}</span>
                  </td>
                  <td class="params-cell">{{ formatParams(record.parameters) }}</td>
                  <td>{{ record.executed_by_name || '系统' }}</td>
                  <td>{{ formatTime(record.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>暂无控制历史记录</p>
            </div>
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

const ledDevices = ref([]);
const temperatureSensors = ref([]);
const cameraDevices = ref([]);
const controlHistory = ref([]);

const colorOptions = [
  { name: '白色', value: '#ffffff' },
  { name: '红色', value: '#ef4444' },
  { name: '绿色', value: '#22c55e' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '黄色', value: '#eab308' },
  { name: '紫色', value: '#8b5cf6' }
];

function formatTime(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

function getCommandTypeLabel(command) {
  const labels = {
    'led_control': 'LED控制',
    'temperature_control': '温度控制',
    'video_control': '视频控制'
  };
  return labels[command] || command;
}

function formatParams(params) {
  try {
    const obj = JSON.parse(params);
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch {
    return params;
  }
}

async function fetchDevices() {
  try {
    const devicesResponse = await api.get('/devices');
    const devices = devicesResponse.data.devices || [];
    
    ledDevices.value = devices
      .filter(d => d.device_type === 'led')
      .map(d => ({
        deviceId: d.device_id,
        name: d.device_name,
        status: d.latestData?.led?.status || 'off',
        brightness: d.latestData?.led?.brightness || 100,
        color: d.latestData?.led?.color || '#ffffff'
      }));
    
    temperatureSensors.value = devices
      .filter(d => d.device_type === 'temperature')
      .map(d => ({
        deviceId: d.device_id,
        name: d.device_name,
        current: parseFloat(d.latestData?.temperature?.value) || 25,
        target: d.latestData?.temperature?.metadata?.target || 25
      }));
    
    cameraDevices.value = devices
      .filter(d => d.device_type === 'camera')
      .map(d => ({
        deviceId: d.device_id,
        name: d.device_name,
        snapshotting: false,
        recording: false
      }));
    
    const historyResponse = await api.get('/control/history');
    controlHistory.value = historyResponse.data.commands || [];
  } catch (error) {
    console.error('获取设备数据失败:', error);
  }
}

async function toggleLed(led) {
  const newStatus = led.status === 'on' ? 'off' : 'on';
  try {
    await api.post('/control/led', {
      deviceId: led.deviceId,
      status: newStatus,
      brightness: led.brightness,
      color: led.color
    });
    led.status = newStatus;
    fetchDevices();
  } catch (error) {
    console.error('控制LED失败:', error);
  }
}

async function updateLed(led) {
  try {
    await api.post('/control/led', {
      deviceId: led.deviceId,
      status: led.status,
      brightness: led.brightness,
      color: led.color
    });
    fetchDevices();
  } catch (error) {
    console.error('更新LED参数失败:', error);
  }
}

function selectColor(led, color) {
  led.color = color;
  updateLed(led);
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
    fetchDevices();
  } catch (error) {
    console.error('设置目标温度失败:', error);
  }
}

async function takeSnapshot(camera) {
  camera.snapshotting = true;
  try {
    await api.post(`/video/snapshot/${camera.deviceId}`);
    fetchDevices();
  } catch (error) {
    console.error('拍摄快照失败:', error);
  } finally {
    camera.snapshotting = false;
  }
}

async function toggleRecording(camera) {
  try {
    await api.post('/control/video', {
      deviceId: camera.deviceId,
      action: camera.recording ? 'stop' : 'record'
    });
    camera.recording = !camera.recording;
    fetchDevices();
  } catch (error) {
    console.error('控制视频录制失败:', error);
  }
}

onMounted(() => {
  fetchDevices();
});
</script>

<style scoped>
.control-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.control-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.led-grid, .temperature-grid, .video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.led-card, .temp-control-card, .video-control-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.led-header, .temp-header, .video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.led-name, .temp-name, .video-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.led-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.led-indicator {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #9ca3af;
  transition: all 0.3s ease;
}

.led-indicator.active {
  box-shadow: 0 0 30px currentColor;
}

.led-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.switch {
  width: 52px;
  height: 28px;
  background: #d1d5db;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
}

.switch.active {
  background: #22c55e;
}

.switch-slider {
  position: absolute;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.switch.active .switch-slider {
  transform: translateX(24px);
}

.range-input {
  width: 60%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option.active {
  border-color: #1f2937;
  transform: scale(1.1);
}

.temp-display {
  text-align: center;
  margin-bottom: 20px;
}

.current-temp {
  font-size: 42px;
  font-weight: 700;
  color: #ef4444;
}

.temp-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.temp-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.temp-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.temp-value-input {
  width: 80px;
  text-align: center;
}

.video-controls {
  display: flex;
  flex-direction: column;
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

.command-type {
  display: inline-block;
  padding: 4px 12px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.params-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b7280;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .led-grid, .temperature-grid, .video-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
