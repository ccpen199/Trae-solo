<template>
  <div class="exam-page">
    <el-card v-if="!examStarted && !examFinished">
      <template #header>
        <span>{{ exam?.title }}</span>
      </template>
      <div class="exam-info">
        <div class="info-item">
          <span class="label">考试时长：</span>
          <span class="value">{{ exam?.duration }} 分钟</span>
        </div>
        <div class="info-item">
          <span class="label">及格分数：</span>
          <span class="value">{{ exam?.passing_score }} 分</span>
        </div>
        <div class="info-item">
          <span class="label">题目数量：</span>
          <span class="value">{{ exam?.questions?.length }} 题</span>
        </div>
        <div class="info-item">
          <span class="label">考试次数：</span>
          <span class="value">{{ exam?.my_attempts?.length || 0 }} / {{ exam?.max_attempts }}</span>
        </div>
      </div>
      
      <div v-if="canStart" class="start-area">
        <el-button type="primary" size="large" @click="startExam">开始考试</el-button>
      </div>
      <div v-else class="warning-area">
        <el-alert type="warning" title="已达到最大考试次数，无法继续考试" />
      </div>
    </el-card>

    <el-card v-if="examStarted && !examFinished" class="exam-card">
      <template #header>
        <div class="exam-header">
          <span>{{ exam?.title }}</span>
          <div class="timer">
            <el-icon><Timer /></el-icon>
            剩余时间：{{ formatTime(remainingTime) }}
          </div>
        </div>
      </template>
      
      <div class="exam-content">
        <div class="question-area">
          <div v-for="(q, idx) in exam?.questions" :key="q.id" class="question-item" v-show="currentIndex === idx">
            <div class="question-header">
              <el-tag>{{ getQuestionType(q.type) }}</el-tag>
              <span class="question-score">（{{ q.score }}分）</span>
            </div>
            <div class="question-text">
              {{ idx + 1 }}. {{ q.question }}
            </div>
            <div class="question-options">
              <div v-if="q.type === 'judge'">
                <el-radio-group v-model="answers[idx]">
                  <el-radio :label="'0'">正确</el-radio>
                  <el-radio :label="'1'">错误</el-radio>
                </el-radio-group>
              </div>
              <div v-else-if="q.type === 'multiple'">
                <el-checkbox-group v-model="multipleAnswers[idx]">
                  <el-checkbox v-for="(opt, optIdx) in q.options" :key="optIdx" :label="String(optIdx)">
                    {{ String.fromCharCode(65 + optIdx) }}. {{ opt }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <div v-else>
                <el-radio-group v-model="answers[idx]">
                  <el-radio v-for="(opt, optIdx) in q.options" :key="optIdx" :label="String(optIdx)">
                    {{ String.fromCharCode(65 + optIdx) }}. {{ opt }}
                  </el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
        </div>
        
        <div class="answer-sheet">
          <div class="sheet-title">答题卡</div>
          <div class="sheet-grid">
            <div 
              v-for="(q, idx) in exam?.questions" 
              :key="q.id" 
              class="sheet-item"
              :class="{ answered: isAnswered(idx), current: currentIndex === idx }"
              @click="goQuestion(idx)"
            >
              {{ idx + 1 }}
            </div>
          </div>
          <div class="sheet-footer">
            <div class="sheet-info">
              已答：{{ answeredCount }} / {{ exam?.questions?.length }}
            </div>
            <el-button type="primary" @click="submitExam" :loading="submitting">交卷</el-button>
          </div>
        </div>
      </div>
      
      <div class="exam-nav">
        <el-button @click="prevQuestion" :disabled="currentIndex === 0">上一题</el-button>
        <span>{{ currentIndex + 1 }} / {{ exam?.questions?.length }}</span>
        <el-button @click="nextQuestion" :disabled="currentIndex === exam?.questions?.length - 1">下一题</el-button>
      </div>
    </el-card>

    <el-card v-if="examFinished" class="result-card">
      <template #header>
        <span>考试结果</span>
      </template>
      <div class="result-content">
        <div class="result-score" :class="{ passed: examResult?.is_passed }">
          <div class="score-value">{{ examResult?.score }}</div>
          <div class="score-label">分</div>
        </div>
        <div class="result-info">
          <el-tag :type="examResult?.is_passed ? 'success' : 'danger'" size="large">
            {{ examResult?.is_passed ? '恭喜通过' : '未通过' }}
          </el-tag>
          <p>及格分数：{{ exam?.passing_score }} 分</p>
        </div>
      </div>
      <div class="result-actions">
        <el-button @click="$router.back()">返回</el-button>
        <el-button v-if="canRetake" type="primary" @click="retakeExam">重新考试</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElIcon } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const exam = ref(null)
const examStarted = ref(false)
const examFinished = ref(false)
const examResult = ref(null)
const currentIndex = ref(0)
const answers = ref({})
const multipleAnswers = ref({})
const remainingTime = ref(0)
const submitting = ref(false)
const attemptNumber = ref(1)
let timer = null

const canStart = computed(() => {
  if (!exam.value) return false
  const attempts = exam.value.my_attempts?.length || 0
  return attempts < exam.value.max_attempts
})

const canRetake = computed(() => {
  if (!exam.value || examResult.value?.is_passed) return false
  const attempts = exam.value.my_attempts?.length || 0
  return attempts < exam.value.max_attempts
})

const answeredCount = computed(() => {
  if (!exam.value) return 0
  return exam.value.questions.filter((_, idx) => isAnswered(idx)).length
})

function isAnswered(idx) {
  const q = exam.value?.questions[idx]
  if (!q) return false
  if (q.type === 'multiple') {
    return multipleAnswers.value[idx]?.length > 0
  }
  return answers.value[idx] !== undefined && answers.value[idx] !== ''
}

function getQuestionType(type) {
  const types = { single: '单选题', multiple: '多选题', judge: '判断题' }
  return types[type] || type
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function loadExam() {
  exam.value = await api.get(`/exams/${route.params.id}`)
}

async function startExam() {
  const res = await api.post(`/exams/${route.params.id}/start`)
  attemptNumber.value = res.attempt_number
  examStarted.value = true
  remainingTime.value = exam.value.duration * 60
  answers.value = {}
  multipleAnswers.value = {}
  
  timer = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(timer)
      submitExam(true)
    }
  }, 1000)
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function nextQuestion() {
  if (currentIndex.value < exam.value.questions.length - 1) currentIndex.value++
}

function goQuestion(idx) {
  currentIndex.value = idx
}

async function submitExam(auto = false) {
  if (!auto) {
    try {
      await ElMessageBox.confirm('确定要交卷吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  
  clearInterval(timer)
  submitting.value = true
  
  const finalAnswers = {}
  exam.value.questions.forEach((q, idx) => {
    if (q.type === 'multiple') {
      finalAnswers[idx] = (multipleAnswers.value[idx] || []).sort().join(',')
    } else {
      finalAnswers[idx] = answers.value[idx] || ''
    }
  })
  
  try {
    examResult.value = await api.post(`/exams/${route.params.id}/submit`, {
      answers: Object.values(finalAnswers),
      attempt_number: attemptNumber.value
    })
    examFinished.value = true
    examStarted.value = false
  } catch (error) {
    ElMessage.error(error.error || '交卷失败')
  } finally {
    submitting.value = false
  }
}

function retakeExam() {
  examFinished.value = false
  examResult.value = null
  startExam()
}

onMounted(loadExam)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.exam-page {
  max-width: 1000px;
  margin: 0 auto;
}

.exam-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  color: #909399;
  width: 100px;
}

.value {
  font-weight: 500;
}

.start-area, .warning-area {
  text-align: center;
  padding: 20px 0;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f56c6c;
  font-weight: 500;
}

.exam-content {
  display: flex;
  gap: 24px;
}

.question-area {
  flex: 1;
  min-height: 300px;
}

.question-item {
  padding: 20px 0;
}

.question-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-score {
  color: #909399;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.question-options {
  padding-left: 24px;
}

.question-options :deep(.el-radio),
.question-options :deep(.el-checkbox) {
  display: block;
  margin-bottom: 16px;
}

.answer-sheet {
  width: 200px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.sheet-title {
  font-weight: 500;
  margin-bottom: 16px;
  text-align: center;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.sheet-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.sheet-item.answered {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
}

.sheet-item.current {
  border-color: #f56c6c;
}

.sheet-footer {
  text-align: center;
}

.sheet-info {
  margin-bottom: 12px;
  color: #606266;
}

.exam-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
}

.result-card {
  text-align: center;
}

.result-content {
  padding: 40px 0;
}

.result-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 20px;
}

.score-value {
  font-size: 72px;
  font-weight: bold;
  color: #f56c6c;
}

.result-score.passed .score-value {
  color: #67c23a;
}

.score-label {
  font-size: 24px;
  color: #606266;
  margin-left: 8px;
}

.result-info p {
  margin-top: 12px;
  color: #909399;
}

.result-actions {
  padding-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
