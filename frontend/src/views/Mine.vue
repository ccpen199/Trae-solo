<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, Dialog } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  Dialog.confirm({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(() => {
    userStore.logout()
    showToast({ message: '已退出登录', type: 'success' })
    router.push('/home')
  }).catch(() => {})
}

const goToRecharge = () => {
  router.push('/recharge')
}

const goToWithdraw = () => {
  router.push('/withdraw')
}

const goToTransactions = () => {
  router.push('/transactions')
}

const goToInvestments = () => {
  router.push('/investments')
}

const goToRepaymentPlans = () => {
  router.push('/repayment-plans')
}
</script>

<template>
  <div class="mine-page">
    <div class="user-header">
      <div class="user-avatar">
        <van-image
          :src="userStore.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'"
          round
          width="64"
          height="64"
        />
      </div>
      <div class="user-info">
        <div class="user-name">{{ userStore.user?.nickname || '用户' }}</div>
        <div class="user-phone">{{ userStore.user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '' }}</div>
      </div>
      <van-icon name="setting-o" size="22" class="settings-icon" />
    </div>

    <div class="balance-section">
      <div class="balance-item">
        <div class="balance-value">{{ (userStore.user?.balance || 0).toFixed(2) }}</div>
        <div class="balance-label">账户余额(元)</div>
      </div>
      <div class="balance-divider"></div>
      <div class="balance-item">
        <div class="balance-value">{{ (userStore.user?.total_invest || 0).toFixed(2) }}</div>
        <div class="balance-label">累计投资(元)</div>
      </div>
      <div class="balance-divider"></div>
      <div class="balance-item">
        <div class="balance-value">{{ (userStore.user?.total_earnings || 0).toFixed(2) }}</div>
        <div class="balance-label">累计收益(元)</div>
      </div>
    </div>

    <div class="action-section">
      <van-button type="primary" block size="normal" @click="goToRecharge">充值</van-button>
      <van-button type="danger" block size="normal" plain @click="goToWithdraw">提现</van-button>
    </div>

    <div class="menu-section">
      <van-cell-group inset>
        <van-cell title="我的投资" is-link @click="goToInvestments">
          <template #icon>
            <van-icon name="orders-o" size="20" color="#1989fa" />
          </template>
        </van-cell>
        <van-cell title="回款计划" is-link @click="goToRepaymentPlans">
          <template #icon>
            <van-icon name="gold-coin-o" size="20" color="#ff4d4f" />
          </template>
        </van-cell>
        <van-cell title="交易记录" is-link @click="goToTransactions">
          <template #icon>
            <van-icon name="balance-list-o" size="20" color="#07c160" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="logout-section">
      <van-button block size="normal" @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.user-header {
  background: linear-gradient(135deg, #1989fa, #57a3f3);
  padding: 40px 20px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  color: white;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 14px;
  opacity: 0.9;
}

.settings-icon {
  color: white;
  flex-shrink: 0;
}

.balance-section {
  background: white;
  margin: -16px 16px 0;
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.balance-item {
  flex: 1;
  text-align: center;
}

.balance-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.balance-label {
  font-size: 12px;
  color: #999;
}

.balance-divider {
  width: 1px;
  background: #f0f0f0;
  margin: 0 8px;
}

.action-section {
  padding: 20px 16px;
  display: flex;
  gap: 12px;
}

.action-section .van-button {
  flex: 1;
}

.menu-section {
  padding: 0 16px;
}

.logout-section {
  padding: 40px 16px 20px;
}
</style>
