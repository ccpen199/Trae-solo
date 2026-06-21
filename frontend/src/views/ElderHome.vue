<template>
  <div class="elder-page" :class="{ 'elder-mode': true }">
    <div class="elder-header">
      <div class="header-bg"></div>
      <div class="header-top">
        <div class="user-row" @click="goProfile">
          <div class="avatar">
            <span>{{ initial }}</span>
          </div>
          <div class="user-info">
            <div class="greeting">{{ greeting }}，您好</div>
            <div class="user-name">{{ userName }} · 已实名</div>
          </div>
        </div>
        <div class="mode-toggle" @click="toggleElder">
          <van-icon name="eye-o" size="20" />
          <span>标准版</span>
        </div>
      </div>
      <div class="time-display">
        <div class="time-now">{{ currentTime }}</div>
        <div class="date-now">{{ currentDate }}</div>
      </div>
    </div>

    <div class="page-content">
      <div class="quick-grid">
        <div class="quick-item" @click="goCode">
          <div class="quick-icon code">
            <van-icon name="qr" size="36" />
          </div>
          <span class="quick-label">亮身份码</span>
        </div>
        <div class="quick-item" @click="goService">
          <div class="quick-icon service">
            <span class="emoji">👩‍💼</span>
          </div>
          <span class="quick-label">人工客服</span>
        </div>
        <div class="quick-item" @click="goVoice">
          <div class="quick-icon voice">
            <span class="emoji">🎤</span>
          </div>
          <span class="quick-label">语音办事</span>
        </div>
        <div class="quick-item" @click="goAppointment">
          <div class="quick-icon appt">
            <van-icon name="calendar-o" size="36" />
          </div>
          <span class="quick-label">预约办事</span>
        </div>
        <div class="quick-item" @click="goNearby">
          <div class="quick-icon map">
            <van-icon name="location-o" size="36" />
          </div>
          <span class="quick-label">附近网点</span>
        </div>
        <div class="quick-item" @click="goAgentCreate">
          <div class="quick-icon agent">
            <span class="emoji">👨‍👩‍👧</span>
          </div>
          <span class="quick-label">亲友代办</span>
        </div>
        <div class="quick-item" @click="goAgentList">
          <div class="quick-icon auth">
            <span class="emoji">📋</span>
          </div>
          <span class="quick-label">代办记录</span>
        </div>
        <div class="quick-item" @click="goEmergency">
          <div class="quick-icon emer">
            <span class="emoji">📞</span>
          </div>
          <span class="quick-label">紧急联系</span>
        </div>
      </div>

      <div class="service-card card">
        <div class="card-title">常用服务</div>
        <div class="service-grid">
          <div class="svc-item" @click="bookService('养老金认证')">
            <span class="svc-ico">💳</span>
            <span class="svc-name">养老金认证</span>
          </div>
          <div class="svc-item" @click="bookService('医保报销')">
            <span class="svc-ico">❤️‍🩹</span>
            <span class="svc-name">医保报销</span>
          </div>
          <div class="svc-item" @click="bookService('身份证补办')">
            <span class="svc-ico">🪪</span>
            <span class="svc-name">身份证补办</span>
          </div>
          <div class="svc-item" @click="bookService('高龄补贴')">
            <span class="svc-ico">🎁</span>
            <span class="svc-name">高龄补贴</span>
          </div>
        </div>
      </div>

      <div class="notice-card card">
        <div class="card-title">
          <van-icon name="volume-o" size="20" color="#ff9800" />
          <span>服务公告</span>
        </div>
        <div class="notice-item" v-for="(n, i) in notices" :key="i">
          <span class="notice-dot">●</span>
          <span class="notice-text">{{ n }}</span>
        </div>
      </div>

      <div class="agent-card card" v-if="agentInfo">
        <div class="card-title">
          <span class="emoji">👨‍👩‍👧</span>
          <span>我的代办人</span>
        </div>
        <div class="agent-info">
          <div class="agent-avatar">
            <span>{{ agentInfo.name?.charAt(0) }}</span>
          </div>
          <div class="agent-detail">
            <div class="agent-name">{{ agentInfo.name }}（{{ agentInfo.relation }}）</div>
            <div class="agent-scope">授权范围：{{ agentInfo.scope }}</div>
            <div class="agent-expire">有效期至：{{ agentInfo.expire }}</div>
          </div>
          <van-button size="small" plain @click="goAgentList">管理</van-button>
        </div>
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getUserInfo, toggleElderMode } from '../api/users'

const router = useRouter()
const userStore = useUserStore()

const userName = ref('张大爷')
const currentTime = ref('')
const currentDate = ref('')
const notices = ref([
  '2024年度养老金资格认证已开始，请及时办理',
  '社区免费体检报名进行中，65岁以上老人可参加',
  '政务服务中心周末也可办理常用业务'
])
const agentInfo = ref({
  name: '张小华',
  relation: '儿子',
  scope: '社保、医保、公积金',
  expire: '2024-12-31'
})

let timer = null

const initial = computed(() => userName.value?.charAt(0) || '长')
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

function updateTime() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentDate.value = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weeks[d.getDay()]}`
}

function goCode() { router.push('/identity/code') }
function goService() { router.push('/elder/service') }
function goVoice() { router.push('/elder/voice') }
function goAppointment() { router.push('/outlets/appointment') }
function goNearby() { router.push('/outlets') }
function goAgentCreate() { router.push('/elder/agent/create') }
function goAgentList() { router.push('/elder/agent/operations') }
function goProfile() { router.push('/profile') }
function goEmergency() { showToast('正在拨打12345政务服务热线...') }
function bookService(name) {
  showToast(`预约：${name}`)
  router.push({ path: '/outlets/appointment', query: { service: name } })
}
async function toggleElder() {
  try {
    await toggleElderMode(userStore.currentUserId)
  } catch (e) {}
  userStore.setElderMode(false)
  router.replace('/')
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 30000)
  try {
    const u = await getUserInfo(userStore.currentUserId)
    if (u?.real_name) userName.value = u.real_name
  } catch (e) {}
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.elder-page {
  min-height: 100vh;
  background: #f0f2f5;
  font-size: 18px;
}
.elder-header { position: relative; padding-bottom: 30px; }
.header-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 240px;
  background: linear-gradient(135deg, #ff7043 0%, #f4511e 100%);
  border-radius: 0 0 32px 32px;
}
.header-top {
  position: relative; z-index: 1;
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 36px 20px 0;
  color: #fff;
}
.user-row { display: flex; align-items: center; gap: 14px; flex: 1; }
.avatar {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  font-weight: 700;
}
.user-info .greeting { font-size: 20px; margin-bottom: 4px; }
.user-info .user-name { font-size: 16px; opacity: 0.9; }
.mode-toggle {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 15px;
}
.time-display {
  position: relative; z-index: 1;
  text-align: center;
  padding: 24px 20px 0;
  color: #fff;
}
.time-now {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 4px;
}
.date-now {
  font-size: 16px;
  opacity: 0.92;
  margin-top: 4px;
}

.page-content {
  position: relative; z-index: 2;
  margin-top: -10px;
  padding: 0 16px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 10px;
  background: #fff;
  border-radius: 18px;
  padding: 24px 10px;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.quick-item {
  display: flex; flex-direction: column; align-items: center;
}
.quick-icon {
  width: 64px; height: 64px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  margin-bottom: 8px;
}
.quick-icon.code { background: linear-gradient(135deg, #1e88e5, #1565c0); }
.quick-icon.service { background: linear-gradient(135deg, #7b1fa2, #6a1b9a); }
.quick-icon.voice { background: linear-gradient(135deg, #e53935, #c62828); }
.quick-icon.appt { background: linear-gradient(135deg, #43a047, #2e7d32); }
.quick-icon.map { background: linear-gradient(135deg, #00897b, #00695c); }
.quick-icon.agent { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
.quick-icon.auth { background: linear-gradient(135deg, #546e7a, #37474f); }
.quick-icon.emer { background: linear-gradient(135deg, #d32f2f, #b71c1c); }
.emoji { font-size: 30px; }
.quick-label {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 20px 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}
.card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 19px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px;
}
.svc-item {
  display: flex; flex-direction: column; align-items: center;
}
.svc-ico { font-size: 34px; margin-bottom: 8px; }
.svc-name { font-size: 16px; color: #333; }

.notice-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.notice-item:last-child { border-bottom: none; }
.notice-dot { color: #ff9800; font-size: 8px; margin-top: 8px; }
.notice-text { flex: 1; font-size: 16px; color: #666; line-height: 1.5; }

.agent-info {
  display: flex; align-items: center; gap: 14px;
  padding: 10px;
  background: #fff8e1;
  border-radius: 14px;
}
.agent-avatar {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: #ff9800;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  font-weight: 600;
  flex-shrink: 0;
}
.agent-detail { flex: 1; }
.agent-name { font-size: 17px; font-weight: 600; color: #333; margin-bottom: 4px; }
.agent-scope, .agent-expire { font-size: 14px; color: #666; margin-bottom: 3px; }

.bottom-space { height: 30px; }
</style>
