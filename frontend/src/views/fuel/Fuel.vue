<template>
  <div class="fuel-page">
    <div class="fuel-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="header-title">一键加油</div>
      </div>
    </div>

    <div class="station-card" v-if="currentStation">
      <div class="station-info">
        <div class="station-name">{{ currentStation.name }}</div>
        <div class="station-address">
          <van-icon name="location-o" size="14" color="#969799" />
          <span>{{ currentStation.address }}</span>
        </div>
        <div class="station-services">
          <van-tag v-for="(service, idx) in stationServices" :key="idx" size="small" type="primary" plain>
            {{ service }}
          </van-tag>
        </div>
      </div>
      <div class="station-distance">
        <div class="distance">{{ currentStation.distance }}</div>
        <div class="nav-btn" @click="navigateTo">导航</div>
      </div>
    </div>

    <div class="fuel-options">
      <div class="options-header">
        <span class="options-title">选择油品</span>
      </div>
      <div class="fuel-type-list">
        <div
          class="fuel-type-item"
          :class="{ active: selectedFuel === '92#' }"
          @click="selectFuel('92#')"
        >
          <div class="fuel-name">92#汽油</div>
          <div class="fuel-price">
            <span class="price">¥{{ fuelPrices['92#'] }}</span>
            <span class="unit">/升</span>
          </div>
        </div>
        <div
          class="fuel-type-item"
          :class="{ active: selectedFuel === '95#'] }"
          @click="selectFuel('95#')"
        >
          <div class="fuel-name">95#汽油</div>
          <div class="fuel-price">
            <span class="price">¥{{ fuelPrices['95#'] }}</span>
            <span class="unit">/升</span>
          </div>
        </div>
        <div
          class="fuel-type-item"
          :class="{ active: selectedFuel === '98#'] }"
          @click="selectFuel('98#')"
        >
          <div class="fuel-name">98#汽油</div>
          <div class="fuel-price">
            <span class="price">¥{{ fuelPrices['98#'] }}</span>
            <span class="unit">/升</span>
          </div>
        </div>
        <div
          class="fuel-type-item"
          :class="{ active: selectedFuel === '0#柴油'] }"
          @click="selectFuel('0#柴油')"
        >
          <div class="fuel-name">0#柴油</div>
          <div class="fuel-price">
            <span class="price">¥{{ fuelPrices['0#柴油'] }}</span>
            <span class="unit">/升</span>
          </div>
        </div>
      </div>
    </div>

    <div class="fuel-amount">
      <div class="amount-header">
        <span class="amount-title">加油金额</span>
      </div>
      <div class="amount-options">
        <div
          class="amount-item"
          :class="{ active: selectedAmount === 100 }"
          @click="selectAmount(100)"
        >
          <div class="amount-value">¥100</div>
          <div class="amount-liters">约 {{ (100 / fuelPrices[selectedFuel]).toFixed(2) }} 升</div>
        </div>
        <div
          class="amount-item"
          :class="{ active: selectedAmount === 200 }"
          @click="selectAmount(200)"
        >
          <div class="amount-value">¥200</div>
          <div class="amount-liters">约 {{ (200 / fuelPrices[selectedFuel]).toFixed(2) }} 升</div>
        </div>
        <div
          class="amount-item"
          :class="{ active: selectedAmount === 300 }"
          @click="selectAmount(300)"
        >
          <div class="amount-value">¥300</div>
          <div class="amount-liters">约 {{ (300 / fuelPrices[selectedFuel]).toFixed(2) }} 升</div>
        </div>
        <div
          class="amount-item"
          :class="{ active: selectedAmount === 0 }"
          @click="selectAmount(0)"
        >
          <div class="amount-value">自定义</div>
          <van-field
            v-if="selectedAmount === 0"
            v-model="customAmount"
            type="number"
            placeholder="输入金额"
            @click.stop
          />
        </div>
      </div>
    </div>

    <div class="fuel-summary">
      <div class="summary-item">
        <span class="summary-label">加油油品</span>
        <span class="summary-value">{{ selectedFuel }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">油品单价</span>
        <span class="summary-value">¥{{ fuelPrices[selectedFuel] }}/升</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">加油金额</span>
        <span class="summary-value highlight">¥{{ finalAmount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">预计升数</span>
        <span class="summary-value">{{ (finalAmount / fuelPrices[selectedFuel]).toFixed(2) }} 升</span>
      </div>
    </div>

    <div class="wallet-info" v-if="userStore.isLoggedIn">
      <div class="wallet-left">
        <van-icon name="balance-pay" size="20" color="#1989fa" />
        <span class="wallet-label">加油钱包</span>
      </div>
      <div class="wallet-right">
        <span class="wallet-balance">¥{{ userStore.userInfo?.balance || 0 }}</span>
        <van-icon name="arrow" size="12" color="#969799" @click="goWallet" />
      </div>
    </div>

    <div class="fuel-bottom">
      <van-button
        type="primary"
        block
        size="large"
        :loading="loading"
        :disabled="!canFuel"
        @click="handleFuel"
        class="fuel-btn"
      >
        {{ userStore.isLoggedIn ? '立即加油' : '请先登录' }}
      </van-button>
    </div>

    <van-popup v-model:show="showPayPopup" round position="bottom" :style="{ height: '50%' }">
      <div class="pay-popup">
        <div class="popup-header">
          <span class="popup-title">确认支付</span>
          <van-icon name="cross" size="20" @click="showPayPopup = false" />
        </div>
        <div class="pay-content">
          <div class="pay-amount">
            <span class="pay-label">支付金额</span>
            <span class="pay-value">¥{{ finalAmount }}</span>
          </div>
          <div class="pay-methods">
            <div
              class="pay-method-item"
              :class="{ active: payMethod === 'wallet' }"
              @click="payMethod = 'wallet'"
            >
              <van-icon name="balance-pay" size="24" color="#1989fa" />
              <span class="method-name">加油钱包</span>
              <span class="method-balance">余额: ¥{{ userStore.userInfo?.balance || 0 }}</span>
              <van-icon
                v-if="payMethod === 'wallet'"
                name="checked"
                size="18"
                color="#1989fa"
              />
            </div>
            <div
              class="pay-method-item"
              :class="{ active: payMethod === 'wechat' }"
              @click="payMethod = 'wechat'"
            >
              <van-icon name="wechat" size="24" color="#07c160" />
              <span class="method-name">微信支付</span>
              <van-icon
                v-if="payMethod === 'wechat'"
                name="checked"
                size="18"
                color="#1989fa"
              />
            </div>
            <div
              class="pay-method-item"
              :class="{ active: payMethod === 'alipay' }"
              @click="payMethod = 'alipay'"
            >
              <van-icon name="wap-home" size="24" color="#1677ff" />
              <span class="method-name">支付宝</span>
              <van-icon
                v-if="payMethod === 'alipay'"
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
            :loading="payLoading"
            @click="confirmPay"
            class="pay-btn"
          >
            确认支付 ¥{{ finalAmount }}
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
import { showToast, showLoadingToast, closeToast } from 'vant'
import { quickFuel, getWallet } from '../../api/fuel'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const payLoading = ref(false)
const showPayPopup = ref(false)

const currentStation = ref({
  id: 1,
  name: '易捷加油 - 朝阳路站',
  address: '北京市朝阳区朝阳路100号',
  distance: '0.5km',
  rating: 4.8,
  services: '["便利店","洗车","休息区","充电桩"]'
})

const fuelPrices = ref({
  '92#': 7.59,
  '95#': 8.19,
  '98#': 9.19,
  '0#柴油': 7.29
})

const selectedFuel = ref('92#')
const selectedAmount = ref(200)
const customAmount = ref('')
const payMethod = ref('wallet')

const stationServices = computed(() => {
  try {
    return JSON.parse(currentStation.value.services || '[]')
  } catch {
    return []
  }
})

const finalAmount = computed(() => {
  if (selectedAmount.value === 0) {
    return parseFloat(customAmount.value) || 0
  }
  return selectedAmount.value
})

const canFuel = computed(() => {
  if (!userStore.isLoggedIn) return false
  return finalAmount.value > 0
})

const selectFuel = (type) => {
  selectedFuel.value = type
}

const selectAmount = (amount) => {
  selectedAmount.value = amount
}

const navigateTo = () => {
  showToast('正在跳转到导航...')
}

const goWallet = () => {
  router.push('/wallet')
}

const handleFuel = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  if (finalAmount.value <= 0) {
    showToast('请选择加油金额')
    return
  }

  showPayPopup.value = true
}

const confirmPay = async () => {
  payLoading.value = true
  try {
    const res = await quickFuel({
      stationId: currentStation.value.id,
      fuelType: selectedFuel.value,
      fuelPrice: fuelPrices.value[selectedFuel.value],
      amount: finalAmount.value,
      payMethod: payMethod.value
    })

    closeToast()
    showToast('加油成功！')
    showPayPopup.value = false

    if (res.data.balance !== undefined) {
      userStore.updateBalance(res.data.balance)
    }

    setTimeout(() => {
      router.push('/home')
    }, 1500)
  } catch (error) {
    console.error('加油失败:', error)
    showToast(error.message || '加油失败')
  } finally {
    payLoading.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    getWallet().catch(err => console.error('获取钱包信息失败:', err))
  }
})
</script>

<style lang="less" scoped>
.fuel-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.fuel-header {
  position: relative;
  padding: 20px 16px 40px;
  background: linear-gradient(180deg, #1989fa, #409eff);

  .header-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: #f5f5f5;
    border-radius: 20px 20px 0 0;
  }

  .header-content {
    text-align: center;

    .header-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }
  }
}

.station-card {
  display: flex;
  justify-content: space-between;
  background: #fff;
  margin: -20px 12px 12px;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .station-info {
    flex: 1;

    .station-name {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
      margin-bottom: 6px;
    }

    .station-address {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #646566;
      margin-bottom: 8px;

      .van-icon {
        margin-right: 4px;
      }
    }

    .station-services {
      display: flex;
      gap: 6px;
    }
  }

  .station-distance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-left: 12px;

    .distance {
      font-size: 18px;
      font-weight: 600;
      color: #1989fa;
      margin-bottom: 8px;
    }

    .nav-btn {
      padding: 4px 16px;
      background: linear-gradient(135deg, #1989fa, #409eff);
      color: #fff;
      font-size: 12px;
      border-radius: 12px;
      cursor: pointer;
    }
  }
}

.fuel-options,
.fuel-amount {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .options-header,
  .amount-header {
    margin-bottom: 12px;

    .options-title,
    .amount-title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
    }
  }
}

.fuel-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .fuel-type-item {
    width: calc(50% - 6px);
    padding: 12px;
    border: 1px solid #ebedf0;
    border-radius: 8px;
    cursor: pointer;

    &.active {
      border-color: #1989fa;
      background: rgba(25, 137, 250, 0.05);
    }

    .fuel-name {
      font-size: 14px;
      font-weight: 500;
      color: #323233;
      margin-bottom: 4px;
    }

    .fuel-price {
      .price {
        font-size: 20px;
        font-weight: 600;
        color: #ee0a24;
      }

      .unit {
        font-size: 12px;
        color: #969799;
      }
    }
  }
}

.amount-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .amount-item {
    width: calc(50% - 6px);
    padding: 16px 12px;
    border: 1px solid #ebedf0;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;

    &.active {
      border-color: #1989fa;
      background: rgba(25, 137, 250, 0.05);
    }

    .amount-value {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
      margin-bottom: 4px;
    }

    .amount-liters {
      font-size: 12px;
      color: #969799;
    }

    .van-field {
      margin-top: 8px;

      :deep(.van-field__control) {
        text-align: center;
      }
    }
  }
}

.fuel-summary {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f7f8fa;

    &:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-size: 14px;
      color: #646566;
    }

    .summary-value {
      font-size: 14px;
      color: #323233;

      &.highlight {
        font-size: 18px;
        font-weight: 600;
        color: #ee0a24;
      }
    }
  }
}

.wallet-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;

  .wallet-left {
    display: flex;
    align-items: center;

    .wallet-label {
      margin-left: 8px;
      font-size: 14px;
      color: #323233;
    }
  }

  .wallet-right {
    display: flex;
    align-items: center;

    .wallet-balance {
      font-size: 18px;
      font-weight: 600;
      color: #ee0a24;
      margin-right: 8px;
    }
  }
}

.fuel-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);

  .fuel-btn {
    border-radius: 24px;
    background: linear-gradient(135deg, #1989fa, #409eff);
    border: none;
  }
}

.pay-popup {
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

  .pay-content {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;

    .pay-amount {
      text-align: center;
      padding: 20px 0;
      margin-bottom: 20px;

      .pay-label {
        font-size: 14px;
        color: #646566;
        display: block;
        margin-bottom: 8px;
      }

      .pay-value {
        font-size: 32px;
        font-weight: 600;
        color: #ee0a24;
      }
    }

    .pay-methods {
      .pay-method-item {
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

        .method-balance {
          font-size: 12px;
          color: #969799;
          margin-right: 8px;
        }
      }
    }

    .pay-btn {
      margin-top: 24px;
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
