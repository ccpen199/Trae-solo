<template>
  <div class="home-container">
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">
          欢迎回来，{{ userStore.user?.nickname || userStore.user?.username }}！
        </h1>
        <p class="welcome-subtitle">让学习变得更有趣，和同学们一起挑战吧！</p>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalGames || 0 }}</div>
          <div class="stat-label">完成游戏</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <div class="stat-value">{{ userStore.user?.total_score || 0 }}</div>
          <div class="stat-label">总积分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgScore || 0 }}</div>
          <div class="stat-label">平均得分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎮</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.gameTypesPlayed || 0 }}</div>
          <div class="stat-label">游戏类型</div>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">🎯 热门游戏</h2>
        <router-link to="/games" class="view-all">查看全部 →</router-link>
      </div>
      <div class="games-grid">
        <div 
          v-for="game in popularGames" 
          :key="game.id" 
          class="game-card"
          @click="goToGame(game)"
        >
          <div class="game-icon">{{ game.icon }}</div>
          <div class="game-info">
            <h3 class="game-name">{{ game.name }}</h3>
            <p class="game-desc">{{ game.description }}</p>
            <div class="game-meta">
              <span class="game-tag">{{ getCategoryName(game.category) }}</span>
              <span class="player-count">{{ game.min_players }}-{{ game.max_players }}人</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">🏅 排行榜</h2>
        <router-link to="/ranking" class="view-all">查看全部 →</router-link>
      </div>
      <div class="ranking-preview">
        <div class="ranking-list">
          <div 
            v-for="(player, index) in topPlayers" 
            :key="player.id"
            class="ranking-item"
            :class="`rank-${index + 1}`"
          >
            <div class="rank-badge">{{ getRankBadge(index + 1) }}</div>
            <div class="player-avatar">{{ player.avatar }}</div>
            <div class="player-info">
              <div class="player-name">{{ player.nickname }}</div>
              <div class="player-games">{{ player.game_count || 0 }} 场游戏</div>
            </div>
            <div class="player-score">{{ player.total_score }} 积分</div>
          </div>
        </div>
        <div class="my-rank" v-if="myRank">
          <div class="my-rank-label">我的排名</div>
          <div class="my-rank-value">
            <span class="rank-number">#{{ myRank.rank }}</span>
            <span class="rank-score">{{ myRank.totalScore }} 积分</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="content-section" v-if="!userStore.isTeacher">
      <div class="section-header">
        <h2 class="section-title">👥 互动房间</h2>
        <router-link to="/room" class="view-all">进入大厅 →</router-link>
      </div>
      <div class="room-actions">
        <div class="action-card create-room" @click="createRoom">
          <div class="action-icon">➕</div>
          <h3>创建房间</h3>
          <p>邀请好友一起游戏</p>
        </div>
        <div class="action-card join-room" @click="showJoinModal = true">
          <div class="action-icon">🚪</div>
          <h3>加入房间</h3>
          <p>输入房间码加入</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { gameApi, rankingApi } from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  totalGames: 0,
  avgScore: 0,
  gameTypesPlayed: 0
})
const popularGames = ref([])
const topPlayers = ref([])
const myRank = ref(null)
const showJoinModal = ref(false)

const getCategoryName = (category) => {
  const categories = {
    quiz: '问答类',
    puzzle: '益智类',
    strategy: '策略类',
    interactive: '互动类'
  }
  return categories[category] || category
}

const getRankBadge = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank
}

const goToGame = (game) => {
  router.push(`/games/${game.code}`)
}

const createRoom = () => {
  router.push('/room')
}

const fetchData = async () => {
  try {
    const [gamesRes, rankingRes, statsRes] = await Promise.all([
      gameApi.getTypes(),
      rankingApi.getGlobal({ limit: 5 }),
      rankingApi.getStats()
    ])
    
    popularGames.value = gamesRes.data.slice(0, 4)
    topPlayers.value = rankingRes.data
    stats.value = statsRes.data
    
    try {
      const myRankRes = await rankingApi.getMyRank()
      myRank.value = myRankRes.data
    } catch (e) {
      console.log('获取我的排名失败')
    }
  } catch (err) {
    console.error('获取首页数据失败:', err)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-section {
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 16px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 40px;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.view-all {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.game-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-card:hover {
  background: #e8f0ff;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(102,126,234,0.2);
}

.game-icon {
  font-size: 48px;
  text-align: center;
}

.game-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.game-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.game-meta {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.game-tag {
  background: #e8f0ff;
  color: #667eea;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.player-count {
  background: #f0f0f0;
  color: #666;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.ranking-preview {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: background 0.3s ease;
}

.ranking-item:hover {
  background: #e8f0ff;
}

.rank-badge {
  font-size: 24px;
  width: 36px;
  text-align: center;
}

.player-avatar {
  font-size: 36px;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: #333;
}

.player-games {
  font-size: 13px;
  color: #888;
}

.player-score {
  font-weight: 700;
  color: #667eea;
  font-size: 16px;
}

.my-rank {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}

.my-rank-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.rank-number {
  font-size: 48px;
  font-weight: 700;
}

.rank-score {
  font-size: 14px;
  opacity: 0.9;
}

.room-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.action-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
}

.create-room:hover {
  background: #e8f0ff;
  box-shadow: 0 8px 25px rgba(102,126,234,0.2);
}

.join-room:hover {
  background: #f0fff4;
  box-shadow: 0 8px 25px rgba(72,187,120,0.2);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.action-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.action-card p {
  font-size: 14px;
  color: #888;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .games-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .games-grid {
    grid-template-columns: 1fr;
  }
  .ranking-preview {
    grid-template-columns: 1fr;
  }
  .room-actions {
    grid-template-columns: 1fr;
  }
}
</style>
