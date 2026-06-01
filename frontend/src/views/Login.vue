<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <el-card style="width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3)">
      <div style="text-align: center; margin-bottom: 30px">
        <h2 style="color: #303133; margin: 0 0 10px 0">政府资金拨付管理系统</h2>
        <p style="color: #909399; margin: 0">请登录您的账号</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="用户名" 
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码" 
            size="large"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            style="width: 100%" 
            @click="handleLogin"
            :loading="loading"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider content-position="center">快速登录</el-divider>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
        <el-button 
          v-for="u in quickUsers" 
          :key="u.username"
          size="small"
          @click="quickLogin(u.username, u.password)"
        >
          {{ u.name }}
        </el-button>
      </div>
      <p style="font-size: 12px; color: #909399; text-align: center; margin-top: 10px">
        密码与用户名相同，例如 business / business123
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const { login } = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const quickUsers = [
  { username: 'business', password: 'business123', name: '张业务' },
  { username: 'finance', password: 'finance123', name: '李财务' },
  { username: 'leader', password: 'leader123', name: '王领导' },
  { username: 'applicant', password: 'applicant123', name: '赵申请' },
  { username: 'admin', password: 'admin123', name: '管理员' }
]

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await login(form.value.username, form.value.password)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (error) {
        ElMessage.error(error.message)
      } finally {
        loading.value = false
      }
    }
  })
}

const quickLogin = async (username, password) => {
  loading.value = true
  try {
    await login(username, password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>
