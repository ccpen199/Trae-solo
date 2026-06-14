<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon size="48" color="#409eff"><OfficeBuilding /></el-icon>
        <h2>注册账号</h2>
        <p>加入智慧社区，享受便捷生活服务</p>
      </div>
      
      <el-form ref="registerForm" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        
        <el-form-item prop="real_name">
          <el-input v-model="form.real_name" placeholder="真实姓名" :prefix-icon="UserFilled" size="large" />
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" :prefix-icon="Phone" size="large" />
        </el-form-item>
        
        <el-form-item prop="id_card">
          <el-input v-model="form.id_card" placeholder="身份证号" :prefix-icon="Postcard" size="large" />
        </el-form-item>
        
        <el-form-item prop="role">
          <el-select v-model="form.role" placeholder="选择身份" size="large" style="width: 100%;">
            <el-option label="住户" value="resident" />
            <el-option label="商户" value="merchant" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <span>已有账号？</span>
        <el-button type="primary" link @click="goToLogin">立即登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const registerForm = ref(null)

const form = reactive({
  username: '',
  password: '',
  real_name: '',
  phone: '',
  id_card: '',
  role: 'resident'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

async function handleRegister() {
  try {
    await registerForm.value.validate()
    loading.value = true
    await register(form)
    ElMessage.success('注册成功，请等待物业审核')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.message || '注册失败')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
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

.login-box {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 15px 0 8px;
  color: #303133;
  font-size: 24px;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
