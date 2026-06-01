<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <div style="width: 400px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3)">
      <div style="text-align: center; margin-bottom: 30px">
        <h2 style="margin: 0; color: #333">学校社团管理系统</h2>
        <p style="color: #999; margin-top: 10px">请登录您的账号</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleLogin" :loading="loading">登录</el-button>
        </el-form-item>
      </el-form>
      <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666">
        <p>测试账号：</p>
        <p>admin / admin123 (团委管理员)</p>
        <p>teacher1 / teacher123 (指导老师)</p>
        <p>student1 / student123 (学生)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { auth } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    const res = await auth.login(form)
    userStore.setUser(res.data)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
