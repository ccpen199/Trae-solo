<template>
  <div class="recharge">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">充值中心</span>
      <span class="placeholder"></span>
    </div>

    <div class="recharge-content">
      <div class="balance-card">
        <div class="balance-info">
          <div class="balance-label">当前余额</div>
          <div class="balance-amount">¥{{ balance.toFixed(2) }}</div>
        </div>
        <div class="balance-actions">
          <button class="btn-detail" @click="showToast('账单记录功能开发中')">账单</button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">手机充值</div>
        <div class="phone-input">
          <span class="flag">🇨🇳</span>
          <input 
            type="tel" 
            v-model="phone" 
            placeholder="请输入手机号码"
            maxlength="11"
          />
        </div>
        <div class="amount-grid">
          <div 
            v-for="amount in phoneAmounts" 
            :key="amount.value"
            class="amount-item"
            :class="{ active: selectedPhoneAmount === amount.value }"
            @click="selectedPhoneAmount = amount.value"
          >
            <div class="amount-value">¥{{ amount.value }}</div>
            <div class="amount-discount" v-if="amount.discount">售价 ¥{{ amount.discount }}</div>
          </div>
        </div>
        <button class="btn-primary full" @click="rechargePhone">立即充值</button>
      </div>

      <div class="section">
        <div class="section-title">余额充值</div>
        <div class="amount-grid">
          <div 
            v-for="amount in balanceAmounts" 
            :key="amount.value"
            class="amount-item"
            :class="{ active: selectedBalanceAmount === amount.value }"
            @click="selectedBalanceAmount = amount.value"
          >
            <div class="amount-value">¥{{ amount.value }}</div>
            <div class="amount-discount" v-if="amount.gift">送 ¥{{ amount.gift }}</div>
          </div>
        </div>
        <button class="btn-primary full" @click="rechargeBalance">立即充值</button>
      </div>

      <div class="section">
        <div class="section-title">热门服务</div>
        <div class="service-grid">
          <div class="service-item" @click="showToast('流量充值功能开发中')">
            <div class="service-icon">📶</div>
            <div class="service-name">流量充值</div>
          </div>
          <div class="service-item" @click="showToast('游戏充值功能开发中')">
            <div class="service-icon">🎮</div>
            <div class="service-name">游戏充值</div>
          </div>
          <div class="service-item" @click="showToast('视频会员功能开发中')">
            <div class="service-icon">🎬</div>
            <div class="service-name">视频会员</div>
          </div>
          <div class="service-item" @click="showToast('音乐会员功能开发中')">
            <div class="service-icon">🎵</div>
            <div class="service-name">音乐会员</div>
          </div>
          <div class="service-item" @click="showToast('Q币充值功能开发中')">
            <div class="service-icon">💎</div>
            <div class="service-name">Q币充值</div>
          </div>
          <div class="service-item" @click="showToast('水电缴费功能开发中')">
            <div class="service-icon">💡</div>
            <div class="service-name">水电缴费</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">充值记录</div>
        <div class="record-list">
          <div v-for="record in records" :key="record.id" class="record-item">
            <div class="record-left">
              <div class="record-type">{{ record.type }}</div>
              <div class="record-time">{{ record.time }}</div>
            </div>
            <div class="record-right">
              <div class="record-amount" :class="record.status === 'success' ? 'success' : 'pending'">
                {{ record.amount > 0 ? '+' : '' }}{{ record.amount > 0 ? record.amount : '' }}{{ record.amount }}
              </div>
              <div class="record-status">{{ record.status === 'success' ? '成功' : '处理中' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showToast = inject('showToast');

const balance = ref(128.50);
const phone = ref('');
const selectedPhoneAmount = ref(50);
const selectedBalanceAmount = ref(100);

const phoneAmounts = [
  { value: 10, discount: 9.95 },
  { value: 20, discount: 19.9 },
  { value: 30, discount: 29.85 },
  { value: 50, discount: 49.8 },
  { value: 100, discount: 99.5 },
  { value: 200, discount: 198 }
];

const balanceAmounts = [
  { value: 50, gift: 0 },
  { value: 100, gift: 2 },
  { value: 200, gift: 5 },
  { value: 500, gift: 15 },
  { value: 1000, gift: 50 }
];

const records = ref([
  { id: 1, type: '手机充值', phone: '138****8000', amount: -50, time: '2026-05-10 14:30', status: 'success' },
  { id: 2, type: '余额充值', amount: +100, time: '2026-05-09 20:15', status: 'success' },
  { id: 3, type: '手机充值', phone: '139****1234', amount: -100, time: '2026-05-08 10:00', status: 'success' },
  { id: 4, type: '视频会员', amount: -25, time: '2026-05-07 18:45', status: 'success' }
]);

const goBack = () => {
  router.back();
};

const rechargePhone = () => {
  if (!phone.value || phone.value.length !== 11) {
    showToast('请输入正确的手机号码');
    return;
  }
  showToast('充值成功！');
  balance.value -= selectedPhoneAmount.value;
  records.value.unshift({
    id: Date.now(),
    type: '手机充值',
    phone: phone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    amount: -selectedPhoneAmount.value,
    time: new Date().toLocaleString('zh-CN'),
    status: 'success'
  });
};

const rechargeBalance = () => {
  showToast('充值成功！');
  balance.value += selectedBalanceAmount.value;
  records.value.unshift({
    id: Date.now(),
    type: '余额充值',
    amount: +selectedBalanceAmount.value,
    time: new Date().toLocaleString('zh-CN'),
    status: 'success'
  });
};
</script>

<style scoped>
.recharge {
  padding-bottom: 30px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(to right, #ff5000, #ff6b00);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .placeholder {
  width: 40px;
  color: #fff;
  font-size: 20px;
}

.title {
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}

.recharge-content {
  padding: 16px;
}

.balance-card {
  background: linear-gradient(135deg, #ff6b00, #ff8c00);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.balance-info .balance-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 8px;
}

.balance-info .balance-amount {
  color: #fff;
  font-size: 32px;
  font-weight: 700;
}

.balance-actions .btn-detail {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.phone-input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.phone-input .flag {
  font-size: 20px;
  margin-right: 12px;
}

.phone-input input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.amount-item {
  background: #f8f8f8;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-item.active {
  background: #fff5f0;
  border-color: #ff5000;
}

.amount-item .amount-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.amount-item.active .amount-value {
  color: #ff5000;
}

.amount-item .amount-discount {
  font-size: 12px;
  color: #ff5000;
}

.btn-primary {
  background: linear-gradient(to right, #ff5000, #ff6b00);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.service-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.service-name {
  font-size: 13px;
  color: #666;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-type {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  text-align: right;
}

.record-amount.success {
  color: #ff5000;
}

.record-amount.pending {
  color: #999;
}

.record-status {
  font-size: 12px;
  color: #999;
  text-align: right;
}
</style>
