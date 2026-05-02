<template>
  <div class="room-container">
    <div class="room-header">
      <div class="room-info">
        <div class="room-game-icon">{{ room?.icon }}</div>
        <div class="room-details">
          <h1 class="room-title">{{ room?.game_name || '游戏房间' }}</h1>
          <p class="room-code">房间码: {{ roomCode }}</p>
        </div>
      </div>
      <div class="room-actions">
        <button class="leave-btn" @click="leaveRoom">离开房间</button>
      </div>
    </div>
    
    <div class="room-content">
      <div class="players-section">
        <h2 class="section-title">👥 玩家列表</h2>
        <div class="players-grid">
          <div 
            v-for="player in players" 
            :key="player.user_id"
            class="player-card"
            :class="{ 
              'is-host': player.user_id === room?.host_id,
              'is-ready': player.is_ready
            }"
          >
            <div class="player-avatar">{{ player.avatar }}</div>
            <div class="player-info">
              <div class="player-name">
                {{ player.nickname }}
                <span v-if="player.user_id === room?.host_id" class="host-badge">房主</span>
              </div>
              <div class="player-status">
                <span class="status-dot" :class="player.is_ready ? 'ready' : 'not-ready'"></span>
                {{ player.is_ready ? '已准备' : '准备中' }}
              </div>
            </div>
          </div>
          
          <div v-for="i in emptySlots" :key="'empty-' + i" class="player-card empty">
            <div class="player-avatar">👤</div>
            <div class="player-info">
              <div class="player-name">等待加入...</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="actions-section">
        <template v-if="isHost">
          <button 
            class="start-btn"
            :disabled="!allReady"
            @click="startGame"
          >
            {{ allReady ? '🎮 开始游戏' : '等待玩家准备' }}
          </button>
          <p class="start-hint" v-if="!allReady">需要所有玩家准备就绪才能开始</p>
        </template>
        
        <template v-else>
          <button 
            class="ready-btn"
            :class="{ 'is-ready': isReady }"
            @click="toggleReady"
          >
            {{ isReady ? '取消准备' : '✓ 准备就绪' }}
          </button>
        </template>
      </div>
      
      <div class="info-section">
        <div class="info-card">
          <div class="info-icon">ℹ️</div>
          <div class="info-content">
            <h3>游戏规则</h3>
            <p>1. 房主可以开始游戏</p>
            <p>2. 所有玩家准备就绪后才能开始</p>
            <p>3. 游戏过程中可以实时互动</p>
            <p>4. 游戏结束后显示排名和积分</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roomApi } from '@/utils/api'
import { useUserStore } from '@/store'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const roomCode = computed(() => route.params.roomCode)
const room = ref(null)
const players = ref([])

const isHost = computed(() => {
  return userStore.user?.id === room.value?.host_id
})

const isReady = computed(() => {
  const myPlayer = players.value.find(p => p.user_id === userStore.user?.id)
  return myPlayer?.is_ready === 1 || myPlayer?.is_ready === true
})

const allReady = computed(() => {
  if (players.value.length === 0) return false
  return players.value.every(p => p.is_ready === 1 || p.is_ready === true)
})

const emptySlots = computed(() => {
  const maxPlayers = room.value?.max_players || 4
  return Math.max(0, maxPlayers - players.value.length)
})

const loadRoom = async () => {
  try {
    const response = await roomApi.get(roomCode.value)
    room.value = response.data
    players.value = response.data.players || []
  } catch (err) {
    console.error('加载房间失败:', err)
    router.push('/room')
  }
}

const toggleReady = async () => {
  try {
    await roomApi.ready({ room_id: room.value.id })
    loadRoom()
  } catch (err) {
    console.error('切换准备状态失败:', err)
  }
}

const startGame = async () => {
  try {
    await roomApi.start({ room_id: room.value.id })
    alert('游戏已开始！')
  } catch (err) {
    console.error('开始游戏失败:', err)
    alert(err.response?.data?.error || '开始游戏失败')
  }
}

const leaveRoom = async () => {
  try {
    await roomApi.leave({ room_id: room.value.id })
    router.push('/room')
  } catch (err) {
    console.error('离开房间失败:', err)
    router.push('/room')
  }
}

onMounted(() => {
  loadRoom()
})
</script>

<style scoped>
.room-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.room-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-game-icon {
  font-size: 48px;
}

.room-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.room-code {
  font-size: 14px;
  color: #888;
  font-family: monospace;
}

.leave-btn {
  padding: 12px 24px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.leave-btn:hover {
  background: #ee5a5a;
}

.room-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.players-section,
.actions-section,
.info-section {
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

.players-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.player-card.is-host {
  background: #fff3cd;
  border-color: #ffc107;
}

.player-card.is-ready {
  background: #d4edda;
  border-color: #28a745;
}

.player-card.empty {
  background: #f5f5f5;
  opacity: 0.5;
}

.player-avatar {
  font-size: 48px;
}

.player-name {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-badge {
  padding: 2px 8px;
  background: #ffc107;
  color: #333;
  border-radius: 8px;
  font-size: 12px;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #888;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.ready {
  background: #28a745;
}

.status-dot.not-ready {
  background: #ffc107;
}

.actions-section {
  text-align: center;
}

.start-btn,
.ready-btn {
  padding: 16px 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled),
.ready-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102,126,234,0.4);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ready-btn.is-ready {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.start-hint {
  margin-top: 12px;
  font-size: 14px;
  color: #888;
}

.info-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #e8f0ff;
  border-radius: 12px;
}

.info-icon {
  font-size: 32px;
}

.info-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.info-content p {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

@media (max-width: 1024px) {
  .players-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .room-info {
    flex-direction: column;
  }
  
  .players-grid {
    grid-template-columns: 1fr;
  }
}
</style>
