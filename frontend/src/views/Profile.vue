<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-avatar">{{ userStore.user?.avatar || '👤' }}</div>
      <div class="profile-info">
        <h1 class="profile-name">{{ userStore.user?.nickname || userStore.user?.username }}</h1>
        <p class="profile-role">{{ userStore.user?.role === 'teacher' ? '👨‍🏫 教师' : '👦 学生' }}</p>
        <p class="profile-username">@{{ userStore.user?.username }}</p>
      </div>
      <div class="profile-score-card">
        <div class="score-label">总积分</div>
        <div class="score-value">{{ userStore.user?.total_score || 0 }}</div>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🎮</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalGames }}</div>
          <div class="stat-label">完成游戏</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgScore }}</div>
          <div class="stat-label">平均得分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.gameTypesPlayed }}</div>
          <div class="stat-label">游戏类型</div>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <h2 class="section-title">🏆 最近成绩</h2>
      <div class="recent-games" v-if="recentGames.length > 0">
        <div 
          v-for="(game, index) in recentGames" 
          :key="game.id"
          class="game-item"
        >
          <div class="game-icon">{{ game.icon }}</div>
          <div class="game-info">
            <div class="game-name">{{ game.game_name }}</div>
            <div class="game-level" v-if="game.level_name">{{ game.level_name }}</div>
          </div>
          <div class="game-score">
            <span class="score">+{{ game.score }}</span>
          </div>
          <div class="game-time">{{ formatTime(game.created_at) }}</div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🎮</div>
        <p>还没有游戏记录，快去玩游戏吧！</p>
      </div>
    </div>
    
    <div class="content-section" v-if="stats.recentGames && stats.recentGames.length > 0">
      <h2 class="section-title">📈 游戏偏好</h2>
      <div class="preference-list">
        <div 
          v-for="(game, index) in stats.recentGames.slice(0, 5)" 
          :key="game.id"
          class="preference-item"
        >
          <div class="preference-icon">{{ game.icon }}</div>
          <div class="preference-info">
            <div class="preference-name">{{ game.name }}</div>
            <div class="preference-stats">{{ game.play_count }} 次 | {{ game.total_score || 0 }} 积分</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store'
import { rankingApi } from '@/utils/api'

const userStore = useUserStore()

const stats = ref({
  totalGames: 0,
  avgScore: 0,
  gameTypesPlayed: 0,
  recentGames: []
})
const recentGames = ref([])

const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  
  return date.toLocaleDateString('zh-CN')
}

const loadProfile = async () => {
  try {
    const [statsRes, historyRes] = await Promise.all([
      rankingApi.getStats(),
      rankingApi.getHistory({ limit: 10 })
    ])
    
    stats.value = statsRes.data
    recentGames.value = historyRes.data
  } catch (err) {
    console.error('加载个人数据失败:', err)
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.profile-avatar {
  font-size: 80px;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.profile-role {
  font-size: 16px;
  color: #667eea;
  margin-bottom: 4px;
}

.profile-username {
  font-size: 14px;
  color: #888;
}

.profile-score-card {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
}

.profile-score-card .score-label {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}

.profile-score-card .score-value {
  font-size: 36px;
  font-weight: 700;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 36px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-label {
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

.recent-games {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.game-item .game-icon {
  font-size: 32px;
}

.game-item .game-info {
  flex: 1;
}

.game-item .game-name {
  font-weight: 600;
  color: #333;
}

.game-item .game-level {
  font-size: 13px;
  color: #888;
}

.game-item .game-score .score {
  font-weight: 700;
  color: #48bb78;
  font-size: 18px;
}

.game-item .game-time {
  font-size: 13px;
  color: #888;
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

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preference-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.preference-icon {
  font-size: 32px;
}

.preference-name {
  font-weight: 600;
  color: #333;
}

.preference-stats {
  font-size: 13px;
  color: #888;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .game-item {
    flex-wrap: wrap;
  }
}
</style>
