<template>
  <div class="payment-container">
    <el-card class="payment-card">
      <template #header>
        <div class="card-header">
          <span>在线支付收银台</span>
        </div>
      </template>
      
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="100px"
      >
        <el-form-item label="商户">
          <el-select v-model="paymentForm.merchant_id" placeholder="请选择商户" style="width: 100%">
            <el-option
              v-for="merchant in merchants"
              :key="merchant.id"
              :label="merchant.merchant_name"
              :value="merchant.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="支付金额" prop="amount">
          <el-input-number
            v-model="paymentForm.amount"
            :precision="2"
            :min="0.01"
            :max="1000000"
            style="width: 100%"
          />
          <span class="amount-tip">元</span>
        </el-form-item>
        
        <el-form-item label="商品名称" prop="subject">
          <el-input v-model="paymentForm.subject" placeholder="请输入商品名称" />
        </el-form-item>
        
        <el-form-item label="商品描述">
          <el-input
            v-model="paymentForm.body"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述（可选）"
          />
        </el-form-item>
        
        <el-form-item label="支付渠道" prop="channel">
          <el-radio-group v-model="paymentForm.channel">
            <el-radio value="alipay">
              <el-icon><Wallet /></el-icon>
              支付宝
            </el-radio>
            <el-radio value="wechat">
              <el-icon><ChatDotRound /></el-icon>
              微信支付
            </el-radio>
            <el-radio value="unionpay">
              <el-icon><CreditCard /></el-icon>
              银联支付
            </el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handlePayment"
          >
            立即支付
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-dialog
      v-model="payDialogVisible"
      title="支付结果"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="payResult" class="pay-result">
        <el-result
          :icon="payResult.success ? 'success' : 'warning'"
          :title="payResult.success ? '支付成功' : '支付处理中'"
          :sub-title="payResult.message"
        >
          <template #extra>
            <div class="result-info">
              <p><strong>订单号：</strong>{{ payResult.order_no }}</p>
              <p><strong>支付金额：</strong>¥{{ payResult.amount }}</p>
              <p><strong>状态：</strong>
                <el-tag :type="payResult.success ? 'success' : 'warning'">
                  {{ payResult.status }}
                </el-tag>
              </p>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button @click="payDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToOrders">查看订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Wallet, ChatDotRound, CreditCard } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const paymentFormRef = ref(null)
const loading = ref(false)
const payDialogVisible = ref(false)
const payResult = ref(null)
const merchants = ref([])

const paymentForm = reactive({
  merchant_id: null,
  amount: 99.00,
  subject: '测试商品',
  body: '',
  channel: 'alipay'
})

const paymentRules = {
  merchant_id: [
    { required: true, message: '请选择商户', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入支付金额', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请输入商品名称', trigger: 'blur' }
  ],
  channel: [
    { required: true, message: '请选择支付渠道', trigger: 'change' }
  ]
}

async function loadMerchants() {
  try {
    merchants.value = [
      { id: 1, merchant_name: '演示商户 (M001)' }
    ]
    paymentForm.merchant_id = 1
  } catch (error) {
    console.error('Load merchants error:', error)
  }
}

async function handlePayment() {
  if (!paymentFormRef.value) return
  
  await paymentFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await api.post('/v1/payment/order', {
          merchant_id: paymentForm.merchant_id,
          amount: paymentForm.amount,
          channel: paymentForm.channel,
          subject: paymentForm.subject,
          body: paymentForm.body
        })
        
        if (response.success) {
          ElMessage.success('订单创建成功，模拟支付中...')
          
          setTimeout(async () => {
            try {
              await api.post('/v1/payment/callback', {
                order_no: response.data.order_no,
                transaction_id: `CH${Date.now()}`,
                success: true
              })
              
              payResult.value = {
                success: true,
                order_no: response.data.order_no,
                amount: response.data.amount,
                status: '已支付',
                message: '您的支付已成功'
              }
              payDialogVisible.value = true
            } catch (err) {
              payResult.value = {
                success: false,
                order_no: response.data.order_no,
                amount: response.data.amount,
                status: '支付中',
                message: '支付正在处理中，请稍后查看订单状态'
              }
              payDialogVisible.value = true
            }
          }, 1500)
        }
      } catch (error) {
        console.error('Payment error:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

function goToOrders() {
  payDialogVisible.value = false
  router.push({ name: 'CustomerOrders' })
}

onMounted(() => {
  loadMerchants()
})
</script>

<style scoped>
.payment-container {
  max-width: 600px;
  margin: 0 auto;
}

.payment-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.amount-tip {
  margin-left: 10px;
  color: #909399;
}

.pay-result {
  text-align: center;
}

.result-info {
  text-align: left;
  padding: 0 40px;
}

.result-info p {
  margin: 10px 0;
  color: #606266;
}
</style>
