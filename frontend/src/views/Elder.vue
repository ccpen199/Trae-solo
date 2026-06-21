<template>
  <div class="elder-page" :class="{ 'elder-active': isElderMode }">
    <div class="page-header warning-bg">
      <div class="header-title">暖心办</div>
      <div class="header-subtitle">长辈专属服务</div>
      <div class="elder-toggle" @click="toggleElder">
        <van-switch v-model="isElderMode" size="24px" />
        <span class="toggle-text">{{ isElderMode ? '长辈模式' : '标准版' }}</span>
      </div>
    </div>

    <div class="page-content">
      <div class="features-card card">
        <div class="feature-row">
          <div class="feature-item" @click="useVoiceInput">
            <div class="feature-icon voice">
              <span>🎤</span>
            </div>
            <div class="feature-name">语音输入</div>
          </div>
          <div class="feature-item" @click="callAgent">
            <div class="feature-icon agent">
              <span>👩‍💼</span>
            </div>
            <div class="feature-name">人工坐席</div>
          </div>
          <div class="feature-item" @click="goToAgent">
            <div class="feature-icon auth">
              <span>👨‍👩‍👧</span>
            </div>
            <div class="feature-name">亲友代办</div>
          </div>
          <div class="feature-item" @click="showHelp">
            <div class="feature-icon help">
              <span>❓</span>
            </div>
            <div class="feature-name">使用帮助</div>
          </div>
        </div>
      </div>

      <div class="elder-config card">
        <div class="section-title">长辈模式配置</div>
        <div class="config-list">
          <div class="config-item" v-for="item in configFeatures" :key="item.id">
            <div class="config-left">
              <span class="config-icon">{{ item.icon }}</span>
              <span class="config-name">{{ item.name }}</span>
            </div>
            <van-switch v-model="item.enabled" size="22px" disabled />
          </div>
        </div>
      </div>

      <div class="quick-service card">
        <div class="section-title">常用服务</div>
        <div class="service-grid">
          <div class="service-item" @click="goService('社保查询')">
            <span class="service-icon">💳</span>
            <span class="service-name">社保查询</span>
          </div>
          <div class="service-item" @click="goService('医保报销')">
            <span class="service-icon">❤️‍🩹</span>
            <span class="service-name">医保报销</span>
          </div>
          <div class="service-item" @click="goService('养老金')">
            <span class="service-icon">👴</span>
            <span class="service-name">养老金</span>
          </div>
          <div class="service-item" @click="goService('高龄补贴')">
            <span class="service-icon">🎁</span>
            <span class="service-name">高龄补贴</span>
          </div>
        </div>
      </div>

      <div class="notice-card card">
        <div class="notice-title">
          <span>📢</span>
          <span>为您推荐</span>
        </div>
        <div class="notice-content">
          <p>· 65岁以上老人可免费办理公交敬老卡</p>
          <p>· 养老金资格认证可在线完成</p>
          <p>· 社区养老服务中心提供助餐助浴</p>
        </div>
      </div>

      <div class="hotline-card">
        <div class="hotline-title">服务热线</div>
        <div class="hotline-number">12345</div>
        <div class="hotline-desc">7×24小时人工服务</div>
        <van-button type="warning" block round size="large" @click="callHotline">
          立即拨打
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast, showDialog } from 'vant'
import { getElderConfig, toggleElderMode } from '../api/users'

const router = useRouter()
const userStore = useUserStore()

const isElderMode = computed(() => userStore.isElderMode)

const configFeatures = ref([
  { id: 'voice_input', name: '语音输入', icon: '🎤', enabled: true },
  { id: 'direct_agent', name: '人工坐席直连', icon: '👩‍💼', enabled: true },
  { id: 'large_font', name: '超大字体', icon: '🔍', enabled: true },
  { id: 'no_ads', name: '无广告弹窗', icon: '🚫', enabled: true },
  { id: 'simplified', name: '简化界面', icon: '📱', enabled: true },
  { id: 'high_contrast', name: '高对比度', icon: '🎨', enabled: false },
])

async function loadConfig() {
  try {
    const data = await getElderConfig()
    if (data?.features) {
      configFeatures.value = data.features
    }
  } catch (e) {
    console.error(e)
  }
}

async function toggleElder() {
  const enabled = !isElderMode.value
  userStore.toggleElderMode(enabled)
  try {
    await toggleElderMode({ userId: userStore.currentUserId, enabled })
  } catch (e) {
    console.error(e)
  }
  showToast(enabled ? '已开启长辈模式' : '已关闭长辈模式')
}

function useVoiceInput() {
  showToast('语音输入已启动，请说话...')
}

function callAgent() {
  showDialog({
    title: '人工坐席',
    message: '正在为您连接人工坐席，请稍候...',
    confirmButtonText: '取消'
  })
}

function goToAgent() {
  router.push('/elder/agent')
}

function showHelp() {
  showDialog({
    title: '使用帮助',
    message: '长辈模式提供：\n1. 超大字体显示\n2. 语音输入功能\n3. 人工坐席直连\n4. 无广告弹窗\n5. 亲友代办授权',
    confirmButtonText: '我知道了'
  })
}

function goService(name) {
  showToast(`进入${name}服务`)
}

function callHotline() {
  showToast('正在拨打12345...')
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.elder-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.elder-active {
  font-size: 18px;
}

.page-header {
  padding: 40px 20px 60px;
  color: #fff;
  text-align: center;
  position: relative;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.elder-toggle {
  position: absolute;
  right: 20px;
  top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.toggle-text {
  font-size: 12px;
}

.page-content {
  margin-top: -40px;
  padding: 0 12px 20px;
}

.features-card {
  padding: 20px 10px;
  margin-bottom: 12px;
}

.feature-row {
  display: flex;
  justify-content: space-around;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 10px;
  background: #fff3e0;
}

.feature-icon.voice {
  background: #e3f2fd;
}

.feature-icon.agent {
  background: #f3e5f5;
}

.feature-icon.auth {
  background: #e8f5e9;
}

.feature-icon.help {
  background: #fff3e0;
}

.feature-name {
  font-size: 14px;
  color: #333;
}

.elder-active .feature-name {
  font-size: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.elder-active .section-title {
  font-size: 18px;
}

.config-list {
  .config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .config-item:last-child {
    border-bottom: none;
  }
}

.config-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-icon {
  font-size: 22px;
}

.config-name {
  font-size: 15px;
  color: #333;
}

.elder-active .config-name {
  font-size: 17px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.service-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.service-name {
  font-size: 13px;
  color: #333;
  text-align: center;
}

.elder-active .service-name {
  font-size: 15px;
}

.notice-card {
  margin-bottom: 12px;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.elder-active .notice-title {
  font-size: 17px;
}

.notice-content {
  font-size: 13px;
  color: #666;
  line-height: 2;
}

.elder-active .notice-content {
  font-size: 15px;
}

.hotline-card {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: #fff;
}

.hotline-title {
  font-size: 15px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.hotline-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 2px;
}

.hotline-desc {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.elder-active .hotline-card {
  padding: 28px;
}

.elder-active .hotline-number {
  font-size: 40px;
}
</style>
