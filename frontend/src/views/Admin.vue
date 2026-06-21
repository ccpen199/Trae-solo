<template>
  <div class="admin-page">
    <van-nav-bar
      title="后台管理"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <div class="overview-section">
        <div class="section-title">数据概览</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon user">👥</div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.user_count || 0 }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon outlet">🏢</div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.outlet_count || 0 }}</div>
              <div class="stat-label">服务网点</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cert">📋</div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.cert_count || 0 }}</div>
              <div class="stat-label">电子证件</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon appt">📅</div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.today_appointments || 0 }}</div>
              <div class="stat-label">今日预约</div>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-section card">
        <div class="section-title">运营管理</div>
        <div class="menu-grid">
          <div class="menu-item" @click="goTo('/admin/heat')">
            <div class="menu-icon heat">
              <span>📊</span>
            </div>
            <span class="menu-text">热度预测</span>
          </div>
          <div class="menu-item" @click="goTo('/admin/windows')">
            <div class="menu-icon window">
              <span>🪟</span>
            </div>
            <span class="menu-text">窗口调度</span>
          </div>
          <div class="menu-item" @click="showServiceItems">
            <div class="menu-icon service">
              <span>📝</span>
            </div>
            <span class="menu-text">服务事项</span>
          </div>
          <div class="menu-item" @click="showLogs">
            <div class="menu-icon log">
              <span>📜</span>
            </div>
            <span class="menu-text">操作日志</span>
          </div>
        </div>
      </div>

      <div class="menu-section card">
        <div class="section-title">智能调度</div>
        <div class="dispatch-list">
          <div 
            v-for="item in scheduling" 
            :key="item.outlet_id"
            class="dispatch-item"
          >
            <div class="dispatch-header">
              <span class="outlet-name">{{ item.outlet_name }}</span>
              <span class="load-tag" :class="item.load_level">
                {{ item.load_level === 'high' ? '繁忙' : item.load_level === 'medium' ? '适中' : '空闲' }}
              </span>
            </div>
            <div class="dispatch-info">
              <span>{{ item.open_windows }}/{{ item.total_windows }}窗口</span>
              <span>排队{{ item.current_queue }}人</span>
              <span>建议开{{ item.suggested_windows }}窗</span>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions card">
        <div class="section-title">快捷操作</div>
        <van-button type="primary" block round @click="generatePrediction">
          生成明日热度预测
        </van-button>
        <van-button plain type="primary" block round class="mt-12" @click="exportData">
          导出运营数据
        </van-button>
      </div>

      <div class="district-section card">
        <div class="section-title">各区县网点分布</div>
        <div class="district-list">
          <div 
            v-for="item in overview.district_stats || []" 
            :key="item.district"
            class="district-item"
          >
            <span class="district-name">{{ item.district }}</span>
            <div class="district-bar">
              <div 
                class="bar-fill" 
                :style="{ width: getDistrictPercent(item.count) + '%' }"
              ></div>
            </div>
            <span class="district-count">{{ item.count }}个</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getAdminOverview, getWindowScheduling, generatePrediction as genPred } from '../api/admin'

const router = useRouter()

const overview = ref({})
const scheduling = ref([])

const maxDistrictCount = computed(() => {
  if (!overview.value.district_stats?.length) return 1
  return Math.max(...overview.value.district_stats.map(d => d.count))
})

function onBack() {
  router.back()
}

async function loadOverview() {
  try {
    const data = await getAdminOverview()
    overview.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadScheduling() {
  try {
    const data = await getWindowScheduling()
    scheduling.value = data?.slice(0, 5) || []
  } catch (e) {
    console.error(e)
  }
}

function goTo(path) {
  router.push(path)
}

function showServiceItems() {
  showToast('服务事项管理')
}

function showLogs() {
  showToast('操作日志')
}

async function generatePrediction() {
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await genPred({ date: tomorrow })
    showToast('预测数据已生成')
  } catch (e) {
    console.error(e)
  }
}

function exportData() {
  showToast('数据导出中...')
}

function getDistrictPercent(count) {
  return (count / maxDistrictCount.value) * 100
}

onMounted(() => {
  loadOverview()
  loadScheduling()
})
</script>

<style scoped>
.admin-page {
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

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 14px;
}

.overview-section {
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 12px;
}

.stat-icon.user {
  background: #e3f2fd;
}

.stat-icon.outlet {
  background: #e8f5e9;
}

.stat-icon.cert {
  background: #fff3e0;
}

.stat-icon.appt {
  background: #f3e5f5;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
}

.menu-icon.heat {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.menu-icon.window {
  background: linear-gradient(135deg, #43a047, #2e7d32);
}

.menu-icon.service {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
}

.menu-icon.log {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
}

.menu-text {
  font-size: 13px;
  color: #333;
}

.dispatch-list {
  .dispatch-item {
    padding: 14px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .dispatch-item:last-child {
    border-bottom: none;
  }
}

.dispatch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.outlet-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.load-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.load-tag.high {
  background: #ffebee;
  color: #e53935;
}

.load-tag.medium {
  background: #fff3e0;
  color: #ff9800;
}

.load-tag.low {
  background: #e8f5e9;
  color: #43a047;
}

.dispatch-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.quick-actions {
  padding: 16px;
}

.district-list {
  .district-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
  }
}

.district-name {
  width: 70px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.district-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 0 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e88e5, #1565c0);
  border-radius: 4px;
  transition: width 0.3s;
}

.district-count {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  width: 50px;
  text-align: right;
}

.mt-12 {
  margin-top: 12px;
}
</style>
