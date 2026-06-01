<template>
  <div class="credit-page">
    <van-nav-bar title="授信申请" left-arrow @click-left="$router.back()" />

    <van-steps :active="currentStep" class="steps">
      <van-step>企业信息</van-step>
      <van-step>法人信息</van-step>
      <van-step>签署协议</van-step>
    </van-steps>

    <div v-if="currentStep === 0" class="step-content">
      <div class="section-title">核对企业信息</div>
      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="form.companyName"
            label="企业名称"
            placeholder="请输入企业名称"
          />
          <van-field
            v-model="form.creditCode"
            label="统一社会信用代码"
            placeholder="请输入18位信用代码"
          />
        </van-cell-group>
      </van-form>
    </div>

    <div v-if="currentStep === 1" class="step-content">
      <div class="section-title">填写法人信息</div>
      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="form.legalPerson"
            label="法人姓名"
            placeholder="请输入法人姓名"
          />
          <van-field
            v-model="form.idCard"
            label="身份证号"
            placeholder="请输入18位身份证号"
          />
        </van-cell-group>
      </van-form>
    </div>

    <div v-if="currentStep === 2" class="step-content">
      <div class="section-title">签署授权协议</div>
      <div class="agreement-box">
        <h4>《佣金垫付服务授权协议》</h4>
        <p>本人同意授权贷款机构查询本人及企业的征信信息，用于佣金垫付服务的授信审核。</p>
        <p>本人承诺所提供的所有信息真实、准确、完整，并承担由此产生的一切法律责任。</p>
        <p>本协议自签署之日起生效。</p>
      </div>
      <van-checkbox v-model="agreed" class="agree-check">
        我已阅读并同意以上协议
      </van-checkbox>
    </div>

    <div class="button-wrap">
      <van-button
        v-if="currentStep < 2"
        type="primary"
        round
        block
        size="large"
        @click="nextStep"
      >
        下一步
      </van-button>
      <van-button
        v-else
        type="primary"
        round
        block
        size="large"
        :disabled="!agreed"
        @click="submitApply"
      >
        提交申请
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getEnterpriseInfo, verifyEnterprise, signAuth } from '../api'
import { showToast } from 'vant'

const router = useRouter()
const currentStep = ref(0)
const agreed = ref(false)
const form = ref({
  companyName: '',
  creditCode: '',
  legalPerson: '',
  idCard: ''
})

onMounted(async () => {
  try {
    const res = await getEnterpriseInfo()
    form.value = {
      companyName: res.data.companyName,
      creditCode: res.data.creditCode,
      legalPerson: res.data.legalPerson,
      idCard: res.data.idCard
    }
    if (res.data.verified) {
      currentStep.value = 2
    }
  } catch (e) {
    console.error(e)
  }
})

const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!form.value.companyName || !form.value.creditCode) {
      showToast('请填写完整的企业信息')
      return
    }
    currentStep.value = 1
  } else if (currentStep.value === 1) {
    if (!form.value.legalPerson || !form.value.idCard) {
      showToast('请填写完整的法人信息')
      return
    }
    try {
      await verifyEnterprise(form.value)
      showToast('信息验证通过')
      currentStep.value = 2
    } catch (e) {
      console.error(e)
    }
  }
}

const submitApply = async () => {
  try {
    await signAuth()
    showToast('授信申请提交成功')
    setTimeout(() => {
      router.push('/home')
    }, 1000)
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.credit-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.steps {
  padding: 20px 16px;
  background: white;
}

.step-content {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 16px;
}

.agreement-box {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.agreement-box h4 {
  font-size: 15px;
  color: #323233;
  margin-bottom: 12px;
  text-align: center;
}

.agreement-box p {
  font-size: 14px;
  color: #646566;
  line-height: 1.8;
  margin-bottom: 10px;
}

.agree-check {
  padding: 0 8px;
}

.button-wrap {
  position: fixed;
  bottom: 30px;
  left: 16px;
  right: 16px;
}
</style>
