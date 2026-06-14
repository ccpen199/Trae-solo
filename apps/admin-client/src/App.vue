<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  LayoutDashboard,
  BarChart3,
  Search,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-vue-next';
import { useAdminStore } from '@/stores/admin';

const router = useRouter();
const route = useRoute();
const adminStore = useAdminStore();
const collapsed = ref(false);

const allMenuItems = [
  { key: 'dashboard', label: '数据看板', icon: LayoutDashboard, path: '/' },
  { key: 'cert-analysis', label: '认证分析', icon: BarChart3, path: '/statistics/certification' },
  { key: 'query-top', label: '高频查询', icon: Search, path: '/statistics/query-top' },
  { key: 'reminder', label: '定向提醒', icon: Bell, path: '/tasks/reminder' },
  { key: 'audit', label: '审计日志', icon: FileText, path: '/audit/logs' },
  { key: 'system', label: '系统管理', icon: Settings, path: '/system/users' },
];

const menuItems = computed(() =>
  allMenuItems.filter((item) => adminStore.hasPermission(item.key))
);

const currentMenu = computed(() => {
  const item = allMenuItems.find((m) => m.path === route.path);
  return item?.key ?? 'dashboard';
});

const breadcrumbItems = computed(() => {
  const item = allMenuItems.find((m) => m.path === route.path);
  if (!item) return [{ label: '数据看板' }];
  if (item.key === 'dashboard') return [{ label: '数据看板' }];
  return [{ label: '首页', path: '/' }, { label: item.label }];
});

const roleIcon = computed(() => {
  switch (adminStore.roleLabel) {
    case '超级管理员': return ShieldCheck;
    case '审计员': return ShieldAlert;
    default: return Shield;
  }
});

const roleColor = computed(() => {
  switch (adminStore.roleLabel) {
    case '超级管理员': return 'bg-red-50 text-red-600 border-red-200';
    case '审计员': return 'bg-amber-50 text-amber-600 border-amber-200';
    case '运营专员': return 'bg-blue-50 text-blue-600 border-blue-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
});

function handleMenuClick(path: string) {
  router.push(path);
}

function handleLogout() {
  adminStore.logout();
  router.push('/login');
}

function toggleSidebar() {
  collapsed.value = !collapsed.value;
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <aside
      class="sidebar flex flex-col transition-all duration-300 shrink-0"
      :class="collapsed ? 'w-16' : 'w-56'"
    >
      <div class="flex items-center h-14 px-4 border-b border-white/10">
        <Shield class="w-7 h-7 text-accent shrink-0" />
        <span v-if="!collapsed" class="ml-2 text-sm font-semibold truncate">
          广西人社管理后台
        </span>
      </div>

      <nav class="flex-1 py-2 overflow-y-auto">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="sidebar-menu-item"
          :class="{ active: currentMenu === item.key }"
          @click="handleMenuClick(item.path)"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </div>
      </nav>

      <div class="border-t border-white/10 p-2">
        <button
          class="w-full flex items-center justify-center py-2 text-gray-400 hover:text-white transition-colors rounded"
          @click="toggleSidebar"
        >
          <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span
            v-for="(crumb, idx) in breadcrumbItems"
            :key="idx"
            class="flex items-center gap-2"
          >
            <span v-if="idx > 0" class="text-gray-300">/</span>
            <router-link
              v-if="crumb.path"
              :to="crumb.path"
              class="hover:text-primary transition-colors"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else :class="idx === breadcrumbItems.length - 1 ? 'text-gray-800 font-medium' : ''">
              {{ crumb.label }}
            </span>
          </span>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <User class="w-4 h-4" />
            <span>{{ adminStore.adminInfo?.nameMasked ?? '管理员' }}</span>
          </div>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
            :class="roleColor"
          >
            <component :is="roleIcon" class="w-3 h-3" />
            {{ adminStore.roleLabel }}
          </span>
          <span class="text-[11px] text-gray-400 max-w-[200px] truncate">
            权限：{{ adminStore.permissions.join('、') }}
          </span>
          <button
            class="flex items-center gap-1 text-sm text-gray-500 hover:text-danger transition-colors"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4" />
            <span>退出</span>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 bg-content-bg">
        <router-view />
      </main>
    </div>
  </div>
</template>
