<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #409EFF, #66b1ff)">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.users }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #67C23A, #85ce61)">
              <el-icon><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.students }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #E6A23C, #ebb563)">
              <el-icon><Reading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.courses }}</div>
              <div class="stat-label">课程总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #F56C6C, #f78989)">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.grades }}</div>
              <div class="stat-label">成绩记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="welcome-card">
          <template #header>
            <span>欢迎使用</span>
          </template>
          <div class="welcome-content">
            <h2>学生成绩管理系统</h2>
            <p class="welcome-text">
              当前用户：<strong>{{ userStore.userName }}</strong>（{{ userStore.userRole }}）
            </p>
            <el-divider />
            <div class="quick-actions">
              <h4>快速入口</h4>
              <template v-if="userStore.isStudent">
                <el-button type="primary" @click="goToMyGrades">
                  <el-icon><Document /></el-icon>
                  查看我的成绩
                </el-button>
              </template>
              <template v-else>
                <el-button type="primary" @click="goToStudents">
                  <el-icon><Avatar /></el-icon>
                  学生管理
                </el-button>
                <el-button type="success" @click="goToCourses">
                  <el-icon><Reading /></el-icon>
                  课程管理
                </el-button>
                <el-button type="warning" @click="goToGrades">
                  <el-icon><Edit /></el-icon>
                  成绩录入
                </el-button>
              </template>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统说明</span>
          </template>
          <div class="system-info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="角色权限说明">
                <ul class="permission-list">
                  <li><strong>系统管理员：</strong>拥有所有权限，可管理用户、系别、班级、学生、课程、成绩</li>
                  <li><strong>教学管理员：</strong>可管理教学数据，包括系别、班级、学生、课程、成绩</li>
                  <li><strong>教师：</strong>可查看课程、录入和查询成绩、统计成绩</li>
                  <li><strong>学生：</strong>仅可查看自己的成绩</li>
                </ul>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const stats = reactive({
  users: 0,
  students: 0,
  courses: 0,
  grades: 0
})

const loadStats = () => {
  stats.users = 5
  stats.students = 10
  stats.courses = 5
  stats.grades = 0
}

const goToMyGrades = () => {
  router.push('/my-grades')
}

const goToStudents = () => {
  router.push('/students')
}

const goToCourses = () => {
  router.push('/courses')
}

const goToGrades = () => {
  router.push('/grades')
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
}

.welcome-text {
  font-size: 16px;
  color: #666;
}

.quick-actions h4 {
  margin-bottom: 15px;
  color: #333;
}

.quick-actions .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.permission-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.permission-list li {
  padding: 8px 0;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.permission-list li:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}
</style>
