<template>
  <div class="ask-question-page">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h2>发布问题</h2>
          <span class="tip">设置悬赏，获得更专业的解答</span>
        </div>
      </template>

      <el-form
        ref="questionFormRef"
        :model="questionForm"
        :rules="questionRules"
        label-position="top"
      >
        <el-form-item label="问题标题" prop="title">
          <el-input
            v-model="questionForm.title"
            placeholder="请输入问题标题（5-200字）"
            size="large"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="问题内容" prop="content">
          <el-input
            v-model="questionForm.content"
            type="textarea"
            placeholder="请详细描述您的问题（至少20字）"
            :rows="10"
            maxlength="10000"
            show-word-limit
          />
          <div class="content-tips">
            <el-text size="small" type="info">
              提示：详细的问题描述有助于获得更准确的回答。可以包含代码示例、错误信息等。
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="questionForm.tags"
            multiple
            filterable
            allow-create
            placeholder="请选择或创建标签（最多5个）"
            size="large"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
          <div class="tags-tips">
            <el-text size="small" type="info">
              建议标签：编程、前端、后端、Java、Python、React、Vue、数据库、算法、设计、安全
            </el-text>
          </div>
        </el-form-item>

        <el-divider content-position="left">悬赏设置（可选）</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="积分悬赏">
              <el-input-number
                v-model="questionForm.reward.points"
                :min="0"
                :max="1000"
                :step="50"
                size="large"
                style="width: 100%"
              />
              <el-text size="small" type="info">
                您当前积分：{{ userStore.user?.points || 0 }}
              </el-text>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现金悬赏（元）">
              <el-input-number
                v-model="questionForm.reward.money"
                :min="0"
                :max="10000"
                :step="50"
                :precision="2"
                size="large"
                style="width: 100%"
              />
              <el-text size="small" type="info">
                您当前余额：¥{{ userStore.user?.balance || 0 }}
              </el-text>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item class="form-actions">
          <el-button size="large" @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            发布问题
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const questionFormRef = ref(null)
const isSubmitting = ref(false)

const availableTags = ref([
  '编程', '前端', '后端', 'Java', 'Python', 'JavaScript', 'TypeScript',
  'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask',
  '数据库', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  '算法', '数据结构', '设计模式', '系统设计', '架构',
  '安全', '网络安全', '信息安全', '渗透测试',
  '测试', '自动化测试', '性能测试',
  '运维', 'DevOps', 'Docker', 'Kubernetes', 'Linux',
  '人工智能', '机器学习', '深度学习', '数据分析',
  '产品', '设计', 'UI', 'UX', '交互设计',
  '商业', '金融', '投资', '管理', '营销'
])

const questionForm = reactive({
  title: '',
  content: '',
  tags: [],
  reward: {
    type: 'points',
    points: 0,
    money: 0
  }
})

const questionRules = {
  title: [
    { required: true, message: '请输入问题标题', trigger: 'blur' },
    { min: 5, message: '标题至少5个字符', trigger: 'blur' },
    { max: 200, message: '标题不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入问题内容', trigger: 'blur' },
    { min: 20, message: '内容至少20个字符', trigger: 'blur' },
    { max: 10000, message: '内容不能超过10000个字符', trigger: 'blur' }
  ],
  tags: [
    { 
      validator: (rule, value, callback) => {
        if (value && value.length > 5) {
          callback(new Error('最多添加5个标签'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ]
}

const handleCancel = () => {
  router.back()
}

const handleSubmit = async () => {
  if (!questionFormRef.value) return

  await questionFormRef.value.validate(async (valid) => {
    if (valid) {
      if (questionForm.reward.points > 0 || questionForm.reward.money > 0) {
        if (questionForm.reward.points > 0 && questionForm.reward.money > 0) {
          questionForm.reward.type = 'both'
        } else if (questionForm.reward.money > 0) {
          questionForm.reward.type = 'money'
        } else {
          questionForm.reward.type = 'points'
        }
      }

      if (questionForm.reward.points > (userStore.user?.points || 0)) {
        ElMessage.error('积分不足')
        return
      }

      if (questionForm.reward.money > (userStore.user?.balance || 0)) {
        ElMessage.error('余额不足')
        return
      }

      isSubmitting.value = true
      try {
        const response = await api.post('/questions', questionForm)
        
        if (response.data.success) {
          const { questionId } = response.data.data
          
          try {
            await api.post(`/questions/${questionId}/publish`)
            ElMessage.success('问题发布成功！')
            router.push(`/questions/${questionId}`)
          } catch (publishError) {
            ElMessage.warning('问题已创建，但发布失败，请稍后重试')
            router.push('/profile/questions')
          }
        }
      } catch (error) {
        console.error('Create question error:', error)
        ElMessage.error(error.response?.data?.error || '发布失败，请稍后重试')
      } finally {
        isSubmitting.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.ask-question-page {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  :deep(.el-card__header) {
    padding: 20px 24px;
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }

  .tip {
    font-size: 13px;
    color: #909399;
  }
}

.content-tips,
.tags-tips {
  margin-top: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  margin-bottom: 0;
}
</style>
