<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo">
        <el-icon v-if="isCollapse" :size="32"><DataLine /></el-icon>
        <span v-else class="logo-text">会展管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager', 'operator'])" index="/barcode">
          <el-icon><QRCode /></el-icon>
          <template #title>条码管理</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager', 'operator'])" index="/entry-scan">
          <el-icon><Camera /></el-icon>
          <template #title>入场扫描</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager', 'operator'])" index="/catering-scan">
          <el-icon><Coffee /></el-icon>
          <template #title>餐饮消费</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager', 'operator'])" index="/booklet-scan">
          <el-icon><Reading /></el-icon>
          <template #title>图册发放</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager'])" index="/device">
          <el-icon><Monitor /></el-icon>
          <template #title>手持机管理</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager'])" index="/department">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>部门管理</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager'])" index="/time-slot">
          <el-icon><Clock /></el-icon>
          <template #title>时段设置</template>
        </el-menu-item>
        
        <el-menu-item v-if="hasPermission(['admin', 'manager'])" index="/user">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        
        <el-sub-menu v-if="hasPermission(['admin', 'manager'])" index="reports">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>统计报表</span>
          </template>
          <el-menu-item index="/reports/entry">入场统计</el-menu-item>
          <el-menu-item index="/reports/catering">餐饮统计</el-menu-item>
          <el-menu-item index="/reports/booklet">图册统计</el-menu-item>
          <el-menu-item index="/reports/department">部门统计</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title || item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon class="user-icon"><UserFilled /></el-icon>
              <span class="user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-tag :type="roleTagType" size="small" class="role-tag">
                {{ roleLabel }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched
})

const roleLabel = computed(() => {
  const roleMap = {
    admin: '管理员',
    manager: '经理',
    operator: '操作员'
  }
  return roleMap[userStore.userInfo?.role] || '未知'
})

const roleTagType = computed(() => {
  const typeMap = {
    admin: 'danger',
    manager: 'warning',
    operator: 'primary'
  }
  return typeMap[userStore.userInfo?.role] || 'info'
})

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function hasPermission(roles) {
  return roles.includes(userStore.userInfo?.role)
}

async function handleCommand(command) {
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
      // 用户取消
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #263445;
    
    .logo-text {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.layout-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 15px;
      color: #606266;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .user-icon {
        font-size: 20px;
        color: #409EFF;
        margin-right: 8px;
      }
      
      .user-name {
        margin-right: 10px;
        color: #606266;
      }
      
      .role-tag {
        transform: scale(0.9);
      }
    }
  }
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
