<template>
  <div id="app">
    <div v-if="!isLoggedIn" class="public-layout">
      <div class="background-gradient"></div>
      <div class="login-container">
        <router-view />
      </div>
    </div>
    <div v-else class="main-layout">
      <Header />
      <div class="content">
        <Sidebar />
        <main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
    <el-backtop :right="40" :bottom="40" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background: #f7f8fa;
}

.public-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  .background-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ff2442 100%);
  }

  .login-container {
    position: relative;
    z-index: 1;
  }
}

.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  display: flex;
  flex: 1;
  margin-top: 60px;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 200px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
