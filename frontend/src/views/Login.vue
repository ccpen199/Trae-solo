<template>
  <el-container style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <el-main style="display: flex; align-items: center; justify-content: center;">
      <el-card style="width: 450px; border-radius: 12px;">
        <template #header>
          <div style="text-align: center; font-size: 24px; font-weight: bold; color: #409eff;">
            用户登录
          </div>
        </template>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="80px"
          style="margin-top: 20px;"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              style="width: 100%;"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
          <el-form-item style="text-align: center; margin-bottom: 0;">
            <el-text>还没有账号？</el-text>
            <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
          </el-form-item>
          <el-divider content-position="center">或</el-divider>
          <el-form-item style="margin-bottom: 0;">
            <el-button text type="primary" @click="fillAdmin">管理员登录</el-button>
            <span style="color: #999; margin: 0 10px;">|</span>
            <el-button text type="primary" @click="fillTestUser">测试用户登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await userStore.login(form)
        if (res.success) {
          ElMessage.success('登录成功')
          if (userStore.isAdmin) {
            router.push('/admin')
          } else {
            router.push('/home')
          }
        }
      } catch (error) {
        console.error('登录失败', error)
      } finally {
        loading.value = false
      }
    }
  })
}

const fillAdmin = () => {
  form.username = 'admin'
  form.password = 'admin123'
}

const fillTestUser = () => {
  form.username = 'test'
  form.password = '123456'
}
</script>
