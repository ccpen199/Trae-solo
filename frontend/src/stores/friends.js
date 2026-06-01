import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useFriendsStore = defineStore('friends', () => {
  const friends = ref([])
  const loading = ref(false)

  async function loadFriends() {
    loading.value = true
    try {
      const response = await api.get('/friends')
      friends.value = response.data
    } catch (error) {
      console.error('Failed to load friends:', error)
    } finally {
      loading.value = false
    }
  }

  function updateFriendRemark(friendId, remark) {
    const friend = friends.value.find(f => f.id === friendId)
    if (friend) {
      friend.remark = remark || null
    }
  }

  function getFriendById(id) {
    return friends.value.find(f => f.id === id)
  }

  return {
    friends,
    loading,
    loadFriends,
    updateFriendRemark,
    getFriendById
  }
})
