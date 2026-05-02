<template>
  <el-container class="main-layout">
    <el-aside width="200px">
      <div class="logo">TMS调度系统</div>
      <el-menu
        :default-active="activeMenu"
        router
        class="side-menu"
      >
        <el-sub-menu index="dispatch">
          <template #title><el-icon><Setting /></el-icon>调度管理</template>
          <el-menu-item index="/dispatch/orders">订单管理</el-menu-item>
          <el-menu-item index="/dispatch/dispatch-center">调度中心</el-menu-item>
          <el-menu-item index="/dispatch/monitor">监控中心</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="driver">
          <template #title><el-icon><Van /></el-icon>司机端</template>
          <el-menu-item index="/driver/waybills">运单列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="customer">
          <template #title><el-icon><User /></el-icon>客户</template>
          <el-menu-item index="/customer/orders">我的订单</el-menu-item>
          <el-menu-item index="/customer/statements">对账单</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="finance">
          <template #title><el-icon><Money /></el-icon>财务</template>
          <el-menu-item index="/finance/freights">运费结算</el-menu-item>
          <el-menu-item index="/finance/statements">对账管理</el-menu-item>
          <el-menu-item index="/finance/reports">运营报表</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title || item.label }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.userInfo?.name || '用户' }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.slice(1)
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示')
    await userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

.el-aside {
  background: #304156;
  color: #fff;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    background: #263445;
  }

  .side-menu {
    border-right: none;
    background: transparent;

    :deep(.el-sub-menu__title),
    :deep(.el-menu-item) {
      color: #bfcbd9;

      &:hover {
        background: #263445;
        color: #fff;
      }
    }

    :deep(.el-menu-item.is-active) {
      background: #409eff !important;
      color: #fff;
    }
  }
}

.el-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
}

.el-main {
  background: #f5f7fa;
  overflow: auto;
}
</style>
