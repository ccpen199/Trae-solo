<template>
  <div class="outlets-page">
    <div class="page-header success-bg">
      <div class="header-title">就近办</div>
      <div class="header-subtitle">智能匹配 · 预约免排队</div>
    </div>

    <div class="page-content">
      <div class="search-section card">
        <van-search
          v-model="keyword"
          placeholder="搜索网点或服务事项"
          shape="round"
          @search="onSearch"
        />
        <div class="filter-tabs">
          <span 
            v-for="district in districts" 
            :key="district"
            class="filter-tab"
            :class="{ active: currentDistrict === district }"
            @click="selectDistrict(district)"
          >
            {{ district }}
          </span>
        </div>
      </div>

      <div class="quick-actions card">
        <div class="action-item" @click="goToMap">
          <div class="action-icon map-icon">
            <van-icon name="location-o" size="24" />
          </div>
          <span>地图模式</span>
        </div>
        <div class="action-item" @click="findNearby">
          <div class="action-icon nearby-icon">
            <van-icon name="aim" size="24" />
          </div>
          <span>附近网点</span>
        </div>
        <div class="action-item" @click="smartMatch">
          <div class="action-icon smart-icon">
            <van-icon name="balance-o" size="24" />
          </div>
          <span>智能匹配</span>
        </div>
        <div class="action-item" @click="goToAppointment">
          <div class="action-icon appt-icon">
            <van-icon name="calendar-o" size="24" />
          </div>
          <span>我的预约</span>
        </div>
      </div>

      <div class="service-items card">
        <div class="section-title">
          <span>热门服务</span>
          <span class="more">更多 <van-icon name="arrow" /></span>
        </div>
        <div class="service-grid">
          <div 
            v-for="item in hotServices" 
            :key="item.name"
            class="service-item"
            @click="bookService(item)"
          >
            <span class="service-icon">{{ item.icon }}</span>
            <span class="service-name">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <div class="outlet-list">
        <div class="section-title">
          <span>服务网点</span>
          <span class="count">共 {{ total }} 个</span>
        </div>
        <div 
          v-for="outlet in outlets" 
          :key="outlet.id" 
          class="outlet-card card"
          @click="goToDetail(outlet.id)"
        >
          <div class="outlet-header">
            <div class="outlet-name">{{ outlet.name }}</div>
            <div class="outlet-rating">
              <van-icon name="star-o" color="#ff9800" />
              <span>{{ outlet.rating }}</span>
            </div>
          </div>
          <div class="outlet-address">
            <van-icon name="location-o" size="14" />
            <span>{{ outlet.address }}</span>
          </div>
          <div class="outlet-tags">
            <span class="tag" v-for="type in outlet.service_types?.slice(0, 3)" :key="type">
              {{ type }}
            </span>
          </div>
          <div class="outlet-footer">
            <div class="distance" v-if="outlet.distance">
              <van-icon name="aim" size="14" />
              <span>{{ formatDistance(outlet.distance) }}</span>
            </div>
            <div class="window-info">
              <span class="open">{{ outlet.window_count }}个窗口</span>
              <van-button size="small" type="primary" round>预约</van-button>
            </div>
          </div>
        </div>
      </div>

      <van-empty v-if="outlets.length === 0 && !loading" description="暂无网点数据" />
      
      <div class="load-more" v-if="hasMore">
        <van-button plain type="primary" block @click="loadMore">
          加载更多
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getOutlets, getNearbyOutlets } from '../api/outlets'

const router = useRouter()

const keyword = ref('')
const currentDistrict = ref('all')
const outlets = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)

const districts = ['全部', '渝中区', '江北区', '南岸区', '九龙坡区', '沙坪坝区', '渝北区', '大渡口区', '巴南区']

const hotServices = [
  { name: '身份证补办', icon: '🪪' },
  { name: '社保查询', icon: '💳' },
  { name: '不动产登记', icon: '🏠' },
  { name: '营业执照', icon: '🏢' },
  { name: '医保业务', icon: '❤️‍🩹' },
  { name: '公积金', icon: '💰' },
  { name: '驾驶证', icon: '🚗' },
  { name: '户籍办理', icon: '📋' },
]

async function loadOutlets() {
  loading.value = true
  try {
    const params = {
      district: currentDistrict.value === '全部' ? 'all' : currentDistrict.value,
      keyword: keyword.value,
      page: page.value,
      pageSize: pageSize.value
    }
    const data = await getOutlets(params)
    if (page.value === 1) {
      outlets.value = data || []
    } else {
      outlets.value = [...outlets.value, ...(data || [])]
    }
    total.value = 8
    hasMore.value = outlets.value.length < total.value
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  loadOutlets()
}

function selectDistrict(district) {
  currentDistrict.value = district
  page.value = 1
  loadOutlets()
}

async function findNearby() {
  showToast('正在定位...')
  try {
    const data = await getNearbyOutlets({
      lng: 106.5516,
      lat: 29.5628,
      radius: 5000
    })
    outlets.value = data || []
    total.value = outlets.value.length
    showToast(`已找到${outlets.value.length}个附近网点`)
  } catch (e) {
    showToast('定位失败，请手动搜索')
  }
}

function smartMatch() {
  showToast('智能匹配功能开发中')
}

function goToMap() {
  router.push('/outlets/map')
}

function goToDetail(id) {
  router.push(`/outlets/${id}`)
}

function goToAppointment() {
  router.push('/outlets/appointment')
}

function bookService(item) {
  showToast(`预约：${item.name}`)
}

function loadMore() {
  page.value++
  loadOutlets()
}

function formatDistance(m) {
  if (m < 1000) return `${Math.round(m)}米`
  return `${(m / 1000).toFixed(1)}公里`
}

onMounted(() => {
  loadOutlets()
})
</script>

<style scoped>
.outlets-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  padding: 40px 20px 60px;
  color: #fff;
  text-align: center;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.page-content {
  margin-top: -40px;
  padding: 0 12px 20px;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.filter-tab {
  padding: 6px 14px;
  background: #f5f7fa;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}

.filter-tab.active {
  background: #e8f5e9;
  color: #43a047;
}

.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  margin-bottom: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 13px;
  color: #333;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
}

.map-icon {
  background: linear-gradient(135deg, #43a047, #2e7d32);
}

.nearby-icon {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
}

.smart-icon {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
}

.appt-icon {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 14px;
}

.section-title .more,
.section-title .count {
  font-size: 13px;
  color: #999;
  font-weight: normal;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.service-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.service-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.outlet-list {
  margin-top: 12px;
}

.outlet-card {
  margin-bottom: 10px;
  padding: 16px;
}

.outlet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.outlet-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.outlet-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #ff9800;
  font-weight: 500;
}

.outlet-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.outlet-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.tag {
  padding: 3px 10px;
  background: #f0f7ff;
  color: #1976d2;
  font-size: 12px;
  border-radius: 4px;
}

.outlet-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.distance {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.window-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.open {
  font-size: 13px;
  color: #43a047;
}

.load-more {
  margin-top: 16px;
}
</style>
