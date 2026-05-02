<template>
  <el-container>
    <el-header>
      <div class="header-left">
        <el-icon :size="24" color="#fff"><Document /></el-icon>
        <span class="system-title">税务筹划与申报系统</span>
      </div>
      
      <div class="header-right">
        <el-badge :value="userStore.pendingTodoCount" :hidden="userStore.pendingTodoCount === 0" class="todo-badge">
          <el-button text @click="goToOrders" style="color: #fff">
            <el-icon :size="20"><List /></el-icon>
            待办
          </el-button>
        </el-badge>
        
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon :size="18"><User /></el-icon>
            <span>{{ userStore.user?.realName }}</span>
            <el-tag size="small" type="info" effect="dark">{{ userStore.user?.roleDisplay }}</el-tag>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="200px">
        <el-menu
          :default-active="activeMenu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          
          <el-sub-menu index="orders">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>申报管理</span>
            </template>
            <el-menu-item index="/orders">
              <el-icon><List /></el-icon>
              <span>主单台账</span>
            </el-menu-item>
            <el-menu-item index="/orders/create">
              <el-icon><Plus /></el-icon>
              <span>新建申报</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const goToOrders = () => {
  router.push('/orders')
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 取消
    }
  }
}
</script>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.system-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.todo-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
