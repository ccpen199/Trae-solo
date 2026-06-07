<template>
  <div class="bottom-nav">
    <div 
      v-for="item in navItems" 
      :key="item.path"
      class="nav-item"
      :class="{ active: currentPath === item.path }"
      @click="navigate(item.path)"
    >
      <el-icon class="nav-icon">
        <component :is="item.icon" />
      </el-icon>
      <span class="nav-text">{{ item.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeFilled, Grid, Document, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const currentPath = ref('')

const navItems = [
  { name: '首页', path: '/home', icon: HomeFilled },
  { name: '服务', path: '/services', icon: Grid },
  { name: '办件', path: '/applications', icon: Document },
  { name: '证照', path: '/certificates', icon: Document },
  { name: '我的', path: '/profile', icon: UserFilled }
]

onMounted(() => {
  currentPath.value = route.path
})

const navigate = (path) => {
  currentPath.value = path
  router.push(path)
}
</script>
