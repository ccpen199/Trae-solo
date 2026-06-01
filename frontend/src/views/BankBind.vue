<template>
  <div class="bank-page">
    <van-nav-bar title="账户绑定" left-arrow @click-left="$router.back()" />

    <div v-if="bankInfo.bound" class="bound-card">
      <div class="bound-icon">✅</div>
      <div class="bound-text">账户已绑定</div>
      <div class="bank-info">
        <p>{{ bankInfo.bankName }}</p>
        <p>{{ maskCard(bankInfo.bankCard) }}</p>
      </div>
      <div class="bound-actions">
        <van-button type="primary" round size="large" @click="goHome">
          返回首页
        </van-button>
      </div>
    </div>

    <div v-else class="bind-form">
      <div class="tip-box">
        <span>💡</span>
        <span>仅支持XX银行一类卡或电子账户</span>
      </div>

      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="form.bankCard"
            type="bankCard"
            label="银行卡号"
            placeholder="请输入银行卡号"
          />
          <van-field
            v-model="form.bankName"
            label="开户银行"
            placeholder="请输入开户银行"
          />
          <van-field
            v-model="form.bankMobile"
            type="tel"
            label="银行预留手机号"
            placeholder="请输入银行预留手机号"
          />
          <van-field
            v-model="form.verifyCode"
            type="number"
            label="验证码"
            placeholder="请输入验证码"
          >
            <template #button>
              <van-button size="small" type="primary" @click="sendCode" :disabled="counting">
                {{ codeText }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
      </van-form>

      <div class="button-wrap">
        <van-button
          type="primary"
          round
          block
          size="large"
          @click="handleBind"
        >
          确认绑定
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBankInfo, bindBank, sendVerifyCode } from '../api'
import { showToast } from 'vant'

const router = useRouter()
const bankInfo = ref({})
const form = ref({
  bankCard: '',
  bankName: 'XX银行',
  bankMobile: '',
  verifyCode: ''
})
const counting = ref(false)
const countdown = ref(60)
const codeText = ref('获取验证码')

onMounted(async () => {
  try {
    const res = await getBankInfo()
    bankInfo.value = res.data
  } catch (e) {
    console.error(e)
  }
})

const maskCard = (card) => {
  if (!card) return ''
  return card.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2')
}

const sendCode = async () => {
  if (!form.value.bankMobile) {
    showToast('请输入手机号')
    return
  }
  try {
    await sendVerifyCode(form.value.bankMobile)
    showToast('验证码已发送，测试验证码：123456')
    startCountdown()
  } catch (e) {
    console.error(e)
  }
}

const startCountdown = () => {
  counting.value = true
  const timer = setInterval(() => {
    countdown.value--
    codeText.value = `${countdown.value}s后重新获取`
    if (countdown.value <= 0) {
      clearInterval(timer)
      counting.value = false
      countdown.value = 60
      codeText.value = '获取验证码'
    }
  }, 1000)
}

const goHome = () => {
  router.push('/home')
}

const handleBind = async () => {
  if (!form.value.bankCard || !form.value.bankName || !form.value.bankMobile || !form.value.verifyCode) {
    showToast('请填写完整信息')
    return
  }
  try {
    await bindBank(form.value)
    showToast('绑定成功')
    bankInfo.value = { ...form.value, bound: true }
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.bank-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.bound-card {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
}

.bound-icon {
  font-size: 50px;
  margin-bottom: 16px;
}

.bound-text {
  font-size: 18px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 16px;
}

.bank-info p {
  color: #646566;
  font-size: 14px;
  margin-bottom: 8px;
}

.tip-box {
  background: #ecf5ff;
  margin: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #409eff;
}

.bound-actions {
  margin-top: 24px;
}

.button-wrap {
  padding: 20px 16px 0;
}
</style>
