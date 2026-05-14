<template>
  <div class="login-container">
    <van-nav-bar title="登录" left-text="返回" @click-left="goBack" />
    
    <div class="login-form">
      <van-form @submit="onSubmit">
        <van-cell-group>
          <van-field 
            v-model="phone" 
            placeholder="请输入手机号" 
            type="tel" 
            maxlength="11"
            clearable
          />
          <van-field 
            v-model="password" 
            placeholder="请输入密码" 
            type="password"
            clearable
            :show-icon="true"
          />
        </van-cell-group>
        
        <div class="form-actions">
          <van-button type="primary" block native-type="submit">登录</van-button>
        </div>
      </van-form>
      
      <div class="quick-login">
        <p class="quick-title">快捷登录</p>
        <div class="quick-buttons">
          <van-button 
            class="taobao-btn" 
            type="default" 
            icon="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=taobao%20logo%20icon%20orange&image_size=square" 
            @click="loginTaobao"
          >
            淘宝登录
          </van-button>
          <van-button 
            class="alipay-btn" 
            type="default" 
            icon="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=alipay%20logo%20icon%20blue&image_size=square" 
            @click="loginAlipay"
          >
            支付宝登录
          </van-button>
        </div>
      </div>
      
      <div class="other-links">
        <a href="#" @click="goRegister">免费注册</a>
        <a href="#" @click="goResetPassword">忘记密码</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Form, Field, CellGroup, Button, showToast } from 'vant'
import { userApi } from '../services/api'
import store from '../store'

const router = useRouter()
const phone = ref('')
const password = ref('')

const goBack = () => {
  router.back()
}

const onSubmit = () => {
  if (!phone.value || !password.value) {
    showToast('请输入手机号和密码')
    return
  }
  
  userApi.login({ phone: phone.value, password: password.value }).then(res => {
    if (res.code === 200) {
      store.mutations.setUser({ token: res.data.token, info: res.data.user })
      showToast('登录成功')
      router.push('/home')
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('登录失败')
  })
}

const loginTaobao = () => {
  userApi.loginTaobao({ 
    openid: `taobao_${Date.now()}`,
    nickname: '淘宝用户',
    avatar: ''
  }).then(res => {
    if (res.code === 200) {
      store.mutations.setUser({ token: res.data.token, info: res.data.user })
      showToast('淘宝登录成功')
      router.push('/home')
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('登录失败')
  })
}

const loginAlipay = () => {
  userApi.loginAlipay({ 
    openid: `alipay_${Date.now()}`,
    nickname: '支付宝用户',
    avatar: ''
  }).then(res => {
    if (res.code === 200) {
      store.mutations.setUser({ token: res.data.token, info: res.data.user })
      showToast('支付宝登录成功')
      router.push('/home')
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('登录失败')
  })
}

const goRegister = () => {
  router.push('/register')
}

const goResetPassword = () => {
  router.push('/reset-password')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.login-form {
  padding: 20px;
}

.form-actions {
  margin-top: 20px;
}

.quick-login {
  margin-top: 40px;
}

.quick-title {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 15px;
}

.quick-buttons {
  display: flex;
  gap: 15px;
}

.taobao-btn {
  flex: 1;
  background: #ff4400;
  color: white;
}

.alipay-btn {
  flex: 1;
  background: #1677ff;
  color: white;
}

.other-links {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding: 0 10px;
}

.other-links a {
  color: #666;
  font-size: 14px;
}
</style>