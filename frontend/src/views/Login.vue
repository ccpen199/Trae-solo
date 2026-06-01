<template>
  <div class="login-container flex-center">
    <el-card class="login-card card-shadow">
      <h2 class="login-title">个人年度目标复盘系统</h2>
      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button class="w-full" @click="showRegister = !showRegister">
            {{ showRegister ? '返回登录' : '注册新账号' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-divider v-if="showRegister">注册新账号</el-divider>
      
      <el-form v-if="showRegister" ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="display_name">
          <el-input v-model="registerForm.display_name" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" class="w-full" @click="handleRegister" :loading="registerLoading">
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="demo-info mt-20">
        <el-alert title="演示账号" type="info" :closable="false" size="small">
          <p>管理员: admin / admin123</p>
          <p>普通用户: demo / user123</p>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const registerLoading = ref(false)
const showRegister = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  display_name: '',
  email: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次密码输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const loginFormRef = ref()
const registerFormRef = ref()

async function handleLogin() {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success(`登录成功，欢迎回来，${userStore.user?.display_name || userStore.user?.username}！`)
    router.push('/')
  } catch (err) {
    console.error('登录失败:', err)
    const errMsg = err?.response?.data?.error || err?.message || '登录失败，请检查账号密码'
    ElMessage.error(errMsg)
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!registerFormRef.value) return
  try {
    await registerFormRef.value.validate()
    registerLoading.value = true
    await userStore.register({
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email,
      display_name: registerForm.display_name
    })
    ElMessage.success('注册成功，请使用新账号登录')
    showRegister.value = false
    loginForm.username = registerForm.username
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.display_name = ''
  } catch (err) {
    console.error('注册失败:', err)
    const errMsg = err?.response?.data?.error || err?.message || '注册失败，请稍后重试'
    ElMessage.error(errMsg)
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 20px;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.w-full {
  width: 100%;
}

.demo-info p {
  margin: 4px 0;
  font-size: 12px;
}
</style>
