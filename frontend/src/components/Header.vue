<template>
  <el-header style="background-color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <el-container style="height: 100%;">
      <el-row :gutter="20" style="height: 100%; align-items: center;">
        <el-col :span="4">
          <router-link to="/home" style="font-size: 24px; font-weight: bold; color: #409eff;">
            <el-icon size="28"><ShoppingCart /></el-icon>
            网上商城
          </router-link>
        </el-col>
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品..."
            prefix-icon="Search"
            style="width: 100%;"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <template v-if="userStore.isLoggedIn">
            <el-button text @click="goToCart">
              <el-badge :value="cartCount" :hidden="cartCount === 0" class="item">
                <el-icon size="20"><ShoppingCart /></el-icon>
              </el-badge>
              购物车
            </el-button>
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link" style="cursor: pointer;">
                <el-icon size="20"><User /></el-icon>
                {{ userStore.userInfo?.username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="admin" v-if="userStore.isAdmin">管理后台</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button text @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </el-col>
      </el-row>
    </el-container>
  </el-header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getCart } from '@/api/cart'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingCart, User, ArrowDown, Search } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchKeyword = ref(route.query.keyword || '')
const cartCount = ref(0)

const fetchCartCount = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await getCart()
    if (res.success) {
      cartCount.value = res.data.totalQuantity || 0
    }
  } catch (error) {
    console.error('获取购物车数量失败', error)
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/home', query: { keyword: searchKeyword.value.trim() } })
  } else {
    router.push('/home')
  }
}

const goToCart = () => {
  router.push('/cart')
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/home')
      }).catch(() => {})
      break
  }
}

onMounted(() => {
  fetchCartCount()
})
</script>
