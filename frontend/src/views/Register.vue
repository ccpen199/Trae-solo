<template>
  <div class="page-container">
    <div class="card">
      <h1 class="title">创建账号</h1>
      <p class="subtitle">开始你的灵魂社交之旅</p>

      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            size="large"
            :prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item prop="code">
          <el-input
            v-model="form.code"
            placeholder="请输入验证码"
            size="large"
            :prefix-icon="Key"
          >
            <template #append>
              <el-button :disabled="codeDisabled" @click="sendCode">
                {{ codeText }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请设置密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="avatar" label="选择头像">
          <div class="avatar-list">
            <div
              v-for="i in 8"
              :key="i"
              class="avatar-item"
              :class="{ active: form.avatar === `avatar-${i}.svg` }"
              @click="form.avatar = `avatar-${i}.svg`"
            >
              <div class="avatar-circle" :style="{ background: avatarColors[i-1] }">
                {{ ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻'][i-1] }}
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item prop="birthday">
          <el-date-picker
            v-model="form.birthday"
            type="date"
            placeholder="选择出生日期"
            size="large"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item prop="gender">
          <el-radio-group v-model="form.gender" size="large">
            <el-radio value="male">♂ 男</el-radio>
            <el-radio value="female">♀ 女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item prop="signature">
          <el-input
            v-model="form.signature"
            type="textarea"
            placeholder="个性签名（选填）"
            :rows="2"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        已有账号？<router-link to="/login" class="link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import { Phone, Lock, Key } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const codeDisabled = ref(false)
const codeText = ref('获取验证码')
const countdown = ref(0)

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const form = reactive({
  phone: '',
  code: '',
  password: '',
  avatar: 'avatar-1.svg',
  birthday: '',
  gender: '',
  signature: ''
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  birthday: [
    { required: true, message: '请选择出生日期', trigger: 'change' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

const sendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  try {
    const res = await userStore.sendCode(form.phone)
    const code = res.code
    ElMessage.success(`验证码已发送: ${code}`)
    form.code = code
    console.log('验证码:', code)
    
    codeDisabled.value = true
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      codeText.value = `${countdown.value}s`
      if (countdown.value <= 0) {
        clearInterval(timer)
        codeDisabled.value = false
        codeText.value = '获取验证码'
      }
    }, 1000)
  } catch (e) {
    console.error(e)
  }
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await userStore.register(form)
    ElMessage.success('注册成功')
    
    router.push('/test')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.avatar-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.avatar-item {
  cursor: pointer;
  padding: 5px;
  border-radius: 12px;
  transition: all 0.3s;
}

.avatar-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
}

.footer {
  text-align: center;
  color: #666;
  margin-top: 20px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

:deep(.el-radio) {
  margin-right: 40px;
}
</style>
