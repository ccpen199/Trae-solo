<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2 style="color: white;">种树公益</h2>
      <div class="energy-display">
        🌱 {{ authStore.user?.current_energy?.toLocaleString() }} g
      </div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else>
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
      >
        <img :src="project.image_url" :alt="project.name" class="project-image" />
        <div class="project-content">
          <div class="project-title">{{ project.name }}</div>
          <div class="project-desc">{{ project.description }}</div>
          <div class="project-cost">
            <div>
              <span style="color: #228B22; font-weight: bold;">🌱 {{ project.energy_cost?.toLocaleString() }} g</span>
              <span style="color: #999; font-size: 12px; margin-left: 12px;">
                已种植 {{ project.total_plantings }} 棵
              </span>
            </div>
            <button
              class="btn btn-success"
              :disabled="authStore.user?.current_energy < project.energy_cost"
              @click="plantTree(project)"
            >
              {{ authStore.user?.current_energy >= project.energy_cost ? '立即种植' : '能量不足' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <nav class="nav-bar">
      <div class="nav-item" @click="$router.push('/')">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </div>
      <div class="nav-item active" @click="$router.push('/plant')">
        <span class="nav-icon">🌲</span>
        <span>种树</span>
      </div>
      <div class="nav-item" @click="$router.push('/leaderboard')">
        <span class="nav-icon">🏆</span>
        <span>排行</span>
      </div>
      <div class="nav-item" @click="authStore.logout(); $router.push('/login')">
        <span class="nav-icon">👤</span>
        <span>退出</span>
      </div>
    </nav>

    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

const projects = ref([])
const loading = ref(true)
const toastMessage = ref('')

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => toastMessage.value = '', 2000)
}

const loadProjects = async () => {
  try {
    const response = await api.get('/tree-projects')
    projects.value = response.data
  } catch (error) {
    console.error('Failed to load projects:', error)
  } finally {
    loading.value = false
  }
}

const plantTree = async (project) => {
  try {
    await api.post('/trees/plant', { project_id: project.id })
    await authStore.updateUser()
    showToast(`成功种植了一棵${project.tree_type}！证书已生成`)
    
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index !== -1) {
      projects.value[index].total_plantings += 1
    }
  } catch (error) {
    showToast(error.response?.data?.detail || '种植失败')
  }
}

onMounted(() => {
  loadProjects()
})
</script>
