<template>
  <div class="reset-container">
    <van-nav-bar title="找回密码" left-text="返回" @click-left="goBack" />
    
    <div class="reset-form">
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
            placeholder="请设置新密码" 
            type="password"
            clearable
          />
          <van-field 
            v-model="confirmPassword" 
            placeholder="请确认新密码" 
            type="password"
            clearable
          />
        </van-cell-group>
        
        <div class="form-actions">
          <van-button type="primary" block native-type="submit">确认重置</van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Form, Field, CellGroup, Button, showToast } from 'vant'
import { userApi } from '../services/api'

const router = useRouter()
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')

const goBack = () => {
  router.back()
}

const onSubmit = () => {
  if (!phone.value) {
    showToast('请输入手机号')
    return
  }
  
  if (!password.value) {
    showToast('请设置新密码')
    return
  }
  
  if (password.value !== confirmPassword.value) {
    showToast('两次输入的密码不一致')
    return
  }
  
  userApi.resetPassword({ phone: phone.value, password: password.value }).then(res => {
    if (res.code === 200) {
      showToast('密码重置成功，请登录')
      router.push('/login')
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('重置失败')
  })
}
</script>

<style scoped>
.reset-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.reset-form {
  padding: 20px;
}

.form-actions {
  margin-top: 20px;
}
</style>