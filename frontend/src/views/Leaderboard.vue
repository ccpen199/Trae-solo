<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2 style="color: white;">排行榜</h2>
      <div></div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading">
        加载中...
      </div>

      <div v-else>
        <div
          v-for="item in leaderboard"
          :key="item.user_id"
          class="friend-item"
          :style="{ background: item.is_current_user ? 'rgba(102, 126, 234, 0.1)' : '' }"
        >
          <div class="rank-badge" :class="`rank-${item.rank <= 3 ? item.rank : 'other'}`">
            {{ item.rank }}
          </div>
          <div class="friend-avatar">{{ item.username.charAt(0).toUpperCase() }}</div>
          <div style="flex: 1; margin-left: 12px;">
            <div style="font-weight: 500; color: #333;">
              {{ item.username }}
              <span v-if="item.is_current_user" style="color: #667eea; font-size: 12px;"> (我)</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              🌳 {{ item.trees_planted }} 棵 · 累计 {{ item.total_energy?.toLocaleString() }} g
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav class="nav-bar">
      <div class="nav-item" @click="$router.push('/')">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/plant')">
        <span class="nav-icon">🌲</span>
        <span>种树</span>
      </div>
      <div class="nav-item active" @click="$router.push('/leaderboard')">
        <span class="nav-icon">🏆</span>
        <span>排行</span>
      </div>
      <div class="nav-item" @click="authStore.logout(); $router.push('/login')">
        <span class="nav-icon">👤</span>
        <span>退出</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

const leaderboard = ref([])
const loading = ref(true)

const loadLeaderboard = async () => {
  try {
    const response = await api.get('/leaderboard')
    leaderboard.value = response.data
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLeaderboard()
})
</script>
