<template>
  <div class="map-page">
    <van-nav-bar
      title="网点地图"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="map-container">
      <div class="map-placeholder">
        <div class="map-icon">🗺️</div>
        <div class="map-text">地图视图</div>
        <div class="map-hint">已加载 {{ outlets.length }} 个网点</div>
      </div>
      
      <div class="map-markers">
        <div 
          v-for="outlet in outlets.slice(0, 6)" 
          :key="outlet.id"
          class="marker"
          :style="{ 
            left: getRandomPosition().x + '%', 
            top: getRandomPosition().y + '%' 
          }"
          @click="selectOutlet(outlet)"
        >
          <van-icon name="location" color="#e53935" size="28" />
        </div>
      </div>
    </div>

    <div class="outlet-panel" v-if="selectedOutlet">
      <div class="panel-header">
        <div class="outlet-name">{{ selectedOutlet.name }}</div>
        <van-icon name="close" @click="selectedOutlet = null" />
      </div>
      <div class="outlet-info">
        <p><van-icon name="location-o" size="14" /> {{ selectedOutlet.address }}</p>
        <p><van-icon name="star-o" size="14" color="#ff9800" /> 评分 {{ selectedOutlet.rating }}</p>
        <p><van-icon name="clock-o" size="14" /> {{ selectedOutlet.open_time }} - {{ selectedOutlet.close_time }}</p>
      </div>
      <div class="panel-actions">
        <van-button type="primary" size="small" round @click="goToDetail">查看详情</van-button>
        <van-button type="success" size="small" round @click="goNav">AR导航</van-button>
      </div>
    </div>

    <div class="outlet-list-card" v-else>
      <div class="list-title">附近网点</div>
      <div class="list-content">
        <div 
          v-for="outlet in outlets.slice(0, 4)" 
          :key="outlet.id"
          class="list-item"
          @click="goToDetail(outlet.id)"
        >
          <div class="item-info">
            <div class="item-name">{{ outlet.name }}</div>
            <div class="item-addr">{{ outlet.address }}</div>
          </div>
          <van-icon name="arrow" color="#ccc" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOutlets } from '../api/outlets'

const router = useRouter()

const outlets = ref([])
const selectedOutlet = ref(null)

function onBack() {
  router.back()
}

async function loadOutlets() {
  try {
    const data = await getOutlets({ pageSize: 20 })
    outlets.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function getRandomPosition() {
  return {
    x: 15 + Math.random() * 70,
    y: 20 + Math.random() * 50
  }
}

function selectOutlet(outlet) {
  selectedOutlet.value = outlet
}

function goToDetail(id) {
  const outletId = id || selectedOutlet.value?.id
  router.push(`/outlets/${outletId}`)
}

function goNav() {
  router.push({
    path: '/outlets/appointment',
    query: { outletId: selectedOutlet.value.id }
  })
}

onMounted(() => {
  loadOutlets()
})
</script>

<style scoped>
.map-page {
  min-height: 100vh;
  background: #f5f7fa;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.map-container {
  position: relative;
  height: 50vh;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  overflow: hidden;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.map-icon {
  font-size: 64px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.map-text {
  font-size: 18px;
  color: #666;
  margin-bottom: 4px;
}

.map-hint {
  font-size: 13px;
  color: #999;
}

.map-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.marker {
  position: absolute;
  transform: translate(-50%, -100%);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translate(-50%, -100%); }
  50% { transform: translate(-50%, -110%); }
}

.outlet-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.outlet-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.outlet-info {
  font-size: 14px;
  color: #666;
  line-height: 2;
  margin-bottom: 16px;
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.outlet-list-card {
  margin: -20px 12px 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  position: relative;
  z-index: 10;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.list-item:last-child {
  border-bottom: none;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.item-addr {
  font-size: 13px;
  color: #999;
}
</style>
