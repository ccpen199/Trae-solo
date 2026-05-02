<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-aside">
      <div class="logo">
        <el-icon :size="30"><Document /></el-icon>
        <span>会计记账系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        class="app-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/vouchers">
          <el-icon><Tickets /></el-icon>
          <span>凭证管理</span>
        </el-menu-item>
        <el-menu-item index="/ledgers">
          <el-icon><Notebook /></el-icon>
          <span>账簿管理</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <span>报表管理</span>
        </el-menu-item>
        <el-menu-item index="/closure">
          <el-icon><Checked /></el-icon>
          <span>月末结账</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-title">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >{{ item.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-user">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ currentUser.name }}</span>
              <el-tag :type="userRoleType" size="small">{{ userRoleLabel }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="switchRole('accountant')">
                  切换角色：会计
                </el-dropdown-item>
                <el-dropdown-item @click="switchRole('auditor')">
                  切换角色：审计
                </el-dropdown-item>
                <el-dropdown-item @click="switchRole('boss')">
                  切换角色：老板
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCurrentUser, setUser } from './api'

const route = useRoute()

const activeMenu = computed(() => route.path)

const currentUser = ref(getCurrentUser())

const userRoleLabel = computed(() => {
  const labels = {
    accountant: '会计',
    auditor: '审计',
    cashier: '出纳',
    boss: '老板',
    tax: '税务'
  }
  return labels[currentUser.value.role] || currentUser.value.role
})

const userRoleType = computed(() => {
  const types = {
    accountant: 'primary',
    auditor: 'warning',
    cashier: 'success',
    boss: 'danger',
    tax: 'info'
  }
  return types[currentUser.value.role] || ''
})

const breadcrumbs = computed(() => {
  const crumbs = [{ path: '/dashboard', name: '首页' }]
  const routeNames = {
    '/vouchers': { path: '/vouchers', name: '凭证管理' },
    '/vouchers/create': { path: '/vouchers/create', name: '新建凭证' },
    '/ledgers': { path: '/ledgers', name: '账簿管理' },
    '/reports': { path: '/reports', name: '报表管理' },
    '/closure': { path: '/closure', name: '月末结账' }
  }
  if (route.path.startsWith('/vouchers/') && route.path !== '/vouchers/create') {
    crumbs.push(routeNames['/vouchers'])
    crumbs.push({ path: route.path, name: '凭证详情' })
  } else if (routeNames[route.path]) {
    crumbs.push(routeNames[route.path])
  }
  return crumbs
})

function switchRole(role) {
  const user = {
    id: `user-${role}`,
    name: role === 'accountant' ? '张会计' : role === 'auditor' ? '李审计' : '赵老板',
    role: role
  }
  setUser(user)
  currentUser.value = user
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  height: 100%;
}

.app-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5f;
}

.app-menu {
  border-right: none;
}

.app-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-title {
  flex: 1;
}

.header-user {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-name {
  color: #606266;
}

.app-main {
  background: #f0f2f5;
  padding: 20px;
}

.page-card {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-draft { background: #e6a23c; color: #fff; }
.status-pending-review { background: #409eff; color: #fff; }
.status-under-review { background: #e6a23c; color: #fff; }
.status-review-passed { background: #67c23a; color: #fff; }
.status-review-rejected { background: #f56c6c; color: #fff; }
.status-pending-ledger { background: #909399; color: #fff; }
.status-ledger-generated { background: #67c23a; color: #fff; }
.status-pending-report { background: #409eff; color: #fff; }
.status-report-generated { background: #67c23a; color: #fff; }
.status-pending-closure { background: #e6a23c; color: #fff; }
.status-closed { background: #909399; color: #fff; }
.status-cancelled { background: #f56c6c; color: #fff; }
</style>
