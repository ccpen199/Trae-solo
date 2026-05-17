<template>
  <div class="login-page">
    <div class="login-header">
      <h1>🐱 猫狗日记 🐶</h1>
      <p>记录毛孩子的每一天</p>
    </div>
    
    <van-cell-group inset>
      <van-field
        v-model="form.phone"
        name="phone"
        label="手机号"
        placeholder="请输入手机号"
      />
      <van-field
        v-model="form.password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码"
      />
    </van-cell-group>

    <div style="margin: 16px;">
      <van-button round block type="primary" :loading="loading" @click="handleLogin">
        登录
      </van-button>
    </div>

    <div class="login-tips">
      <p>测试账号：13800138000</p>
      <p>密码：123456</p>
      <van-button type="link" @click="$router.push('/register')">没有账号？去注册</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = ref({
  phone: '13800138000',
  password: '123456'
})

const handleLogin = async () => {
  console.log('点击登录，表单数据:', form.value)
  
  if (!form.value.phone) {
    showToast('请输入手机号')
    return
  }
  if (!form.value.password) {
    showToast('请输入密码')
    return
  }
  
  loading.value = true
  try {
    const res = await request.post('/auth/login', form.value)
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)
    showToast('登录成功')
    router.replace('/posts')
  } catch (error) {
    console.error('登录失败:', error)
    showToast(error.response?.data?.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  color: #fff;
}

.login-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.login-header p {
  opacity: 0.9;
  font-size: 14px;
}

.login-tips {
  text-align: center;
  margin-top: 20px;
  color: #fff;
  font-size: 12px;
}

.login-tips p {
  margin: 5px 0;
}
</style>
