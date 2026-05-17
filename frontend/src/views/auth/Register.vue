<template>
  <div class="page-container register-page">
    <van-nav-bar title="注册" left-arrow @click-left="$router.back()" />
    <div class="page-content">
      <van-steps :active="step">
        <van-step>验证</van-step>
        <van-step>设置</van-step>
      </van-steps>

      <van-form v-if="step === 0" @submit="handleVerify" class="form-section">
        <van-cell-group inset>
          <van-field
            v-model="contact"
            name="contact"
            label="联系方式"
            placeholder="手机号或邮箱"
            :rules="[{ required: true, message: '请输入联系方式' }]"
          />
          <van-field
            v-model="code"
            name="code"
            label="验证码"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <van-button size="small" type="primary" @click="sendCode" :disabled="countdown > 0" plain>
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>

        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            下一步
          </van-button>
        </div>
      </van-form>

      <van-form v-if="step === 1" @submit="handleRegister" class="form-section">
        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }, { min: 2, max: 20, message: '用户名长度2-20位' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="设置密码"
            placeholder="请输入密码（至少6位）"
            :rules="[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]"
          />
          <van-field
            v-model="confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="请再次输入密码"
            :rules="[{ required: true, message: '请确认密码' }, { validator: validatePassword, message: '两次密码不一致' }]"
          />
        </van-cell-group>

        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            完成注册
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { authApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const step = ref(0)
const contact = ref('')
const code = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const countdown = ref(0)

let timer = null

const sendCode = async () => {
  if (!contact.value) {
    showToast('请先输入联系方式')
    return
  }

  try {
    await authApi.sendCode(contact.value)
    showToast('验证码已发送')

    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (e) {
  }
}

const handleVerify = async () => {
  loading.value = true
  try {
    await authApi.verifyCode(contact.value, code.value)
    step.value = 1
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const validatePassword = (val) => val === password.value

const handleRegister = async () => {
  loading.value = true
  try {
    const res = await authApi.register({
      contact: contact.value,
      code: code.value,
      username: username.value,
      password: password.value
    })

    userStore.setToken(res.data.token)
    userStore.setUser(res.data.user)
    showToast('注册成功')
    router.replace('/excerpt')
  } catch (e) {
  } finally {
    loading.value = false
  }
}
</script>

<style lang="less" scoped>
.register-page {
  background: #faf8f5;
}

.form-section {
  margin-top: 20px;
}
</style>
