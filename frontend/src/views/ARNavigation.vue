<template>
  <div class="ar-page">
    <van-nav-bar
      title="AR实景导航"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="ar-view">
      <div class="camera-overlay">
        <div class="ar-scan-line"></div>
        <div class="ar-marker" v-for="(m, i) in markers" :key="i" :style="m.style">
          <div class="marker-pin">{{ m.icon }}</div>
          <div class="marker-label">
            <div class="ml-name">{{ m.name }}</div>
            <div class="ml-dist">{{ m.distance }}</div>
          </div>
        </div>
      </div>

      <div class="ar-top-bar">
        <div class="ar-target">
          <van-icon name="aim" size="18" />
          <span>目标：{{ outletName }}</span>
        </div>
        <div class="ar-status">
          <span class="status-dot"></span>
          <span>AR已激活</span>
        </div>
      </div>

      <div class="ar-direction-card">
        <div class="dir-icon">
          <van-icon name="arrow-up" size="36" color="#fff" />
        </div>
        <div class="dir-info">
          <div class="dir-text">前方直行</div>
          <div class="dir-dist">约 150 米，2分钟</div>
        </div>
        <div class="dir-alt">
          <van-icon name="volume-o" size="20" />
        </div>
      </div>

      <div class="ar-bottom-panel">
        <div class="route-summary">
          <div class="rs-title">路线详情</div>
          <div class="rs-steps">
            <div class="step-item active">
              <div class="step-icon">↑</div>
              <div class="step-content">
                <div class="step-main">沿和平路直行</div>
                <div class="step-sub">150米 · 约2分钟</div>
              </div>
            </div>
            <div class="step-item">
              <div class="step-icon">↰</div>
              <div class="step-content">
                <div class="step-main">左转进入民生路</div>
                <div class="step-sub">200米 · 约3分钟</div>
              </div>
            </div>
            <div class="step-item">
              <div class="step-icon">●</div>
              <div class="step-content">
                <div class="step-main">到达政务服务中心</div>
                <div class="step-sub">预计 10:25 到达</div>
              </div>
            </div>
          </div>
        </div>

        <div class="action-row">
          <van-button plain icon="share-o" @click="shareRoute">分享路线</van-button>
          <van-button type="primary" icon="location-o" block @click="goAppointment" style="margin-left: 10px">
            去预约
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

const outletName = ref(route.query.name || '渝中区政务服务中心')

const markers = computed(() => [
  { name: '政务服务中心', distance: '150米', icon: '🏛️', style: 'top: 35%; left: 45%' },
  { name: '地铁站', distance: '300米', icon: '🚇', style: 'top: 25%; left: 20%' },
  { name: '公交站', distance: '200米', icon: '🚌', style: 'top: 40%; left: 75%' },
  { name: '停车场', distance: '100米', icon: '🅿️', style: 'top: 55%; left: 30%' }
])

function shareRoute() { showToast('路线已复制到剪贴板') }
function goAppointment() {
  router.push({ path: '/outlets/appointment' })
}
</script>

<style scoped>
.ar-page {
  min-height: 100vh;
  background: #000;
}
.ar-view {
  position: relative;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

.camera-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}
.ar-scan-line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #4fc3f7, transparent);
  animation: scan 3s linear infinite;
}
@keyframes scan {
  0% { top: 10%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 70%; opacity: 0; }
}

.ar-marker {
  position: absolute;
  display: flex; flex-direction: column; align-items: center;
  animation: float 2s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.marker-pin {
  font-size: 30px;
  filter: drop-shadow(0 2px 8px rgba(79, 195, 247, 0.6));
}
.marker-label {
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 10px;
  border-radius: 8px;
  text-align: center;
  margin-top: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.ml-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.ml-dist {
  font-size: 10px;
  color: #1976d2;
}

.ar-top-bar {
  position: absolute;
  top: 60px; left: 12px; right: 12px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 10;
}
.ar-target {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  backdrop-filter: blur(10px);
}
.ar-status {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: rgba(67, 160, 71, 0.3);
  border-radius: 20px;
  color: #4fc3f7;
  font-size: 12px;
  backdrop-filter: blur(10px);
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #4fc3f7;
  animation: blink 1.2s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.ar-direction-card {
  position: absolute;
  top: 120px; left: 12px; right: 12px;
  display: flex; align-items: center;
  padding: 14px 16px;
  background: rgba(25, 118, 210, 0.95);
  border-radius: 16px;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(25, 118, 210, 0.4);
  backdrop-filter: blur(10px);
}
.dir-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex; align-items: center; justify-content: center;
  margin-right: 14px;
}
.dir-info { flex: 1; color: #fff; }
.dir-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}
.dir-dist {
  font-size: 13px;
  opacity: 0.9;
}
.dir-alt {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

.ar-bottom-panel {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px 24px 0 0;
  padding: 20px 16px 30px;
  backdrop-filter: blur(20px);
}
.route-summary { margin-bottom: 16px; }
.rs-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.rs-steps {
  display: flex; flex-direction: column; gap: 0;
  padding-left: 4px;
}
.step-item {
  display: flex; gap: 12px;
  padding: 8px 0;
  position: relative;
}
.step-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 13px; top: 36px; bottom: -8px;
  width: 2px;
  background: #e0e0e0;
}
.step-icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #666;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.step-item.active .step-icon {
  background: #1976d2;
  color: #fff;
}
.step-content { flex: 1; }
.step-main {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}
.step-item.active .step-main { color: #1976d2; }
.step-sub {
  font-size: 12px;
  color: #999;
}
.action-row {
  display: flex;
}
</style>
