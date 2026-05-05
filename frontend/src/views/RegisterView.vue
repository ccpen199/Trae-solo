<template>
  <div class="register-page">
    <div class="register-container">
      <el-card shadow="hover" class="register-card">
        <div class="register-header">
          <el-icon :size="48" color="#409EFF"><UserFilled /></el-icon>
          <h2>注册智汇教育</h2>
          <p>加入我们，开启学习新篇章</p>
        </div>
        
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名 (3-20位)"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
              prefix-icon="Message"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码 (至少6位)"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item prop="role">
            <el-select
              v-model="registerForm.role"
              placeholder="请选择用户身份"
              size="large"
              style="width: 100%"
            >
              <el-option label="学生" value="student" />
              <el-option label="教师" value="teacher" />
              <el-option label="在职人员" value="employee" />
              <el-option label="程序员" value="programmer" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="register-btn"
              @click="handleRegister"
            >
              {{ loading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref<FormInstance>()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student'
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度需在3-20之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择用户身份', trigger: 'change' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const { confirmPassword, ...registerData } = registerForm
      
      const response = await api.post('/users/register', registerData)
      
      if (response.data.success) {
        const { token, user } = response.data.data
        
        userStore.setToken(token)
        userStore.setUser(user)
        
        ElMessage.success('注册成功，已自动登录')
        router.push('/')
      } else {
        ElMessage.error(response.data.message || '注册失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        ElMessage.error(error.response.data.message)
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss">
.register-page {
  min-height: calc(100vh - 64px - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .register-container {
    width: 100%;
    max-width: 450px;
  }

  .register-card {
    .register-header {
      text-align: center;
      margin-bottom: 32px;

      h2 {
        margin: 16px 0 8px;
        font-size: 24px;
        color: #303133;
      }

      p {
        color: #909399;
        font-size: 14px;
      }
    }

    .register-form {
      .el-form-item {
        margin-bottom: 20px;
      }

      .register-btn {
        width: 100%;
      }
    }

    .register-footer {
      text-align: center;
      font-size: 14px;
      color: #909399;

      a {
        color: #409EFF;
        text-decoration: none;
        margin-left: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
