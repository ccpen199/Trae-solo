<template>
  <div class="page-container test-detail-page">
    <el-card v-loading="loading" shadow="never" class="paper-card" v-if="!isSubmitted">
      <div class="paper-header">
        <h2 class="paper-title">{{ testPaper?.title }}</h2>
        <div class="paper-meta">
          <el-tag type="primary" effect="plain">
            <el-icon><Timer /></el-icon>
            {{ testPaper?.duration }} 分钟
          </el-tag>
          <el-tag type="success" effect="plain">
            <el-icon><Tickets /></el-icon>
            总分 {{ testPaper?.totalScore }} 分
          </el-tag>
          <el-tag type="warning" effect="plain" v-if="testPaper?.passScore">
            <el-icon><CircleCheck /></el-icon>
            及格 {{ testPaper?.passScore }} 分
          </el-tag>
        </div>
        <p class="paper-desc" v-if="testPaper?.description">{{ testPaper.description }}</p>
      </div>

      <el-divider />

      <div class="questions-section">
        <div
          class="question-item"
          v-for="(question, index) in testPaper?.questions || []"
          :key="question.id"
        >
          <div class="question-header">
            <span class="question-num">第 {{ index + 1 }} 题</span>
            <el-tag size="small" :type="getQuestionTypeTag(question.type)">
              {{ getQuestionTypeLabel(question.type) }}
            </el-tag>
            <span class="question-score">{{ question.score }} 分</span>
          </div>
          <div class="question-content">{{ question.content }}</div>

          <div class="question-options" v-if="question.type !== 'fill_blank'">
            <template v-if="question.type === 'judgment'">
              <el-radio-group v-model="userAnswers[question.id]">
                <el-radio label="true">正确</el-radio>
                <el-radio label="false">错误</el-radio>
              </el-radio-group>
            </template>
            <template v-else>
              <el-radio-group
                v-if="question.type === 'single_choice'"
                v-model="userAnswers[question.id]"
              >
                <el-radio
                  v-for="(option, optIndex) in parseOptions(question.options)"
                  :key="optIndex"
                  :label="String.fromCharCode(65 + optIndex)"
                >
                  {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                </el-radio>
              </el-radio-group>
              <el-checkbox-group
                v-else-if="question.type === 'multiple_choice'"
                v-model="userAnswers[question.id]"
              >
                <el-checkbox
                  v-for="(option, optIndex) in parseOptions(question.options)"
                  :key="optIndex"
                  :label="String.fromCharCode(65 + optIndex)"
                >
                  {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
                </el-checkbox>
              </el-checkbox-group>
            </template>
          </div>

          <el-input
            v-else
            v-model="userAnswers[question.id]"
            type="textarea"
            :rows="2"
            placeholder="请输入答案"
          />
        </div>
      </div>

      <el-divider />

      <div class="submit-section">
        <el-button type="primary" size="large" @click="submitTest" :loading="submitting">
          提交试卷
        </el-button>
        <el-button size="large" @click="confirmClear">
          清空答案
        </el-button>
      </div>
    </el-card>

    <el-card v-else shadow="never" class="result-card">
      <div class="result-header">
        <h2>测试结果</h2>
      </div>

      <div class="result-score" :class="{ passed: testRecord?.isPassed, failed: !testRecord?.isPassed }">
        <div class="score-value">{{ testRecord?.score }}</div>
        <div class="score-label">得分</div>
        <el-tag :type="testRecord?.isPassed ? 'success' : 'danger'" size="large" class="pass-tag">
          {{ testRecord?.isPassed ? '恭喜通过' : '继续努力' }}
        </el-tag>
      </div>

      <div class="result-info">
        <div class="info-item">
          <span class="info-label">总分</span>
          <span class="info-value">{{ testPaper?.totalScore }} 分</span>
        </div>
        <div class="info-item">
          <span class="info-label">及格线</span>
          <span class="info-value">{{ testPaper?.passScore }} 分</span>
        </div>
        <div class="info-item">
          <span class="info-label">用时</span>
          <span class="info-value">{{ testRecord?.duration || 0 }} 分钟</span>
        </div>
        <div class="info-item">
          <span class="info-label">提交时间</span>
          <span class="info-value">{{ formatTime(testRecord?.createdAt) }}</span>
        </div>
      </div>

      <div class="result-actions">
        <el-button type="primary" @click="reTest">
          重新测试
        </el-button>
        <el-button @click="goBack">
          返回试卷列表
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const isSubmitted = ref(false)
const testPaper = ref<any>(null)
const testRecord = ref<any>(null)
const userAnswers = reactive<Record<string, any>>({})

const parseOptions = (options: string) => {
  if (!options) return []
  try {
    return JSON.parse(options)
  } catch {
    return options.split('|')
  }
}

const getQuestionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    judgment: '判断题',
    fill_blank: '填空题'
  }
  return labels[type] || type
}

const getQuestionTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    single_choice: 'primary',
    multiple_choice: 'warning',
    judgment: 'success',
    fill_blank: 'info'
  }
  return tags[type] || 'info'
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

const fetchTestPaper = async () => {
  const paperId = route.params.id as string
  if (!paperId) return

  loading.value = true
  try {
    const response = await api.get(`/tests/papers/${paperId}`)
    if (response.data.success) {
      testPaper.value = response.data.data
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
      router.push('/login?redirect=' + route.fullPath)
    } else {
      ElMessage.error('获取试卷详情失败')
    }
  } finally {
    loading.value = false
  }
}

const submitTest = async () => {
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] !== undefined && userAnswers[k] !== '').length
  const totalCount = testPaper.value?.questions?.length || 0

  if (answeredCount < totalCount) {
    try {
      await ElMessageBox.confirm(
        `还有 ${totalCount - answeredCount} 题未作答，确定要提交吗？`,
        '确认提交',
        {
          confirmButtonText: '确定提交',
          cancelButtonText: '继续作答',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  submitting.value = true
  try {
    const response = await api.post(`/tests/papers/${route.params.id}/submit`, {
      answers: userAnswers
    })
    if (response.data.success) {
      ElMessage.success('提交成功')
      testRecord.value = response.data.data
      isSubmitted.value = true
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
      router.push('/login?redirect=' + route.fullPath)
    } else {
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

const confirmClear = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有答案吗？', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    Object.keys(userAnswers).forEach(key => {
      userAnswers[key] = ''
    })
    ElMessage.success('已清空')
  } catch {
    // 用户取消
  }
}

const reTest = () => {
  isSubmitted.value = false
  testRecord.value = null
  Object.keys(userAnswers).forEach(key => {
    userAnswers[key] = ''
  })
}

const goBack = () => {
  router.push('/tests')
}

onMounted(() => {
  fetchTestPaper()
})
</script>

<style lang="scss">
.test-detail-page {
  .paper-card {
    .paper-header {
      .paper-title {
        font-size: 20px;
        margin: 0 0 16px;
        color: #303133;
      }

      .paper-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .paper-desc {
        font-size: 14px;
        color: #606266;
        margin: 0;
      }
    }

    .questions-section {
      .question-item {
        padding: 20px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .question-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .question-num {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }

          .question-score {
            margin-left: auto;
            font-size: 14px;
            color: #F56C6C;
            font-weight: 600;
          }
        }

        .question-content {
          font-size: 15px;
          color: #303133;
          line-height: 1.8;
          margin-bottom: 16px;
        }

        .question-options {
          :deep(.el-radio-group),
          :deep(.el-checkbox-group) {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          :deep(.el-radio),
          :deep(.el-checkbox) {
            font-size: 14px;
          }
        }
      }
    }

    .submit-section {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding-top: 16px;
    }
  }

  .result-card {
    .result-header {
      text-align: center;
      margin-bottom: 32px;

      h2 {
        margin: 0;
        font-size: 24px;
        color: #303133;
      }
    }

    .result-score {
      text-align: center;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 32px;

      &.passed {
        background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
      }

      &.failed {
        background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
      }

      .score-value {
        font-size: 72px;
        font-weight: 700;
        margin-bottom: 8px;

        .passed & {
          color: #67C23A;
        }

        .failed & {
          color: #F56C6C;
        }
      }

      .score-label {
        font-size: 16px;
        color: #909399;
        margin-bottom: 16px;
      }

      .pass-tag {
        font-size: 18px;
        padding: 8px 24px;
        height: auto;
      }
    }

    .result-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 32px;

      .info-item {
        background: #f5f7fa;
        padding: 16px 20px;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .info-label {
          font-size: 14px;
          color: #909399;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .result-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
    }
  }
}
</style>
