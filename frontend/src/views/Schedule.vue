<script setup>
import { ref, onMounted } from 'vue'
import { movieApi, cinemaApi, scheduleApi } from '../api'
import { useTicketStore } from '../stores/ticket'
import Header from '../components/Header.vue'

const ticketStore = useTicketStore()
const movies = ref([])
const cinemas = ref([])
const schedules = ref([])
const selectedMovie = ref(null)
const selectedCinema = ref(null)
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const [movieRes, cinemaRes] = await Promise.all([
      movieApi.getMovies({ status: 'showing' }),
      cinemaApi.getCinemas({})
    ])
    
    if (movieRes.code === 0) {
      movies.value = movieRes.data.items
    }
    if (cinemaRes.code === 0) {
      cinemas.value = cinemaRes.data.items
    }
    
    await loadSchedules()
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

async function loadSchedules() {
  try {
    const params = {}
    if (selectedMovie.value) params.movie_id = selectedMovie.value
    if (selectedCinema.value) params.cinema_id = selectedCinema.value
    
    const res = await scheduleApi.getSchedules(params)
    console.log('排期API返回:', res)
    if (res.code === 0) {
      schedules.value = res.data
      console.log('排期数据:', schedules.value)
    }
  } catch (e) {
    console.error('加载排期失败', e)
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
    const movieTitle = movies.find(m => m.id === schedule.movie_id)?.title || '未知电影'
    const cinemaName = cinemas.find(c => c.id === schedule.cinema_id)?.name || '未知影院'
    alert(`购票成功！\n\n场次信息：\n电影：${movieTitle}\n影院：${cinemaName}\n时间：${schedule.start_time} ~ ${schedule.end_time}\n影厅：${schedule.hall_name}\n版本：${schedule.version} ${schedule.language}\n价格：¥${schedule.price}\n剩余座位：${schedules.value[index].available_seats} 座\n\n（演示功能，已自动减少1个座位）`)
  } else {
    alert(result.message)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="schedule-page">
    <Header />
    
    <main class="main-content">
      <div class="page-header">
        <h1 class="page-title">排期查询</h1>
      </div>
      
      <div class="filter-section">
        <div class="filter-group">
            <label class="filter-label">选择电影</label>
            <select 
              v-model.number="selectedMovie" 
              class="filter-select"
              @change="loadSchedules"
            >
              <option :value="null">全部电影</option>
              <option v-for="movie in movies" :key="movie.id" :value="movie.id">
                {{ movie.title }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">选择影院</label>
            <select 
              v-model.number="selectedCinema" 
              class="filter-select"
              @change="loadSchedules"
            >
              <option :value="null">全部影院</option>
              <option v-for="cinema in cinemas" :key="cinema.id" :value="cinema.id">
              {{ cinema.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
      
      <div v-else class="schedules-list">
        <div v-for="(schedule, index) in schedules" :key="schedule.id" class="schedule-card" :class="{ 'sold-out': schedule.available_seats <= 0, 'purchased': ticketStore.hasPurchased(schedule.id) }">
          <div class="schedule-main">
            <div class="schedule-time">
              <span class="start-time">{{ schedule.start_time }}</span>
              <span class="end-time" v-if="schedule.end_time">~ {{ schedule.end_time }}</span>
            </div>
            <div class="schedule-details">
              <div class="schedule-movie">
                电影：{{ movies.find(m => m.id === schedule.movie_id)?.title || '未知' }}
              </div>
              <div class="schedule-cinema">
                影院：{{ cinemas.find(c => c.id === schedule.cinema_id)?.name || '未知' }}
              </div>
              <div class="schedule-hall-info">
                {{ schedule.hall_name }} | {{ schedule.language }} | {{ schedule.version }}
              </div>
            </div>
          </div>
          <div class="schedule-action">
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
      </div>
      
      <div v-if="!loading && schedules.length === 0" class="empty-state">
        暂无排期数据
      </div>
    </main>
  </div>
</template>

<style scoped>
.schedule-page {
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

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.schedules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.schedule-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.schedule-card.sold-out,
.schedule-card.purchased {
  opacity: 0.7;
}

.schedule-card.sold-out .price,
.schedule-card.purchased .price {
  color: #999;
}

.schedule-main {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.schedule-time {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.start-time {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.end-time {
  font-size: 13px;
  color: var(--text-light);
}

.schedule-details {
  flex: 1;
}

.schedule-movie,
.schedule-cinema {
  font-size: 15px;
  margin-bottom: 6px;
}

.schedule-hall-info {
  font-size: 13px;
  color: var(--text-light);
}

.schedule-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.schedule-price {
  text-align: right;
}

.price {
  font-size: 22px;
  font-weight: 600;
  color: var(--primary-color);
}

.seats {
  font-size: 12px;
  color: var(--text-light);
  display: block;
}

.book-btn {
  padding: 10px 28px;
  font-size: 14px;
  min-width: 80px;
  transition: all 0.3s;
}

.btn-disabled {
  background: #999 !important;
  opacity: 0.7;
  cursor: not-allowed !important;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-light);
}
</style>
