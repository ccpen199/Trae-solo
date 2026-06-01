<template>
  <div class="dashboard">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon hotel-icon">🏨</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalHotels }}</div>
          <div class="stat-label">合作酒店</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon team-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activeTeams }}/{{ stats.totalTeams }}</div>
          <div class="stat-label">活跃团队</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon room-icon">🛏️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.availableRooms }}/{{ stats.totalRooms }}</div>
          <div class="stat-label">可用房量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon money-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingSettlements }}</div>
          <div class="stat-label">待结算</div>
        </div>
      </div>
    </div>

    <div class="content-row">
      <div class="content-card">
        <h3>游客人数统计</h3>
        <div class="tourist-stat">
          <div class="tourist-number">{{ stats.totalTourists }}</div>
          <div class="tourist-label">总游客人数</div>
        </div>
      </div>
      <div class="content-card">
        <div class="card-header">
          <span>即将到期释放</span>
          <button class="btn-refresh" @click="checkExpired">刷新</button>
        </div>
        <table class="simple-table" v-if="expiredPlans.length > 0">
          <thead>
            <tr>
              <th>酒店</th>
              <th>房型</th>
              <th>日期</th>
              <th>可释放</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in expiredPlans" :key="plan.id">
              <td>{{ plan.hotel_name }}</td>
              <td>{{ plan.room_type_name }}</td>
              <td>{{ plan.date }}</td>
              <td>{{ plan.available_rooms }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-text">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { settlementApi, controlPlanApi } from '@/api'

const stats = ref({
  totalHotels: 0,
  totalTeams: 0,
  activeTeams: 0,
  totalTourists: 0,
  totalRooms: 0,
  usedRooms: 0,
  availableRooms: 0,
  pendingSettlements: 0
})

const expiredPlans = ref([])

const loadStats = async () => {
  try {
    const res = await settlementApi.getDashboardStats()
    if (res.success) {
      stats.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const checkExpired = async () => {
  try {
    const res = await controlPlanApi.checkExpired()
    if (res.success) {
      expiredPlans.value = res.data.slice(0, 5)
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadStats()
  checkExpired()
})
</script>

<style>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.hotel-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.team-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.room-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.money-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.content-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn-refresh {
  padding: 6px 12px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.tourist-stat {
  text-align: center;
  padding: 20px 0;
}

.tourist-number {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
}

.tourist-label {
  font-size: 16px;
  color: #606266;
  margin-top: 8px;
}

.simple-table {
  width: 100%;
  border-collapse: collapse;
}

.simple-table th,
.simple-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

.simple-table th {
  background: #fafafa;
  font-weight: 500;
  color: #909399;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}
</style>
