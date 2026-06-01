<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { cinemaApi, scheduleApi } from '../api'
import { useTicketStore } from '../stores/ticket'
import Header from '../components/Header.vue'

const route = useRoute()
const ticketStore = useTicketStore()
const cinema = ref(null)
const schedules = ref([])
const loading = ref(false)

async function loadCinema() {
  loading.value = true
  try {
    const cinemaId = Number(route.params.id)
    const res = await cinemaApi.getCinema(cinemaId)
    if (res.code === 0) {
      cinema.value = res.data
    }
    
    const scheduleRes = await scheduleApi.getSchedules({ cinema_id: cinemaId })
    console.log('影院排期API返回:', scheduleRes)
    if (scheduleRes.code === 0) {
      schedules.value = scheduleRes.data
      console.log('影院排期数据:', schedules.value)
    }
  } catch (e) {
    console.error('加载影院详情失败', e)
  } finally {
    loading.value = false
  }
}

function handleBookTicket(schedule, index) {
  if (ticketStore.hasPurchased(schedule.id)) {
    alert('您已经购买过该场次的票了，请勿重复购买！')
    return
  }

  if (schedule.available_seats <= 0) {
    alert('该场次已售罄！')
    return
  }

  const result = ticketStore.purchaseTicket(schedule)
  if (result.success) {
    schedules.value[index].available_seats -= 1
    alert(`购票成功！\n\n场次信息：\n时间：${schedule.start_time} ~ ${schedule.end_time}\n影厅：${schedule.hall_name}\n版本：${schedule.version} ${schedule.language}\n价格：¥${schedule.price}\n剩余座位：${schedules.value[index].available_seats} 座\n\n（演示功能，已自动减少1个座位）`)
  } else {
    alert(result.message)
  }
}

onMounted(() => {
  loadCinema()
})
</script>

<template>
  <div class="cinema-detail-page">
    <Header />
    
    <main class="main-content">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
      
      <div v-else-if="cinema" class="cinema-detail">
        <div class="cinema-header">
          <h1 class="cinema-title">{{ cinema.name }}</h1>
          <p class="cinema-address">{{ cinema.address }}</p>
          <div class="cinema-contact">
            <span v-if="cinema.phone">📞 {{ cinema.phone }}</span>
            <span v-if="cinema.business_hours">🕐 {{ cinema.business_hours }}</span>
          </div>
          <div v-if="cinema.facilities" class="cinema-facilities">
            <span class="facilities-label">设施：</span>
            <span class="facilities-value">{{ cinema.facilities }}</span>
          </div>
        </div>
        
        <div class="schedules-section">
          <h2 class="section-title">今日排期</h2>
          <div v-if="schedules.length > 0" class="schedules-list">
            <div v-for="(schedule, index) in schedules" :key="schedule.id" class="schedule-item" :class="{ 'sold-out': schedule.available_seats <= 0, 'purchased': ticketStore.hasPurchased(schedule.id) }">
              <div class="schedule-time">
                <span class="start-time">{{ schedule.start_time }}</span>
                <span class="end-time" v-if="schedule.end_time">~ {{ schedule.end_time }}</span>
              </div>
              <div class="schedule-info">
                <div class="schedule-hall">{{ schedule.hall_name }}</div>
                <div class="schedule-version">{{ schedule.version }} {{ schedule.language }}</div>
              </div>
              <div class="schedule-price">
                <span class="price">¥{{ schedule.price }}</span>
                <span class="seats">剩余 {{ schedule.available_seats }} 座</span>
              </div>
              <button 
                class="btn btn-primary book-btn" 
                :class="{ 'btn-disabled': ticketStore.hasPurchased(schedule.id) || schedule.available_seats <= 0 }"
                :disabled="ticketStore.hasPurchased(schedule.id) || schedule.available_seats <= 0"
                @click="handleBookTicket(schedule, index)"
              >
                <template v-if="ticketStore.hasPurchased(schedule.id)">已购票</template>
                <template v-else-if="schedule.available_seats <= 0">售罄</template>
                <template v-else>购票</template>
              </button>
            </div>
          </div>
          <div v-else class="empty-schedules">
            今日暂无排期
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.cinema-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
}

.cinema-header {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.cinema-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
}

.cinema-address {
  font-size: 15px;
  color: var(--text-light);
  margin-bottom: 16px;
}

.cinema-contact {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-light);
}

.cinema-facilities {
  font-size: 14px;
  color: var(--text-light);
}

.facilities-label {
  margin-right: 8px;
}

.schedules-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-color);
}

.schedules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: var(--bg-color);
  border-radius: 8px;
}

.schedule-time {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.start-time {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
}

.end-time {
  font-size: 13px;
  color: var(--text-light);
}

.schedule-info {
  flex: 1;
}

.schedule-hall {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
}

.schedule-version {
  font-size: 13px;
  color: var(--text-light);
}

.schedule-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 100px;
}

.price {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
}

.seats {
  font-size: 12px;
  color: var(--text-light);
}

.book-btn {
  padding: 10px 24px;
  font-size: 14px;
  min-width: 80px;
  transition: all 0.3s;
}

.btn-disabled {
  background: #999 !important;
  opacity: 0.7;
  cursor: not-allowed !important;
}

.schedule-item.sold-out,
.schedule-item.purchased {
  opacity: 0.7;
}

.schedule-item.sold-out .price,
.schedule-item.purchased .price {
  color: #999;
}

.empty-schedules {
  text-align: center;
  padding: 40px;
  color: var(--text-light);
}
</style>
