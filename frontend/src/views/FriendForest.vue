<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="friend-avatar">{{ friend?.username?.charAt(0)?.toUpperCase() }}</div>
        <div style="color: white;">
          <div style="font-weight: bold; display: flex; align-items: center; gap: 8px;">
            {{ friend?.remark || friend?.username }}的森林
            <button @click="toggleEditRemark" style="background: none; border: none; color: white; cursor: pointer; font-size: 14px;">✏️</button>
          </div>
          <div style="font-size: 12px;">
            🌱 {{ friend?.current_energy?.toLocaleString() }} g · 🌳 {{ friend?.trees_planted }} 棵
          </div>
        </div>
      </div>
      <div></div>
    </div>

    <div v-if="editingRemark" class="card" style="margin-bottom: 16px;">
      <h3 style="color: #333; margin-bottom: 12px;">设置备注</h3>
      <div class="input-group">
        <input v-model="newRemark" placeholder="输入备注名称（留空则清除）" />
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-primary" style="flex: 1;" @click="saveRemark">保存</button>
        <button class="btn" style="flex: 1; background: #f0f0f0; color: #666;" @click="cancelEditRemark">取消</button>
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

      <div v-if="energyBubbles.length === 0" style="text-align: center; color: white; padding-top: 100px;">
        暂无能量可收取
      </div>
    </div>

    <div class="card">
      <h3 style="color: #333; margin-bottom: 16px;">给好友留言</h3>
      <div class="input-group">
        <input v-model="messageContent" placeholder="说点什么..." />
      </div>
      <button class="btn btn-primary" style="width: 100%;" @click="sendMessage" :disabled="!messageContent">
        发送消息
      </button>
    </div>

    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFriendsStore } from '@/stores/friends'
import api from '@/services/api'

const route = useRoute()
const authStore = useAuthStore()
const friendsStore = useFriendsStore()

const friendId = parseInt(route.params.id)
const friend = computed(() => friendsStore.getFriendById(friendId))
const energyBubbles = ref([])
const messageContent = ref('')
const toastMessage = ref('')
const editingRemark = ref(false)
const newRemark = ref('')

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

const loadFriendInfo = async () => {
  if (friendsStore.friends.length === 0) {
    await friendsStore.loadFriends()
  }
}

const loadEnergyBubbles = async () => {
  try {
    const response = await api.get(`/friends/${friendId}/energy`)
    energyBubbles.value = response.data
  } catch (error) {
    console.error('Failed to load energy bubbles:', error)
  }
}

const collectEnergy = async (bubble) => {
  try {
    await api.post('/energy/collect', {
      bubble_id: bubble.id,
      friend_id: parseInt(friendId)
    })
    energyBubbles.value = energyBubbles.value.filter(b => b.id !== bubble.id)
    await authStore.updateUser()
    showToast(`从好友森林收取了 ${bubble.amount}g 绿色能量！`)
  } catch (error) {
    showToast(error.response?.data?.detail || '收取失败')
  }
}

const sendMessage = async () => {
  if (!messageContent.value) return
  
  try {
    await api.post('/messages/send', {
      receiver_id: parseInt(friendId),
      content: messageContent.value
    })
    messageContent.value = ''
    showToast('消息发送成功')
  } catch (error) {
    showToast('发送失败')
  }
}

const toggleEditRemark = () => {
  editingRemark.value = !editingRemark.value
  if (editingRemark.value) {
    newRemark.value = friend.value?.remark || ''
  }
}

const cancelEditRemark = () => {
  editingRemark.value = false
  newRemark.value = ''
}

const saveRemark = async () => {
  try {
    await api.post('/friends/remark', {
      friend_id: friendId,
      remark: newRemark.value
    })
    friendsStore.updateFriendRemark(friendId, newRemark.value)
    editingRemark.value = false
    showToast(newRemark.value ? '备注已更新' : '备注已清除')
  } catch (error) {
    showToast('保存备注失败')
  }
}

onMounted(() => {
  loadFriendInfo()
  loadEnergyBubbles()
})
</script>
