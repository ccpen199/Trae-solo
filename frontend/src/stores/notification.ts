import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import mockData from '@/utils/mock-data'
import type { Notification } from '@/types'
import { useUserStore } from '@/stores/user'

export const useNotificationStore = defineStore('notification', () => {
  const userStore = useUserStore()
  
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.isRead)
  )

  const loadMockNotifications = () => {
    if (userStore.isLoggedIn && userStore.user) {
      notifications.value = mockData.getMockNotifications(userStore.user.id)
      unreadCount.value = mockData.getMockUnreadCount(userStore.user.id)
    } else {
      notifications.value = mockData.mockNotifications.filter(n => n.userId === 'buyer-001')
      unreadCount.value = mockData.mockNotifications.filter(n => n.userId === 'buyer-001' && !n.isRead).length
    }
  }

  const fetchUnreadCount = async (): Promise<number> => {
    if (userStore.isLoggedIn && userStore.user) {
      unreadCount.value = mockData.getMockUnreadCount(userStore.user.id)
    }
    return unreadCount.value
  }

  const markAsRead = async (id: string): Promise<void> => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  const markAllAsRead = async (): Promise<void> => {
    notifications.value.forEach(n => (n.isRead = true))
    unreadCount.value = 0
  }

  const fetchList = async (): Promise<Notification[]> => {
    loadMockNotifications()
    return notifications.value
  }

  return {
    notifications,
    unreadCount,
    unreadNotifications,
    loadMockNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    fetchList,
  }
})
