<template>
  <div class="practice">
    <div v-if="!question" class="card text-center">
      <p>加载中...</p>
    </div>
    <div v-else>
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-3">
            <span class="tag" :style="{ background: getDifficultyBg(question.difficulty), color: getDifficultyColor(question.difficulty) }">
              {{ getDifficultyLabel(question.difficulty) }}
            </span>
            <span class="tag">{{ question.type === 'choice' ? '选择题' : '解答题' }}</span>
          </div>
          <div class="timer">
            用时：{{ formatTime(elapsedTime) }}
          </div>
        </div>

        <h2 class="question-title mb-4">{{ question.title }}</h2>
        <p class="question-content mb-6">{{ question.content }}</p>

        <div v-if="question.type === 'choice'" class="options mb-6">
          <div
            v-for="(opt, idx) in question.options"
            :key="idx"
            :class="['option-item', { selected: selectedAnswer === idx, correct: showResult && idx === question.correct_answer, wrong: showResult && selectedAnswer === idx && idx !== question.correct_answer }]"
            @click="!showResult && selectAnswer(idx)"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
            <span>{{ opt }}</span>
          </div>
        </div>

        <div v-else class="mb-6">
          <textarea
            v-model="textAnswer"
            class="answer-input"
            placeholder="请输入你的答案..."
            rows="4"
            :disabled="showResult"
          ></textarea>
        </div>

        <div v-if="showResult" class="result-box mb-6">
          <div v-if="isCorrect" class="result-correct">
            ✅ 回答正确！
          </div>
          <div v-else class="result-wrong">
            ❌ 回答错误
            <p class="mt-2">正确答案：{{ question.type === 'choice' ? String.fromCharCode(65 + question.correct_answer) : question.correct_answer }}</p>
          </div>
          <div class="explanation mt-3">
            <strong>解析：</strong>{{ question.explanation }}
          </div>
        </div>

        <div class="flex justify-between">
          <button @click="$router.back()" class="btn btn-outline">返回学习中心</button>
          <div class="flex gap-3">
            <button @click="toggleFavorite" :class="['btn', isFavorite ? 'btn-warning' : 'btn-outline']">
              {{ isFavorite ? '已收藏' : '收藏' }}
            </button>
            <button v-if="!showResult" @click="submitAnswer" class="btn btn-primary" :disabled="!hasAnswer">
              提交答案
            </button>
            <button v-else @click="nextQuestion" class="btn btn-primary" :disabled="!nextRec">
              <span v-if="nextRec">
                下一题：{{ { weak: '补弱', reinforce: '巩固', preview: '预习', sprint: '冲刺' }[nextRec.strategy] }}
              </span>
              <span v-else>加载中...</span>
            </button>
          </div>
        </div>
        
        <div v-if="showResult && nextRec" class="next-recommendation card mt-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="tag" :class="'tag-' + nextRec.strategy">
              🎯 下一道推荐：{{ { weak: '补弱', reinforce: '巩固', preview: '预习', sprint: '冲刺' }[nextRec.strategy] }}
            </span>
            <span class="text-sm text-gray">{{ nextRec.resource.estimated_time }}分钟</span>
          </div>
          <h4>{{ nextRec.resource.title }}</h4>
          <p class="next-reason mt-2">{{ nextRec.reason }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from '../stores'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58830'
const route = useRoute()
const router = useRouter()
const store = useStudentStore()

const question = ref(null)
const selectedAnswer = ref(null)
const textAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const isFavorite = ref(false)
const elapsedTime = ref(0)
const startTime = ref(Date.now())
let timer = null

const hasAnswer = computed(() => question.value?.type === 'choice' ? selectedAnswer.value !== null : textAnswer.value.trim())

const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
const getDifficultyBg = (d) => ({ easy: '#dcfce7', medium: '#fef3c7', hard: '#fee2e2' }[d] || '#e5e7eb')
const getDifficultyColor = (d) => ({ easy: '#166534', medium: '#92400e', hard: '#991b1b' }[d] || '#374151')
const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

const selectAnswer = (idx) => {
  selectedAnswer.value = idx
}

const nextRec = ref(null)

const loadQuestion = async () => {
  question.value = null
  selectedAnswer.value = null
  textAnswer.value = ''
  showResult.value = false
  isCorrect.value = false
  nextRec.value = null
  elapsedTime.value = 0
  startTime.value = Date.now()
  
  const res = await axios.get(`${API_BASE}/api/resources/${route.params.id}`)
  question.value = res.data
}

const submitAnswer = async () => {
  showResult.value = true
  const userAnswer = question.value.type === 'choice' ? selectedAnswer.value : textAnswer.value
  isCorrect.value = question.value.type === 'choice' 
    ? selectedAnswer.value === question.value.correct_answer
    : textAnswer.value.trim() === question.value.correct_answer.trim()

  await store.submitFeedback({
    student_id: 1,
    resource_id: question.value.id,
    resource_type: 'question',
    action: 'complete',
    is_correct: isCorrect.value,
    time_spent: elapsedTime.value,
    user_answer: userAnswer
  })
  
  const recRes = await axios.get(`${API_BASE}/api/recommendations/1`)
  nextRec.value = recRes.data[0]
}

const toggleFavorite = async () => {
  isFavorite.value = !isFavorite.value
  await store.submitFeedback({
    student_id: 1,
    resource_id: question.value.id,
    resource_type: 'question',
    action: isFavorite.value ? 'favorite' : 'unfavorite'
  })
}

const nextQuestion = () => {
  if (nextRec.value) {
    router.push('/practice/' + nextRec.value.resource_id)
  } else {
    router.push('/')
  }
}

onMounted(async () => {
  await loadQuestion()
  timer = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
})

watch(() => route.params.id, async () => {
  await loadQuestion()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.timer {
  font-family: monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}

.question-title {
  font-size: 20px;
  font-weight: 600;
}

.question-content {
  font-size: 16px;
  line-height: 1.8;
  padding: 16px;
  background: var(--gray-50);
  border-radius: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.option-item:hover { border-color: var(--primary); }
.option-item.selected { border-color: var(--primary); background: #eef2ff; }
.option-item.correct { border-color: var(--success); background: #f0fdf4; }
.option-item.wrong { border-color: var(--danger); background: #fef2f2; }

.option-letter {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border-radius: 50%;
  font-weight: 600;
}

.answer-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
}
.answer-input:focus {
  outline: none;
  border-color: var(--primary);
}

.result-box {
  padding: 16px;
  border-radius: 8px;
}
.result-correct {
  background: #f0fdf4;
  color: #166534;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
}
.result-wrong {
  background: #fef2f2;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
}
.explanation {
  padding: 12px;
  background: var(--gray-50);
  border-radius: 8px;
  font-size: 14px;
}

.btn-warning {
  background: var(--warning);
  color: white;
}
.btn-outline {
  background: white;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}

.next-recommendation {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid var(--primary);
  margin-top: 24px;
}
.next-recommendation h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.next-reason {
  color: var(--primary);
  font-size: 14px;
  margin: 0;
}
</style>
