<template>
  <div class="page-container">
    <div class="card test-card" v-if="!completed">
      <h1 class="title">灵魂测试</h1>
      <p class="subtitle">找到属于你的星球</p>

      <div v-if="loading" class="loading">
        <div class="loading-spinner">⟳</div>
        <p>加载中...</p>
      </div>

      <div v-else-if="test">
        <div class="progress">
          <div class="progress-bar" :style="{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }"></div>
        </div>

        <div class="question-number">第 {{ currentQuestion + 1 }} / {{ test.questions.length }} 题</div>

        <div class="question">
          <h2>{{ test.questions[currentQuestion].question }}</h2>
          
          <div class="options">
            <div
              v-for="(option, index) in test.questions[currentQuestion].options"
              :key="index"
              class="option"
              :class="{ selected: answers[currentQuestion]?.optionIndex === index }"
              @click="selectOption(index)"
            >
              <span class="option-label">{{ String.fromCharCode(65 + index) }}</span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <el-button v-if="currentQuestion > 0" @click="prevQuestion">上一题</el-button>
          <el-button
            type="primary"
            :disabled="answers[currentQuestion] === undefined"
            :loading="submitting"
            @click="nextQuestion"
          >
            {{ currentQuestion === test.questions.length - 1 ? '提交' : '下一题' }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="card result-card" v-else>
      <div class="planet-icon" :style="{ background: resultPlanet?.color }">
        ✦
      </div>
      <h1 class="result-title">{{ resultPlanet?.name }}</h1>
      <p class="result-desc">{{ resultPlanet?.description }}</p>
      <button type="button" class="enter-btn" @click="enterPlanet">
        进入星球
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const completed = ref(false)
const test = ref(null)
const currentQuestion = ref(0)
const answers = ref([])
const resultPlanet = ref(null)

const fetchTest = async () => {
  try {
    loading.value = true
    const res = await request.get('/tests')
    test.value = res.data[0]
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const selectOption = (index) => {
  answers.value[currentQuestion.value] = {
    questionIndex: currentQuestion.value,
    optionIndex: index
  }
}

const prevQuestion = () => {
  if (currentQuestion.value > 0) {
    currentQuestion.value--
  }
}

const nextQuestion = async () => {
  if (currentQuestion.value < test.value.questions.length - 1) {
    currentQuestion.value++
  } else {
    await submitTest()
  }
}

const submitTest = async () => {
  try {
    submitting.value = true
    const res = await request.post('/tests/submit', {
      testId: test.value.id,
      answers: answers.value
    })
    resultPlanet.value = res.data.planet
    completed.value = true
    await userStore.fetchUser()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const enterPlanet = () => {
  router.push('/')
}

onMounted(() => {
  fetchTest()
})
</script>

<style scoped>
.test-card {
  max-width: 550px;
}

.progress {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-bottom: 15px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s;
}

.question-number {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
}

.question h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 25px;
  text-align: center;
  line-height: 1.6;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.option:hover {
  border-color: #667eea;
  background: #f5f3ff;
}

.option.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.option-label {
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #666;
}

.option.selected .option-label {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.option-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 15px;
}

.actions .el-button {
  flex: 1;
}

.result-card {
  text-align: center;
  max-width: 450px;
}

.planet-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.result-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}

.result-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.enter-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  padding: 15px;
  font-size: 18px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  font-size: 40px;
  animation: spin 1s linear infinite;
  display: inline-block;
  color: #667eea;
  margin-bottom: 15px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.planet-icon {
  font-size: 60px;
  line-height: 1;
}
</style>
