<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="getLayout(route.meta.layout)" :key="route.fullPath">
        <component :is="Component" />
      </component>
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import PortalLayout from '@/components/layout/PortalLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import EnterpriseLayout from '@/components/layout/EnterpriseLayout.vue'
import BlankLayout from '@/components/layout/BlankLayout.vue'

const layoutMap: Record<string, any> = {
  portal: PortalLayout,
  admin: AdminLayout,
  enterprise: EnterpriseLayout,
  blank: BlankLayout
}

function getLayout(layout: unknown) {
  return layoutMap[layout as string] || PortalLayout
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
