<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { api } from '../api'
import { $message } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()

const showPasswordModal = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

function logout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/')
  }
}

async function resetPassword() {
  if (!newPassword.value || newPassword.value.length < 6) {
    $message.show('密码长度至少6位')
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    $message.show('两次输入密码不一致')
    return
  }
  
  try {
    await api.resetPassword(userStore.currentUser.id, newPassword.value)
    $message.show('密码重置成功', 'success')
    showPasswordModal.value = false
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {}
}
</script>

<template>
  <div class="profile h-full flex flex-col">
    <div class="header p-32 bg-primary text-white text-center">
      <div class="avatar w-64 h-64 rounded-full bg-white/20 flex items-center justify-center text-32 mx-auto mb-12">
        👤
      </div>
      <div class="text-20 font-medium">{{ userStore.currentUser?.name || '用户' }}</div>
      <div class="text-14 opacity-80 mt-4">{{ userStore.currentUser?.phone || '' }}</div>
    </div>
    
    <div class="content flex-1 p-16">
      <div class="card balance-card mb-24">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-14 text-secondary">零钱余额</div>
            <div class="text-28 font-bold text-primary mt-4">
              ¥{{ userStore.balance?.toFixed(2) || '0.00' }}
            </div>
          </div>
          <div class="text-40">💰</div>
        </div>
      </div>
      
      <div class="menu-list card">
        <button 
          class="w-full flex items-center justify-between p-12 border-b"
          @click="router.push('/transactions')"
        >
          <div class="flex items-center gap-12">
            <span class="text-20">📋</span>
            <span class="text-16">交易记录</span>
          </div>
          <span class="text-secondary">→</span>
        </button>
        
        <button 
          class="w-full flex items-center justify-between p-12 border-b"
          @click="router.push('/bank-cards')"
        >
          <div class="flex items-center gap-12">
            <span class="text-20">💳</span>
            <span class="text-16">银行卡管理</span>
          </div>
          <span class="text-secondary">→</span>
        </button>
        
        <button 
          class="w-full flex items-center justify-between p-12 border-b"
          @click="showPasswordModal = true"
        >
          <div class="flex items-center gap-12">
            <span class="text-20">🔐</span>
            <span class="text-16">重置支付密码</span>
          </div>
          <span class="text-secondary">→</span>
        </button>
        
        <button 
          class="w-full flex items-center justify-between p-12"
          @click="() => {}"
        >
          <div class="flex items-center gap-12">
            <span class="text-20">🔔</span>
            <span class="text-16">通知设置</span>
          </div>
          <span class="text-secondary">→</span>
        </button>
      </div>
      
      <div class="card mt-24">
        <h4 class="text-14 font-medium mb-12">账户信息</h4>
        <div class="space-y-8 text-14">
          <div class="flex justify-between">
            <span class="text-secondary">用户ID</span>
            <span>{{ userStore.currentUser?.id || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-secondary">注册时间</span>
            <span>{{ new Date(userStore.currentUser?.created_at || Date.now()).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>
      
      <button class="btn btn-danger w-full mt-24" @click="logout">
        退出登录
      </button>
    </div>
    
    <div class="tab-bar flex bg-white border-t">
      <button 
        class="flex-1 flex flex-col items-center p-12"
        @click="() => router.push('/receive')"
      >
        <span class="text-20">💰</span>
        <span class="text-12 text-secondary mt-4">收钱</span>
      </button>
      <button 
        class="flex-1 flex flex-col items-center p-12"
        @click="() => router.push('/bank-cards')"
      >
        <span class="text-20">💳</span>
        <span class="text-12 text-secondary mt-4">银行卡</span>
      </button>
      <button 
        class="flex-1 flex flex-col items-center p-12 active"
        @click="() => router.push('/profile')"
      >
        <span class="text-20">👤</span>
        <span class="text-12 text-primary mt-4">我的</span>
      </button>
    </div>
    
    <div v-if="showPasswordModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="modal-content bg-white rounded-xl p-24 w-320 max-w-full mx-16">
        <h3 class="text-18 font-medium text-center mb-16">重置支付密码</h3>
        
        <div class="mb-12">
          <input 
            v-model="newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            class="input"
          />
        </div>
        
        <div class="mb-24">
          <input 
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            class="input"
          />
        </div>
        
        <div class="flex gap-12">
          <button class="btn btn-outline flex-1" @click="showPasswordModal = false">
            取消
          </button>
          <button class="btn btn-primary flex-1" @click="resetPassword">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-32 {
  padding: 32px;
}

.p-16 {
  padding: 16px;
}

.p-12 {
  padding: 12px;
}

.p-24 {
  padding: 24px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-24 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-24 {
  margin-top: 24px;
}

.gap-12 {
  gap: 12px;
}

.w-64 {
  width: 64px;
}

.h-64 {
  height: 64px;
}

.w-320 {
  width: 320px;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.mx-16 {
  margin-left: 16px;
  margin-right: 16px;
}

.bg-primary {
  background: var(--primary);
}

.bg-white\/20 {
  background: rgba(255, 255, 255, 0.2);
}

.border-b {
  border-bottom: 1px solid var(--border);
}

.rounded-full {
  border-radius: 9999px;
}

.rounded-xl {
  border-radius: 12px;
}

.text-center {
  text-align: center;
}

.text-32 {
  font-size: 32px;
}

.text-28 {
  font-size: 28px;
}

.text-20 {
  font-size: 20px;
}

.space-y-8 > * + * {
  margin-top: 8px;
}

.tab-bar {
  border-top-color: var(--border);
}

.tab-bar button.active {
  color: var(--primary);
}
</style>
