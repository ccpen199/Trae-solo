<template>
  <header class="nav-header">
    <div class="container flex-between">
      <router-link to="/" class="nav-logo">
        <el-icon :size="28"><House /></el-icon>
        <span>标准化套餐系统</span>
      </router-link>
      
      <nav class="nav-menu">
        <router-link to="/">首页</router-link>
        <router-link to="/packages">套餐列表</router-link>
        <router-link to="/accessories">配件商城</router-link>
      </nav>
      
      <div class="nav-actions">
        <router-link to="/cart" class="cart-badge">
          <el-badge :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0">
            <el-button type="primary" circle>
              <el-icon><ShoppingCart /></el-icon>
            </el-button>
          </el-badge>
        </router-link>
        
        <template v-if="userStore.isLoggedIn">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userName }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="orders">
                  <el-icon><Document /></el-icon>
                  我的订单
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button>登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button type="primary">注册</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useCartStore } from '@/store/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const userName = computed(() => {
  const user = userStore.userInfo
  if (!user) return '用户'
  if (user.realName) return user.realName
  if (user.phone) return user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  return '用户'
})

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'orders':
      router.push('/orders')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        userStore.logout()
        cartStore.clearCart()
        ElMessage.success('已退出登录')
        router.push('/')
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  margin: 0 8px;
  font-size: 14px;
  color: #606266;
}

.nav-menu a {
  position: relative;
  padding: 8px 0;
}

.nav-menu a.router-link-active {
  color: #667eea;
}

.nav-menu a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
