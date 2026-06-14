<template>
  <div class="profile-layout">
    <div class="page-header">
      <div class="container">
        <h2>个人中心</h2>
        <p>管理您的个人信息和办件记录</p>
      </div>
    </div>
    
    <div class="container profile-container">
      <aside class="sidebar">
        <div class="user-card card">
          <el-avatar :size="80" class="mb-16">{{ userStore.userInfo?.real_name?.charAt(0) || '用' }}</el-avatar>
          <h3 class="username">{{ userStore.userInfo?.real_name || '用户' }}</h3>
          <p class="user-region">{{ userStore.userInfo?.region_name || '' }}</p>
          <div class="user-level">
            <el-tag size="small" type="primary">
              {{ userStore.userInfo?.level === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
        </div>
        
        <el-menu
          :default-active="$route.path"
          class="menu card"
          router
        >
          <el-menu-item index="/profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
          <el-menu-item index="/profile/applications">
            <el-icon><Document /></el-icon>
            <span>我的办件</span>
          </el-menu-item>
          <el-menu-item index="/profile/evaluations">
            <el-icon><Star /></el-icon>
            <span>我的评价</span>
          </el-menu-item>
          <el-menu-item index="/profile/certificates">
            <el-icon><CreditCard /></el-icon>
            <span>我的证照</span>
          </el-menu-item>
          <el-menu-item index="/profile/notifications">
            <el-icon><Bell /></el-icon>
            <span>消息通知</span>
          </el-menu-item>
        </el-menu>
      </aside>
      
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
</script>

<style lang="scss" scoped>
.profile-layout {
  min-height: calc(100vh - 70px);
}

.profile-container {
  display: flex;
  gap: 24px;
  padding-bottom: 60px;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
}

.user-card {
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
  
  .username {
    font-size: 18px;
    font-weight: 600;
    margin: 12px 0 4px;
  }
  
  .user-region {
    font-size: 13px;
    color: #909399;
    margin-bottom: 12px;
  }
}

.menu {
  padding: 12px 0;
  border-right: none;
  
  .el-menu-item {
    height: 50px;
    line-height: 50px;
    font-size: 14px;
    
    &.is-active {
      background: #e3f2fd;
      color: #1e88e5;
    }
    
    &:hover {
      background: #f5f7fa;
    }
  }
}

.content {
  flex: 1;
  min-width: 0;
}

.page-header {
  h2 {
    font-size: 28px;
    margin: 0 0 8px;
  }
  
  p {
    margin: 0;
    opacity: 0.9;
  }
}
</style>
