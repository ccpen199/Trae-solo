<template>
  <div class="success-page">
    <div class="success-bg"></div>
    <div class="page-content">
      <div class="success-icon">
        <van-icon name="checked" size="60" color="#fff" />
      </div>
      <div class="success-title">预约成功</div>
      <div class="success-sub">您的预约已提交，请按时前往办理</div>

      <div class="ticket-card">
        <div class="ticket-header">
          <div class="ticket-title">预约凭证</div>
          <div class="ticket-no">NO.{{ orderNo }}</div>
        </div>
        <div class="ticket-qr">
          <div class="qr-box">
            <van-icon name="qr" size="80" color="#1976d2" />
          </div>
          <div class="qr-tip">现场出示此二维码签到</div>
        </div>
        <div class="ticket-info">
          <div class="info-row">
            <span class="info-label">办理事项</span>
            <span class="info-value">{{ info.service || '身份证补办' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">办理网点</span>
            <span class="info-value">{{ info.outlet || '渝中区政务服务中心' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">预约时间</span>
            <span class="info-value highlight">{{ info.time || '2024-05-20 10:30' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">办理窗口</span>
            <span class="info-value">{{ info.window || '3号窗口' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">预计时长</span>
            <span class="info-value">{{ info.duration || '约15分钟' }}</span>
          </div>
        </div>
        <div class="ticket-footer">
          <div class="tip-row">
            <van-icon name="info-o" size="14" color="#ff9800" />
            <span>请提前15分钟到达，迟到15分钟预约自动取消</span>
          </div>
        </div>
      </div>

      <div class="tips-card">
        <div class="tips-title">温馨提示</div>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-num">1</span>
            <span class="tip-text">请携带本人有效身份证件原件</span>
          </div>
          <div class="tip-item">
            <span class="tip-num">2</span>
            <span class="tip-text">如需代办，请携带代办人身份证及授权书</span>
          </div>
          <div class="tip-item">
            <span class="tip-num">3</span>
            <span class="tip-text">建议使用公共交通前往，避免停车不便</span>
          </div>
        </div>
      </div>

      <div class="action-row">
        <van-button plain icon="calendar-o" block @click="addToCalendar">加入日历</van-button>
        <van-button type="primary" icon="location-o" block @click="goNav" style="margin-left: 10px">
          导航前往
        </van-button>
      </div>

      <div class="action-row">
        <van-button plain block @click="goHome" style="flex: 1; margin-right: 5px">返回首页</van-button>
        <van-button plain block @click="goAppointments" style="flex: 1; margin-left: 5px">查看预约</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

const orderNo = ref('')
const info = ref({})

function addToCalendar() { showToast('已添加到系统日历') }
function goNav() { router.push({ path: '/outlets/ar-nav', query: { name: info.value.outlet } }) }
function goHome() { router.replace('/') }
function goAppointments() { router.replace('/outlets/appointment') }

onMounted(() => {
  orderNo.value = 'YY' + Date.now().toString().slice(-8)
  info.value = {
    service: route.query.service || '身份证补办',
    outlet: route.query.outlet || '渝中区政务服务中心',
    time: route.query.time || '2024-05-20 10:30',
    window: '3号窗口',
    duration: '约15分钟'
  }
})
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: #f5f7fa;
  position: relative;
}
.success-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 280px;
  background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);
  border-radius: 0 0 40px 40px;
}
.page-content {
  position: relative;
  z-index: 1;
  padding: 40px 16px 30px;
  text-align: center;
}
.success-icon {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
  animation: pop 0.4s ease;
}
@keyframes pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.success-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.success-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 28px;
}

.ticket-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.ticket-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  color: #fff;
}
.ticket-title { font-size: 15px; font-weight: 600; }
.ticket-no { font-size: 12px; opacity: 0.9; }

.ticket-qr {
  padding: 20px;
  text-align: center;
  border-bottom: 1px dashed #eee;
}
.qr-box {
  display: inline-block;
  padding: 16px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 10px;
}
.qr-tip { font-size: 12px; color: #666; }

.ticket-info { padding: 4px 16px; }
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #999; }
.info-value { color: #333; font-weight: 500; text-align: right; max-width: 60%; }
.info-value.highlight { color: #1976d2; font-weight: 600; }

.ticket-footer {
  padding: 12px 16px;
  background: #fffbe6;
}
.tip-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px;
  color: #b26a00;
}

.tips-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
  text-align: left;
}
.tips-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.tips-list { display: flex; flex-direction: column; gap: 10px; }
.tip-item {
  display: flex; align-items: flex-start; gap: 10px;
}
.tip-num {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.tip-text { flex: 1; font-size: 13px; color: #666; line-height: 1.5; }

.action-row {
  display: flex;
  margin-bottom: 12px;
}
</style>
