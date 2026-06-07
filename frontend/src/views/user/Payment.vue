<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetailApi } from '@/api/order'
import { createPaymentApi, getPaymentMethodsApi } from '@/api/payment'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const orderId = Number(route.params.orderId)
const loading = ref(false)
const paying = ref(false)
const order = ref<any>(null)
const paymentMethods = ref<any[]>([])
const selectedMethod = ref('')

const paymentIcons: Record<string, string> = {
  wechat: 'ChatDotRound',
  alipay: 'CircleCheck',
  balance: 'Wallet',
  card: 'CreditCard'
}

const paymentNames: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  balance: '余额支付',
  card: '银行卡'
}

async function loadOrder() {
  loading.value = true
  try {
    const res = await getOrderDetailApi(orderId)
    order.value = res.data
  } catch (error) {
    console.error('Load order error:', error)
  } finally {
    loading.value = false
  }
}

async function loadPaymentMethods() {
  try {
    const res = await getPaymentMethodsApi()
    paymentMethods.value = res.data
    if (paymentMethods.value.length > 0) {
      selectedMethod.value = paymentMethods.value[0].code
    }
  } catch (error) {
    console.error('Load payment methods error:', error)
    paymentMethods.value = [
      { code: 'wechat', name: '微信支付', enabled: true },
      { code: 'alipay', name: '支付宝', enabled: true },
      { code: 'balance', name: '余额支付', enabled: true },
      { code: 'card', name: '银行卡', enabled: true }
    ]
    selectedMethod.value = 'wechat'
  }
}

async function handlePay() {
  if (!selectedMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }

  paying.value = true
  try {
    const res = await createPaymentApi({
      orderId: orderId,
      paymentMethod: selectedMethod.value as any
    })

    ElMessage.success('支付成功！')
    router.push(`/order/${orderId}`)
  } catch (error) {
    console.error('Payment error:', error)
  } finally {
    paying.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadOrder()
  loadPaymentMethods()
})
</script>

<template>
  <div class="payment-page">
    <PageHeader title="订单支付" show-back />

    <div v-if="loading" class="content-wrapper">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="!order" class="content-wrapper">
      <EmptyState description="订单不存在" icon="Warning" />
    </div>

    <div v-else class="content-wrapper">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="14">
          <el-card class="order-card">
            <template #header>
              <div class="card-header">
                <span>订单信息</span>
                <StatusBadge :status="order.status" type="order" />
              </div>
            </template>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="订单编号">
                {{ order.orderNo }}
              </el-descriptions-item>
              <el-descriptions-item label="设备名称">
                {{ order.deviceName }}
              </el-descriptions-item>
              <el-descriptions-item label="洗涤程序">
                {{ order.program }}
              </el-descriptions-item>
              <el-descriptions-item label="洗涤时长">
                {{ order.duration }} 分钟
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ order.createdAt }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="payment-card">
            <template #header>
              <span>选择支付方式</span>
            </template>

            <div class="payment-methods">
              <div
                v-for="method in paymentMethods"
                :key="method.code"
                class="payment-method-item"
                :class="{ active: selectedMethod === method.code, disabled: !method.enabled }"
                @click="method.enabled && (selectedMethod = method.code)"
              >
	                <el-radio
	                  :model-value="selectedMethod"
	                  :value="method.code"
	                  :disabled="!method.enabled"
	                />
                <el-icon :size="28">
                  <component :is="paymentIcons[method.code]" />
                </el-icon>
                <div class="method-info">
                  <div class="method-name">{{ paymentNames[method.code] || method.name }}</div>
                  <div class="method-desc" v-if="method.code === 'balance'">
                    余额: ¥{{ order.userBalance || 0 }}
                  </div>
                </div>
                <el-tag v-if="!method.enabled" type="info" size="small">暂不可用</el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="10">
          <el-card class="summary-card">
            <template #header>
              <span>支付摘要</span>
            </template>

            <div class="summary-content">
              <div class="summary-row">
                <span class="label">商品金额</span>
                <span class="value">¥{{ order.amount }}</span>
              </div>
              <div class="summary-row">
                <span class="label">优惠券</span>
                <span class="value discount">-¥0.00</span>
              </div>
              <div class="summary-row total">
                <span class="label">实付金额</span>
                <span class="value price">¥{{ order.amount }}</span>
              </div>

              <div class="pay-section">
                <div class="pay-amount">
                  <span>支付金额：</span>
                  <span class="amount">¥{{ order.amount }}</span>
                </div>
                <el-button
                  type="primary"
                  size="large"
                  :loading="paying"
                  class="pay-btn"
                  @click="handlePay"
                >
                  立即支付
                </el-button>
                <el-button class="cancel-btn" @click="goBack">取消支付</el-button>
              </div>
            </div>
          </el-card>

          <el-card class="security-card">
            <div class="security-info">
              <el-icon color="#67c23a" size="18"><Lock /></el-icon>
              <span>您的支付信息将被安全加密处理</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.payment-page {
  min-height: 100vh;
  background: #f5f7fa;

  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 24px;
  }

  .order-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .payment-card {
    .payment-methods {
      .payment-method-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 2px solid #ebeef5;
        border-radius: 8px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover:not(.disabled) {
          border-color: #409eff;
        }

        &.active {
          border-color: #409eff;
          background: #ecf5ff;
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .method-info {
          flex: 1;

          .method-name {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
          }

          .method-desc {
            font-size: 13px;
            color: #909399;
            margin-top: 2px;
          }
        }
      }
    }
  }

  .summary-card {
    position: sticky;
    top: 20px;

    .summary-content {
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        font-size: 15px;

        &.total {
          margin-top: 8px;
          padding-top: 16px;
          border-top: 2px solid #ebeef5;

          .label {
            font-size: 16px;
            font-weight: 600;
          }

          .value.price {
            font-size: 28px;
            color: #f56c6c;
            font-weight: 700;
          }
        }

        .label {
          color: #606266;
        }

        .value {
          color: #303133;

          &.discount {
            color: #67c23a;
          }
        }
      }

      .pay-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ebeef5;

        .pay-amount {
          text-align: right;
          margin-bottom: 16px;
          font-size: 15px;

          .amount {
            font-size: 28px;
            font-weight: 700;
            color: #f56c6c;
            margin-left: 8px;
          }
        }

        .pay-btn {
          width: 100%;
          height: 48px;
          font-size: 16px;
          margin-bottom: 12px;
        }

        .cancel-btn {
          width: 100%;
          height: 40px;
        }
      }
    }
  }

  .security-card {
    margin-top: 20px;
    padding: 12px 16px;

    .security-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: #606266;
    }
  }
}
</style>
