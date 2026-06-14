import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    currentRole: localStorage.getItem('currentRole') || ''
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setRole(role) {
      this.currentRole = role
      localStorage.setItem('currentRole', role)
    }
  }
})
