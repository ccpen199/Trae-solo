<template>
  <div class="home">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalEnrollments || 0 }}</div>
            <div class="stat-label">已报名课程</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completedCourses || 0 }}</div>
            <div class="stat-label">已完成课程</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon><Medal /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.certificates || 0 }}</div>
            <div class="stat-label">获得证书</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon purple">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCredits || 0 }}</div>
            <div class="stat-label">累计学分</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>待学课程</span>
              <el-button type="primary" link @click="$router.push('/my-courses')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingCourses" style="width: 100%">
            <el-table-column prop="title" label="课程名称" />
            <el-table-column prop="instructor_name" label="讲师" width="100" />
            <el-table-column prop="live_time" label="直播时间" width="160">
              <template #default="{ row }">{{ formatDate(row.live_time) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_required ? 'danger' : 'info'">{{ row.is_required ? '必修' : '选修' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="goCourse(row.id)">进入学习</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="section-card">
          <template #header>
            <span>今日直播</span>
          </template>
          <div v-if="todayCourses.length === 0" class="empty-tip">
            <el-icon><Calendar /></el-icon>
            <p>今日暂无直播课程</p>
          </div>
          <div v-else>
            <div v-for="course in todayCourses" :key="course.id" class="live-item" @click="goCourse(course.id)">
              <div class="live-time">{{ formatTime(course.live_time) }}</div>
              <div class="live-info">
                <div class="live-title">{{ course.title }}</div>
                <div class="live-teacher">{{ course.instructor_name }}</div>
              </div>
              <el-button type="primary" size="small">进入</el-button>
            </div>
          </div>
        </el-card>
        
        <el-card class="section-card" style="margin-top: 20px;">
          <template #header>
            <span>待补考提醒</span>
          </template>
          <div v-if="retakeCourses.length === 0" class="empty-tip">
            <el-icon><CircleCheck /></el-icon>
            <p>暂无待补考</p>
          </div>
          <div v-else>
            <div v-for="exam in retakeCourses" :key="exam.id" class="retake-item">
              <div class="retake-title">{{ exam.title }}</div>
              <div class="retake-info">剩余 {{ exam.remaining_attempts }} 次机会</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElIcon } from 'element-plus'
import { Reading, CircleCheck, Medal, Trophy, Calendar } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()
const stats = ref({})
const pendingCourses = ref([])
const todayCourses = ref([])
const retakeCourses = ref([])

async function loadData() {
  try {
    const [myCourses, certificates] = await Promise.allSettled([
      api.get('/courses/my-courses').catch(() => []),
      api.get('/courses/my-certificates').catch(() => [])
    ])
    
    const courses = myCourses.status === 'fulfilled' ? myCourses.value : []
    const certs = certificates.status === 'fulfilled' ? certificates.value : []
    
    const enrolled = courses.filter(c => c.enrollment_status === 'enrolled')
    const completed = courses.filter(c => c.enrollment_status === 'completed')
    const totalCredits = completed.reduce((sum, c) => sum + (c.credits || 0), 0)
    
    stats.value = {
      totalEnrollments: courses.length,
      completedCourses: completed.length,
      certificates: certs.length,
      totalCredits
    }
    
    pendingCourses.value = courses.slice(0, 5)
    
    const today = new Date().toDateString()
    todayCourses.value = courses.filter(c => {
      const courseDate = new Date(c.live_time).toDateString()
      return courseDate === today
    })
  } catch (error) {
    console.error('加载首页数据失败:', error)
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function goCourse(id) {
  router.push(`/courses/${id}`)
}

onMounted(loadData)
</script>

<style scoped>
.home {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.purple { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.section-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-tip .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.live-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.live-item:last-child {
  border-bottom: none;
}

.live-time {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  min-width: 60px;
}

.live-info {
  flex: 1;
}

.live-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.live-teacher {
  font-size: 12px;
  color: #909399;
}

.retake-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.retake-item:last-child {
  border-bottom: none;
}

.retake-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.retake-info {
  font-size: 12px;
  color: #f56c6c;
}
</style>
