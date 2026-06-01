<template>
  <div class="whitelist-page">
    <div class="header">
      <div class="logo">💰</div>
      <h1>佣金垫付服务</h1>
      <p class="subtitle">房产交易云店专属服务</p>
    </div>

    <van-form @submit="handleCheck" class="form">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入您的手机号"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
      </van-cell-group>
      <div class="button-wrap">
        <van-button type="primary" native-type="submit" round block size="large">
          验证进入
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showDenied" position="center" :overlay="true">
      <div class="denied-popup">
        <div class="denied-icon">⚠️</div>
        <h3>暂无法使用</h3>
        <p>您的手机号不在白名单中</p>
        <p class="contact">请联系云店客服</p>
        <van-button type="primary" round @click="callService">
          拨打 400-888-8888
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkWhitelist } from '../api'

const router = useRouter()
const phone = ref('13800138000')
const showDenied = ref(false)
const contactPhone = ref('')

const handleCheck = async () => {
  try {
    const res = await checkWhitelist(phone.value)
    if (res.inWhitelist) {
      localStorage.setItem('tempUserId', res.user.id)
      localStorage.setItem('tempPhone', phone.value)
      localStorage.setItem('token', res.token)
      if (res.user.registered) {
        router.push('/home')
      } else {
        router.push('/register')
      }
    } else {
      contactPhone.value = res.contactPhone
      showDenied.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

const callService = () => {
  window.location.href = `tel:${contactPhone.value}`
}
</script>

<style scoped>
.whitelist-page {
  min-height: 100vh;
  padding: 60px 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.logo {
  font-size: 60px;
  margin-bottom: 16px;
}

h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.subtitle {
  opacity: 0.8;
  font-size: 14px;
}

.form {
  background: white;
  border-radius: 16px;
  padding: 24px 0;
}

.button-wrap {
  padding: 20px 16px 0;
}

.denied-popup {
  width: 300px;
  padding: 30px 20px;
  text-align: center;
}

.denied-icon {
  font-size: 50px;
  margin-bottom: 16px;
}

.denied-popup h3 {
  margin-bottom: 12px;
  color: #323233;
}

.denied-popup p {
  color: #646566;
  margin-bottom: 8px;
}

.contact {
  font-weight: bold;
  margin-bottom: 20px !important;
}
</style>
