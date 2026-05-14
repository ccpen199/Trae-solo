<template>
  <div class="login-page">
    <div class="login-container">
      <div class="logo">
        <h1>合家具</h1>
        <p>让家更美好</p>
        <p class="dev-tip">
          <strong>开发环境提示：</strong><br>
          验证码会显示在控制台，<br>
          当前验证码：<code>123456</code>
        </p>
      </div>
      <el-form ref="formRef" :model="form" class="login-form" @submit.prevent="handleSubmit">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="form.code" placeholder="请输入验证码" maxlength="6" />
            <el-button 
              type="primary" 
              :disabled="countdown > 0 || !form.phone"
              @click="sendCode"
              class="send-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleSubmit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  phone: '',
  code: ''
})

const loading = ref(false)
const countdown = ref(0)

async function sendCode() {
  if (!form.phone || form.phone.length !== 11) {
    ElMessage.error('请输入正确的手机号')
    return
  }
  try {
    await authAPI.sendCode(form.phone)
    ElMessage.success('验证码已发送')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (e) {
    ElMessage.error('发送失败')
  }
}

async function handleSubmit() {
  if (!form.phone || !form.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  loading.value = true
  try {
    const data = await authAPI.login(form.phone, form.code)
    userStore.login(data.token, data.user)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo h1 {
  font-size: 28px;
  color: #2563eb;
  margin: 0 0 8px 0;
}

.logo p {
  color: #999;
  margin: 0;
}

.dev-tip {
  margin-top: 15px;
  font-size: 12px;
  color: #666;
  background: #fffbeb;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fcd34d;
}

.dev-tip code {
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  color: #d97706;
}

.login-form {
  width: 100%;
}

.code-input {
  display: flex;
  gap: 12px;
}

.code-input .el-input {
  flex: 1;
}

.send-btn {
  width: 120px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}
</style>