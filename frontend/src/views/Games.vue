<template>
  <div class="games-container">
    <div class="page-header">
      <h1 class="page-title">🎮 游戏中心</h1>
      <p class="page-subtitle">选择你喜欢的游戏，开始学习之旅</p>
    </div>
    
    <div class="category-filters">
      <button 
        v-for="cat in categories" 
        :key="cat.value"
        class="filter-btn"
        :class="{ active: currentCategory === cat.value }"
        @click="filterByCategory(cat.value)"
      >
        {{ cat.label }}
      </button>
    </div>
    
    <div class="games-grid">
      <div 
        v-for="game in filteredGames" 
        :key="game.id" 
        class="game-card"
        @click="goToGame(game)"
      >
        <div class="game-icon">{{ game.icon }}</div>
        <div class="game-content">
          <h3 class="game-name">{{ game.name }}</h3>
          <p class="game-desc">{{ game.description }}</p>
          <div class="game-meta">
            <span class="game-tag">{{ getCategoryName(game.category) }}</span>
            <span class="level-count">{{ game.levelCount }} 个关卡</span>
            <span class="player-info">支持 {{ game.min_players }}-{{ game.max_players }} 人</span>
          </div>
        </div>
        <div class="game-action">
          <button class="play-btn">开始游戏 →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameApi } from '@/utils/api'

const router = useRouter()

const categories = [
  { value: 'all', label: '全部' },
  { value: 'quiz', label: '🎯 问答类' },
  { value: 'puzzle', label: '🧩 益智类' },
  { value: 'strategy', label: '♟️ 策略类' },
  { value: 'interactive', label: '👥 互动类' }
]

const currentCategory = ref('all')
const games = ref([])

const filteredGames = computed(() => {
  if (currentCategory.value === 'all') {
    return games.value
  }
  return games.value.filter(g => g.category === currentCategory.value)
})

const getCategoryName = (category) => {
  const cat = categories.find(c => c.value === category)
  return cat ? cat.label.replace(/^[^\s]+\s*/, '') : category
}

const filterByCategory = (cat) => {
  currentCategory.value = cat
}

const goToGame = (game) => {
  router.push(`/games/${game.code}`)
}

const fetchGames = async () => {
  try {
    const response = await gameApi.getTypes()
    games.value = response.data
  } catch (err) {
    console.error('获取游戏列表失败:', err)
  }
}

onMounted(() => {
  fetchGames()
})
</script>

<style scoped>
.games-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  text-align: center;
  padding: 20px;
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

.category-filters {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 12px 24px;
  background: rgba(255,255,255,0.9);
  border: 2px solid #e5e5e5;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.game-card {
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102,126,234,0.2);
}

.game-icon {
  font-size: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}

.game-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.game-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.game-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.game-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.game-tag,
.level-count,
.player-info {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

.game-tag {
  background: #e8f0ff;
  color: #667eea;
}

.level-count {
  background: #fff0f5;
  color: #f06595;
}

.player-info {
  background: #f0fff4;
  color: #48bb78;
}

.game-action {
  display: flex;
  align-items: center;
}

.play-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102,126,234,0.4);
}

@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
  
  .game-card {
    flex-direction: column;
    text-align: center;
  }
  
  .game-meta {
    justify-content: center;
  }
  
  .game-action {
    justify-content: center;
  }
}
</style>
