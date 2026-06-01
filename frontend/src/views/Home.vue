<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <div class="user-info">
        <div class="friend-avatar">{{ authStore.user?.username?.charAt(0)?.toUpperCase() }}</div>
        <div style="color: white;">
          <div style="font-weight: bold;">{{ authStore.user?.username }}</div>
          <div style="font-size: 12px;">已种树 {{ authStore.user?.trees_planted }} 棵</div>
        </div>
      </div>
      <div class="energy-display">
        🌱 {{ authStore.user?.current_energy?.toLocaleString() }} g
      </div>
    </div>

    <div style="position: relative; height: 300px; margin-bottom: 20px;">
      <div class="tree">🌳</div>
      
      <div
        v-for="(bubble, index) in energyBubbles"
        :key="bubble.id"
        class="energy-bubble"
        :style="getBubblePosition(index)"
        @click="collectEnergy(bubble)"
      >
        {{ bubble.amount }}g
      </div>
    </div>

    <div class="card" style="display: flex; justify-content: space-around;">
      <div style="text-align: center; cursor: pointer;" @click="$router.push('/plant')">
        <div style="font-size: 32px;">🌲</div>
        <div style="font-size: 14px; color: #333;">去种树</div>
      </div>
      <div style="text-align: center; cursor: pointer;" @click="$router.push('/my-trees')">
        <div style="font-size: 32px;">🏆</div>
        <div style="font-size: 14px; color: #333;">我的树</div>
      </div>
      <div style="text-align: center; cursor: pointer;" @click="$router.push('/leaderboard')">
        <div style="font-size: 32px;">📊</div>
        <div style="font-size: 14px; color: #333;">排行榜</div>
      </div>
      <div style="text-align: center; cursor: pointer;" @click="$router.push('/activities')">
        <div style="font-size: 32px;">📝</div>
        <div style="font-size: 14px; color: #333;">动态</div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="color: #333;">好友森林</h3>
        <span style="font-size: 12px; color: #666; cursor: pointer;" @click="$router.push('/notifications')">通知 🔔</span>
      </div>
      
      <div v-if="friends.length === 0" class="loading">
        加载中...
      </div>
      
      <div
        v-for="friend in friends"
        :key="friend.id"
        class="friend-item"
        :class="{ 'has-energy': friend.has_collectable_energy }"
        @click="$router.push(`/friend/${friend.id}`)"
      >
        <div class="friend-avatar">{{ (friend.remark || friend.username).charAt(0).toUpperCase() }}</div>
        <div style="flex: 1; margin-left: 12px;">
          <div style="font-weight: 500; color: #333; display: flex; align-items: center; gap: 6px;">
            {{ friend.remark || friend.username }}
            <span v-if="friend.remark" style="font-size: 12px; color: #999; font-weight: normal;">({{ friend.username }})</span>
          </div>
          <div style="font-size: 12px; color: #666;">
            🌱 {{ friend.current_energy?.toLocaleString() }} g · 🌳 {{ friend.trees_planted }} 棵
          </div>
        </div>
        <div v-if="friend.has_collectable_energy" style="color: #38ef7d; font-size: 12px;">
          可收取
        </div>
      </div>
    </div>

    <nav class="nav-bar">
      <div class="nav-item active" @click="$router.push('/')">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </div>
      <div class="nav-item" @click="$router.push('/plant')">
        <span class="nav-icon">🌲</span>
        <span>种树</span>
      </div>
      <div class="nav-item" @click="$router.push('/leaderboard')">
        <span class="nav-icon">🏆</span>
        <span>排行</span>
      </div>
      <div class="nav-item" @click="handleLogout">
        <span class="nav-icon">👤</span>
        <span>退出</span>
      </div>
    </nav>

    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const friendsStore = useFriendsStore()

const energyBubbles = ref([])
const friends = computed(() => friendsStore.friends)
const toastMessage = ref('')

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => toastMessage.value = '', 2000)
}

const getBubblePosition = (index) => {
  const positions = [
    { left: '20%', top: '60%' },
    { left: '60%', top: '50%' },
    { left: '40%', top: '30%' }
  ]
  return positions[index % positions.length]
}

const loadEnergyBubbles = async () => {
  try {
    const response = await api.get('/energy/bubbles')
    energyBubbles.value = response.data
  } catch (error) {
    console.error('Failed to load energy bubbles:', error)
  }
}

const loadFriends = async () => {
  await friendsStore.loadFriends()
}

const collectEnergy = async (bubble) => {
  try {
    await api.post('/energy/collect', { bubble_id: bubble.id })
    energyBubbles.value = energyBubbles.value.filter(b => b.id !== bubble.id)
    await authStore.updateUser()
    showToast(`收取了 ${bubble.amount}g 绿色能量！`)
  } catch (error) {
    showToast(error.response?.data?.detail || '收取失败')
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadEnergyBubbles()
  loadFriends()
})
</script>
