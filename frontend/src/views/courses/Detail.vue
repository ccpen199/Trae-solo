<template>
  <div class="course-detail" v-if="course">
    <el-card class="header-card">
      <div class="course-header">
        <div class="course-cover">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div class="course-main">
          <h1 class="course-title">{{ course.title }}</h1>
          <div class="course-tags">
            <el-tag v-if="course.is_required" type="danger">必修</el-tag>
            <el-tag v-else type="info">选修</el-tag>
            <el-tag>{{ course.credits }}学分</el-tag>
            <el-tag type="success">{{ course.status === 'completed' ? '已结束' : '进行中' }}</el-tag>
          </div>
          <div class="course-meta">
            <span><el-icon><User /></el-icon> 讲师：{{ course.instructor_name }}</span>
            <span><el-icon><Clock /></el-icon> 时长：{{ course.duration }}分钟</span>
            <span><el-icon><Calendar /></el-icon> 直播：{{ formatDate(course.live_time) }}</span>
          </div>
          <p class="course-desc">{{ course.description }}</p>
          <div class="course-actions">
            <el-button v-if="!course.enrolled" type="primary" size="large" @click="enrollCourse">立即报名</el-button>
            <template v-else>
              <el-button type="primary" size="large" @click="enterLive">进入直播课堂</el-button>
              <el-button size="large" @click="startExam" v-if="exam && !isExamPassed">参加考试</el-button>
              <el-button size="large" @click="viewReplay" v-if="course.replay_url">观看回放</el-button>
            </template>
          </div>
        </div>
        <div class="course-progress" v-if="course.enrolled">
          <div class="progress-label">学习进度</div>
          <el-progress :percentage="course.progress" :status="course.progress === 100 ? 'success' : ''" />
          <div class="progress-info">{{ course.enrollment_status === 'completed' ? '已完成' : '学习中' }}</div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>课程资料</template>
          <div v-if="materials.length === 0" class="empty-tip">暂无资料</div>
          <div v-else>
            <div v-for="(item, index) in materials" :key="index" class="material-item">
              <el-icon><Document /></el-icon>
              <span class="material-name">{{ item }}</span>
              <el-button type="primary" link size="small">下载</el-button>
            </div>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>课程评价</template>
          <el-form v-if="canEvaluate" :model="evaluationForm" @submit.prevent="submitEvaluation">
            <el-form-item label="评分">
              <el-rate v-model="evaluationForm.rating" />
            </el-form-item>
            <el-form-item label="评价">
              <el-input v-model="evaluationForm.comment" type="textarea" :rows="3" placeholder="请输入您的评价" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="submitEvaluation">提交评价</el-button>
            </el-form-item>
          </el-form>
          <div v-else class="empty-tip">完成课程学习后可评价</div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>讲师信息</template>
          <div class="instructor-info">
            <el-avatar size="64">{{ course.instructor_name?.charAt(0) }}</el-avatar>
            <div class="instructor-detail">
              <div class="instructor-name">{{ course.instructor_name }}</div>
              <div class="instructor-dept">{{ course.instructor_department }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>适用范围</template>
          <div class="scope-info">
            <div class="scope-item">
              <span class="scope-label">适用岗位：</span>
              <span class="scope-value">{{ course.applicable_positions }}</span>
            </div>
            <div class="scope-item">
              <span class="scope-label">报名范围：</span>
              <span class="scope-value">{{ course.registration_scope }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElIcon } from 'element-plus'
import { VideoPlay, User, Clock, Calendar, Document } from '@element-plus/icons-vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const course = ref(null)
const exam = ref(null)
const submitting = ref(false)
const evaluationForm = ref({ rating: 5, comment: '' })

const materials = computed(() => {
  try {
    return JSON.parse(course.value?.materials || '[]')
  } catch {
    return []
  }
})

const canEvaluate = computed(() => {
  return course.value?.enrollment_status === 'completed'
})

const isExamPassed = computed(() => {
  return exam.value?.my_attempts?.some(a => a.is_passed)
})

async function loadCourse() {
  course.value = await api.get(`/courses/${route.params.id}`)
  
  const exams = await api.get(`/exams/course/${route.params.id}`)
  if (exams.length > 0) {
    exam.value = await api.get(`/exams/${exams[0].id}`)
  }
}

async function enrollCourse() {
  await api.post(`/courses/${route.params.id}/enroll`)
  ElMessage.success('报名成功')
  loadCourse()
}

function enterLive() {
  router.push(`/live/${route.params.id}`)
}

function startExam() {
  router.push(`/exams/${exam.value.id}`)
}

function viewReplay() {
  ElMessage.info('回放功能演示中')
}

async function submitEvaluation() {
  if (!evaluationForm.value.rating) {
    return ElMessage.warning('请选择评分')
  }
  submitting.value = true
  try {
    await api.post('/admin/evaluations', {
      course_id: route.params.id,
      rating: evaluationForm.value.rating,
      comment: evaluationForm.value.comment
    })
    ElMessage.success('评价提交成功')
  } catch (error) {
    ElMessage.error(error.error || '提交失败')
  } finally {
    submitting.value = false
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(loadCourse)
</script>

<style scoped>
.course-header {
  display: flex;
  gap: 24px;
}

.course-cover {
  width: 240px;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.course-cover .el-icon {
  font-size: 64px;
  color: #fff;
}

.course-main {
  flex: 1;
}

.course-title {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 12px;
}

.course-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.course-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  color: #606266;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-desc {
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.6;
}

.course-actions {
  display: flex;
  gap: 12px;
}

.course-progress {
  width: 200px;
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.progress-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.progress-info {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.material-item:last-child {
  border-bottom: none;
}

.material-name {
  flex: 1;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.instructor-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.instructor-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.instructor-dept {
  font-size: 13px;
  color: #909399;
}

.scope-item {
  padding: 8px 0;
}

.scope-label {
  color: #909399;
}

.scope-value {
  color: #303133;
}
</style>
