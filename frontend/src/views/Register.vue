<template>
  <div class="register-container">
    <div class="register-background">
      <div class="deco-circle deco-circle-1"></div>
      <div class="deco-circle deco-circle-2"></div>
      <div class="deco-circle deco-circle-3"></div>
    </div>
    <el-card class="register-card" shadow="always">
      <div class="register-header">
        <div class="logo-icon">
          <el-icon :size="40"><Refresh /></el-icon>
        </div>
        <h1 class="page-title">用户注册</h1>
        <p class="page-subtitle">加入再生资源产业互联网交易平台</p>
      </div>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            :prefix-icon="Phone"
          />
        </el-form-item>
        <el-form-item label="企业名称" prop="companyName">
          <el-input
            v-model="registerForm.companyName"
            placeholder="请输入企业名称"
            :prefix-icon="OfficeBuilding"
          />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input
            v-model="registerForm.contact"
            placeholder="请输入联系人姓名"
            :prefix-icon="UserFilled"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select
            v-model="registerForm.role"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="产废方" value="producer" />
            <el-option label="收废商" value="collector" />
            <el-option label="利废厂" value="processor" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>
        <div class="login-link">
          已有账号？
          <el-link type="primary" :underline="false" @click="goToLogin">去登录</el-link>
        </div>
      </el-form>
    </el-card>
    <div class="register-footer">
      <p>© 2024 再生资源产业互联网交易平台 版权所有</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, Lock, Phone, OfficeBuilding, UserFilled, Refresh
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  companyName: '',
  contact: '',
  role: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePhone = (rule, value, callback) => {
  const phoneReg = /^1[3-9]\d{9}$/
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!phoneReg.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  phone: [
    { required: true, validator: validatePhone, trigger: 'blur' }
  ],
  companyName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 50, message: '企业名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  contact: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '联系人姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  try {
    await registerFormRef.value.validate()
    loading.value = true
    const { confirmPassword, ...data } = registerForm
    await userStore.register(data)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message || '注册失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
  position: relative;
  overflow: hidden;
  padding: 40px 0;
}

.register-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.3;
}

.deco-circle-1 {
  width: 400px;
  height: 400px;
  background: #81c784;
  top: -100px;
  right: -100px;
}

.deco-circle-2 {
  width: 300px;
  height: 300px;
  background: #a5d6a7;
  bottom: 100px;
  left: -80px;
}

.deco-circle-3 {
  width: 200px;
  height: 200px;
  background: #c5e1a5;
  bottom: -50px;
  right: 20%;
}

.register-card {
  width: 520px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 20px 60px rgba(102, 187, 106, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 24px rgba(102, 187, 106, 0.4);
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #66bb6a;
  margin: 0;
}

.register-form {
  margin-top: 20px;
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border: none;
}

.register-btn:hover {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #90a4ae;
}

.register-footer {
  position: absolute;
  bottom: 20px;
  color: rgba(46, 125, 50, 0.6);
  font-size: 12px;
}
</style>
