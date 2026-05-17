<template>
  <div class="home-page">
    <div class="header">
      <div class="user-info">
        <div class="avatar">{{ userStore.user?.avatar || '👤' }}</div>
        <div class="user-text">
          <h3>{{ userStore.user?.nickname || '用户' }}</h3>
          <p>{{ userStore.isOnline ? '🟢 在线' : '🔴 离线' }}</p>
        </div>
      </div>
      <van-icon name="search" size="22" @click="goToSearch" />
    </div>
    
    <van-tabs v-model:active="activeTab" class="main-tabs">
      <van-tab title="训练">
        <div class="tab-content">
          <LoadingState v-if="loading" />
          <ErrorState v-else-if="error" @retry="fetchData" />
          <template v-else>
            <div class="stats-card card">
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ stepCount }}</div>
                  <div class="stat-label">步数</div>
                  <van-button size="mini" type="primary" plain @click="requestStepPermission">
                    授权
                  </van-button>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ formatDuration(totalDuration) }}</div>
                  <div class="stat-label">总运动时长</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ weekDuration }}</div>
                  <div class="stat-label">本周(分钟)</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h4 class="section-title">🏆 好友排行榜</h4>
              <div class="ranking-list card">
                <div 
                  v-for="(friend, index) in friendsRank" 
                  :key="index"
                  class="ranking-item"
                  :class="{ 'is-me': friend.isMe }"
                >
                  <div class="rank-no">{{ index + 1 }}</div>
                  <div class="friend-avatar">{{ friend.avatar }}</div>
                  <div class="friend-info">
                    <div class="friend-name">{{ friend.nickname }}</div>
                  </div>
                  <div class="friend-duration">{{ friend.week_duration || 0 }} 分钟</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h4 class="section-title">🔥 今日推荐</h4>
              <div class="course-list">
                <div 
                  v-for="course in recommended" 
                  :key="course.id"
                  class="course-card card"
                  @click="goToCourse(course.id)"
                >
                  <div class="course-cover">{{ course.cover }}</div>
                  <div class="course-info">
                    <h5>{{ course.title }}</h5>
                    <p>{{ course.description }}</p>
                    <div class="course-meta">
                      <span>⏱ {{ course.duration }}分钟</span>
                      <span>🔥 {{ course.calories }}千卡</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section" v-if="myCourses?.length">
              <h4 class="section-title">📚 我的训练</h4>
              <div class="course-list">
                <div 
                  v-for="course in myCourses" 
                  :key="course.id"
                  class="course-card card"
                  @click="goToCourse(course.id)"
                >
                  <div class="course-cover">{{ course.cover }}</div>
                  <div class="course-info">
                    <h5>{{ course.title }}</h5>
                    <div class="course-progress">
                      <van-progress :percentage="course.progress || 0" color="#667eea" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h4 class="section-title">✨ 新课程</h4>
              <div class="course-list">
                <div 
                  v-for="course in newCourses" 
                  :key="course.id"
                  class="course-card card"
                  @click="goToCourse(course.id)"
                >
                  <div class="course-cover">{{ course.cover }}</div>
                  <div class="course-info">
                    <h5>{{ course.title }}</h5>
                    <p>{{ course.description }}</p>
                    <div class="course-meta">
                      <span>⏱ {{ course.duration }}分钟</span>
                      <span>🔥 {{ course.calories }}千卡</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </van-tab>
      
      <van-tab title="跑步">
        <div class="running-tab">
          <div class="running-entry card" @click="goToRunning">
            <div class="running-icon">🏃</div>
            <div class="running-text">
              <h3>开始跑步</h3>
              <p>记录每一次奔跑</p>
            </div>
            <van-icon name="arrow" />
          </div>
          
          <div class="running-entry card" @click="goToRunning">
            <div class="running-icon">🚶</div>
            <div class="running-text">
              <h3>开始行走</h3>
              <p>记录每一步</p>
            </div>
            <van-icon name="arrow" />
          </div>
          
          <div class="running-entry card" @click="goToRunning">
            <div class="running-icon">🚴</div>
            <div class="running-text">
              <h3>开始骑行</h3>
              <p>记录每一次骑行</p>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
      </van-tab>
      
      <van-tab title="我的">
        <div class="profile-tab">
          <div class="profile-card card">
            <div class="profile-avatar">{{ userStore.user?.avatar || '👤' }}</div>
            <h3>{{ userStore.user?.nickname || '用户' }}</h3>
            <p>{{ userStore.user?.phone }}</p>
          </div>
          
          <van-cell-group inset class="menu-group">
            <van-cell title="我的课程" is-link @click="handleMyCourses" />
            <van-cell title="运动记录" is-link @click="handleWorkoutRecords" />
            <van-cell title="设置" is-link @click="handleSettings" />
            <van-cell title="退出登录" @click="handleLogout">
              <template #title>
                <span style="color: #ff4d4f">退出登录</span>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { courseApi } from '../api'
import { useUserStore } from '../store/user'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(0)
const loading = ref(true)
const error = ref(false)
const stepCount = ref(0)
const totalDuration = ref(0)
const weekDuration = ref(0)
const recommended = ref([])
const newCourses = ref([])
const myCourses = ref([])
const friendsRank = ref([])

function formatDuration(minutes) {
  if (!minutes) return '0分钟'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

async function fetchData() {
  loading.value = true
  error.value = false
  try {
    const data = await courseApi.getHomeData()
    totalDuration.value = data?.total_duration || 0
    weekDuration.value = data?.week_duration || 0
    recommended.value = data?.recommended || []
    newCourses.value = data?.newCourses || []
    myCourses.value = data?.myCourses || []
    friendsRank.value = data?.friends_rank || []
  } catch (err) {
    console.error('获取首页数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

function requestStepPermission() {
  if ('HealthKit' in window) {
    showToast('正在请求步数权限...')
  } else {
    stepCount.value = Math.floor(Math.random() * 5000) + 1000
    showToast('步数授权成功')
  }
}

function goToSearch() {
  router.push('/search')
}

function goToCourse(id) {
  router.push(`/course/${id}`)
}

function goToRunning() {
  router.push('/running')
}

function handleMyCourses() {
  activeTab.value = 0
  showToast('已切换到训练标签查看我的课程')
}

function handleWorkoutRecords() {
  activeTab.value = 1
  showToast('已切换到跑步标签查看运动记录')
}

function handleSettings() {
  showToast('设置功能开发中')
}

function handleLogout() {
  showDialog({
    title: '提示',
    message: '确定要退出登录吗？',
    showCancelButton: true
  }).then(() => {
    userStore.logout()
    router.replace('/welcome')
  }).catch(() => {})
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="less" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  font-size: 32px;
}

.user-text h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
}

.user-text p {
  font-size: 12px;
  opacity: 0.9;
}

.main-tabs {
  min-height: calc(100vh - 80px);
}

.tab-content {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.section {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding: 0 4px;
}

.ranking-list {
  padding: 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.is-me {
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), transparent);
  }
}

.rank-no {
  width: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.friend-avatar {
  font-size: 28px;
  margin: 0 12px;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 14px;
  font-weight: 500;
}

.friend-duration {
  font-size: 14px;
  color: #666;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
}

.course-cover {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  border-radius: 12px;
}

.course-info {
  flex: 1;
}

.course-info h5 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.course-info p {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.course-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.course-progress {
  margin-top: 8px;
}

.running-tab {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.running-entry {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
}

.running-icon {
  font-size: 40px;
}

.running-text {
  flex: 1;
}

.running-text h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.running-text p {
  font-size: 13px;
  color: #666;
}

.profile-tab {
  padding: 16px;
}

.profile-card {
  text-align: center;
  padding: 24px;
  margin-bottom: 16px;
}

.profile-avatar {
  font-size: 60px;
  margin-bottom: 12px;
}

.profile-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.profile-card p {
  font-size: 14px;
  color: #666;
}

.menu-group {
  overflow: hidden;
}
</style>
