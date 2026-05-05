<template>
  <div class="store-detail-page">
    <div class="header">
      <div class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </div>
      <h3>门店详情</h3>
    </div>

    <div class="store-card" v-if="store">
      <div class="store-image">
        <div class="placeholder-img">
          <el-icon :size="40"><OfficeBuilding /></el-icon>
        </div>
      </div>
      <div class="store-info">
        <h3 class="store-name">{{ store.name }}</h3>
        <div class="store-rating">
          <el-rate v-model="store.rating" disabled :max="5" show-score text-color="#ff9800" />
          <span class="rating-count">({{ store.ratingCount }}条评价)</span>
        </div>
        <div class="store-address">
          <el-icon :size="14"><Location /></el-icon>
          <span>{{ store.address }}</span>
        </div>
        <div class="store-contact">
          <el-icon :size="14"><Phone /></el-icon>
          <span>{{ store.phone }}</span>
        </div>
        <div class="store-hours">
          <el-icon :size="14"><Clock /></el-icon>
          <span>营业时间：{{ store.businessHours }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">门店技师</div>
      <div class="technician-list">
        <div 
          v-for="tech in technicians" 
          :key="tech.id"
          class="technician-card"
        >
          <div class="tech-avatar">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="tech-info">
            <h4 class="tech-name">{{ tech.name }}</h4>
            <p class="tech-title">{{ tech.title }}</p>
            <div class="tech-meta">
              <el-rate v-model="tech.rating" disabled :max="5" show-score text-color="#ff9800" size="small" />
              <span class="service-count">服务{{ tech.serviceCount }}次</span>
            </div>
            <p class="tech-specialties">擅长：{{ tech.specialties }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">门店服务</div>
      <div class="service-list">
        <div class="service-item">
          <div class="service-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="20"><Oil /></el-icon>
          </div>
          <span class="service-name">小保养</span>
        </div>
        <div class="service-item">
          <div class="service-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon :size="20"><Promotion /></el-icon>
          </div>
          <span class="service-name">轮胎更换</span>
        </div>
        <div class="service-item">
          <div class="service-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon :size="20"><Tools /></el-icon>
          </div>
          <span class="service-name">大保养</span>
        </div>
        <div class="service-item">
          <div class="service-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <el-icon :size="20"><Aim /></el-icon>
          </div>
          <span class="service-name">四轮定位</span>
        </div>
        <div class="service-item">
          <div class="service-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon :size="20"><WindPower /></el-icon>
          </div>
          <span class="service-name">空调清洗</span>
        </div>
        <div class="service-item">
          <div class="service-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            <el-icon :size="20"><Connection /></el-icon>
          </div>
          <span class="service-name">电瓶更换</span>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <el-button type="primary" size="large" class="appointment-btn" @click="handleAppointment">
        预约到店
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const store = ref(null)
const technicians = ref([])

const goBack = () => {
  router.back()
}

const handleAppointment = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  ElMessage.success('预约功能开发中')
}

onMounted(async () => {
  const storeId = route.params.id
  try {
    const res = await request.get(`/api/stores/${storeId}`)
    if (res.code === 200 && res.data) {
      store.value = res.data
    }
  } catch (e) {
    store.value = {
      id: storeId,
      name: '途虎养车工厂店(北京朝阳店)',
      address: '北京市朝阳区建国路88号SOHO现代城',
      phone: '400-111-8866',
      businessHours: '8:00-22:00',
      rating: 4.8,
      ratingCount: 2568,
      isFactoryStore: true
    }
  }

  technicians.value = [
    {
      id: 1,
      name: '张师傅',
      title: '高级技师',
      rating: 4.9,
      ratingCount: 568,
      serviceCount: 3256,
      specialties: '机油更换,轮胎更换,刹车系统'
    },
    {
      id: 2,
      name: '李师傅',
      title: '资深技师',
      rating: 4.8,
      ratingCount: 425,
      serviceCount: 2896,
      specialties: '发动机保养,空调系统,电路检测'
    },
    {
      id: 3,
      name: '王师傅',
      title: '技师',
      rating: 4.7,
      ratingCount: 356,
      serviceCount: 2156,
      specialties: '轮胎动平衡,四轮定位,小保养'
    }
  ]
})
</script>

<style scoped>
.store-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  color: #fff;
  cursor: pointer;
  margin-right: 16px;
}

.header h3 {
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  margin: 0;
}

.store-card {
  background: #fff;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.store-image {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-img {
  color: rgba(255, 255, 255, 0.5);
}

.store-info {
  padding: 16px;
}

.store-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px;
}

.store-rating {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.rating-count {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.store-address,
.store-contact,
.store-hours {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.store-address .el-icon,
.store-contact .el-icon,
.store-hours .el-icon {
  color: #999;
  margin-top: 2px;
  flex-shrink: 0;
}

.section {
  background: #fff;
  margin: 12px 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.technician-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.technician-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.tech-avatar {
  width: 56px;
  height: 56px;
  background: #e8e8e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  flex-shrink: 0;
}

.tech-info {
  flex: 1;
}

.tech-name {
  font-size: 15px;
  color: #333;
  margin: 0 0 4px;
  font-weight: 500;
}

.tech-title {
  font-size: 12px;
  color: #ff9800;
  margin: 0 0 6px;
}

.tech-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.service-count {
  font-size: 11px;
  color: #999;
}

.tech-specialties {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.service-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(33.33% - 11px);
  cursor: pointer;
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 6px;
}

.service-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 750px;
  margin: 0 auto;
  background: #fff;
  padding: 12px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  border-top: 1px solid #eee;
}

.appointment-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
}
</style>
