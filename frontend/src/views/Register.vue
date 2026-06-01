<template>
  <div class="register-page">
    <div class="header">
      <h2>一键注册</h2>
      <p>确认您的信息并签署协议</p>
    </div>

    <van-cell-group inset class="info-card">
      <van-cell title="经纪商户" :value="merchantName" />
      <van-cell title="手机号" :value="phone" />
    </van-cell-group>

    <div class="agreement-section">
      <van-checkbox v-model="registerAgreed">
        我已阅读并同意《用户注册协议》
      </van-checkbox>
      <van-checkbox v-model="commissionAgreed">
        我已阅读并同意《提前结佣服务协议》
      </van-checkbox>
    </div>

    <div class="button-wrap">
      <van-button
        type="primary"
        round
        block
        size="large"
        :disabled="!registerAgreed || !commissionAgreed"
        @click="handleRegister"
      >
        确认注册并进入
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api'
import { showToast } from 'vant'

const router = useRouter()
const merchantName = ref('')
const phone = ref('')
const registerAgreed = ref(false)
const commissionAgreed = ref(false)

onMounted(() => {
  const tempPhone = localStorage.getItem('tempPhone')
  phone.value = tempPhone ? tempPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
  merchantName.value = '上海房产经纪有限公司'
  localStorage.setItem('token', '1-demo-token')
})

const handleRegister = async () => {
  try {
    const res = await register({
      registerAgreed: registerAgreed.value,
      commissionAgreed: commissionAgreed.value
    })
    localStorage.setItem('token', res.token)
    showToast('注册成功')
    router.push('/home')
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 40px 20px 20px;
  background: #f5f5f5;
}

.header {
  margin-bottom: 24px;
}

h2 {
  font-size: 22px;
  color: #323233;
  margin-bottom: 8px;
}

p {
  color: #646566;
  font-size: 14px;
}

.info-card {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.agreement-section {
  background: white;
  border-radius: 12px;
  padding: 20px 16px;
  margin-bottom: 24px;
}

.agreement-section .van-checkbox {
  display: block;
  margin-bottom: 16px;
  font-size: 14px;
  color: #646566;
}

.agreement-section .van-checkbox:last-child {
  margin-bottom: 0;
}

.button-wrap {
  position: fixed;
  bottom: 40px;
  left: 20px;
  right: 20px;
}
</style>
