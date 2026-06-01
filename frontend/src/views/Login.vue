<template>
  <div class="login">
    <div class="login-box">
      <h2>访客车辆管理系统</h2>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="tips">
        <p>测试账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auth } from '../api'

const router = useRouter()
const form = ref({
  username: 'admin',
  password: 'admin123'
})

const handleLogin = async () => {
  try {
    const res = await auth.login(form.value)
    if (res.data.success) {
      localStorage.setItem('user', JSON.stringify(res.data.operator))
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-box h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
.tips {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 20px;
}
</style>
