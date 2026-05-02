<template>
  <div class="page-container">
    <el-page-header @back="goBack" content="轨迹追踪" />
    <div class="track-view">
      <div class="map-placeholder">
        <p>地图区域</p>
        <p class="text-secondary">当前位置：{{ currentLocation || '加载中...' }}</p>
      </div>
      <div class="track-info">
        <el-card>
          <template #header>当前位置</template>
          <p>{{ currentLocation || '暂无' }}</p>
          <p>速度: {{ speed || 0 }} km/h</p>
          <p>更新时间: {{ lastUpdate }}</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { monitorApi } from '@/api'

const router = useRouter()
const route = useRoute()
const currentLocation = ref('')
const speed = ref(0)
const lastUpdate = ref('')
let timer = null

onMounted(() => {
  fetchTrack()
  timer = setInterval(fetchTrack, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function fetchTrack() {
  try {
    const res = await monitorApi.waybillLocation(route.params.id)
    currentLocation.value = res.data.address
    speed.value = res.data.speed
    lastUpdate.value = res.data.update_time
  } catch (error) {
    console.error('获取轨迹失败', error)
  }
}

function goBack() {
  router.push('/driver/waybills')
}
</script>

<style lang="scss" scoped>
.track-view {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  margin-top: 20px;
}

.map-placeholder {
  height: 500px;
  background: #e8f4fc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 18px;
}

.text-secondary {
  font-size: 14px;
  color: #909399;
  margin-top: 10px;
}
</style>
