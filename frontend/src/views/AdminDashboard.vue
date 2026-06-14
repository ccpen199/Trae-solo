<template>
  <div class="admin-dashboard">
    <el-container>
      <el-aside width="200px">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/admin">
            <el-icon><DataBoard /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/zones">
            <el-icon><Location /></el-icon>
            <span>运营区配置</span>
          </el-menu-item>
          <el-menu-item index="/admin/restricted-items">
            <el-icon><Warning /></el-icon>
            <span>禁运词库</span>
          </el-menu-item>
          <el-menu-item index="/admin/disputes">
            <el-icon><ScaleToOriginal /></el-icon>
            <span>纠纷仲裁</span>
          </el-menu-item>
          <el-menu-item index="/admin/couriers">
            <el-icon><User /></el-icon>
            <span>骑手管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/audit">
            <el-icon><Document /></el-icon>
            <span>审计日志</span>
          </el-menu-item>
          <el-menu-item index="/home" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header>
          <h2>FastTrust 管理后台</h2>
        </el-header>

        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = ref(route.path)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
}

.el-aside {
  background: #304156;
  color: white;
}

.el-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.el-header h2 {
  margin: 0;
  color: #303133;
}

.el-menu {
  border: none;
  background: #304156;
}

:deep(.el-menu-item) {
  color: #bfcbd9;
}

:deep(.el-menu-item.is-active) {
  background: #263445;
  color: #409eff;
}

:deep(.el-menu-item:hover) {
  background: #263445;
}
</style>
