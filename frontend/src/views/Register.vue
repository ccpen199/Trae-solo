<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <el-card style="width: 400px" shadow="hover">
      <template #header>
        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #333">老师注册</div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" :disabled="loading" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" :disabled="loading" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <el-row :gutter="10">
            <el-col :span="15">
              <el-input v-model="form.code" placeholder="请输入验证码" :disabled="loading" />
            </el-col>
            <el-col :span="9">
              <el-button 
                type="primary" 
                style="width: 100%" 
                @click="handleSendCode" 
                :disabled="loading || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </el-col>
          </el-row>
          <div style="font-size: 12px; color: #999; margin-top: 5px">测试验证码：123456</div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :disabled="loading" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleRegister" :loading="loading">注册</el-button>
        </el-form-item>
        <div style="text-align: center">
          已有账号？<el-link type="primary" @click="$router.push('/login')">立即登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const countdown = ref(0)

const form = reactive({
  name: '',
  phone: '',
  code: '',
  password: ''
})

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleSendCode = async () => {
  if (!form.phone || !/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.error('请先输入正确的手机号')
    return
  }
  try {
    await userStore.sendCode(form.phone)
    ElMessage.success('验证码已发送')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (e) {
    console.error(e)
  }
}

const handleRegister = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    await userStore.register(form.phone, form.code, form.password, form.name)
    ElMessage.success('注册成功')
    router.push('/homework')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>