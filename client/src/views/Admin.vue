<template>
  <div class="admin-page">
    <el-row :gutter="20">
      <el-col :span="5">
        <el-card class="admin-sidebar">
          <div class="admin-header">
            <el-icon><Tools /></el-icon>
            <span>管理后台</span>
          </div>
          
          <el-divider />
          
          <el-menu
            :default-active="activeMenu"
            router
            background-color="#ffffff"
            text-color="#303133"
            active-text-color="#409eff"
          >
            <el-menu-item index="/admin">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据概览</span>
            </el-menu-item>
            <el-menu-item index="/admin/moderation">
              <el-icon><DocumentChecked /></el-icon>
              <span>内容审核</span>
            </el-menu-item>
            <el-menu-item index="/admin/archives">
              <el-icon><Box /></el-icon>
              <span>归档记录</span>
            </el-menu-item>
            <el-menu-item index="/admin/users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      
      <el-col :span="19">
        <router-view />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style lang="scss" scoped>
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-sidebar {
  .admin-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    
    .el-icon {
      font-size: 24px;
      color: #409eff;
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
