<template>
  <div class="store-page">
    <div class="header">
      <h1>门店</h1>
    </div>
    
    <div class="search-bar">
      <el-icon :size="16"><Search /></el-icon>
      <span class="search-placeholder">搜索门店地址</span>
    </div>

    <div class="store-list">
      <div 
        v-for="store in stores" 
        :key="store.id"
        class="store-card"
      >
        <div class="store-image" @click="goToStoreDetail(store.id)">
          <div class="store-img-content" :style="{ background: store.imageBg }">
            <el-icon :size="32" color="rgba(255,255,255,0.7)"><OfficeBuilding /></el-icon>
          </div>
        </div>
        <div class="store-info">
          <div class="store-header">
            <h4 class="store-name">{{ store.name }}</h4>
            <div class="store-tag" v-if="store.isFactoryStore">工厂店</div>
          </div>
          <div class="store-rating">
            <el-rate 
              v-model="store.rating" 
              disabled 
              :max="5"
              show-text
              text-color="#ff6600"
              texts="['差', '一般', '良好', '较好', '很好']"
            />
            <span class="rating-count">({{ store.ratingCount }}条评价)</span>
          </div>
          <p class="store-address">
            <el-icon :size="12"><Location /></el-icon>
            {{ store.address }}
          </p>
          <p class="store-hours">
            <el-icon :size="12"><Clock /></el-icon>
            营业时间：{{ store.businessHours }}
          </p>
          <div class="store-actions">
            <el-button size="small" type="primary" plain @click="handlePhoneCall(store)">电话咨询</el-button>
            <el-button size="small" type="primary" @click="handleAppointment(store)">立即预约</el-button>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()

const stores = ref([
  {
    id: 1,
    name: '途虎养车工厂店(北京朝阳店)',
    address: '北京市朝阳区建国路88号SOHO现代城',
    businessHours: '8:00-22:00',
    phone: '400-111-8866',
    rating: 4.8,
    ratingCount: 2568,
    isFactoryStore: true,
    imageBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    name: '途虎养车工厂店(北京海淀店)',
    address: '北京市海淀区中关村大街1号',
    businessHours: '8:00-22:00',
    phone: '400-111-8867',
    rating: 4.9,
    ratingCount: 3125,
    isFactoryStore: true,
    imageBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3,
    name: '途虎养车工厂店(上海浦东店)',
    address: '上海市浦东新区陆家嘴环路1000号',
    businessHours: '8:00-22:00',
    phone: '400-111-8868',
    rating: 4.7,
    ratingCount: 1896,
    isFactoryStore: true,
    imageBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
])

const goToStoreDetail = (storeId) => {
  router.push(`/store/${storeId}`)
}

const handlePhoneCall = (store) => {
  ElMessage.info(`正在拨打: ${store.phone}`)
}

const handleAppointment = (store) => {
  router.push(`/store/${store.id}`)
  ElMessage.success(`正在跳转至 ${store.name} 预约页面`)
}
</script>

<style scoped>
.store-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.header {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #fff;
  margin: 12px 16px;
  border-radius: 20px;
  padding: 10px 16px;
}

.search-bar .el-icon {
  color: #999;
  margin-right: 8px;
}

.search-placeholder {
  font-size: 13px;
  color: #999;
}

.store-list {
  padding: 0 16px;
}

.store-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
}

.store-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  cursor: pointer;
}

.store-img-content {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.store-info {
  flex: 1;
  min-width: 0;
}

.store-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.store-name {
  font-size: 15px;
  color: #333;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #ff6600;
  color: #fff;
  border-radius: 4px;
  flex-shrink: 0;
}

.store-rating {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.rating-count {
  font-size: 11px;
  color: #999;
  margin-left: 6px;
}

.store-address,
.store-hours {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.store-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
