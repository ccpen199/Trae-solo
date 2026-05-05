<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <div class="logo-icon">
          <van-icon name="shopping-cart-o" size="40" color="#fff" />
        </div>
        <h1>易捷加油</h1>
        <p>加油购物，一键搞定</p>
      </div>
    </div>

    <div class="login-content">
      <van-tabs v-model:active="activeTab" line-width="60" color="#1989fa">
        <van-tab title="验证码登录">
          <div class="form-group">
            <van-field
              v-model="loginForm.phone"
              type="tel"
              label="手机号"
              placeholder="请输入手机号"
              maxlength="11"
              :rules="phoneRules"
            />
            <van-field
              v-model="loginForm.code"
              type="number"
              label="验证码"
              placeholder="请输入验证码"
              maxlength="6"
              :rules="codeRules"
            >
              <template #button>
                <van-button
                  size="small"
                  type="primary"
                  :disabled="countdown > 0"
                  @click="sendCode('login')"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </van-button>
              </template>
            </van-field>
          </div>
          <van-button
            type="primary"
            block
            size="large"
            :loading="loading"
            :disabled="!loginForm.phone || !loginForm.code"
            @click="handleLogin"
            class="login-btn"
          >
            登录
          </van-button>
          <div class="switch-text">
            <span class="switch-link" @click="activeTab = 1">
              密码登录
            </span>
            <span class="switch-link" @click="showRegister = true">
              注册账号
            </span>
          </div>
        </van-tab>

        <van-tab title="密码登录">
          <div class="form-group">
            <van-field
              v-model="pwdForm.phone"
              type="tel"
              label="手机号"
              placeholder="请输入手机号"
              maxlength="11"
            />
            <van-field
              v-model="pwdForm.password"
              type="password"
              label="密码"
              placeholder="请输入密码"
            />
          </div>
          <van-button
            type="primary"
            block
            size="large"
            :loading="pwdLoading"
            :disabled="!pwdForm.phone || !pwdForm.password"
            @click="handlePwdLogin"
            class="login-btn"
          >
            登录
          </van-button>
          <div class="switch-text">
            <span class="switch-link" @click="activeTab = 0">
              验证码登录
            </span>
            <span class="switch-link" @click="showRegister = true">
              注册账号
            </span>
          </div>
        </van-tab>
      </van-tabs>

      <div class="third-login">
        <div class="divider">
          <span>其他登录方式</span>
        </div>
        <div class="third-icons">
          <div class="third-item" @click="handleThirdLogin('wechat')">
            <div class="third-icon wechat">
              <van-icon name="wechat" size="28" color="#07c160" />
            </div>
            <span>微信</span>
          </div>
          <div class="third-item" @click="handleThirdLogin('alipay')">
            <div class="third-icon alipay">
              <van-icon name="wap-home" size="28" color="#1677ff" />
            </div>
            <span>支付宝</span>
          </div>
          <div class="third-item" @click="handleThirdLogin('qq')">
            <div class="third-icon qq">
              <van-icon name="user-o" size="28" color="#12b7f5" />
            </div>
            <span>QQ</span>
          </div>
        </div>
      </div>
    </div>

    <van-popup
      v-model:show="showRegister"
      round
      position="bottom"
      :style="{ height: '70%' }"
    >
      <div class="register-popup">
        <div class="popup-header">
          <span class="popup-title">注册账号</span>
          <van-icon name="cross" size="20" @click="showRegister = false" />
        </div>
        <div class="register-form">
          <van-field
            v-model="registerForm.phone"
            type="tel"
            label="手机号"
            placeholder="请输入手机号"
            maxlength="11"
          />
          <van-field
            v-model="registerForm.code"
            type="number"
            label="验证码"
            placeholder="请输入验证码"
            maxlength="6"
          >
            <template #button>
              <van-button
                size="small"
                type="primary"
                :disabled="registerCountdown > 0"
                @click="sendCode('register')"
              >
                {{ registerCountdown > 0 ? `${registerCountdown}s` : '获取验证码' }}
              </van-button>
            </template>
          </van-field>
          <van-field
            v-model="registerForm.password"
            type="password"
            label="设置密码"
            placeholder="请设置6-20位密码"
          />
          <van-field
            v-model="registerForm.passwordConfirm"
            type="password"
            label="确认密码"
            placeholder="请再次输入密码"
          />
          <van-cell-group inset>
            <van-button
              type="primary"
              block
              :loading="registerLoading"
              :disabled="!registerForm.phone || !registerForm.code || !registerForm.password"
              @click="handleRegister"
              class="register-btn"
            >
              注册
            </van-button>
          </van-cell-group>
          <div class="agreement">
            <van-checkbox v-model="agreeAgreement" shape="square">
              我已阅读并同意
              <span class="link-text">《用户协议》</span>
              和
              <span class="link-text">《隐私政策》</span>
            </van-checkbox>
          </div>
        </div>
      </div>
    </van-popup>

    <van-toast id="login-toast" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { sendCode, loginByCode, loginByPassword, register, thirdLogin } from '../../api/auth'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref(0)
const loading = ref(false)
const pwdLoading = ref(false)
const countdown = ref(0)
const registerCountdown = ref(0)
const showRegister = ref(false)
const registerLoading = ref(false)
const agreeAgreement = ref(true)

const loginForm = ref({
  phone: '',
  code: ''
})

const pwdForm = ref({
  phone: '',
  password: ''
})

const registerForm = ref({
  phone: '',
  code: '',
  password: '',
  passwordConfirm: ''
})

const phoneRules = computed(() => [
  {
    validator: (val) => /^1[3-9]\d{9}$/.test(val),
    message: '请输入正确的手机号',
    trigger: 'onBlur'
  }
])

const codeRules = computed(() => [
  {
    validator: (val) => /^\d{6}$/.test(val),
    message: '请输入6位验证码',
    trigger: 'onBlur'
  }
])

const startCountdown = (type) => {
  if (type === 'login') {
    countdown.value = 120
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } else {
    registerCountdown.value = 120
    const timer = setInterval(() => {
      registerCountdown.value--
      if (registerCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  }
}

const sendCode = async (type) => {
  const phone = type === 'login' ? loginForm.value.phone : registerForm.value.phone
  
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    showToast('请输入正确的手机号')
    return
  }

  try {
    const res = await sendCode({ phone, type })
    showToast('验证码已发送')
    
    if (res.data?.test_code) {
      console.log(`[测试验证码] 手机号: ${phone}, 验证码: ${res.data.test_code}`)
    }
    
    startCountdown(type)
  } catch (error) {
    console.error('发送验证码失败:', error)
  }
}

const handleLogin = async () => {
  if (!loginForm.value.phone || !loginForm.value.code) {
    showToast('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const res = await loginByCode({
      phone: loginForm.value.phone,
      code: loginForm.value.code
    })

    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)

    showToast('登录成功')
    
    const redirect = route.query.redirect || '/home'
    setTimeout(() => {
      router.replace(redirect)
    }, 500)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePwdLogin = async () => {
  if (!pwdForm.value.phone || !pwdForm.value.password) {
    showToast('请填写完整信息')
    return
  }

  pwdLoading.value = true
  try {
    const res = await loginByPassword({
      phone: pwdForm.value.phone,
      password: pwdForm.value.password
    })

    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)

    showToast('登录成功')
    
    const redirect = route.query.redirect || '/home'
    setTimeout(() => {
      router.replace(redirect)
    }, 500)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    pwdLoading.value = false
  }
}

const handleRegister = async () => {
  if (!agreeAgreement.value) {
    showToast('请先同意用户协议')
    return
  }

  if (registerForm.value.password !== registerForm.value.passwordConfirm) {
    showToast('两次密码输入不一致')
    return
  }

  if (registerForm.value.password.length < 6) {
    showToast('密码长度至少6位')
    return
  }

  registerLoading.value = true
  try {
    const res = await register({
      phone: registerForm.value.phone,
      code: registerForm.value.code,
      password: registerForm.value.password,
      passwordConfirm: registerForm.value.passwordConfirm
    })

    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)

    showToast(res.message)
    showRegister.value = false
    
    setTimeout(() => {
      router.replace('/home')
    }, 500)
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    registerLoading.value = false
  }
}

const handleThirdLogin = async (platform) => {
  showLoadingToast({
    message: '正在跳转...',
    duration: 0
  })

  try {
    const res = await thirdLogin({
      platform,
      openId: `${platform}_${Date.now()}`,
      nickname: `${platform}用户`,
      avatar: ''
    })

    closeToast()
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)

    showToast('登录成功')
    
    const redirect = route.query.redirect || '/home'
    setTimeout(() => {
      router.replace(redirect)
    }, 500)
  } catch (error) {
    closeToast()
    console.error('第三方登录失败:', error)
  }
}
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1989fa 0%, #e8f4ff 100%);
}

.login-header {
  padding: 60px 0 40px;
  text-align: center;

  .logo {
    .logo-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #1989fa, #409eff);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      box-shadow: 0 4px 20px rgba(25, 137, 250, 0.3);
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 8px;
    }

    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }
  }
}

.login-content {
  background: #fff;
  border-radius: 24px 24px 0 0;
  min-height: calc(100vh - 200px);
  padding: 20px 16px;

  .form-group {
    padding: 16px 0;
  }

  .login-btn {
    margin: 24px 0;
    border-radius: 24px;
    background: linear-gradient(135deg, #1989fa, #409eff);
    border: none;
    font-size: 16px;
    font-weight: 500;
  }

  .switch-text {
    display: flex;
    justify-content: space-between;
    padding: 0 12px;

    .switch-link {
      color: #1989fa;
      font-size: 14px;
      cursor: pointer;
    }
  }
}

.third-login {
  margin-top: 40px;

  .divider {
    display: flex;
    align-items: center;
    margin: 0 20px 30px;
    color: #969799;
    font-size: 12px;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #ebedf0;
    }

    span {
      padding: 0 20px;
    }
  }

  .third-icons {
    display: flex;
    justify-content: center;
    gap: 40px;
  }

  .third-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    .third-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;

      &.wechat {
        background: rgba(7, 193, 96, 0.1);
      }

      &.alipay {
        background: rgba(22, 119, 255, 0.1);
      }

      &.qq {
        background: rgba(18, 183, 245, 0.1);
      }
    }

    span {
      font-size: 12px;
      color: #646566;
    }
  }
}

.register-popup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebedf0;

    .popup-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .register-form {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;

    .register-btn {
      margin-top: 24px;
      border-radius: 24px;
      background: linear-gradient(135deg, #1989fa, #409eff);
      border: none;
    }

    .agreement {
      margin-top: 16px;
      padding: 0 8px;
      font-size: 12px;
      color: #969799;

      .link-text {
        color: #1989fa;
      }
    }
  }
}
</style>
