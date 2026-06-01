<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title">企业门户统一工作台</div>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent>
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="login">登 录</el-button>
      </el-form>
      <el-divider />
      <div class="muted">演示账号：admin / Admin@123，ops / Ops@123，dev / Dev@123，owner / Owner@123，security / Security@123，platform / Platform@123</div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { AuthAPI } from '../api'

const router = useRouter()
const form = ref({ username: '', password: '' })
const formRef = ref()
const loading = ref(false)
const rules = {
  username: [{ required: true, message: '用户名必填', trigger: 'blur' }],
  password: [{ required: true, message: '密码必填', trigger: 'blur' }]
}

async function login() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res = await AuthAPI.login(form.value)
    if (res?.code === 0) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      ElMessage.success('登录成功')
      router.push('/portal')
    } else {
      ElMessage.error(res?.message || '登录失败')
    }
  } catch (e) {
    console.error('login error:', e)
  } finally {
    loading.value = false
  }
}
</script>
