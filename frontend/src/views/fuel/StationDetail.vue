<template>
  <div class="station-detail-page">
    <div class="page-header">
      <van-icon name="arrow-left" size="20" color="#fff" @click="goBack" />
      <div class="header-title">油站详情</div>
    </div>

    <div class="station-banner" v-if="station.images">
      <van-swipe :autoplay="3000">
        <van-swipe-item v-for="(img, idx) in stationImages" :key="idx">
          <img :src="img" class="banner-image" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <div class="station-info-card">
      <div class="station-name">{{ station.name }}</div>
      <div class="station-rating">
        <van-rate v-model="station.rating" readonly size="16" />
        <span class="rating-text">{{ station.rating }}分</span>
        <span class="distance">{{ station.distance }}</span>
      </div>
      <div class="station-address" @click="navigateTo">
        <van-icon name="location-o" size="16" color="#1989fa" />
        <span>{{ station.address }}</span>
        <van-icon name="nav-arrow-right" size="14" color="#969799" />
      </div>
      <div class="station-hours">
        <van-icon name="clock-o" size="16" color="#969799" />
        <span>营业时间: {{ station.opening_hours || '24小时' }}</span>
      </div>
    </div>

    <div class="fuel-price-section">
      <div class="section-title">今日油价</div>
      <div class="price-grid">
        <div class="price-item" v-for="(price, type) in fuelPrices" :key="type">
          <div class="fuel-type">{{ type }}</div>
          <div class="fuel-price">
            <span class="price">¥{{ price }}</span>
            <span class="unit">/升</span>
          </div>
        </div>
      </div>
    </div>

    <div class="services-section">
      <div class="section-title">油站服务</div>
      <div class="services-list">
        <div class="service-item" v-for="(service, idx) in stationServices" :key="idx">
          <van-icon name="passed" size="16" color="#07c160" />
          <span>{{ service }}</span>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <van-button type="default" size="large" @click="navigateTo" class="nav-btn">
        <van-icon name="location-o" size="18" />
        <span>导航</span>
      </van-button>
      <van-button type="primary" size="large" @click="goFuel" class="fuel-btn">
        <van-icon name="new-fire-o" size="18" />
        <span>一键加油</span>
      </van-button>
    </div>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const station = ref({
  id: 1,
  name: '易捷加油 - 朝阳路站',
  address: '北京市朝阳区朝阳路100号',
  distance: '0.5km',
  rating: 4.8,
  opening_hours: '24小时',
  services: '["便利店","洗车","休息区","充电桩","餐饮","卫生间"]',
  images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20gas%20station%20with%20convenience%20store%20exterior%20photo&image_size=landscape_4_3"]'
})

const fuelPrices = ref({
  '92#汽油': 7.59,
  '95#汽油': 8.19,
  '98#汽油': 9.19,
  '0#柴油': 7.29
})

const stationImages = computed(() => {
  try {
    return JSON.parse(station.value.images || '[]')
  } catch {
    return []
  }
})

const stationServices = computed(() => {
  try {
    return JSON.parse(station.value.services || '[]')
  } catch {
    return []
  }
})

const goBack = () => {
  router.back()
}

const navigateTo = () => {
  showToast('正在跳转到导航...')
}

const goFuel = () => {
  router.push('/fuel')
}

const fetchStationDetail = async () => {
  loading.value = true
  try {
    const stationId = route.params.id
    console.log('获取油站详情:', stationId)
  } catch (error) {
    console.error('获取油站详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStationDetail()
})
</script>

<style lang="less" scoped>
.station-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5), transparent);

  .header-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-right: 20px;
  }
}

.station-banner {
  height: 200px;
  overflow: hidden;

  .banner-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
}

.station-info-card {
  background: #fff;
  margin: -20px 12px 12px;
  padding: 16px;
  border-radius: 12px;
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  .station-name {
    font-size: 18px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 8px;
  }

  .station-rating {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .rating-text {
      margin-left: 8px;
      font-size: 14px;
      color: #ff976a;
    }

    .distance {
      margin-left: 16px;
      font-size: 14px;
      color: #1989fa;
    }
  }

  .station-address,
  .station-hours {
    display: flex;
    align-items: center;
    padding: 8px 0;
    font-size: 13px;
    color: #646566;

    .van-icon {
      margin-right: 8px;
    }
  }

  .station-address {
    border-top: 1px solid #f7f8fa;
    cursor: pointer;

    .van-nav-arrow-right {
      margin-left: auto;
    }
  }
}

.fuel-price-section,
.services-section {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 16px;
  }
}

.fuel-price-section {
  .price-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .price-item {
      width: calc(50% - 6px);
      padding: 16px;
      background: linear-gradient(135deg, #f5faff, #e8f4ff);
      border-radius: 8px;
      text-align: center;

      .fuel-type {
        font-size: 14px;
        color: #646566;
        margin-bottom: 8px;
      }

      .fuel-price {
        .price {
          font-size: 24px;
          font-weight: 600;
          color: #ee0a24;
        }

        .unit {
          font-size: 12px;
          color: #969799;
        }
      }
    }
  }
}

.services-section {
  .services-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    .service-item {
      display: flex;
      align-items: center;
      min-width: calc(50% - 8px);
      font-size: 14px;
      color: #646566;

      .van-icon {
        margin-right: 8px;
      }
    }
  }
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 12px 16px;
  background: #fff;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  gap: 12px;

  .nav-btn,
  .fuel-btn {
    flex: 1;
    border-radius: 24px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .fuel-btn {
    background: linear-gradient(135deg, #1989fa, #409eff);
    border: none;
  }
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
