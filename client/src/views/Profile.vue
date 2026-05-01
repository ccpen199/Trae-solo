<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="profile-sidebar">
          <div class="user-info">
            <el-avatar :size="80" :src="userStore.user?.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="user-name">{{ userStore.user?.nickname || userStore.user?.username || '用户' }}</div>
            <el-tag :type="getRoleTagType" size="small">{{ getRoleName }}</el-tag>
          </div>
          
          <el-divider />
          
          <el-menu
            :default-active="activeMenu"
            router
            background-color="#ffffff"
            text-color="#303133"
            active-text-color="#409eff"
          >
            <el-menu-item index="/profile">
              <el-icon><User /></el-icon>
              <span>个人概览</span>
            </el-menu-item>
            <el-menu-item index="/profile/questions">
              <el-icon><ChatDotRound /></el-icon>
              <span>我的提问</span>
            </el-menu-item>
            <el-menu-item index="/profile/answers">
              <el-icon><Edit /></el-icon>
              <span>我的回答</span>
            </el-menu-item>
            <el-menu-item index="/profile/credit">
              <el-icon><Star /></el-icon>
              <span>信用中心</span>
            </el-menu-item>
            <el-menu-item index="/profile/wallet">
              <el-icon><Wallet /></el-icon>
              <span>钱包中心</span>
            </el-menu-item>
            <el-menu-item index="/profile/settings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <router-view />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const getRoleTagType = computed(() => {
  const role = userStore.user?.role
  const typeMap = {
    'admin': 'danger',
    'editor': 'warning',
    'expert': 'primary',
    'answerer': 'success',
    'questioner': 'info'
  }
  return typeMap[role] || 'info'
})

const getRoleName = computed(() => {
  const role = userStore.user?.role
  const nameMap = {
    'admin': '管理员',
    'editor': '知识编辑',
    'expert': '行业专家',
    'answerer': '回答者',
    'questioner': '提问者'
  }
  return nameMap[role] || '用户'
})
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 1400px;
  margin: 0 auto;
}

.profile-sidebar {
  .user-info {
    text-align: center;
    
    .user-name {
      margin-top: 12px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
    
    :deep(.el-tag) {
      margin-top: 8px;
    }
  }
  
  :deep(.el-menu) {
    border-right: none;
    
    .el-menu-item {
      height: 48px;
      line-height: 48px;
      margin-bottom: 4px;
      border-radius: 6px;
      
      &:hover {
        background-color: #ecf5ff;
      }
      
      &.is-active {
        background-color: #ecf5ff;
        color: #409eff;
      }
    }
  }
}
</style>
