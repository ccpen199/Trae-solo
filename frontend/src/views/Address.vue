<template>
  <div class="address-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">收货地址</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="!userStore.isLoggedIn" class="login-tip">
      <div class="tip-icon">🔑</div>
      <p>请登录后管理收货地址</p>
      <button class="btn btn-primary" @click="goLogin">立即登录</button>
    </div>

    <div v-else class="address-list">
      <div 
        v-for="address in addresses" 
        :key="address.id" 
        class="address-item"
        :class="{ selected: selectedId === address.id }"
        @click="selectAddress(address)"
      >
        <div class="address-radio">
          <span v-if="selectedId === address.id" class="radio-selected">✓</span>
        </div>
        <div class="address-content">
          <div class="address-header">
            <span class="address-name">{{ address.name }}</span>
            <span class="address-phone">{{ address.phone }}</span>
            <span v-if="address.is_default === 1" class="default-tag">默认</span>
          </div>
          <p class="address-detail">
            {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}
          </p>
        </div>
        <div class="address-actions">
          <span class="action-btn" @click.stop="editAddress(address)">编辑</span>
          <span class="action-btn" @click.stop="deleteAddress(address.id)">删除</span>
        </div>
      </div>

      <button class="add-address-btn" @click="goAddAddress">
        <span class="add-icon">+</span>
        <span>添加新地址</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { addressAPI } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const addresses = ref([])
const selectedId = ref(null)

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadAddresses()
  }
})

async function loadAddresses() {
  try {
    const result = await addressAPI.getAddresses()
    if (result.success) {
      addresses.value = result.data
      const defaultAddress = addresses.value.find(a => a.is_default === 1)
      if (defaultAddress) {
        selectedId.value = defaultAddress.id
      }
    }
  } catch (err) {
    console.error('加载地址失败:', err)
  }
}

function goLogin() {
  router.push('/login')
}

function goAddAddress() {
  router.push('/add-address')
}

function selectAddress(address) {
  selectedId.value = address.id
}

function editAddress(address) {
  router.push({ path: '/add-address', query: { id: address.id } })
}

async function deleteAddress(id) {
  if (!confirm('确定要删除这个地址吗？')) return
  
  try {
    const result = await addressAPI.deleteAddress(id)
    if (result.success) {
      loadAddresses()
    }
  } catch (err) {
    console.error('删除地址失败:', err)
  }
}
</script>

<style scoped>
.address-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.placeholder {
  width: 44px;
}

.login-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.tip-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.login-tip p {
  font-size: 16px;
  color: #666;
  margin: 0 0 20px 0;
}

.address-list {
  padding: 16px;
}

.address-item {
  display: flex;
  gap: 12px;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 2px solid transparent;
}

.address-item.selected {
  border-color: #ff6b35;
}

.address-radio {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.address-item.selected .address-radio {
  border-color: #ff6b35;
  background: #ff6b35;
}

.radio-selected {
  color: #fff;
  font-size: 14px;
}

.address-content {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.address-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.address-phone {
  font-size: 14px;
  color: #666;
}

.default-tag {
  padding: 2px 8px;
  background: #ff6b35;
  color: #fff;
  font-size: 10px;
  border-radius: 4px;
}

.address-detail {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  font-size: 14px;
  color: #ff6b35;
}

.add-address-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 56px;
  background: #fff;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  color: #666;
}

.add-icon {
  font-size: 24px;
  color: #ff6b35;
}
</style>