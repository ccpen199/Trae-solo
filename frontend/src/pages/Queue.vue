<template>
  <div class="queue">
    <div class="header">
      <button class="back-btn" @click="goBack">←</button>
      <h2>排队取号</h2>
    </div>
    
    <div class="content" v-if="!queue">
      <div class="card">
        <h3>请选择就餐人数</h3>
        <div class="people-select">
          <button 
            v-for="n in 6" 
            :key="n"
            class="people-btn"
            :class="{ active: peopleCount === n }"
            @click="peopleCount = n"
          >
            {{ n }}人
          </button>
        </div>
        <button class="btn btn-primary btn-block" @click="getTicket" style="margin-top: 20px;">
          取号排队
        </button>
      </div>
    </div>
    
    <div class="content" v-else-if="queue.status === 'waiting'">
      <div class="ticket card waiting">
        <div class="ticket-icon">⏳</div>
        <h2>{{ queue.ticket_number }}</h2>
        <p class="queue-badge">排队中</p>
        <div class="queue-info-list">
          <div class="info-item">
            <span class="label">前方等待</span>
            <span class="value">{{ queue.wait_count || 0 }}桌</span>
          </div>
          <div class="info-item">
            <span class="label">就餐人数</span>
            <span class="value">{{ queue.people_count }}人</span>
          </div>
          <div class="info-item">
            <span class="label">取号时间</span>
            <span class="value">{{ formatTime(queue.created_at) }}</span>
          </div>
        </div>
      </div>
      
      <div class="alert-info">
        <span class="alert-icon">🔔</span>
        <span>请等待叫号，轮到您时会收到通知</span>
      </div>
      
      <div class="actions">
        <button class="btn btn-secondary btn-block" @click="goToMenu">
          📖 边等边选菜
        </button>
        <button class="btn btn-outline btn-block" @click="cancelQueue">
          取消排队
        </button>
      </div>
    </div>
    
    <div class="content" v-else-if="queue.status === 'called'">
      <div class="ticket card called">
        <div class="ticket-icon">🎉</div>
        <h2>{{ queue.ticket_number }}</h2>
        <p class="queue-badge success">叫号中</p>
        <div class="called-notice">
          <h3>轮到您了！</h3>
          <p>请尽快到前台确认入座</p>
        </div>
        <div class="queue-info-list">
          <div class="info-item">
            <span class="label">就餐人数</span>
            <span class="value">{{ queue.people_count }}人</span>
          </div>
        </div>
      </div>
      
      <div class="alert-success">
        <span class="alert-icon">✅</span>
        <span>轮到您了，请确认桌号入座</span>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary btn-block" @click="goToTable">
          🪑 确认桌号入座
        </button>
      </div>
    </div>
    
    <div class="content" v-else-if="queue.status === 'cancelled'">
      <div class="ticket card cancelled">
        <div class="ticket-icon">❌</div>
        <h2>{{ queue.ticket_number }}</h2>
        <p class="queue-badge cancelled">已取消</p>
      </div>
      
      <div class="alert-error">
        <span class="alert-icon">ℹ️</span>
        <span>您的排队已取消，如需重新排队请取号</span>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary btn-block" @click="resetQueue">
          重新取号
        </button>
      </div>
    </div>
    
    <div class="content" v-else-if="queue.status === 'served'">
      <div class="ticket card served">
        <div class="ticket-icon">✅</div>
        <h2>{{ queue.ticket_number }}</h2>
        <p class="queue-badge served">已入座</p>
      </div>
      
      <div class="alert-info">
        <span class="alert-icon">ℹ️</span>
        <span>您已完成排队并入座</span>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary btn-block" @click="goToMenu">
          📖 开始点菜
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Queue',
  data() {
    return {
      peopleCount: 2,
      queue: null,
      refreshTimer: null
    }
  },
  mounted() {
    const queueId = localStorage.getItem('queueId')
    if (queueId) {
      this.loadQueue(queueId)
      this.startAutoRefresh()
    }
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    formatTime(dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    },
    
    async getTicket() {
      try {
        const restaurantId = localStorage.getItem('restaurantId') || 1
        const res = await axios.post('http://localhost:19881/api/queues', {
          restaurant_id: restaurantId,
          people_count: this.peopleCount
        })
        this.queue = { ...res.data, wait_count: 0 }
        localStorage.setItem('queueId', res.data.id)
        this.startAutoRefresh()
      } catch (e) {
        console.error(e)
        alert('取号失败，请重试')
      }
    },
    
    async loadQueue(queueId) {
      try {
        const res = await axios.get(`http://localhost:19881/api/queues/${queueId}/status`)
        this.queue = res.data
      } catch (e) {
        console.error(e)
        if (e.response && e.response.status === 404) {
          this.queue = null
          localStorage.removeItem('queueId')
        }
      }
    },
    
    startAutoRefresh() {
      this.stopAutoRefresh()
      this.refreshTimer = setInterval(() => {
        if (this.queue && this.queue.status === 'waiting') {
          this.loadQueue(this.queue.id)
        }
      }, 5000)
    },
    
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    
    async cancelQueue() {
      if (!confirm('确定要取消排队吗？')) return
      
      try {
        await axios.put(`http://localhost:19881/api/queues/${this.queue.id}/cancel`)
        this.queue.status = 'cancelled'
        this.stopAutoRefresh()
        localStorage.removeItem('queueId')
      } catch (e) {
        console.error(e)
        alert('取消失败，请重试')
      }
    },
    
    goToMenu() {
      this.$router.push('/menu')
    },
    
    goToTable() {
      this.$router.push('/table')
    },
    
    resetQueue() {
      this.queue = null
      this.peopleCount = 2
    },
    
    goBack() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
.queue {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
}
.header h2 {
  font-size: 18px;
  color: #333;
}
.content {
  padding: 20px;
}
.card h3 {
  margin-bottom: 16px;
  color: #333;
  text-align: center;
}
.people-select {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.people-btn {
  padding: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.people-btn:hover {
  border-color: #ff6b6b;
}
.people-btn.active {
  border-color: #ff6b6b;
  background: #fff5f5;
  color: #ff6b6b;
}

.ticket {
  text-align: center;
  color: white;
  position: relative;
}
.ticket.waiting {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.ticket.called {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}
.ticket.cancelled {
  background: linear-gradient(135deg, #969696 0%, #636363 100%);
}
.ticket.served {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.ticket-icon {
  font-size: 64px;
  margin-bottom: 12px;
}
.ticket h2 {
  font-size: 56px;
  margin-bottom: 8px;
  font-weight: bold;
}
.queue-badge {
  display: inline-block;
  padding: 4px 16px;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 20px;
}
.queue-badge.success {
  background: rgba(255,255,255,0.3);
}
.queue-badge.cancelled {
  background: rgba(255,255,255,0.2);
}

.queue-info-list {
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.info-item:last-child {
  border-bottom: none;
}
.info-item .label {
  opacity: 0.9;
  font-size: 14px;
}
.info-item .value {
  font-weight: 600;
}

.called-notice {
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
}
.called-notice h3 {
  color: white;
  font-size: 20px;
  margin-bottom: 8px;
}
.called-notice p {
  opacity: 0.9;
}

.alert-info, .alert-success, .alert-error {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.alert-info {
  border-left: 4px solid #3498db;
}
.alert-success {
  border-left: 4px solid #27ae60;
}
.alert-error {
  border-left: 4px solid #e74c3c;
}
.alert-icon {
  font-size: 20px;
}

.actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
