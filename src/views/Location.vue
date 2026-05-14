<template>
  <div class="location-container">
    <van-nav-bar title="选择位置" left-text="返回" @click-left="goBack" />

    <div class="location-content">
      <div class="current-location">
        <van-icon name="location-o" class="location-icon" />
        <span class="location-text">{{ appStore.location }}</span>
      </div>

      <div class="section">
        <h3 class="section-title">附近位置</h3>
        <div 
          v-for="location in nearbyLocations" 
          :key="location.id"
          class="location-item"
          @click="selectLocation(location.name)"
        >
          <van-icon name="map-marker" class="marker-icon" />
          <div class="location-info">
            <p class="location-name">{{ location.name }}</p>
            <p class="location-detail">{{ location.detail }}</p>
          </div>
          <van-icon name="check" v-if="appStore.location === location.name" class="check-icon" />
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">常用位置</h3>
        <div 
          v-for="location in commonLocations" 
          :key="location.id"
          class="location-item"
          @click="selectLocation(location.name)"
        >
          <van-icon name="home" class="marker-icon" />
          <div class="location-info">
            <p class="location-name">{{ location.name }}</p>
            <p class="location-detail">{{ location.detail }}</p>
          </div>
          <van-icon name="check" v-if="appStore.location === location.name" class="check-icon" />
        </div>
      </div>

      <van-button type="primary" class="add-btn" @click="addNewLocation">
        <van-icon name="plus" />
        添加新位置
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const nearbyLocations = [
  { id: 1, name: '北京市朝阳区', detail: 'SOHO现代城附近' },
  { id: 2, name: '北京市海淀区', detail: '中关村科技园区' },
  { id: 3, name: '北京市东城区', detail: '王府井商业街' },
]

const commonLocations = [
  { id: 4, name: '公司', detail: '北京市朝阳区建国路88号' },
  { id: 5, name: '家', detail: '北京市海淀区中关村大街1号' },
]

const goBack = () => {
  router.back()
}

const selectLocation = (location) => {
  appStore.setLocation(location)
  router.back()
}

const addNewLocation = () => {
  showToast('添加新位置')
}
</script>

<style scoped>
.location-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.location-content {
  padding: 16px;
}

.current-location {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.location-icon {
  font-size: 24px;
  color: #ff6b35;
  margin-right: 12px;
}

.location-text {
  font-size: 16px;
  color: #333;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
}

.location-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.location-item:last-child {
  border-bottom: none;
}

.marker-icon {
  font-size: 18px;
  color: #ff6b35;
  margin-right: 12px;
}

.location-info {
  flex: 1;
}

.location-name {
  font-size: 15px;
  color: #333;
  margin: 0;
}

.location-detail {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
}

.check-icon {
  font-size: 18px;
  color: #ff6b35;
}

.add-btn {
  width: 100%;
  border-radius: 25px;
  padding: 14px;
}
</style>
