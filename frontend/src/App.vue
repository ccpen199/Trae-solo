<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <div class="header-inner">
          <div class="logo" @click="$router.push('/')">
            🏠 个人网站
          </div>
          <button class="mobile-menu-btn" @click="toggleMenu">
            {{ menuOpen ? '✕' : '☰' }}
          </button>
          <nav class="nav" :class="{ open: menuOpen }">
            <router-link to="/" @click="menuOpen = false">首页</router-link>
            <router-link to="/profile" @click="menuOpen = false">个人信息</router-link>
            <router-link to="/articles" @click="menuOpen = false">日志</router-link>
            <router-link to="/learning" @click="menuOpen = false">学习园地</router-link>
            <router-link to="/albums" @click="menuOpen = false">相册</router-link>
            <router-link to="/media" @click="menuOpen = false">音乐影视</router-link>
            <router-link to="/guestbook" @click="menuOpen = false">留言板</router-link>
            
            <template v-if="store.state.isLoggedIn">
              <router-link to="/admin" @click="menuOpen = false">后台管理</router-link>
              <a href="#" @click.prevent="handleLogout" style="color: rgba(255,255,255,0.9); cursor: pointer;">
                退出登录 ({{ store.state.user?.username }})
              </a>
            </template>
            <template v-else>
              <router-link to="/login" @click="menuOpen = false">管理员登录</router-link>
            </template>
          </nav>
        </div>
      </div>
    </header>
    
    <main class="main">
      <router-view />
    </main>
    
    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 个人网站 | 用心记录每一刻</p>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">
          前端端口: 22180 | 后端端口: 12180
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { authApi } from '@/api'

const router = useRouter()
const menuOpen = ref(false)
const store = useStore()

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

async function handleLogout() {
  menuOpen.value = false
  
  try {
    await authApi.logout()
  } catch (e) {
    console.error('退出登录失败:', e)
  }
  
  store.clearSession()
  router.push('/')
}
</script>
