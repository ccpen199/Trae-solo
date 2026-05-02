<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon size="24"><Document /></el-icon>
        <span class="title">知识库系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/documents">
          <el-icon><Document /></el-icon>
          <template #title>文档管理</template>
        </el-menu-item>
        <el-menu-item index="/directories">
          <el-icon><Folder /></el-icon>
          <template #title>目录管理</template>
        </el-menu-item>
        <el-menu-item index="/tags">
          <el-icon><PriceTag /></el-icon>
          <template #title>标签管理</template>
        </el-menu-item>
        <el-menu-item index="/todos">
          <el-icon><Bell /></el-icon>
          <template #title>
            待办事项
            <el-badge :value="todoCount" :max="99" class="badge" />
          </template>
        </el-menu-item>
        <el-menu-item index="/search">
          <el-icon><Search /></el-icon>
          <template #title>搜索</template>
        </el-menu-item>
        <el-menu-item index="/users" v-if="isAdmin">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/audit" v-if="isAdmin">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              <el-icon><User /></el-icon>
              {{ user?.name }} ({{ userRoleLabel }})
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { todoApi } from '@/api'

const route = useRoute()
const router = useRouter()

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const todoCount = ref(0)

const activeMenu = computed(() => route.path)

const isAdmin = computed(() => {
  return user.value.role === 'admin' || user.value.role === 'knowledge_manager'
})

const userRoleLabel = computed(() => {
  const roleMap = {
    admin: '管理员',
    knowledge_manager: '知识管理员',
    expert: '专家',
    customer_service: '客服',
    newbie: '新人',
    employee: '员工'
  }
  return roleMap[user.value.role] || user.value.role
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title)
  return matched.map(r => ({
    path: r.path,
    title: r.meta.title
  }))
})

const loadTodoCount = async () => {
  try {
    const res = await todoApi.list({ is_read: 0 })
    todoCount.value = res.data.unreadCount || 0
  } catch (e) {
    console.error(e)
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (e) {
      if (e !== 'cancel') {
        console.error(e)
      }
    }
  }
}

watch(() => route.path, () => {
  loadTodoCount()
}, { immediate: true })
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
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
  border-bottom: 1px solid #3a4a5c;
}

.menu {
  border-right: none;
}

.badge {
  margin-left: 8px;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.user-info {
  cursor: pointer;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
