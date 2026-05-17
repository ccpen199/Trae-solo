<template>
  <div class="register-page">
    <div class="register-header">
      <h1>创建账号</h1>
      <p>加入猫狗日记大家庭</p>
    </div>
    
    <van-cell-group inset>
      <van-field
        v-model="form.phone"
        name="phone"
        label="手机号"
        placeholder="请输入手机号"
      />
      <van-field
        v-model="form.nickname"
        name="nickname"
        label="昵称"
        placeholder="请输入昵称"
      />
      <van-field
        v-model="form.password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码（至少6位）"
      />
    </van-cell-group>

    <div style="margin: 16px;">
      <van-button round block type="primary" :loading="loading" @click="handleRegister">
        注册
      </van-button>
    </div>

    <div class="register-tips">
      <van-button type="link" @click="$router.push('/login')">已有账号？去登录</van-button>
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
  phone: '',
  nickname: '',
  password: ''
})

const handleRegister = async () => {
  console.log('点击注册，表单数据:', form.value)
  
  if (!form.value.phone) {
    showToast('请输入手机号')
    return
  }
  if (!form.value.nickname) {
    showToast('请输入昵称')
    return
  }
  if (!form.value.password || form.value.password.length < 6) {
    showToast('密码至少6位')
    return
  }
  
  loading.value = true
  try {
    const res = await request.post('/auth/register', form.value)
    console.log('注册响应:', res)
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.user)
    showToast('注册成功')
    router.replace('/posts')
  } catch (error) {
    console.error('注册失败:', error)
    showToast(error.response?.data?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 60px 20px 20px;
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
  color: #fff;
}

.register-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.register-header p {
  opacity: 0.9;
  font-size: 14px;
}

.register-tips {
  text-align: center;
  margin-top: 20px;
}
</style>
