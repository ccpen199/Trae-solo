<template>
  <div class="main-layout">
    <div class="header" :style="{ background: planet?.color }">
      <div class="planet-info">
        <div class="planet-icon">
          ✦
        </div>
        <div>
          <h1>{{ planet?.name || '加载中...' }}</h1>
          <p>{{ planet?.description }}</p>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="section">
      <div class="section-header">
        <h2>星球成员</h2>
        <el-button type="primary" size="small" @click="showFilter = true">
          <el-icon><Filter /></el-icon> 筛选
        </el-button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner">⟳</div>
      </div>

      <div v-else class="user-grid">
        <div
          v-for="user in users" :key="user.id" class="user-card" @click="goToProfile(user.id)">
          <div class="user-avatar" :style="{ background: getAvatarColor(user.id) }">
            {{ getAvatarEmoji(user.id) }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.gender === 'male' ? '♂' : '♀' }} {{ user.age || '?' }}岁</div>
            <div class="user-constellation">{{ user.constellation || '未知' }}</div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item active" @click="$router.push('/')">
        <span class="nav-icon">🏠</span>
        <span>星球</span>
      </div>
      <div class="nav-item" @click="$router.push('/square')">
        <span class="nav-icon">📝</span>
        <span>广场</span>
      </div>
      <div class="nav-item match-btn" @click="$router.push('/match')">
        <span class="nav-icon">💕</span>
        <span>匹配</span>
      </div>
      <div class="nav-item" @click="$router.push('/messages')">
        <span class="nav-icon">💬</span>
        <span>消息</span>
      </div>
      <div class="nav-item" @click="handleLogout">
        <span class="nav-icon">🚪</span>
        <span>退出</span>
      </div>
    </div>

    <el-dialog v-model="showFilter" title="筛选条件" width="350px">
      <el-form :model="filterForm" label-width="80px">
        <el-form-item label="年龄">
          <el-input v-model.number="filterForm.minAge" placeholder="最小" style="width: 100px" />
          <span style="margin: 0 10px">-</span>
          <el-input v-model.number="filterForm.maxAge" placeholder="最大" style="width: 100px" />
        </el-form-item>
        <el-form-item label="星座">
          <el-select v-model="filterForm.constellation" placeholder="选择星座" clearable style="width: 100%">
            <el-option v-for="c in constellations" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="filterForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
            <el-radio value="">不限</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetFilter">重置</el-button>
        <el-button type="primary" @click="applyFilter">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const planet = ref(null)
const users = ref([])
const showFilter = ref(false)

const filterForm = reactive({
  minAge: null,
  maxAge: null,
  constellation: '',
  gender: ''
})

const constellations = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
]

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const avatarEmojis = ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻']

const getAvatarColor = (id) => avatarColors[(id - 1) % avatarColors.length]
const getAvatarEmoji = (id) => avatarEmojis[(id - 1) % avatarEmojis.length]

const fetchPlanets = async () => {
  request.get('/planets').then(res => {
    planet.value = res.data.find(p => p.id === userStore.user?.planet_id) || res.data[0]
  })
}

const fetchUsers = async () => {
  if (!userStore.user?.planet_id) return
  
  try {
    loading.value = true
    const params = {}
    if (filterForm.minAge) params.minAge = filterForm.minAge
    if (filterForm.maxAge) params.maxAge = filterForm.maxAge
    if (filterForm.constellation) params.constellation = filterForm.constellation
    if (filterForm.gender) params.gender = filterForm.gender
    
    const res = await request.get(`/planets/${userStore.user.planet_id}/users`, { params })
    users.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`)
}

const applyFilter = () => {
  showFilter.value = false
  fetchUsers()
}

const resetFilter = () => {
  filterForm.minAge = null
  filterForm.maxAge = null
  filterForm.constellation = ''
  filterForm.gender = ''
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchPlanets()
  fetchUsers()
})
</script>

<style scoped>
.header {
  padding: 30px 20px;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.planet-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.planet-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.planet-info h1 {
  font-size: 24px;
  margin-bottom: 5px;
}

.planet-info p {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.content {
  padding: 20px;
  margin-top: -15px;
  position: relative;
  z-index: 1;
}

.section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.user-card {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-card:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-constellation {
  font-size: 13px;
  color: #666;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.nav-item.active {
  color: #667eea;
}

.nav-item.match-btn {
  color: #667eea;
}

.nav-icon {
  font-size: 20px;
}

.nav-item.match-btn .nav-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -8px;
  font-size: 18px;
}

.loading-spinner {
  font-size: 30px;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.planet-icon {
  font-size: 32px;
  line-height: 1;
}
</style>
