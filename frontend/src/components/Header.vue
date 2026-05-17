<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">📕</span>
        <span class="logo-text">小红书</span>
      </div>
    </div>

    <div class="header-center">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索笔记、商品、用户"
        size="large"
        @keyup.enter="handleSearch"
        @click="handleSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="header-right">
      <el-button
        type="primary"
        size="large"
        @click="$router.push('/publish')"
        class="publish-btn"
      >
        <el-icon><Plus /></el-icon>
        发布笔记
      </el-button>

      <el-badge :value="3" class="message-badge">
        <el-button circle @click="$router.push('/messages')">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>

      <el-badge :value="cartCount" class="cart-badge">
        <el-button circle @click="$router.push('/cart')">
          <el-icon><ShoppingCart /></el-icon>
        </el-button>
      </el-badge>

      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="36" :src="userStore.user?.avatar" />
          <span class="username">{{ userStore.user?.nickname }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$router.push('/profile')">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item @click="$router.push('/cart')">
              <el-icon><ShoppingCart /></el-icon>
              购物车
            </el-dropdown-item>
            <el-dropdown-item @click="$router.push('/orders')">
              <el-icon><Document /></el-icon>
              我的订单
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Plus, Bell, ShoppingCart, User, Document, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const searchKeyword = ref('')
const cartCount = ref(0)

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(searchKeyword.value)}`)
  } else {
    router.push('/search')
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
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;

  .header-left {
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #ff2442;

      .logo-icon {
        font-size: 24px;
      }
    }
  }

  .header-center {
    flex: 1;
    max-width: 500px;
    margin: 0 40px;

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: 20px;
        background: #f5f5f5;
        box-shadow: none;

        &:hover {
          background: #eee;
        }

        &.is-focus {
          background: #fff;
          box-shadow: 0 0 0 2px rgba(255, 36, 66, 0.1);
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .publish-btn {
      border-radius: 20px;
      background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
      border: none;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 36, 66, 0.3);
      }
    }

    .message-badge,
    .cart-badge {
      :deep(.el-badge__content) {
        background: #ff2442;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 20px;
      transition: background 0.2s;

      &:hover {
        background: #f5f5f5;
      }

      .username {
        font-size: 14px;
        color: #333;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
