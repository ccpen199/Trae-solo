<template>
  <div class="interview-room" v-loading="loading">
    <div v-if="session" class="interview-container">
      <el-card class="header-card">
        <div class="interview-header">
          <div>
            <h2>
              <el-icon><VideoCamera /></el-icon>
              AI模拟面试间
            </h2>
            <p class="job-title">目标岗位：{{ session.job_title }}</p>
          </div>
          <div class="progress-info">
            <el-tag type="primary" size="large">
              第 {{ currentQuestionIndex + 1 }} / {{ session.questions?.length || 0 }} 题
            </el-tag>
          </div>
        </div>
        <el-progress
          :percentage="Math.round((currentQuestionIndex + 1) / (session.questions?.length || 1) * 100)"
          :color="'#667eea'"
        />
      </el-card>

      <div v-if="!showResult" class="question-area">
        <el-card class="question-card">
          <template #header>
            <div class="question-header">
              <el-tag :type="getQuestionTypeTag(currentQuestion?.type)">
                {{ getQuestionTypeText(currentQuestion?.type) }}
              </el-tag>
              <el-tag size="small" type="warning">
                难度：{{ getDifficultyText(currentQuestion?.difficulty) }}
              </el-tag>
              <span class="skill-tag">
                <el-icon><Collection /></el-icon>
                {{ currentQuestion?.related_skill }}
              </span>
            </div>
          </template>
          <h3 class="question-text">{{ currentQuestion?.question }}</h3>
          <div class="answer-area">
            <el-input
              v-model="currentAnswer"
              type="textarea"
              :rows="8"
              placeholder="请输入你的回答... 建议使用STAR法则，包含具体案例和数据"
            />
            <div class="answer-actions">
              <span class="char-count">字数：{{ currentAnswer.length }}</span>
              <div>
                <el-button v-if="currentQuestionIndex > 0" @click="prevQuestion">
                  上一题
                </el-button>
                <el-button
                  v-if="currentQuestionIndex < (session.questions?.length || 0) - 1"
                  type="primary"
                  @click="nextQuestion"
                  :disabled="!currentAnswer.trim()"
                >
                  下一题
                </el-button>
                <el-button
                  v-else
                  type="success"
                  @click="submitInterview"
                  :disabled="!currentAnswer.trim()"
                  :loading="submitting"
                >
                  提交面试
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div v-else class="result-area">
        <el-card class="result-card">
          <template #header>
            <h2>
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              面试评估报告
            </h2>
          </template>

          <div class="score-overview">
            <div class="score-ring">
              <v-chart class="score-chart" :option="scoreChartOption" autoresize />
            </div>
            <div class="score-info">
              <h3>综合逻辑评分</h3>
              <div class="score-value">{{ evaluation?.logic_score || 0 }}</div>
              <p class="assessment">{{ evaluation?.overall_assessment }}</p>
            </div>
          </div>

          <el-row :gutter="20" class="section">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h4>
                    <el-icon color="#67c23a"><CircleCheck /></el-icon>
                    优势
                  </h4>
                </template>
                <ul class="evaluation-list">
                  <li v-for="(item, idx) in evaluation?.strengths" :key="idx">
                    <el-icon color="#67c23a"><CircleCheck /></el-icon>
                    {{ item }}
                  </li>
                </ul>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h4>
                    <el-icon color="#e6a23c"><Warning /></el-icon>
                    待改进
                  </h4>
                </template>
                <ul class="evaluation-list">
                  <li v-for="(item, idx) in evaluation?.weaknesses" :key="idx">
                    <el-icon color="#e6a23c"><Warning /></el-icon>
                    {{ item }}
                  </li>
                </ul>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="section">
            <template #header>
              <h4>
                <el-icon><Guide /></el-icon>
                改进建议
              </h4>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(item, idx) in evaluation?.suggestions"
                :key="idx"
                placement="top"
              >
                {{ item }}
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <el-card v-if="evaluation?.type_scores" class="section">
            <template #header>
              <h4>
                <el-icon><TrendCharts /></el-icon>
                各维度得分
              </h4>
            </template>
            <v-chart class="bar-chart" :option="typeScoresOption" autoresize />
          </el-card>

          <div class="result-actions">
            <el-button @click="$router.push('/interview')">返回列表</el-button>
            <el-button type="primary" @click="$router.push('/resume')">
              优化简历
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { submitAnswer, evaluateInterview } from '../../api'

const route = useRoute()
const loading = ref(false)
const submitting = ref(false)
const session = ref(null)
const currentQuestionIndex = ref(0)
const answers = ref({})
const currentAnswer = ref('')
const showResult = ref(false)
const evaluation = ref(null)

const currentQuestion = computed(() => {
  return session.value?.questions?.[currentQuestionIndex.value]
})

const scoreChartOption = computed(() => {
  const score = evaluation.value?.logic_score || 0
  return {
    series: [{
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      pointer: { show: false },
      progress: { show: true, overlap: false, roundCap: true, clip: false,
        itemStyle: { color: score >= 80 ? '#67c23a' : score >= 60 ? '#e6a23c' : '#f56c6c' }
      },
      axisLine: { lineStyle: { width: 18 } },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      data: [{ value: score, detail: { show: false } }],
      detail: { show: false }
    }]
  }
})

const typeScoresOption = computed(() => {
  const scores = evaluation.value?.type_scores || {}
  const typeMap = {
    technical: '技术能力',
    behavioral: '行为表现',
    situational: '应变能力',
    domain: '领域知识'
  }
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: Object.keys(scores).map(k => typeMap[k] || k) },
    series: [{
      type: 'bar',
      data: Object.values(scores),
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      }
    }]
  }
})

const getQuestionTypeTag = (type) => {
  const map = { technical: 'primary', behavioral: 'success', situational: 'warning', domain: 'info' }
  return map[type] || 'info'
}

const getQuestionTypeText = (type) => {
  const map = { technical: '技术题', behavioral: '行为题', situational: '情景题', domain: '领域题' }
  return map[type] || type
}

const getDifficultyText = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[diff] || diff
}

const saveCurrentAnswer = () => {
  if (currentQuestion.value && currentAnswer.value.trim()) {
    answers.value[currentQuestion.value.id] = currentAnswer.value
  }
}

const loadCurrentAnswer = () => {
  if (currentQuestion.value) {
    currentAnswer.value = answers.value[currentQuestion.value.id] || ''
  }
}

const nextQuestion = async () => {
  if (!currentAnswer.value.trim()) return
  saveCurrentAnswer()
  try {
    await submitAnswer(session.value.id, {
      question_id: currentQuestion.value.id,
      answer: currentAnswer.value
    })
    currentQuestionIndex.value++
    loadCurrentAnswer()
  } catch (e) {
    ElMessage.error('保存答案失败')
  }
}

const prevQuestion = () => {
  saveCurrentAnswer()
  currentQuestionIndex.value--
  loadCurrentAnswer()
}

const submitInterview = async () => {
  saveCurrentAnswer()
  submitting.value = true
  try {
    await submitAnswer(session.value.id, {
      question_id: currentQuestion.value.id,
      answer: currentAnswer.value
    })
    evaluation.value = await evaluateInterview(session.value.id)
    showResult.value = true
    ElMessage.success('面试完成！')
  } catch (e) {
    ElMessage.error('提交失败，请重试')
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const sessionData = localStorage.getItem('interview_session_' + route.params.id)
  if (sessionData) {
    session.value = JSON.parse(sessionData)
    if (session.value.status === 'completed') {
      showResult.value = true
      evaluation.value = session.value.evaluation
    }
  }
})
</script>

<style scoped>
.interview-container {
  max-width: 900px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 20px;
}

.interview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.interview-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.job-title {
  color: #667eea;
  font-weight: 500;
  margin: 8px 0 0 0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.skill-tag {
  color: #909399;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.question-text {
  font-size: 18px;
  line-height: 1.8;
  color: #1a1a2e;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.answer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.char-count {
  color: #909399;
  font-size: 13px;
}

.result-card h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-overview {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 20px;
}

.score-chart {
  width: 150px;
  height: 150px;
}

.score-info h3 {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 10px 0;
  font-size: 18px;
}

.score-value {
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  margin: 0 0 10px 0;
}

.assessment {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.evaluation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.evaluation-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  color: #606266;
}

.bar-chart {
  height: 200px;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.result-actions .el-button {
  padding: 12px 32px;
  font-size: 16px;
}
</style>
