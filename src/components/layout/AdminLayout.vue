<template>
  <div class="min-h-screen flex bg-gray-50">
    <aside class="w-64 bg-white border-r border-gray-100 flex flex-col">
      <div class="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
        <div class="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
          <span class="text-white font-bold">德</span>
        </div>
        <div>
          <div class="text-sm font-bold text-gray-900">大件运营平台</div>
          <div class="text-xs text-gray-500">Deppon Admin</div>
        </div>
      </div>

      <nav class="flex-1 py-4 px-3 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          :class="isActive(item.path) ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="ml-auto px-2 py-0.5 rounded-full text-xs bg-alert-500 text-white">
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
            管
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">管理员</div>
            <div class="text-xs text-gray-500">运营调度组</div>
          </div>
          <router-link to="/" class="text-gray-400 hover:text-gray-600">
            <component :is="icons.LogOut" class="w-4 h-4" />
          </router-link>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>
          <p class="text-xs text-gray-500">{{ pageSubtitle }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <component :is="icons.Bell" class="w-5 h-5" />
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-alert-500"></span>
          </button>
          <button class="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <component :is="icons.Settings" class="w-5 h-5" />
          </button>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto animate-fade-in">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard, Route, Video, FileText, Truck, Bell, Settings, LogOut, ReceiptText
} from 'lucide-vue-next'

const icons = { Bell, Settings, LogOut }
const route = useRoute()

const menuItems = [
  { path: '/admin/dashboard', label: '数据概览', icon: LayoutDashboard },
  { path: '/admin/routing', label: '路由规划引擎', icon: Route },
  { path: '/admin/video-review', label: '装卸视频审核', icon: Video, badge: '3' },
  { path: '/admin/claims', label: '理赔中心', icon: FileText, badge: '1' },
  { path: '/admin/vehicles', label: '车辆监控对接', icon: Truck },
  { path: '/admin/auditing', label: '对账审计', icon: ReceiptText, badge: '2' }
]

const titleMap: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: '数据概览', subtitle: '大件物流运营核心指标实时监控' },
  '/admin/routing': { title: '大件路由规划引擎', subtitle: '智能规避限高限重路段，多方案对比选优' },
  '/admin/video-review': { title: '装卸作业视频审核', subtitle: 'AI智能抽检 + 人工复核' },
  '/admin/claims': { title: '理赔中心', subtitle: 'OCR智能识别 · 结构化录入 · 快速理算' },
  '/admin/vehicles': { title: '车辆监控对接', subtitle: '交通运输部货运车辆动态监控平台' },
  '/admin/auditing': { title: '对账审计中心', subtitle: '客户账单核对 · 差异追踪 · 财务留痕' }
}

const pageInfo = computed(() => titleMap[route.path] || { title: '', subtitle: '' })
const pageTitle = computed(() => pageInfo.value.title)
const pageSubtitle = computed(() => pageInfo.value.subtitle)

function isActive(path: string) {
  return route.path === path
}
</script>
