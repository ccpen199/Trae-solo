<template>
  <aside
    class="h-screen bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <div class="h-16 flex items-center justify-between px-4 border-b border-neutral-800 shrink-0">
      <div v-if="!collapsed" class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-gov-gradient rounded-lg flex items-center justify-center">
          <Building2 class="w-4 h-4 text-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-bold text-white leading-tight">抚州政务</span>
          <span class="text-xs text-neutral-500 leading-tight">管理后台</span>
        </div>
      </div>
      <div v-else class="w-full flex justify-center">
        <div class="w-8 h-8 bg-gov-gradient rounded-lg flex items-center justify-center">
          <Building2 class="w-4 h-4 text-white" />
        </div>
      </div>
    </div>

    <nav class="flex-1 py-4 overflow-y-auto scrollbar-thin">
      <el-menu
        :default-active="activeMenu"
        background-color="#1A1F29"
        text-color="#94A3B8"
        active-text-color="#60A5FA"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="admin-menu !border-none"
      >
        <el-menu-item index="/admin">
          <template #icon>
            <LayoutDashboard class="w-5 h-5" />
          </template>
          <span>工作台</span>
        </el-menu-item>

        <el-sub-menu index="services-group">
          <template #title>
            <Briefcase class="w-5 h-5 mr-2" />
            <span>服务管理</span>
          </template>
          <el-menu-item index="/admin/services">服务列表</el-menu-item>
          <el-menu-item index="/admin/forms">表单管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/monitor">
          <template #icon>
            <Activity class="w-5 h-5" />
          </template>
          <span>实时监控</span>
        </el-menu-item>

        <el-menu-item index="/admin/tickets">
          <template #icon>
            <Ticket class="w-5 h-5" />
          </template>
          <span>工单处理</span>
        </el-menu-item>

        <el-menu-item index="/admin/evaluations">
          <template #icon>
            <Star class="w-5 h-5" />
          </template>
          <span>评价管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/reports">
          <template #icon>
            <BarChart3 class="w-5 h-5" />
          </template>
          <span>数据报表</span>
        </el-menu-item>

        <el-menu-item index="/admin/users">
          <template #icon>
            <Users class="w-5 h-5" />
          </template>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </nav>

    <div class="p-3 border-t border-neutral-800 shrink-0">
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-200"
        @click="$emit('toggle-collapse')"
      >
        <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
        <span v-if="!collapsed" class="text-sm">收起菜单</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Building2,
  LayoutDashboard,
  Briefcase,
  Activity,
  Ticket,
  Star,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style>
.admin-menu .el-menu-item,
.admin-menu .el-sub-menu__title {
  height: 44px !important;
  line-height: 44px !important;
  margin: 2px 8px !important;
  border-radius: 8px !important;
}

.admin-menu .el-menu-item:hover,
.admin-menu .el-sub-menu__title:hover {
  background-color: rgba(96, 165, 250, 0.1) !important;
}

.admin-menu .el-menu-item.is-active {
  background-color: rgba(96, 165, 250, 0.15) !important;
  color: #60A5FA !important;
}

.admin-menu .el-sub-menu .el-menu-item {
  padding-left: 48px !important;
}

.admin-menu:not(.el-menu--collapse) .el-sub-menu .el-menu-item {
  min-width: calc(100% - 16px) !important;
}
</style>
