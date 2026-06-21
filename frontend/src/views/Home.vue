<template>
  <div class="home-page">
    <div class="header">
      <div class="header-bg"></div>
      <div class="user-row">
        <div class="user-info" @click="goToProfile">
          <div class="avatar">
            <span>{{ userInfo?.real_name?.charAt(0) || '用' }}</span>
          </div>
          <div class="user-detail">
            <div class="greeting">{{ greeting }}，{{ userInfo?.real_name || '游客' }}</div>
            <div class="subtitle">
              <van-tag type="success" plain size="mini">已实名</van-tag>
              <span class="cert-count">{{ userInfo?.cert_count || 0 }} 张证件</span>
            </div>
          </div>
          <van-icon name="arrow" color="#fff" />
        </div>
        <div class="header-actions">
          <div class="action-btn" @click="goToVoiceInput">
            <van-icon name="microphone" size="22" />
          </div>
          <div class="action-btn" @click="goToService">
            <van-icon name="service-o" size="22" />
          </div>
        </div>
      </div>

      <div class="search-bar" @click="showSearch = true">
        <van-icon name="search" size="16" color="#999" />
        <span class="search-placeholder">搜索服务事项、网点、证件...</span>
      </div>
    </div>

    <div class="page-content">
      <div class="quick-actions card">
        <div class="action-item" @click="goToCode">
          <div class="action-wrap">
            <div class="action-icon code">
              <van-icon name="qr" size="26" />
            </div>
            <span class="action-label">亮码</span>
          </div>
          <span class="hot-tag">常用</span>
        </div>
        <div class="action-item" @click="goToSmartMatch">
          <div class="action-wrap">
            <div class="action-icon match">
              <van-icon name="balance-o" size="26" />
            </div>
            <span class="action-label">智能匹配</span>
          </div>
        </div>
        <div class="action-item" @click="goToMap">
          <div class="action-wrap">
            <div class="action-icon map">
              <van-icon name="location-o" size="26" />
            </div>
            <span class="action-label">附近网点</span>
          </div>
        </div>
        <div class="action-item" @click="goToAppointment">
          <div class="action-wrap">
            <div class="action-icon appt">
              <van-icon name="calendar-o" size="26" />
            </div>
            <span class="action-label">在线预约</span>
          </div>
        </div>
        <div class="action-item" @click="goToARNav">
          <div class="action-wrap">
            <div class="action-icon ar">
              <span class="ar-icon">AR</span>
            </div>
            <span class="action-label">实景导航</span>
          </div>
          <span class="new-tag">新</span>
        </div>
        <div class="action-item" @click="goToAgent">
          <div class="action-wrap">
            <div class="action-icon agent">
              <van-icon name="friends-o" size="26" />
            </div>
            <span class="action-label">亲友代办</span>
          </div>
        </div>
        <div class="action-item" @click="goToElder">
          <div class="action-wrap">
            <div class="action-icon elder">
              <van-icon name="heart-o" size="26" />
            </div>
            <span class="action-label">长辈版</span>
          </div>
        </div>
        <div class="action-item" @click="goToAdmin">
          <div class="action-wrap">
            <div class="action-icon admin">
              <van-icon name="chart-trending-o" size="26" />
            </div>
            <span class="action-label">工作台</span>
          </div>
        </div>
      </div>

      <div class="identity-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot blue"></span>
            电子身份码
          </div>
          <span class="section-more" @click="goToCode">立即亮码 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="code-display" @click="goToCode">
          <div class="qr-area">
            <div class="qr-placeholder">
              <van-icon name="qr" size="64" color="#1976d2" />
            </div>
            <div class="code-status">
              <span class="status-dot"></span>
              <span>动态码 实时有效</span>
            </div>
          </div>
          <div class="code-info">
            <div class="info-row">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ userInfo?.real_name || '***' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">证件号</span>
              <span class="info-value">{{ maskedIdCard }}</span>
            </div>
            <div class="info-row risk-row">
              <span class="info-label">风险等级</span>
              <span class="risk-tag" :class="'risk-' + riskLevel">{{ riskText }}</span>
            </div>
          </div>
        </div>
        <div class="code-actions">
          <div class="code-btn" @click="goToCerts">
            <van-icon name="description" size="16" />
            <span>证件管理 ({{ certCount }})</span>
          </div>
          <div class="code-btn" @click="goToRisk">
            <van-icon name="shield-o" size="16" />
            <span>风险详情</span>
          </div>
          <div class="code-btn" @click="goToRecords">
            <van-icon name="clock-o" size="16" />
            <span>亮码记录</span>
          </div>
        </div>
      </div>

      <div class="service-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot green"></span>
            就近办理
          </div>
          <span class="section-more" @click="goToOutlets">更多服务 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="nearby-outlet" v-if="nearbyOutlet" @click="goToOutletDetail(nearbyOutlet.id)">
          <div class="outlet-info">
            <div class="outlet-name-row">
              <span class="outlet-name">{{ nearbyOutlet.name }}</span>
              <span class="outlet-distance">{{ formatDistance(nearbyOutlet.distance) }}</span>
            </div>
            <div class="outlet-addr">
              <van-icon name="location-o" size="12" /> {{ nearbyOutlet.address }}
            </div>
            <div class="outlet-status">
              <span class="wait-tag">
                <van-icon name="clock-o" size="12" /> 约{{ nearbyOutlet.avg_wait || 15 }}分钟
              </span>
              <span class="window-tag">
                <van-icon name="shop-o" size="12" /> {{ nearbyOutlet.open_windows || 5 }}窗开放
              </span>
            </div>
          </div>
          <van-button size="small" type="primary" round>去这里</van-button>
        </div>
        <div class="nearby-actions">
          <div class="nearby-action-item" @click="goToSmartMatch">
            <div class="nearby-action-icon match-icon">
              <van-icon name="balance-o" size="20" />
            </div>
            <div class="nearby-action-text">
              <span class="nearby-action-name">智能匹配</span>
              <span class="nearby-action-desc">事项×网点×时段</span>
            </div>
          </div>
          <div class="nearby-action-item" @click="goToAppointment">
            <div class="nearby-action-icon appt-icon">
              <van-icon name="calendar-o" size="20" />
            </div>
            <div class="nearby-action-text">
              <span class="nearby-action-name">在线预约</span>
              <span class="nearby-action-desc">选择时段免排队</span>
            </div>
          </div>
          <div class="nearby-action-item" @click="goToARNav">
            <div class="nearby-action-icon ar-icon">
              <span style="font-size:14px;font-weight:700;font-style:italic">AR</span>
            </div>
            <div class="nearby-action-text">
              <span class="nearby-action-name">实景导航</span>
              <span class="nearby-action-desc">AR步行引导</span>
            </div>
          </div>
        </div>
        <div class="service-types">
          <div class="type-item" @click="bookService('身份证补办')">
            <span class="type-icon">🪪</span>
            <span class="type-name">身份证补办</span>
          </div>
          <div class="type-item" @click="bookService('社保查询')">
            <span class="type-icon">💳</span>
            <span class="type-name">社保查询</span>
          </div>
          <div class="type-item" @click="bookService('医保报销')">
            <span class="type-icon">❤️‍🩹</span>
            <span class="type-name">医保报销</span>
          </div>
          <div class="type-item" @click="bookService('公积金提取')">
            <span class="type-icon">💰</span>
            <span class="type-name">公积金</span>
          </div>
          <div class="type-item" @click="bookService('驾驶证换证')">
            <span class="type-icon">🚗</span>
            <span class="type-name">驾驶证</span>
          </div>
          <div class="type-item" @click="bookService('不动产登记')">
            <span class="type-icon">🏠</span>
            <span class="type-name">不动产</span>
          </div>
        </div>
      </div>

      <div class="elder-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot orange"></span>
            暖心服务
          </div>
          <span class="section-more" @click="goToElderHome">进入长辈版 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="elder-banner" @click="goToElderHome">
          <div class="elder-text">
            <div class="elder-title">长辈专属版本</div>
            <div class="elder-desc">大字 · 语音 · 人工直连 · 无广告</div>
          </div>
          <div class="elder-entry">
            <span>立即体验</span>
            <van-icon name="arrow" />
          </div>
        </div>
        <div class="elder-features">
          <div class="elder-feature" @click="goToElderHome">
            <div class="feature-icon">🔤</div>
            <div class="feature-body">
              <span class="feature-name">长辈独立环境</span>
              <span class="feature-desc">大字体、高对比度、禁弹窗</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="elder-feature" @click="goToVoiceInput">
            <div class="feature-icon">🎤</div>
            <div class="feature-body">
              <span class="feature-name">语音办事</span>
              <span class="feature-desc">说句话即可办理业务</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="elder-feature" @click="goToService">
            <div class="feature-icon">👩‍💼</div>
            <div class="feature-body">
              <span class="feature-name">人工坐席直连</span>
              <span class="feature-desc">一键拨通人工客服</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
        </div>
        <div class="elder-agent-row">
          <div class="elder-btn" @click="goToAgentCreate">
            <div class="elder-btn-icon auth">👨‍👩‍👧</div>
            <span>创建代办</span>
          </div>
          <div class="elder-btn" @click="goToAgentOps">
            <div class="elder-btn-icon log">📋</div>
            <span>代办记录</span>
          </div>
          <div class="elder-btn" @click="goToAgent">
            <div class="elder-btn-icon scope">🔐</div>
            <span>授权管理</span>
          </div>
          <div class="elder-btn" @click="goToAgentConfirm">
            <div class="elder-btn-icon confirm">✅</div>
            <span>待确认</span>
          </div>
        </div>
      </div>

      <div class="admin-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot purple"></span>
            运营工作台
          </div>
          <span class="section-more" @click="goToAdmin">进入后台 <van-icon name="arrow" size="12" /></span>
        </div>
        <div class="stats-row">
          <div class="stat-item" @click="goToReport">
            <div class="stat-num">{{ stats.userCount || 0 }}</div>
            <div class="stat-label">注册用户</div>
          </div>
          <div class="stat-item" @click="goToHeat">
            <div class="stat-num">{{ stats.outletCount || 0 }}</div>
            <div class="stat-label">服务网点</div>
          </div>
          <div class="stat-item" @click="goToWindows">
            <div class="stat-num">{{ stats.todayAppointments || 0 }}</div>
            <div class="stat-label">今日预约</div>
          </div>
          <div class="stat-item" @click="goToLogs">
            <div class="stat-num">{{ stats.certCount || 0 }}</div>
            <div class="stat-label">电子证件</div>
          </div>
        </div>
        <div class="admin-shortcuts">
          <div class="shortcut-item" @click="goToHeat">
            <span class="shortcut-icon">📊</span>
            <span>热度预测</span>
          </div>
          <div class="shortcut-item" @click="goToWindows">
            <span class="shortcut-icon">🪟</span>
            <span>窗口调度</span>
          </div>
          <div class="shortcut-item" @click="goToLogs">
            <span class="shortcut-icon">📜</span>
            <span>审计日志</span>
          </div>
          <div class="shortcut-item" @click="goToReport">
            <span class="shortcut-icon">📈</span>
            <span>数据报表</span>
          </div>
        </div>
      </div>

      <div class="notice-section card">
        <van-notice-bar
          left-icon="volume-o"
          text="身份证补办支持全程网办，最快当日可取 | 长辈模式全新上线，操作更简单 | 亲友代办功能已开放授权"
          scrollable
          color="#ff9800"
          background="#fff8e1"
        />
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getUserInfo, toggleElderMode as apiToggleElder } from '../api/users'
import { getCertificates, getRiskAssessment } from '../api/identity'
import { getNearbyOutlets } from '../api/outlets'
import request from '../api/request'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const certCount = ref(0)
const riskLevel = ref('low')
const nearbyOutlet = ref(null)
const stats = ref({})
const showSearch = ref(false)

const riskText = computed(() => {
  const map = { low: '低风险', medium: '中风险', high: '高风险' }
  return map[riskLevel.value] || '低风险'
})

const maskedIdCard = computed(() => {
  if (userInfo.value?.id_card) {
    return userInfo.value.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }
  return '***'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

async function loadAll() {
  try {
    const uid = userStore.currentUserId
    const [user, certs, risk, nearby, statData] = await Promise.all([
      getUserInfo(uid),
      getCertificates(uid),
      getRiskAssessment(uid),
      getNearbyOutlets({ lng: 106.5516, lat: 29.5628, radius: 5000 }),
      request.get('/health/stats')
    ])
    userInfo.value = user
    userStore.setUserInfo(user)
    certCount.value = certs?.length || 0
    riskLevel.value = risk?.risk_level || 'low'
    nearbyOutlet.value = nearby?.[0] || null
    stats.value = statData || {}
  } catch (e) {
    console.error(e)
  }
}

function goToCode() { router.push('/identity/code') }
function goToCerts() { router.push('/identity/certificates') }
function goToRisk() { router.push('/identity/risk') }
function goToRecords() { router.push('/identity/records') }
function goToOutlets() { router.push('/outlets') }
function goToMap() { router.push('/outlets/map') }
function goToSmartMatch() { router.push('/outlets/smart-match') }
function goToAppointment() { router.push('/outlets/appointment') }
function goToARNav() { router.push('/outlets/ar-nav') }
function goToOutletDetail(id) { router.push(`/outlets/${id}`) }
function goToElder() { router.push('/elder') }
function goToElderHome() { router.push('/elder/home') }
function goToVoiceInput() { router.push('/elder/voice') }
function goToService() { router.push('/elder/service') }
function goToAgent() { router.push('/elder/agent') }
function goToAgentCreate() { router.push('/elder/agent/create') }
function goToAgentOps() { router.push('/elder/agent/operations') }
function goToAgentConfirm() { router.push('/elder/agent/confirm') }
function goToProfile() { router.push('/profile') }
function goToAdmin() { router.push('/admin') }
function goToHeat() { router.push('/admin/heat') }
function goToWindows() { router.push('/admin/windows') }
function goToLogs() { router.push('/admin/logs') }
function goToReport() { router.push('/admin/report') }

function bookService(name) {
  showToast(`预约：${name}`)
  router.push({ path: '/outlets/appointment', query: { service: name } })
}

function formatDistance(m) {
  if (!m) return '定位中'
  if (m < 1000) return `${Math.round(m)}米`
  return `${(m / 1000).toFixed(1)}km`
}

onMounted(() => {
  userStore.initElderMode()
  loadAll()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  position: relative;
  padding-bottom: 50px;
}

.header-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 260px;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  border-radius: 0 0 24px 24px;
}

.user-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 36px 16px 16px;
  color: #fff;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  font-weight: 600;
  margin-right: 12px;
}

.user-detail { flex: 1; }
.greeting { font-size: 17px; font-weight: 600; margin-bottom: 4px; }
.subtitle {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; opacity: 0.9;
}
.cert-count { opacity: 0.85; }

.header-actions {
  display: flex; gap: 10px;
}
.action-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

.search-bar {
  position: relative;
  z-index: 1;
  margin: 0 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 24px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.search-placeholder {
  flex: 1;
  font-size: 14px;
  color: #999;
}

.page-content {
  margin-top: -30px;
  padding: 0 12px;
  position: relative;
  z-index: 2;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 8px;
  padding: 20px 8px;
}
.action-item {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
}
.action-wrap {
  display: flex; flex-direction: column; align-items: center;
}
.action-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  margin-bottom: 8px;
}
.action-icon.code { background: linear-gradient(135deg, #1e88e5, #1565c0); }
.action-icon.match { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
.action-icon.map { background: linear-gradient(135deg, #43a047, #2e7d32); }
.action-icon.appt { background: linear-gradient(135deg, #00897b, #00695c); }
.action-icon.ar { background: linear-gradient(135deg, #e53935, #c62828); }
.action-icon.agent { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
.action-icon.elder { background: linear-gradient(135deg, #f4511e, #d84315); }
.action-icon.admin { background: linear-gradient(135deg, #546e7a, #37474f); }
.ar-icon {
  font-size: 16px;
  font-weight: 700;
  font-style: italic;
}
.action-label {
  font-size: 12px;
  color: #333;
}
.hot-tag, .new-tag {
  position: absolute;
  top: -4px; right: 4px;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
}
.hot-tag { background: #ffebee; color: #e53935; }
.new-tag { background: #e8f5e9; color: #43a047; }

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.title-dot {
  width: 4px; height: 16px;
  border-radius: 2px;
}
.title-dot.blue { background: #1e88e5; }
.title-dot.green { background: #43a047; }
.title-dot.orange { background: #ff9800; }
.title-dot.purple { background: #9c27b0; }
.section-more {
  font-size: 13px;
  color: #999;
  display: flex; align-items: center;
}

.code-display {
  display: flex;
  padding: 14px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 12px;
  margin-bottom: 14px;
}
.qr-area {
  width: 100px; margin-right: 14px;
  display: flex; flex-direction: column; align-items: center;
}
.qr-placeholder {
  width: 80px; height: 80px;
  background: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.code-status {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px;
  color: #43a047;
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #43a047;
  animation: blink 1.5s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.code-info { flex: 1; }
.info-row {
  display: flex; justify-content: space-between;
  padding: 5px 0;
  font-size: 13px;
}
.info-label { color: #666; }
.info-value { color: #333; font-weight: 500; }
.risk-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.risk-low { background: #e8f5e9; color: #43a047; }
.risk-medium { background: #fff3e0; color: #ff9800; }
.risk-high { background: #ffebee; color: #e53935; }

.code-actions {
  display: flex; justify-content: space-around;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.code-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px;
  color: #666;
}

.nearby-outlet {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 14px;
}
.outlet-info { flex: 1; }
.outlet-name-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 6px;
}
.outlet-name {
  font-size: 15px; font-weight: 600; color: #333;
}
.outlet-distance {
  font-size: 12px; color: #1976d2;
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 10px;
}
.outlet-addr {
  font-size: 12px; color: #999;
  margin-bottom: 8px;
  display: flex; align-items: center; gap: 4px;
}
.outlet-status {
  display: flex; gap: 12px;
  font-size: 12px;
  color: #666;
}
.wait-tag, .window-tag {
  display: flex; align-items: center; gap: 4px;
}

.service-types {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px 8px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.nearby-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.nearby-action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
}

.nearby-action-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.match-icon { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
.appt-icon { background: linear-gradient(135deg, #00897b, #00695c); }
.ar-icon { background: linear-gradient(135deg, #e53935, #c62828); }

.nearby-action-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nearby-action-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.nearby-action-desc {
  font-size: 10px;
  color: #999;
}
.type-item {
  display: flex; flex-direction: column; align-items: center;
}
.type-icon { font-size: 28px; margin-bottom: 6px; }
.type-name { font-size: 11px; color: #333; }

.elder-banner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-radius: 12px;
  margin-bottom: 14px;
}
.elder-title {
  font-size: 16px; font-weight: 600; color: #e65100;
  margin-bottom: 4px;
}
.elder-desc {
  font-size: 12px; color: #ef6c00;
}
.elder-entry {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #e65100;
  font-weight: 500;
}

.elder-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.elder-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.elder-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fff8e1;
  border-radius: 10px;
}

.feature-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.feature-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.feature-desc {
  font-size: 11px;
  color: #999;
}

.elder-agent-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.elder-btn {
  display: flex; flex-direction: column; align-items: center;
}
.elder-btn-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  margin-bottom: 6px;
  background: #fff8e1;
}
.elder-btn span { font-size: 12px; color: #333; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.stat-item {
  text-align: center;
  padding: 12px 4px;
  background: #f8f9fa;
  border-radius: 10px;
}
.stat-num {
  font-size: 20px; font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 11px; color: #999;
}

.admin-shortcuts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.shortcut-item {
  display: flex; flex-direction: column; align-items: center;
  font-size: 12px; color: #333;
  gap: 6px;
}
.shortcut-icon { font-size: 24px; }

.bottom-space {
  height: 30px;
}
</style>
