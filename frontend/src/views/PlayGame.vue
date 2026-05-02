<template>
  <div class="play-game-container">
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">🎮</div>
      <p>准备游戏中...</p>
    </div>
    
    <template v-else-if="gameFinished">
      <div class="result-section">
        <div class="result-card">
          <div class="result-icon">{{ correctCount >= totalCount * 0.6 ? '🎉' : '💪' }}</div>
          <h2 class="result-title">
            {{ correctCount >= totalCount * 0.6 ? '太棒了！' : '继续加油！' }}
          </h2>
          <div class="score-display">
            <div class="score-item">
              <span class="score-label">正确题数</span>
              <span class="score-value">{{ correctCount }}/{{ totalCount }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">正确率</span>
              <span class="score-value">{{ correctPercent }}%</span>
            </div>
            <div class="score-item final-score">
              <span class="score-label">获得积分</span>
              <span class="score-value">+{{ finalScore }}</span>
            </div>
          </div>
          <div class="result-actions">
            <button class="action-btn" @click="playAgain">再玩一次</button>
            <button class="action-btn secondary" @click="goBack">返回游戏</button>
          </div>
        </div>
      </div>
    </template>
    
    <template v-else>
      <div class="game-header">
        <div class="game-progress">
          <div class="progress-info">
            <span class="current-question">第 {{ currentIndex + 1 }} 题</span>
            <span class="total-questions">共 {{ questions.length }} 题</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: ((currentIndex + 1) / questions.length) * 100 + '%' }"
            ></div>
          </div>
        </div>
        <div class="timer-display" v-if="timeLeft > 0">
          <span class="timer-icon">⏱️</span>
          <span class="timer-value" :class="{ urgent: timeLeft <= 10 }">{{ timeLeft }}s</span>
        </div>
      </div>
      
      <div class="question-card">
        <h3 class="question-text">{{ currentQuestion?.question }}</h3>
        <div class="options-list">
          <button
            v-for="(option, index) in currentQuestion?.options"
            :key="index"
            class="option-btn"
            :class="{ 
              selected: selectedIndex === index,
              correct: showResult && index === currentQuestion?.answer,
              wrong: showResult && selectedIndex === index && index !== currentQuestion?.answer
            }"
            :disabled="showResult"
            @click="selectOption(index)"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
            <span class="option-text">{{ option }}</span>
            <span v-if="showResult && index === currentQuestion?.answer" class="result-icon">✓</span>
            <span v-if="showResult && selectedIndex === index && index !== currentQuestion?.answer" class="result-icon wrong">✗</span>
          </button>
        </div>
      </div>
      
      <div class="game-actions">
        <button 
          v-if="!showResult"
          class="action-btn"
          :disabled="selectedIndex === null"
          @click="submitAnswer"
        >
          确认答案
        </button>
        <button 
          v-else-if="currentIndex < questions.length - 1"
          class="action-btn"
          @click="nextQuestion"
        >
          下一题 →
        </button>
        <button 
          v-else
          class="action-btn"
          @click="finishGame"
        >
          完成游戏
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gameApi } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const questions = ref([])
const currentIndex = ref(0)
const selectedIndex = ref(null)
const showResult = ref(false)
const correctCount = ref(0)
const gameFinished = ref(false)
const finalScore = ref(0)
const timeLeft = ref(0)
let timerInterval = null

const currentQuestion = computed(() => questions.value[currentIndex.value])

const totalCount = computed(() => questions.value.length)
const correctPercent = computed(() => Math.round(correctCount.value / totalCount.value * 100))

const selectOption = (index) => {
  if (showResult.value) return
  selectedIndex.value = index
}

const submitAnswer = () => {
  if (selectedIndex.value === null) return
  showResult.value = true
  
  if (selectedIndex.value === currentQuestion.value.answer) {
    correctCount.value++
  }
}

const nextQuestion = () => {
  currentIndex.value++
  selectedIndex.value = null
  showResult.value = false
}

const finishGame = async () => {
  try {
    const answers = questions.value.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i === currentIndex.value ? selectedIndex.value : -1
    }))
    
    const response = await gameApi.checkQuizAnswers({
      answers,
      game_type_id: 1,
      level_id: route.params.levelId ? parseInt(route.params.levelId) : 1
    })
    
    finalScore.value = response.data.score
  } catch (err) {
    finalScore.value = Math.floor(correctCount.value / questions.value.length * 100)
  }
  
  gameFinished.value = true
}

const playAgain = () => {
  currentIndex.value = 0
  selectedIndex.value = null
  showResult.value = false
  correctCount.value = 0
  gameFinished.value = false
  finalScore.value = 0
  loading.value = true
  
  loadQuestions()
}

const goBack = () => {
  router.push(`/games/${route.params.gameCode}`)
}

const loadQuestions = async () => {
  try {
    const response = await gameApi.getQuizQuestions({
      difficulty: 'easy',
      count: 5
    })
    questions.value = response.data
  } catch (err) {
    console.error('加载题目失败:', err)
    questions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQuestions()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.play-game-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 600px;
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
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.result-section {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.result-card {
  background: rgba(255,255,255,0.95);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  max-width: 500px;
  width: 100%;
}

.result-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.result-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 32px;
}

.score-display {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.score-item {
  flex: 1;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 16px;
}

.score-item.final-score {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.score-item.final-score .score-label,
.score-item.final-score .score-value {
  color: white;
}

.score-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.score-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.game-progress {
  flex: 1;
  margin-right: 32px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.current-question {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.total-questions {
  font-size: 14px;
  color: #888;
}

.progress-bar {
  height: 8px;
  background: #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #fff0f5;
  border-radius: 25px;
}

.timer-icon {
  font-size: 20px;
}

.timer-value {
  font-size: 20px;
  font-weight: 700;
  color: #f06595;
}

.timer-value.urgent {
  color: #dc3545;
  animation: pulse 0.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.question-card {
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.question-text {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 32px;
  text-align: center;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-btn:hover:not(:disabled) {
  background: #e8f0ff;
  border-color: #667eea;
}

.option-btn.selected {
  background: #e8f0ff;
  border-color: #667eea;
}

.option-btn.correct {
  background: #d4edda;
  border-color: #28a745;
}

.option-btn.wrong {
  background: #f8d7da;
  border-color: #dc3545;
}

.option-letter {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-weight: 700;
  color: #667eea;
}

.option-btn.correct .option-letter {
  background: #28a745;
  color: white;
}

.option-btn.wrong .option-letter {
  background: #dc3545;
  color: white;
}

.option-text {
  flex: 1;
  text-align: left;
  font-size: 16px;
  color: #333;
}

.result-icon {
  font-size: 24px;
  color: #28a745;
  font-weight: 700;
}

.result-icon.wrong {
  color: #dc3545;
}

.game-actions {
  display: flex;
  justify-content: center;
}

.action-btn {
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

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102,126,234,0.4);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #666;
}

.action-btn.secondary:hover {
  background: #e5e5e5;
  box-shadow: none;
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .game-progress {
    margin-right: 0;
    width: 100%;
  }
  
  .score-display {
    flex-direction: column;
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>
