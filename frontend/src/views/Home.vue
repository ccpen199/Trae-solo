<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { $message } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const selectedUser = ref('user_001')

const users = [
  { id: 'user_001', name: '张三 (余额: ¥1000)', phone: '13800138001' },
  { id: 'user_002', name: '李四 (余额: ¥500)', phone: '13800138002' }
]

async function login() {
  loading.value = true
  try {
    console.log('尝试登录用户:', selectedUser.value)
    const success = await userStore.login(selectedUser.value)
    if (success) {
      $message.show('登录成功', 'success')
      router.push('/receive')
    } else {
      $message.show('登录失败，请检查后端服务是否启动')
    }
  } catch (e) {
    console.error('登录错误:', e)
    $message.show('网络请求失败，请确认后端服务已启动')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="home h-full flex flex-col">
    <div class="header flex flex-col items-center justify-center p-32">
      <div class="logo text-64 mb-16">💳</div>
      <h1 class="text-24 font-bold text-primary">微信收钱</h1>
      <p class="text-14 text-secondary mt-8">个人收付款演示系统</p>
    </div>
    
    <div class="content flex-1 p-16">
      <div class="card mb-24">
        <h3 class="text-16 font-medium mb-16">选择用户登录</h3>
        <div class="flex flex-col gap-12">
          <label 
            v-for="user in users" 
            :key="user.id"
            class="flex items-center gap-12 p-12 border rounded-lg cursor-pointer"
            :class="{ 'border-primary bg-green-50': selectedUser === user.id }"
          >
            <input 
              type="radio" 
              v-model="selectedUser" 
              :value="user.id"
              class="w-16 h-16"
            />
            <div class="flex-1">
              <div class="text-16 font-medium">{{ user.name }}</div>
              <div class="text-12 text-secondary">{{ user.phone }}</div>
            </div>
          </label>
        </div>
        
        <button 
          class="btn btn-primary w-full mt-24"
          :disabled="loading"
          @click="login"
        >
          <span v-if="loading" class="loading"></span>
          <span v-else>进入系统</span>
        </button>
      </div>
      
      <div class="card">
        <h3 class="text-16 font-medium mb-12">功能说明</h3>
        <ul class="text-14 text-secondary space-y-8">
          <li>📱 收款二维码生成（可设置金额、备注）</li>
          <li>🔍 扫码付款（支持模拟扫描）</li>
          <li>💰 零钱支付、银行卡支付</li>
          <li>💳 银行卡绑定/解绑</li>
          <li>📊 交易记录与对账</li>
          <li>🔐 支付密码验证</li>
        </ul>
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

.mt-8 {
  margin-top: 8px;
}

.mt-24 {
  margin-top: 24px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-12 {
  margin-bottom: 12px;
}

.logo {
  font-size: 64px;
}

.header {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  color: white;
}

.header h1 {
  color: white;
}

.header p {
  color: rgba(255,255,255,0.8);
}

.border {
  border: 1px solid var(--border);
}

.rounded-lg {
  border-radius: 8px;
}

.bg-green-50 {
  background: rgba(7, 193, 96, 0.05);
}

.border-primary {
  border-color: var(--primary);
}

.space-y-8 > * + * {
  margin-top: 8px;
}

.w-16 {
  width: 16px;
}

.h-16 {
  height: 16px;
}
</style>
