<template>
  <div class="flex h-screen bg-gray-100">
    <aside class="w-64 bg-gray-900 text-white flex flex-col">
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <h1 class="font-bold text-lg">能源监控平台</h1>
            <p class="text-xs text-gray-400">Energy Management</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <router-link 
          to="/" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          <span>监控看板</span>
        </router-link>

        <router-link 
          to="/devices" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/devices' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
          </svg>
          <span>设备管理</span>
        </router-link>

        <router-link 
          to="/alarms" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/alarms' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>告警管理</span>
        </router-link>

        <router-link 
          to="/inspections" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/inspections' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
          <span>巡检管理</span>
        </router-link>

        <router-link 
          to="/todos" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/todos' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <span>待办任务</span>
        </router-link>

        <router-link 
          to="/suggestions" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/suggestions' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span>节能建议</span>
        </router-link>

        <router-link 
          to="/billing" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/billing' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          <span>计费管理</span>
        </router-link>

        <router-link 
          to="/reports" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/reports' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>报表管理</span>
        </router-link>

        <router-link 
          to="/audit" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/audit' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <span>审计日志</span>
        </router-link>

        <router-link 
          to="/timeline" 
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
          :class="$route.path === '/timeline' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>时间线</span>
        </router-link>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h2 class="text-lg font-semibold text-gray-800">{{ currentPageTitle }}</h2>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-sm font-medium text-gray-700">{{ userStore.userName }}</p>
            <p class="text-xs text-gray-500">{{ roleText }}</p>
          </div>
          <button 
            @click="handleLogout"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="退出登录"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const roleMap = {
  'admin': '系统管理员',
  'energy_admin': '能源管理员',
  'maintenance_operator': '设备运维商',
  'finance_accountant': '财务核算员',
  'government_regulator': '政府监管人'
}

const roleText = computed(() => roleMap[userStore.userRole] || userStore.userRole)

const pageTitleMap = {
  '/': '监控看板',
  '/devices': '设备管理',
  '/alarms': '告警管理',
  '/inspections': '巡检管理',
  '/todos': '待办任务',
  '/suggestions': '节能建议',
  '/billing': '计费管理',
  '/reports': '报表管理',
  '/audit': '审计日志',
  '/timeline': '时间线追踪'
}

const currentPageTitle = computed(() => {
  const path = router.currentRoute.value.path
  if (path.startsWith('/devices/')) return '设备详情'
  return pageTitleMap[path] || '能源监控平台'
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
