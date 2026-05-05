<template>
  <div class="tab-bar">
    <div 
      v-for="item in tabs" 
      :key="item.path"
      class="tab-item"
      :class="{ active: isActive(item.path) }"
      @click="goTo(item.path)"
    >
      <el-icon :size="24">
        <component :is="isActive(item.path) ? item.activeIcon : item.icon" />
      </el-icon>
      <span class="tab-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: '首页', icon: 'HomeFilled', activeIcon: 'HomeFilled' },
  { path: '/category', label: '分类', icon: 'Menu', activeIcon: 'Menu' },
  { path: '/discover', label: '发现', icon: 'Compass', activeIcon: 'Compass' },
  { path: '/store', label: '门店', icon: 'OfficeBuilding', activeIcon: 'OfficeBuilding' },
  { path: '/my', label: '我的', icon: 'User', activeIcon: 'UserFilled' }
]

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 750px;
  margin: 0 auto;
  height: 60px;
  background-color: #fff;
  display: flex;
  border-top: 1px solid #eee;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active {
  color: #409eff;
}

.tab-label {
  font-size: 11px;
  margin-top: 4px;
}
</style>
