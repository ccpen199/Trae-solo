<template>
  <div class="room-container">
    <div class="page-header">
      <h1 class="page-title">👥 互动房间</h1>
      <p class="page-subtitle">和同学们一起游戏，互动学习更有趣！</p>
    </div>
    
    <div class="action-section">
      <div class="create-room-card" @click="showCreateModal = true">
        <div class="card-icon">➕</div>
        <h3>创建房间</h3>
        <p>创建一个新房间，邀请好友加入</p>
      </div>
      
      <div class="join-room-card" @click="showJoinModal = true">
        <div class="card-icon">🚪</div>
        <h3>加入房间</h3>
        <p>输入房间码，加入好友的游戏</p>
      </div>
    </div>
    
    <div class="content-section">
      <h2 class="section-title">🎮 等待中的房间</h2>
      <div class="room-list" v-if="waitingRooms.length > 0">
        <div 
          v-for="room in waitingRooms" 
          :key="room.id"
          class="room-card"
          @click="joinRoom(room.room_code)"
        >
          <div class="room-game-icon">{{ room.icon }}</div>
          <div class="room-info">
            <div class="room-name">{{ room.game_name }}</div>
            <div class="room-code">房间码: {{ room.room_code }}</div>
          </div>
          <div class="room-players">
            <div class="player-count">{{ room.player_count }}/{{ room.max_players }}</div>
            <div class="player-status">等待中</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🎮</div>
        <p>暂无等待中的房间，快来创建一个吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { roomApi } from '@/utils/api'

const router = useRouter()

const showCreateModal = ref(false)
const showJoinModal = ref(false)
const waitingRooms = ref([])

const loadWaitingRooms = async () => {
  try {
    const response = await roomApi.getWaitingList()
    waitingRooms.value = response.data
  } catch (err) {
    console.error('加载房间列表失败:', err)
  }
}

const joinRoom = async (roomCode) => {
  try {
    await roomApi.join(roomCode)
    router.push(`/room/${roomCode}`)
  } catch (err) {
    console.error('加入房间失败:', err)
    alert(err.response?.data?.error || '加入房间失败')
  }
}

onMounted(() => {
  loadWaitingRooms()
})
</script>

<style scoped>
.room-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  text-align: center;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #888;
}

.action-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.create-room-card,
.join-room-card {
  padding: 32px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.create-room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102,126,234,0.3);
}

.join-room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(72,187,120,0.3);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.create-room-card h3,
.join-room-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.create-room-card p,
.join-room-card p {
  font-size: 14px;
  color: #888;
}

.content-section {
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.room-card:hover {
  background: #e8f0ff;
  transform: translateX(8px);
}

.room-game-icon {
  font-size: 40px;
}

.room-info {
  flex: 1;
}

.room-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.room-code {
  font-size: 13px;
  color: #888;
  font-family: monospace;
}

.room-players {
  text-align: right;
}

.player-count {
  font-weight: 700;
  color: #667eea;
  font-size: 18px;
}

.player-status {
  font-size: 12px;
  color: #48bb78;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .action-section {
    grid-template-columns: 1fr;
  }
  
  .room-card {
    flex-direction: column;
    text-align: center;
  }
  
  .room-players {
    text-align: center;
  }
}
</style>
