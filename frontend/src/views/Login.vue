<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <h1><el-icon><Van /></el-icon> B2B货运撮合SaaS平台</h1>
        <p>智能匹配 · 安全担保 · 全程追踪</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名/手机号" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" @click="handleLogin" :loading="loading">登 录</el-button>
        </el-form-item>
        <div class="login-footer">
          <span>还没有账号？</span>
          <router-link to="/register">立即注册</router-link>
        </div>
        <div class="demo-accounts">
          <el-divider>演示账号</el-divider>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="管理员">admin / admin123456</el-descriptions-item>
            <el-descriptions-item label="货主">shipper01 / shipper123</el-descriptions-item>
            <el-descriptions-item label="司机">driver01 / driver123</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Van } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.login(form)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  padding: 20px;
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
}
.login-header h1 {
  margin: 0 0 10px 0;
  color: #409eff;
  font-size: 24px;
}
.login-header p {
  color: #909399;
  margin: 0;
}
.login-footer {
  text-align: center;
  color: #909399;
}
.login-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
}
.demo-accounts {
  margin-top: 20px;
}
</style>
