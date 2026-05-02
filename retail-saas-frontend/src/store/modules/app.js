import { defineStore } from 'pinia'
import { getStorage, setStorage, removeStorage } from '@/utils/auth'

const appStoreKey = 'retail-saas-app'

const defaultAppState = {
  sidebar: {
    collapsed: false,
    withoutAnimation: false
  },
  device: 'desktop',
  size: 'default',
  cachedViews: [],
  visitedViews: []
}

function loadAppState() {
  const saved = getStorage(appStoreKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return { ...defaultAppState, ...parsed }
    } catch {
      return defaultAppState
    }
  }
  return defaultAppState
}

export const useAppStore = defineStore('app', {
  state: () => ({
    ...loadAppState()
  }),

  getters: {
    sidebarCollapsed: (state) => state.sidebar.collapsed
  },

  actions: {
    toggleSidebar(withoutAnimation = false) {
      this.sidebar.collapsed = !this.sidebar.collapsed
      this.sidebar.withoutAnimation = withoutAnimation
      this.saveState()
    },

    closeSidebar(withoutAnimation = false) {
      this.sidebar.collapsed = true
      this.sidebar.withoutAnimation = withoutAnimation
      this.saveState()
    },

    toggleDevice(device) {
      this.device = device
      this.saveState()
    },

    setSize(size) {
      this.size = size
      this.saveState()
    },

    addCachedView(view) {
      if (this.cachedViews.includes(view.name)) return
      if (view.meta && view.meta.cache !== false) {
        this.cachedViews.push(view.name)
      }
    },

    removeCachedView(view) {
      const index = this.cachedViews.indexOf(view.name)
      index > -1 && this.cachedViews.splice(index, 1)
    },

    addVisitedView(view) {
      if (this.visitedViews.some(v => v.path === view.path)) return
      this.visitedViews.push(
        Object.assign({}, view, {
          title: view.meta?.title || 'no-name'
        })
      )
    },

    removeVisitedView(view) {
      const index = this.visitedViews.findIndex(v => v.path === view.path)
      index > -1 && this.visitedViews.splice(index, 1)
    },

    resetState() {
      this.$reset()
      removeStorage(appStoreKey)
    },

    saveState() {
      const stateToSave = {
        sidebar: this.sidebar,
        device: this.device,
        size: this.size
      }
      setStorage(appStoreKey, JSON.stringify(stateToSave))
    }
  }
})
