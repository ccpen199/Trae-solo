<template>
  <div class="window-page">
    <van-nav-bar
      title="窗口资源调度"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <div class="outlet-list">
        <div 
          v-for="item in windowData" 
          :key="item.outlet_id"
          class="outlet-card card"
        >
          <div class="outlet-header">
            <div class="outlet-name">{{ item.outlet_name }}</div>
            <span class="load-badge" :class="item.load_level">
              {{ item.load_level === 'high' ? '繁忙' : item.load_level === 'medium' ? '适中' : '空闲' }}
            </span>
          </div>
          
          <div class="outlet-stats">
            <div class="stat">
              <span class="label">开放窗口</span>
              <span class="value">{{ item.open_windows }}/{{ item.total_windows }}</span>
            </div>
            <div class="stat">
              <span class="label">排队人数</span>
              <span class="value">{{ item.current_queue }}人</span>
            </div>
            <div class="stat">
              <span class="label">平均等待</span>
              <span class="value">{{ item.avg_wait_time }}分钟</span>
            </div>
          </div>
          
          <div class="window-grid">
            <div 
              v-for="win in item.windows" 
              :key="win.id"
              class="window-item"
              :class="{ open: win.is_open }"
            >
              <div class="win-no">{{ win.window_no }}</div>
              <div class="win-type">{{ win.service_type }}</div>
              <div class="win-queue">{{ win.current_queue }}人</div>
            </div>
          </div>
          
          <div class="dispatch-section">
            <div class="suggestion">
              <van-icon name="info-o" color="#ff9800" />
              <span>建议开放 {{ item.suggested_windows }} 个窗口</span>
            </div>
            <van-slider
              v-model="item.open_windows"
              :min="1"
              :max="item.total_windows"
              :step="1"
              @change="onWindowChange(item)"
            />
            <div class="slider-labels">
              <span>1</span>
              <span>{{ item.total_windows }}</span>
            </div>
            <van-button 
              type="primary" 
              size="small" 
              block 
              round
              @click="dispatchWindows(item)"
            >
              确认调度
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getWindowScheduling, dispatchWindow } from '../api/admin'

const router = useRouter()

const windowData = ref([])

function onBack() {
  router.back()
}

async function loadData() {
  try {
    const data = await getWindowScheduling()
    windowData.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function onWindowChange(item) {
  console.log('窗口数变更:', item.open_windows)
}

async function dispatchWindows(item) {
  try {
    await dispatchWindow({
      outletId: item.outlet_id,
      windowCount: item.open_windows
    })
    showToast('调度成功')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.window-page {
  min-height: 100vh;
  background: #f5f7fa;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-content {
  padding: 12px;
}

.outlet-card {
  margin-bottom: 12px;
  padding: 16px;
}

.outlet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.outlet-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.load-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.load-badge.high {
  background: #ffebee;
  color: #e53935;
}

.load-badge.medium {
  background: #fff3e0;
  color: #ff9800;
}

.load-badge.low {
  background: #e8f5e9;
  color: #43a047;
}

.outlet-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  margin-bottom: 14px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat .label {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 4px;
}

.stat .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.window-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.window-item {
  padding: 10px 4px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
  opacity: 0.5;
}

.window-item.open {
  background: #e8f5e9;
  opacity: 1;
}

.win-no {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.win-type {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.win-queue {
  font-size: 11px;
  color: #ff9800;
}

.dispatch-section {
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ff9800;
  margin-bottom: 14px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin: 8px 0 16px;
}
</style>
