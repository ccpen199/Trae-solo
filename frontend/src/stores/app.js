import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const projects = ref([])
  const cloudAccounts = ref([])

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setLoading = (value) => {
    loading.value = value
  }

  const fetchProjects = async () => {
    try {
      const data = await request.get('/admin/projects', {
        params: { pageSize: 100 }
      })
      projects.value = data.list || []
      return projects.value
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return []
    }
  }

  const fetchCloudAccounts = async () => {
    try {
      const data = await request.get('/admin/accounts', {
        params: { pageSize: 100 }
      })
      cloudAccounts.value = data.list || []
      return cloudAccounts.value
    } catch (error) {
      console.error('获取账号列表失败:', error)
      return []
    }
  }

  const initData = async () => {
    await Promise.all([
      fetchProjects(),
      fetchCloudAccounts()
    ])
  }

  return {
    sidebarCollapsed,
    loading,
    projects,
    cloudAccounts,
    toggleSidebar,
    setLoading,
    fetchProjects,
    fetchCloudAccounts,
    initData
  }
})
