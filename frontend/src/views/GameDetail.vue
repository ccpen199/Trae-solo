<template>
  <div class="game-detail-container">
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">⏳</div>
      <p>加载中...</p>
    </div>
    
    <template v-else>
      <div class="game-header">
        <div class="game-icon">{{ gameType?.icon }}</div>
        <div class="game-info">
          <h1 class="game-title">{{ gameType?.name }}</h1>
          <p class="game-desc">{{ gameType?.description }}</p>
          <div class="game-tags">
            <span class="game-tag">{{ getCategoryName(gameType?.category) }}</span>
            <span class="player-tag">支持 {{ gameType?.min_players }}-{{ gameType?.max_players }} 人</span>
          </div>
        </div>
      </div>
      
      <div class="content-section">
        <h2 class="section-title">📚 关卡列表</h2>
        <div class="levels-grid">
          <div 
            v-for="(level, index) in levels" 
            :key="level.id" 
            class="level-card"
            @click="startLevel(level)"
          >
            <div class="level-number">
              <span class="level-badge">{{ level.level_number }}</span>
            </div>
            <div class="level-info">
              <h3 class="level-name">{{ level.name }}</h3>
              <div class="level-meta">
                <span class="difficulty-badge" :class="level.difficulty">
                  {{ getDifficultyLabel(level.difficulty) }}
                </span>
                <span class="score-badge">+{{ level.score_points }} 积分</span>
              </div>
            </div>
            <div class="level-action">
              <span class="play-text">开始 →</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content-section multi-player-section">
        <h2 class="section-title">👥 多人互动</h2>
        <div class="multi-player-actions">
          <div class="action-card create-room" @click="createRoom">
            <div class="action-icon">➕</div>
            <h3>创建房间</h3>
            <p>邀请好友一起游戏</p>
          </div>
          <div class="action-card quick-match" @click="quickMatch">
            <div class="action-icon">⚡</div>
            <h3>快速匹配</h3>
            <p>随机匹配在线玩家</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gameApi, roomApi } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const gameType = ref(null)
const levels = ref([])

const getCategoryName = (category) => {
  const categories = {
    quiz: '问答类',
    puzzle: '益智类',
    strategy: '策略类',
    interactive: '互动类'
  }
  return categories[category] || category
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

const startLevel = (level) => {
  router.push(`/play/${gameType.value.code}/${level.id}`)
}

const createRoom = async () => {
  try {
    const response = await roomApi.create({
      game_type_id: gameType.value.id,
      max_players: gameType.value.max_players
    })
    router.push(`/room/${response.data.room_code}`)
  } catch (err) {
    console.error('创建房间失败:', err)
  }
}

const quickMatch = () => {
  router.push('/room')
}

const fetchGameDetail = async () => {
  const code = route.params.code
  try {
    const response = await gameApi.getType(code)
    gameType.value = response.data.gameType
    levels.value = response.data.levels
  } catch (err) {
    console.error('获取游戏详情失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchGameDetail()
})
</script>

<style scoped>
.game-detail-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
}

.loading-spinner {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.game-header {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.game-icon {
  font-size: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.game-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.game-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
}

.game-tags {
  display: flex;
  gap: 12px;
}

.game-tag,
.player-tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.game-tag {
  background: #e8f0ff;
  color: #667eea;
}

.player-tag {
  background: #f0fff4;
  color: #48bb78;
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

.levels-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-card:hover {
  background: #e8f0ff;
  transform: translateX(8px);
}

.level-number {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.level-badge {
  color: white;
  font-weight: 700;
  font-size: 18px;
}

.level-info {
  flex: 1;
}

.level-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.level-meta {
  display: flex;
  gap: 12px;
}

.difficulty-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-badge.easy {
  background: #d4edda;
  color: #28a745;
}

.difficulty-badge.medium {
  background: #fff3cd;
  color: #ffc107;
}

.difficulty-badge.hard {
  background: #f8d7da;
  color: #dc3545;
}

.score-badge {
  padding: 4px 12px;
  background: #e8f0ff;
  color: #667eea;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.level-action {
  padding: 12px 20px;
}

.play-text {
  color: #667eea;
  font-weight: 600;
}

.multi-player-section {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
}

.multi-player-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.action-card {
  background: rgba(255,255,255,0.9);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
}

.create-room:hover {
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102,126,234,0.3);
}

.quick-match:hover {
  border-color: #48bb78;
  box-shadow: 0 8px 25px rgba(72,187,120,0.3);
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

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    text-align: center;
  }
  
  .game-tags {
    justify-content: center;
  }
  
  .multi-player-actions {
    grid-template-columns: 1fr;
  }
}
</style>
