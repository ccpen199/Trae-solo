<template>
  <div class="wallet-page">
    <div class="wallet-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <van-icon name="arrow-left" size="20" color="#fff" @click="goBack" />
        <div class="header-title">加油钱包</div>
      </div>
    </div>

    <div class="balance-card">
      <div class="card-bg"></div>
      <div class="card-content">
        <div class="balance-label">账户余额</div>
        <div class="balance-value">¥{{ userStore.userInfo?.balance || 0 }}</div>
        <div class="card-actions">
          <van-button type="primary" size="small" @click="showRechargePopup = true" class="recharge-btn">
            充值
          </van-button>
          <van-button type="default" size="small" @click="goTransactions" class="history-btn">
            账单
          </van-button>
        </div>
      </div>
    </div>

    <div class="wallet-menu">
      <div class="menu-item" @click="goVehicles">
        <div class="menu-left">
          <van-icon name="car" size="22" color="#1989fa" />
          <span class="menu-text">车牌管理</span>
        </div>
        <van-icon name="arrow" size="14" color="#969799" />
      </div>
      <div class="menu-item" @click="goFuelOrders">
        <div class="menu-left">
          <van-icon name="new-fire-o" size="22" color="#ff9f43" />
          <span class="menu-text">加油记录</span>
        </div>
        <van-icon name="arrow" size="14" color="#969799" />
      </div>
      <div class="menu-item" @click="goInvoices">
        <div class="menu-left">
          <van-icon name="newspaper-o" size="22" color="#4ecdc4" />
          <span class="menu-text">发票管理</span>
        </div>
        <van-icon name="arrow" size="14" color="#969799" />
      </div>
      <div class="menu-item" @click="goSetPaymentPassword">
        <div class="menu-left">
          <van-icon name="lock" size="22" color="#a8e063" />
          <span class="menu-text">支付密码</span>
        </div>
        <van-icon name="arrow" size="14" color="#969799" />
      </div>
    </div>

    <div class="recharge-rules">
      <div class="rules-title">充值优惠</div>
      <div class="rules-list">
        <div class="rule-item">
          <van-icon name="gift-o" size="14" color="#ff6b6b" />
          <span>充200送10元</span>
        </div>
        <div class="rule-item">
          <van-icon name="gift-o" size="14" color="#ff6b6b" />
          <span>充500送30元</span>
        </div>
        <div class="rule-item">
          <van-icon name="gift-o" size="14" color="#ff6b6b" />
          <span>充1000送80元</span>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showRechargePopup" round position="bottom" :style="{ height: '60%' }">
      <div class="recharge-popup">
        <div class="popup-header">
          <span class="popup-title">账户充值</span>
          <van-icon name="cross" size="20" @click="showRechargePopup = false" />
        </div>
        <div class="recharge-content">
          <div class="recharge-amount">
            <div class="amount-title">选择充值金额</div>
            <div class="amount-grid">
              <div
                class="amount-item"
                :class="{ active: rechargeAmount === 100 }"
                @click="rechargeAmount = 100"
              >
                <div class="amount-value">¥100</div>
                <div class="amount-gift" v-if="false">送5元</div>
              </div>
              <div
                class="amount-item"
                :class="{ active: rechargeAmount === 200 }"
                @click="rechargeAmount = 200"
              >
                <div class="amount-value">¥200</div>
                <div class="amount-gift">送10元</div>
              </div>
              <div
                class="amount-item"
                :class="{ active: rechargeAmount === 500 }"
                @click="rechargeAmount = 500"
              >
                <div class="amount-value">¥500</div>
                <div class="amount-gift">送30元</div>
              </div>
              <div
                class="amount-item"
                :class="{ active: rechargeAmount === 1000 }"
                @click="rechargeAmount = 1000"
              >
                <div class="amount-value">¥1000</div>
                <div class="amount-gift">送80元</div>
              </div>
              <div
                class="amount-item"
                :class="{ active: rechargeAmount === 0 }"
                @click="rechargeAmount = 0"
              >
                <div class="amount-value">自定义</div>
                <van-field
                  v-if="rechargeAmount === 0"
                  v-model="customRechargeAmount"
                  type="number"
                  placeholder="输入金额"
                  @click.stop
                />
              </div>
            </div>
          </div>

          <div class="pay-methods">
            <div class="methods-title">选择支付方式</div>
            <div
              class="method-item"
              :class="{ active: rechargePayMethod === 'wechat' }"
              @click="rechargePayMethod = 'wechat'"
            >
              <van-icon name="wechat" size="24" color="#07c160" />
              <span class="method-name">微信支付</span>
              <van-icon
                v-if="rechargePayMethod === 'wechat'"
                name="checked"
                size="18"
                color="#1989fa"
              />
            </div>
            <div
              class="method-item"
              :class="{ active: rechargePayMethod === 'alipay' }"
              @click="rechargePayMethod = 'alipay'"
            >
              <van-icon name="wap-home" size="24" color="#1677ff" />
              <span class="method-name">支付宝</span>
              <van-icon
                v-if="rechargePayMethod === 'alipay'"
                name="checked"
                size="18"
                color="#1989fa"
              />
            </div>
          </div>

          <van-button
            type="primary"
            block
            size="large"
            :loading="rechargeLoading"
            :disabled="!canRecharge"
            @click="handleRecharge"
            class="recharge-btn"
          >
            确认充值 ¥{{ finalRechargeAmount }}
          </van-button>
        </div>
      </div>
    </van-popup>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getWallet, recharge, getTransactions } from '../../api/fuel'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const rechargeLoading = ref(false)
const showRechargePopup = ref(false)

const rechargeAmount = ref(200)
const customRechargeAmount = ref('')
const rechargePayMethod = ref('wechat')

const finalRechargeAmount = computed(() => {
  if (rechargeAmount.value === 0) {
    return parseFloat(customRechargeAmount.value) || 0
  }
  return rechargeAmount.value
})

const canRecharge = computed(() => {
  return finalRechargeAmount.value > 0
})

const goBack = () => {
  router.back()
}

const goTransactions = () => {
  showToast('账单页面开发中')
}

const goVehicles = () => {
  showToast('车牌管理页面开发中')
}

const goFuelOrders = () => {
  showToast('加油记录页面开发中')
}

const goInvoices = () => {
  showToast('发票管理页面开发中')
}

const goSetPaymentPassword = () => {
  showToast('支付密码页面开发中')
}

const handleRecharge = async () => {
  if (finalRechargeAmount.value <= 0) {
    showToast('请输入充值金额')
    return
  }

  rechargeLoading.value = true
  try {
    const res = await recharge({
      amount: finalRechargeAmount.value,
      payMethod: rechargePayMethod.value
    })

    showToast('充值成功！')
    showRechargePopup.value = false

    if (res.data.balance !== undefined) {
      userStore.updateBalance(res.data.balance)
    }
  } catch (error) {
    console.error('充值失败:', error)
    showToast(error.message || '充值失败')
  } finally {
    rechargeLoading.value = false
  }
}

const fetchWalletInfo = async () => {
  loading.value = true
  try {
    const res = await getWallet()
    if (res.data?.balance !== undefined) {
      userStore.updateBalance(res.data.balance)
    }
  } catch (error) {
    console.error('获取钱包信息失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWalletInfo()
})
</script>

<style lang="less" scoped>
.wallet-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.wallet-header {
  position: relative;
  padding: 20px 16px 60px;
  background: linear-gradient(180deg, #1989fa, #409eff);

  .header-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: #f5f5f5;
    border-radius: 40px 40px 0 0;
  }

  .header-content {
    display: flex;
    align-items: center;

    .header-title {
      flex: 1;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      text-align: center;
      margin-right: 20px;
    }
  }
}

.balance-card {
  position: relative;
  margin: -40px 16px 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(25, 137, 250, 0.2);

  .card-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #1989fa, #409eff);
  }

  .card-content {
    position: relative;
    padding: 24px 20px;

    .balance-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }

    .balance-value {
      font-size: 36px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 20px;
    }

    .card-actions {
      display: flex;
      gap: 12px;

      .recharge-btn,
      .history-btn {
        flex: 1;
        height: 40px;
        border-radius: 20px;
      }

      .recharge-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: #fff;
      }

      .history-btn {
        background: #fff;
        border: none;
        color: #1989fa;
      }
    }
  }
}

.wallet-menu {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;

  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f7f8fa;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    .menu-left {
      display: flex;
      align-items: center;

      .menu-text {
        margin-left: 12px;
        font-size: 14px;
        color: #323233;
      }
    }
  }
}

.recharge-rules {
  background: #fff;
  margin: 0 12px;
  padding: 16px;
  border-radius: 12px;

  .rules-title {
    font-size: 15px;
    font-weight: 600;
    color: #323233;
    margin-bottom: 12px;
  }

  .rules-list {
    .rule-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      font-size: 13px;
      color: #646566;

      .van-icon {
        margin-right: 8px;
      }
    }
  }
}

.recharge-popup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #ebedf0;

    .popup-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .recharge-content {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;

    .recharge-amount {
      margin-bottom: 24px;

      .amount-title {
        font-size: 15px;
        font-weight: 600;
        color: #323233;
        margin-bottom: 12px;
      }

      .amount-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .amount-item {
          width: calc(50% - 6px);
          padding: 16px 12px;
          border: 1px solid #ebedf0;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;

          &.active {
            border-color: #1989fa;
            background: rgba(25, 137, 250, 0.05);
          }

          .amount-value {
            font-size: 18px;
            font-weight: 600;
            color: #323233;
            margin-bottom: 4px;
          }

          .amount-gift {
            font-size: 11px;
            color: #ee0a24;
          }

          .van-field {
            margin-top: 8px;

            :deep(.van-field__control) {
              text-align: center;
            }
          }
        }
      }
    }

    .pay-methods {
      margin-bottom: 24px;

      .methods-title {
        font-size: 15px;
        font-weight: 600;
        color: #323233;
        margin-bottom: 12px;
      }

      .method-item {
        display: flex;
        align-items: center;
        padding: 16px 12px;
        border: 1px solid #ebedf0;
        border-radius: 8px;
        margin-bottom: 12px;
        cursor: pointer;

        &.active {
          border-color: #1989fa;
          background: rgba(25, 137, 250, 0.05);
        }

        .method-name {
          flex: 1;
          margin-left: 12px;
          font-size: 14px;
          color: #323233;
        }
      }
    }

    .recharge-btn {
      border-radius: 24px;
      background: linear-gradient(135deg, #1989fa, #409eff);
      border: none;
    }
  }
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
