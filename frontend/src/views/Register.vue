<template>
  <div class="page-container register-page">
    <div class="register-header">
      <h1>综合电商</h1>
      <p>注册账号</p>
    </div>

    <div class="register-form">
      <div class="form-group">
        <input 
          v-model="username" 
          type="text" 
          placeholder="用户名"
          class="form-input"
          @blur="checkUsername"
        />
        <span v-if="usernameStatus" class="status-text" :class="usernameStatus">{{ usernameMessage }}</span>
      </div>

      <div class="form-group">
        <input 
          v-model="phone" 
          type="text" 
          placeholder="手机号"
          class="form-input"
          @blur="checkPhone"
        />
        <span v-if="phoneStatus" class="status-text" :class="phoneStatus">{{ phoneMessage }}</span>
      </div>

      <div class="form-group">
        <input 
          v-model="email" 
          type="text" 
          placeholder="邮箱（选填）"
          class="form-input"
          @blur="checkEmail"
        />
        <span v-if="emailStatus" class="status-text" :class="emailStatus">{{ emailMessage }}</span>
      </div>

      <div class="form-group">
        <input 
          v-model="password" 
          type="password" 
          placeholder="密码"
          class="form-input"
        />
      </div>

      <button 
        class="btn-register" 
        :disabled="!canSubmit || isSubmitting"
        @click="handleRegister"
      >
        {{ isSubmitting ? '注册中...' : '注册' }}
      </button>

      <div class="register-links">
        <span @click="goToLogin">已有账号？立即登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

const usernameStatus = ref('')
const usernameMessage = ref('')
const phoneStatus = ref('')
const phoneMessage = ref('')
const emailStatus = ref('')
const emailMessage = ref('')

const canSubmit = computed(() => {
  return username.value.trim() && phone.value.trim() && password.value.trim() && 
         usernameStatus.value === 'success' && phoneStatus.value === 'success'
})

async function checkUsername() {
  if (!username.value.trim()) {
    usernameStatus.value = 'error'
    usernameMessage.value = '请输入用户名'
    return
  }

  try {
    const res = await authAPI.checkUsername({ username: username.value.trim() })
    if (res.success) {
      if (res.data.exists) {
        usernameStatus.value = 'error'
        usernameMessage.value = '用户名已存在'
      } else {
        usernameStatus.value = 'success'
        usernameMessage.value = '用户名可用'
      }
    }
  } catch (err) {
    usernameStatus.value = 'error'
    usernameMessage.value = '检查失败'
  }
}

async function checkPhone() {
  if (!phone.value.trim()) {
    phoneStatus.value = 'error'
    phoneMessage.value = '请输入手机号'
    return
  }

  try {
    const res = await authAPI.checkPhone({ phone: phone.value.trim() })
    if (res.success) {
      if (!res.data.valid) {
        phoneStatus.value = 'error'
        phoneMessage.value = '手机号格式不正确'
      } else if (res.data.exists) {
        phoneStatus.value = 'error'
        phoneMessage.value = '手机号已被注册'
      } else {
        phoneStatus.value = 'success'
        phoneMessage.value = '手机号可用'
      }
    }
  } catch (err) {
    phoneStatus.value = 'error'
    phoneMessage.value = '检查失败'
  }
}

async function checkEmail() {
  if (!email.value.trim()) {
    emailStatus.value = ''
    emailMessage.value = ''
    return
  }

  try {
    const res = await authAPI.checkEmail({ email: email.value.trim() })
    if (res.success) {
      if (!res.data.valid) {
        emailStatus.value = 'error'
        emailMessage.value = '邮箱格式不正确'
      } else if (res.data.exists) {
        emailStatus.value = 'error'
        emailMessage.value = '邮箱已被注册'
      } else {
        emailStatus.value = 'success'
        emailMessage.value = '邮箱可用'
      }
    }
  } catch (err) {
    emailStatus.value = 'error'
    emailMessage.value = '检查失败'
  }
}

async function handleRegister() {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  
  try {
    const res = await authAPI.register({
      username: username.value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim() || null,
      password: password.value.trim()
    })
    
    if (res.success) {
      const event = new CustomEvent('showToast', { detail: '注册成功，请登录' })
      window.dispatchEvent(event)
      router.push('/login')
    } else {
      const event = new CustomEvent('showToast', { detail: res.message || '注册失败' })
      window.dispatchEvent(event)
    }
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: err.message || '注册失败' })
    window.dispatchEvent(event)
  } finally {
    isSubmitting.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.register-header p {
  font-size: 16px;
  color: var(--gray-color);
}

.register-form {
  width: 100%;
  max-width: 350px;
  background: #fff;
  padding: 30px;
  border-radius: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-input {
  width: 100%;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
}

.status-text {
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.status-text.success {
  color: #00c853;
}

.status-text.error {
  color: var(--primary-color);
}

.btn-register {
  width: 100%;
  padding: 15px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
}

.btn-register:disabled {
  background: #ccc;
}

.register-links {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--gray-color);
}

.register-links span {
  cursor: pointer;
  color: var(--primary-color);
}
</style>