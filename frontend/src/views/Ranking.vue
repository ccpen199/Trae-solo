<template>
  <div class="ranking-container">
    <div class="page-header">
      <h1 class="page-title">🏆 排行榜</h1>
      <p class="page-subtitle">看看谁是真正的学习达人！</p>
    </div>
    
    <div class="filter-section">
      <div class="filter-group">
        <label class="filter-label">游戏类型</label>
        <select v-model="selectedGameType" class="filter-select" @change="loadRankings">
          <option value="">全部游戏</option>
          <option v-for="game in gameTypes" :key="game.id" :value="game.id">
            {{ game.icon }} {{ game.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="top-three-section" v-if="topThree.length > 0">
      <div class="podium">
        <div class="podium-item second" @click="showPlayerDetail(topThree[1])">
          <div class="player-avatar">{{ topThree[1]?.avatar }}</div>
          <div class="player-info">
            <div class="player-name">{{ topThree[1]?.nickname }}</div>
            <div class="player-score">{{ topThree[1]?.total_score }} 积分</div>
          </div>
          <div class="podium-badge">🥈</div>
        </div>
        
        <div class="podium-item first" @click="showPlayerDetail(topThree[0])">
          <div class="crown">👑</div>
          <div class="player-avatar">{{ topThree[0]?.avatar }}</div>
          <div class="player-info">
            <div class="player-name">{{ topThree[0]?.nickname }}</div>
            <div class="player-score">{{ topThree[0]?.total_score }} 积分</div>
          </div>
          <div class="podium-badge">🥇</div>
        </div>
        
        <div class="podium-item third" @click="showPlayerDetail(topThree[2])">
          <div class="player-avatar">{{ topThree[2]?.avatar }}</div>
          <div class="player-info">
            <div class="player-name">{{ topThree[2]?.nickname }}</div>
            <div class="player-score">{{ topThree[2]?.total_score }} 积分</div>
          </div>
          <div class="podium-badge">🥉</div>
        </div>
      </div>
    </div>
    
    <div class="ranking-list-section">
      <h2 class="section-title">完整排行</h2>
      <div class="ranking-list">
        <div 
          v-for="(player, index) in otherPlayers" 
          :key="player.id"
          class="ranking-item"
          @click="showPlayerDetail(player)"
        >
          <div class="rank-number">{{ index + 4 }}</div>
          <div class="player-avatar">{{ player.avatar }}</div>
          <div class="player-info">
            <div class="player-name">{{ player.nickname }}</div>
            <div class="player-stats">
              <span class="game-count">{{ player.game_count || 0 }} 场游戏</span>
            </div>
          </div>
          <div class="player-score">{{ player.total_score }} 积分</div>
        </div>
        
        <div v-if="otherPlayers.length === 0 && rankings.length <= 3" class="empty-state">
          <div class="empty-icon">🎮</div>
          <p>还没有更多玩家，快来挑战吧！</p>
        </div>
      </div>
    </div>
    
    <div class="my-rank-section" v-if="myRank">
      <h2 class="section-title">我的排名</h2>
      <div class="my-rank-card">
        <div class="my-rank-info">
          <div class="my-rank-number" :class="{ 'in-top-ten': myRank.rank <= 10 }">
            #{{ myRank.rank }}
          </div>
          <div class="my-rank-details">
            <div class="my-rank-score">
              <span class="score-label">总积分</span>
              <span class="score-value">{{ myRank.totalScore }}</span>
            </div>
          </div>
        </div>
        <div class="my-rank-actions">
          <button class="action-btn" @click="goToGames">去玩游戏 →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { rankingApi, gameApi } from '@/utils/api'

const router = useRouter()

const selectedGameType = ref('')
const gameTypes = ref([])
const rankings = ref([])
const myRank = ref(null)

const topThree = computed(() => rankings.value.slice(0, 3))
const otherPlayers = computed(() => rankings.value.slice(3))

const loadRankings = async () => {
  try {
    const params = { limit: 50 }
    if (selectedGameType.value) {
      params.game_type_id = selectedGameType.value
    }
    
    const [rankingRes, myRankRes] = await Promise.all([
      rankingApi.getGlobal(params),
      rankingApi.getMyRank(selectedGameType.value ? { game_type_id: selectedGameType.value } : {})
    ])
    
    rankings.value = rankingRes.data
    myRank.value = myRankRes.data
  } catch (err) {
    console.error('加载排行榜失败:', err)
  }
}

const loadGameTypes = async () => {
  try {
    const response = await gameApi.getTypes()
    gameTypes.value = response.data
  } catch (err) {
    console.error('加载游戏类型失败:', err)
  }
}

const showPlayerDetail = (player) => {
  if (player) {
    console.log('查看玩家详情:', player)
  }
}

const goToGames = () => {
  router.push('/games')
}

onMounted(() => {
  loadGameTypes()
  loadRankings()
})
</script>

<style scoped>
.ranking-container {
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

.filter-section {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.filter-select {
  padding: 12px 20px;
  background: #f8f9fa;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.top-three-section {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.podium {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 24px;
  margin-top: 20px;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: rgba(255,255,255,0.9);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.3s ease;
  position: relative;
}

.podium-item:hover {
  transform: translateY(-8px);
}

.podium-item.first {
  order: 2;
  padding: 32px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.podium-item.second {
  order: 1;
  padding: 24px;
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.podium-item.third {
  order: 3;
  padding: 24px;
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
}

.crown {
  position: absolute;
  top: -20px;
  font-size: 32px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.podium-item .player-avatar {
  font-size: 48px;
}

.podium-item.first .player-avatar {
  font-size: 64px;
}

.podium-item .player-name {
  font-weight: 700;
  color: #333;
  font-size: 16px;
}

.podium-item .player-score {
  font-size: 14px;
  color: #666;
}

.podium-badge {
  font-size: 28px;
}

.ranking-list-section {
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

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: #e8f0ff;
  transform: translateX(8px);
}

.rank-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e5e5;
  border-radius: 50%;
  font-weight: 700;
  color: #666;
}

.ranking-item .player-avatar {
  font-size: 36px;
}

.ranking-item .player-info {
  flex: 1;
}

.ranking-item .player-name {
  font-weight: 600;
  color: #333;
}

.ranking-item .player-stats {
  font-size: 13px;
  color: #888;
}

.ranking-item .player-score {
  font-weight: 700;
  color: #667eea;
  font-size: 18px;
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

.my-rank-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.my-rank-section .section-title {
  color: white;
}

.my-rank-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
}

.my-rank-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.my-rank-number {
  font-size: 48px;
  font-weight: 700;
  color: #666;
}

.my-rank-number.in-top-ten {
  color: #667eea;
}

.my-rank-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.my-rank-score {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-label {
  font-size: 12px;
  color: #888;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.action-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102,126,234,0.4);
}

@media (max-width: 768px) {
  .podium {
    flex-direction: column;
    align-items: center;
  }
  
  .podium-item.first {
    order: 1;
  }
  
  .podium-item.second {
    order: 2;
  }
  
  .podium-item.third {
    order: 3;
  }
  
  .my-rank-card {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .my-rank-info {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
