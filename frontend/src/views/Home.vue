<template>
  <div class="home-container">
    <el-header class="home-header">
      <div class="header-left">
        <h1 class="app-title">知识星球</h1>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索星球或主题"
          prefix-icon="Search"
          style="width: 320px"
          @keyup.enter="goSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="goSearch" />
          </template>
        </el-input>
      </div>

      <div class="header-right">
        <el-button type="primary" @click="goCreatePlanet">
          <el-icon><Plus /></el-icon>
          创建星球
        </el-button>

        <el-dropdown @command="handleCommand">
          <div class="user-dropdown">
            <el-avatar :size="32">
              {{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="user-name">{{ userStore.userInfo?.nickname || '用户' }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-main class="home-main">
      <div class="toolbar">
        <h2 class="section-title">发现星球</h2>
        <div class="toolbar-right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>

          <el-select v-model="filterType" size="small" style="width: 120px" @change="fetchPlanets">
            <el-option label="全部星球" value="all" />
            <el-option label="我加入的" value="joined" />
            <el-option label="我创建的" value="owned" />
          </el-select>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="error" class="error-container">
        <el-icon :size="48" color="#f56c6c"><Warning /></el-icon>
        <p class="error-text">加载失败</p>
        <el-button type="primary" class="mt-20" @click="fetchPlanets">重新加载</el-button>
      </div>

      <div v-else-if="planets.length === 0" class="empty-container">
        <el-icon :size="48" color="#909399"><Document /></el-icon>
        <p class="empty-text">暂无星球，快去创建一个吧</p>
        <el-button type="primary" class="mt-20" @click="goCreatePlanet">创建星球</el-button>
      </div>

      <div v-else-if="viewMode === 'grid'" class="planet-grid">
        <el-card
          v-for="planet in planets"
          :key="planet.id"
          class="planet-card"
          @click="goPlanetDetail(planet.id)"
        >
          <div class="planet-cover">
            <span class="planet-initial">{{ planet.name.charAt(0) }}</span>
          </div>
          <h3 class="planet-name">{{ planet.name }}</h3>
          <p class="planet-desc">{{ planet.description || '暂无描述' }}</p>
          <div class="planet-stats">
            <span class="stat-item">
              <el-icon><User /></el-icon>
              {{ planet.member_count || 0 }} 成员
            </span>
            <span class="stat-item">
              <el-icon><Document /></el-icon>
              {{ planet.topic_count || 0 }} 主题
            </span>
          </div>
          <el-tag
            v-if="planet.user_role"
            :type="planet.user_role === 'owner' ? 'danger' : 'success'"
            size="small"
            class="planet-tag"
          >
            {{ planet.user_role === 'owner' ? '创建者' : '已加入' }}
          </el-tag>
        </el-card>
      </div>

      <div v-else class="planet-list">
        <el-card
          v-for="planet in planets"
          :key="planet.id"
          class="list-card"
          @click="goPlanetDetail(planet.id)"
        >
          <div class="list-item">
            <div class="list-cover">
              <span class="list-initial">{{ planet.name.charAt(0) }}</span>
            </div>
            <div class="list-content">
              <div class="list-header">
                <h3 class="list-name">{{ planet.name }}</h3>
                <el-tag
                  v-if="planet.user_role"
                  :type="planet.user_role === 'owner' ? 'danger' : 'success'"
                  size="small"
                >
                  {{ planet.user_role === 'owner' ? '创建者' : '已加入' }}
                </el-tag>
              </div>
              <p class="list-desc">{{ planet.description || '暂无描述' }}</p>
              <div class="list-stats">
                <span class="stat-item">
                  <el-icon><User /></el-icon>
                  {{ planet.member_count || 0 }} 成员
                </span>
                <span class="stat-item">
                  <el-icon><Document /></el-icon>
                  {{ planet.topic_count || 0 }} 主题
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="planets.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchPlanets"
        />
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getPlanets } from '@/api/planet'
import { Search, Plus, Grid, List, User, Document, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref(false)
const searchKeyword = ref('')
const viewMode = ref('grid')
const filterType = ref('all')

const planets = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

const fetchPlanets = async () => {
  loading.value = true
  error.value = false

  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      type: filterType.value
    }

    const res = await getPlanets(params)
    planets.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('获取星球列表失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const goSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(searchKeyword.value)}`)
  }
}

const goCreatePlanet = () => {
  if (!userStore.token) {
    router.push('/login')
    return
  }
  router.push('/create-planet')
}

const goPlanetDetail = (id) => {
  router.push(`/planet/${id}`)
}

const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

onMounted(() => {
  if (userStore.token) {
    userStore.fetchUserInfo()
  }
  fetchPlanets()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.home-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.app-title {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  color: #303133;
}

.home-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.error-text,
.empty-text {
  color: #606266;
  margin-top: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.planet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .planet-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .planet-grid {
    grid-template-columns: 1fr;
  }
}

.planet-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.planet-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.planet-cover {
  height: 128px;
  background: linear-gradient(90deg, #66b1ff, #b37feb);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.planet-initial {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.planet-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planet-desc {
  color: #909399;
  font-size: 14px;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 42px;
}

.planet-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.planet-tag {
  margin-top: 12px;
}

.planet-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.list-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.list-cover {
  width: 64px;
  height: 64px;
  background: linear-gradient(90deg, #66b1ff, #b37feb);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-initial {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.list-content {
  flex: 1;
  min-width: 0;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.list-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.list-desc {
  color: #909399;
  font-size: 14px;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
