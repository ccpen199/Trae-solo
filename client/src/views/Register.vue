<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-left">
        <div class="brand">
          <el-icon :size="48" color="#409eff">
            <ChatDotRound />
          </el-icon>
          <h1>QA Community</h1>
          <p>加入我们的知识共享社区</p>
        </div>
        <div class="benefits">
          <h3>成为会员的好处</h3>
          <ul>
            <li>
              <el-icon color="#409eff"><Check /></el-icon>
              免费发布问题，获得专家解答
            </li>
            <li>
              <el-icon color="#409eff"><Check /></el-icon>
              回答问题，赚取积分和赏金
            </li>
            <li>
              <el-icon color="#409eff"><Check /></el-icon>
              成为认证专家，获得优先匹配
            </li>
            <li>
              <el-icon color="#409eff"><Check /></el-icon>
              参与知识图谱建设，永久留存
            </li>
          </ul>
        </div>
      </div>
      <div class="register-right">
        <div class="register-form-container">
          <h2>创建账号</h2>
          <p class="form-subtitle">填写以下信息完成注册</p>

          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="register-form"
            label-position="top"
          >
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="用户名" prop="username">
                  <el-input
                    v-model="registerForm.username"
                    placeholder="请输入用户名"
                    size="large"
                    prefix-icon="User"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="registerForm.email"
                    placeholder="请输入邮箱地址"
                    size="large"
                    prefix-icon="Message"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="密码" prop="password">
                  <el-input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="请输入密码（至少6位）"
                    size="large"
                    prefix-icon="Lock"
                    show-password
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="registerForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    size="large"
                    prefix-icon="Lock"
                    show-password
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="角色选择" prop="role">
                  <el-select
                    v-model="registerForm.role"
                    placeholder="请选择您的角色"
                    size="large"
                    style="width: 100%"
                  >
                    <el-option label="提问者" value="questioner">
                      <template #default>
                        <div class="role-option">
                          <el-icon><User /></el-icon>
                          <span>提问者</span>
                          <span class="role-desc">主要是发布问题，寻求解答</span>
                        </div>
                      </template>
                    </el-option>
                    <el-option label="回答者" value="answerer">
                      <template #default>
                        <div class="role-option">
                          <el-icon><EditPen /></el-icon>
                          <span>回答者</span>
                          <span class="role-desc">主要是回答问题，赚取积分</span>
                        </div>
                      </template>
                    </el-option>
                    <el-option label="行业专家" value="expert">
                      <template #default>
                        <div class="role-option">
                          <el-icon><Star /></el-icon>
                          <span>行业专家</span>
                          <span class="role-desc">获得优先匹配，更高权重</span>
                        </div>
                      </template>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item prop="agreement">
              <el-checkbox v-model="registerForm.agreement">
                我已阅读并同意
                <el-link type="primary">《服务条款》</el-link>
                和
                <el-link type="primary">《隐私政策》</el-link>
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="isLoading"
                class="register-button"
                @click="handleRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>

          <p class="login-link">
            已有账号？
            <router-link to="/login">立即登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref(null)
const isLoading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'questioner',
  agreement: false
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateAgreement = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请阅读并同意服务条款'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度为2-50个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  agreement: [
    { validator: validateAgreement, trigger: 'change' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        const { confirmPassword, agreement, ...userData } = registerForm
        
        const result = await userStore.register(userData)

        if (result.success) {
          ElMessage.success('注册成功！')
          router.push('/')
        } else {
          ElMessage.error(result.error)
        }
      } catch (error) {
        console.error('Register error:', error)
        ElMessage.error('注册失败，请稍后重试')
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  width: 100vw;
  margin: -20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.register-left {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 28px;
    margin: 16px 0 8px;
    font-weight: 600;
  }

  p {
    font-size: 14px;
    color: #a0aec0;
    opacity: 0.8;
  }
}

.benefits {
  h3 {
    font-size: 16px;
    margin-bottom: 20px;
    color: #e2e8f0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: #cbd5e0;
      margin-bottom: 16px;
      transition: transform 0.3s;

      &:hover {
        transform: translateX(8px);
      }
    }
  }
}

.register-right {
  flex: 1.2;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.register-form-container {
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .form-subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 24px;
  }
}

.register-form {
  .register-button {
    width: 100%;
  }
}

.role-option {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > span:first-of-type {
    font-weight: 500;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .role-desc {
    font-size: 12px;
    color: #909399;
  }
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #606266;
  margin-top: 16px;

  a {
    color: #409eff;
    text-decoration: none;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
  }

  .register-left {
    padding: 30px 20px;
  }

  .register-right {
    padding: 30px 20px;
  }

  .benefits ul {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .benefits li {
    margin-bottom: 0;
  }
}
</style>
