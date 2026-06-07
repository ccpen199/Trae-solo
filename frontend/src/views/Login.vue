<template>
  <div class="login-container">
    <div v-if="showTransition" class="transition-card">
      <div class="transition-icon">
        <el-icon :size="64" color="#67c23a"><Document /></el-icon>
      </div>
      <h2>身份核验结果</h2>
      <div class="transition-result">
        <div class="result-row">
          <span class="result-label">核验结果</span>
          <el-tag type="success" size="large">通过</el-tag>
        </div>
        <div class="result-row">
          <span class="result-label">核验方式</span>
          <span class="result-value">{{ transitionData.method }}</span>
        </div>
        <div class="result-row">
          <span class="result-label">身份类型</span>
          <span class="result-value">{{ transitionData.identityType }}</span>
        </div>
        <div class="result-row" v-if="transitionData.codeId">
          <span class="result-label">粤省事码编号</span>
          <span class="result-value">{{ transitionData.codeId }}</span>
        </div>
      </div>
      <div class="transition-services">
        <p class="services-title">可办事项边界</p>
        <div class="services-list">
          <el-tag v-for="s in transitionData.services" :key="s" size="small" style="margin: 4px;">{{ s }}</el-tag>
        </div>
      </div>
      <el-button type="primary" size="large" style="width: 100%; margin-top: 24px;" @click="goToHome">
        立即进入 ({{ transitionCountdown }}s)
      </el-button>
    </div>

    <div v-else class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48" color="#1e5cb8"><Document /></el-icon>
        </div>
        <h2>广东省一体化移动政务服务平台</h2>
        <p>统一身份认证</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="粤省事码登录" name="code">
          <div class="qr-login">
            <template v-if="!qrVerifyResult">
              <div class="qr-code-display">
                <div class="qr-placeholder-code">扫码</div>
              </div>
              <p class="qr-tip">请使用粤省事APP扫码登录</p>
              <div class="auth-desc">
                <p><el-icon color="#1e5cb8"><Document /></el-icon> 适用：持有粤省事码的广东省居民</p>
                <p><el-icon color="#1e5cb8"><Document /></el-icon> 安全：一码一密，动态更新</p>
              </div>
              <div class="test-btns">
                <el-button type="primary" size="small" @click="simulateQrLogin(true)">模拟扫码成功</el-button>
                <el-button type="danger" size="small" plain @click="simulateQrLogin(false)">模拟扫码失败</el-button>
              </div>
              <el-button type="text" @click="activeTab = 'face'">人脸识别登录 ></el-button>
            </template>
            <div v-else class="verify-result-panel" :class="qrVerifyResult.passed ? 'verify-pass' : 'verify-fail'">
              <div class="verify-status">
                <el-icon :size="28" :color="qrVerifyResult.passed ? '#67c23a' : '#f56c6c'"><Document /></el-icon>
                <span class="verify-status-text">{{ qrVerifyResult.passed ? '核验通过' : '核验失败' }}</span>
              </div>
              <div v-if="qrVerifyResult.passed" class="verify-details">
                <div class="detail-row"><span class="detail-label">核验时间</span><span class="detail-value">{{ qrVerifyResult.time }}</span></div>
                <div class="detail-row"><span class="detail-label">核验方式</span><span class="detail-value">{{ qrVerifyResult.method }}</span></div>
                <div class="detail-row"><span class="detail-label">粤省事码编号</span><span class="detail-value">{{ qrVerifyResult.codeId }}</span></div>
                <div class="detail-row"><span class="detail-label">安全等级</span><span class="detail-value">{{ qrVerifyResult.securityLevel }}</span></div>
              </div>
              <template v-else>
                <div class="verify-error-msg">{{ qrVerifyResult.error }}</div>
                <el-button type="primary" size="small" style="margin-top: 12px;" @click="resetQrVerify">重新扫码</el-button>
              </template>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="人脸识别" name="face">
          <div class="face-login">
            <template v-if="!faceVerifyResult">
              <div class="face-camera" @click="startFaceVerify" :class="{ verifying: faceVerifying, success: faceVerified }">
                <div class="face-inner">
                  <el-icon :size="64" :color="faceVerified ? '#67c23a' : '#1e5cb8'"><UserFilled /></el-icon>
                  <p v-if="!faceVerifying && !faceVerified">点击开始人脸识别</p>
                  <p v-if="faceVerifying">正在识别... {{ faceProgress }}%</p>
                  <p v-if="faceVerified">识别成功</p>
                </div>
              </div>
              <el-progress v-if="faceVerifying" :percentage="faceProgress" :show-text="false" style="margin-top: 20px;" />
              <div class="auth-desc" style="margin-top: 20px;">
                <p><el-icon color="#1e5cb8"><Document /></el-icon> 适用：已完成人脸核验的实名认证用户</p>
                <p><el-icon color="#1e5cb8"><Document /></el-icon> 说明：请保持面部在框内，光线充足</p>
              </div>
            </template>
            <div v-else class="verify-result-panel" :class="faceVerifyResult.passed ? 'verify-pass' : 'verify-fail'">
              <div class="verify-status">
                <el-icon :size="28" :color="faceVerifyResult.passed ? '#67c23a' : '#f56c6c'"><UserFilled /></el-icon>
                <span class="verify-status-text">{{ faceVerifyResult.passed ? '核验通过' : '核验失败' }}</span>
              </div>
              <div v-if="faceVerifyResult.passed" class="verify-details">
                <div class="detail-row"><span class="detail-label">活体检测</span><span class="detail-value pass-text">通过</span></div>
                <div class="detail-row"><span class="detail-label">人脸相似度</span><span class="detail-value">{{ faceVerifyResult.similarity }}</span></div>
                <div class="detail-row"><span class="detail-label">核验时间</span><span class="detail-value">{{ faceVerifyResult.time }}</span></div>
                <div class="detail-row"><span class="detail-label">核验编号</span><span class="detail-value">{{ faceVerifyResult.verifyId }}</span></div>
              </div>
              <template v-else>
                <div class="verify-error-msg">{{ faceVerifyResult.error }}</div>
                <el-button type="primary" size="small" style="margin-top: 12px;" @click="resetFaceVerify">重新识别</el-button>
              </template>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="电子营业执照" name="license">
          <div class="license-login">
            <template v-if="!licenseVerifyResult">
              <div class="license-icon">
                <el-icon :size="64" color="#1e5cb8"><OfficeBuilding /></el-icon>
              </div>
              <el-input v-model="licenseCode" placeholder="请输入统一社会信用代码" style="margin-bottom: 12px;" />
              <el-input v-model="licensePassword" type="password" placeholder="请输入营业执照密码" style="margin-bottom: 16px;" />
              <el-button type="primary" style="width: 100%;" :loading="licenseVerifying" @click="verifyLicense">验证并登录</el-button>
              <div class="auth-desc" style="margin-top: 20px;">
                <p><el-icon color="#1e5cb8"><Document /></el-icon> 适用：企业法人、个体工商户等市场主体</p>
                <p><el-icon color="#1e5cb8"><Document /></el-icon> 可办：企业开办、税务、社保等企业服务</p>
              </div>
            </template>
            <div v-else class="verify-result-panel" :class="licenseVerifyResult.passed ? 'verify-pass' : 'verify-fail'">
              <div class="verify-status">
                <el-icon :size="28" :color="licenseVerifyResult.passed ? '#67c23a' : '#f56c6c'"><OfficeBuilding /></el-icon>
                <span class="verify-status-text">{{ licenseVerifyResult.passed ? '核验通过' : '核验失败' }}</span>
              </div>
              <div v-if="licenseVerifyResult.passed" class="verify-details">
                <div class="detail-row"><span class="detail-label">企业名称</span><span class="detail-value">{{ licenseVerifyResult.companyName }}</span></div>
                <div class="detail-row"><span class="detail-label">统一社会信用代码</span><span class="detail-value">{{ licenseVerifyResult.creditCode }}</span></div>
                <div class="detail-row"><span class="detail-label">营业执照状态</span><span class="detail-value pass-text">{{ licenseVerifyResult.licenseStatus }}</span></div>
                <div class="detail-row"><span class="detail-label">核验时间</span><span class="detail-value">{{ licenseVerifyResult.time }}</span></div>
              </div>
              <template v-else>
                <div class="verify-error-msg">{{ licenseVerifyResult.error }}</div>
                <el-button type="primary" size="small" style="margin-top: 12px;" @click="resetLicenseVerify">重新验证</el-button>
              </template>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="quick-login">
        <p style="color: #999; margin-bottom: 12px;">快速登录（测试）</p>
        <el-select v-model="testUser" placeholder="选择测试用户" style="width: 100%; margin-bottom: 12px;">
          <el-option label="个人用户 - 张三" value="personal">
            <span style="display: flex; align-items: center; gap: 8px;">
              <el-tag size="small" type="primary">个人</el-tag>
              张三 - 身份证实名认证
            </span>
          </el-option>
          <el-option label="企业用户 - 广东XX科技" value="enterprise">
            <span style="display: flex; align-items: center; gap: 8px;">
              <el-tag size="small" type="success">企业</el-tag>
              广东XX科技有限公司
            </span>
          </el-option>
          <el-option label="老年人用户 - 李桂兰" value="elder">
            <span style="display: flex; align-items: center; gap: 8px;">
              <el-tag size="small" type="warning">老年</el-tag>
              李桂兰 - 养老待遇领取
            </span>
          </el-option>
        </el-select>
        <el-button type="primary" style="width: 100%;" :loading="loggingIn" @click="quickLogin">快速登录</el-button>
        <p v-if="loginError" style="color: #f56c6c; margin-top: 12px; text-align: center;">⚠️ {{ loginError }}</p>
      </div>

      <div class="login-footer">
        <el-checkbox v-model="agreed" style="margin-bottom: 12px;">
          我已阅读并同意<a href="javascript:;" style="color: #1e5cb8;">《用户服务协议》</a>
          和<a href="javascript:;" style="color: #1e5cb8;">《隐私政策》</a>
        </el-checkbox>
        <el-button type="text" @click="goToAdmin">管理后台入口</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Document, UserFilled, OfficeBuilding } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('code')
const testUser = ref('personal')
const agreed = ref(true)
const loggingIn = ref(false)
const loginError = ref('')

const faceVerifying = ref(false)
const faceVerified = ref(false)
const faceProgress = ref(0)

const licenseCode = ref('')
const licensePassword = ref('')
const licenseVerifying = ref(false)

const redirect = route.query.redirect || '/home'

const qrVerifyResult = ref(null)
const faceVerifyResult = ref(null)
const licenseVerifyResult = ref(null)

const showTransition = ref(false)
const transitionData = ref({ method: '', identityType: '', services: [], codeId: '' })
const transitionCountdown = ref(2)
let transitionTimer = null

const serviceMap = {
  personal: ['社保查询', '医保报销', '户政办理', '住房公积金', '婚姻登记'],
  enterprise: ['企业开办', '税务申报', '资质办理', '社保缴纳', '年报公示'],
  elder: ['养老金查询', '医保报销', '长期护理', '高龄津贴', '优待证办理']
}

const identityTypeMap = {
  personal: '个人用户',
  enterprise: '企业用户',
  elder: '老年人用户'
}

const methodMap = {
  code: '粤省事码',
  face: '人脸识别',
  license: '电子营业执照'
}

onMounted(() => {
  const type = route.query.type
  if (type === 'code') activeTab.value = 'code'
  if (type === 'face') activeTab.value = 'face'
  if (type === 'license') activeTab.value = 'license'
})

onUnmounted(() => {
  if (transitionTimer) clearInterval(transitionTimer)
})

const now = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const genCodeId = () => 'YSS' + Date.now().toString().slice(-10)
const genVerifyId = () => 'FV' + Date.now().toString().slice(-10) + Math.random().toString(36).slice(2, 6).toUpperCase()

const startTransition = (method, userType, codeId) => {
  transitionData.value = {
    method: methodMap[method] || method,
    identityType: identityTypeMap[userType] || '个人用户',
    services: serviceMap[userType] || serviceMap.personal,
    codeId: codeId || ''
  }
  showTransition.value = true
  transitionCountdown.value = 2
  transitionTimer = setInterval(() => {
    transitionCountdown.value--
    if (transitionCountdown.value <= 0) {
      clearInterval(transitionTimer)
      goToHome()
    }
  }, 1000)
}

const goToHome = () => {
  if (transitionTimer) clearInterval(transitionTimer)
  router.push(redirect)
}

const simulateQrLogin = async (success) => {
  if (!agreed.value) {
    loginError.value = '请先阅读并同意服务协议'
    return
  }
  loggingIn.value = true
  loginError.value = ''
  try {
    await new Promise(r => setTimeout(r, 1500))
    if (success) {
      const codeId = genCodeId()
      qrVerifyResult.value = { passed: true, time: now(), method: '粤省事码扫码', codeId, securityLevel: '高' }
      const res = await userStore.login('13800138000', 'personal')
      if (res.success) {
        setTimeout(() => startTransition('code', 'personal', codeId), 1200)
      }
    } else {
      const errors = ['粤省事码已过期，请重新获取', '身份核验服务响应超时，请稍后重试']
      qrVerifyResult.value = { passed: false, error: errors[Math.floor(Math.random() * errors.length)] }
    }
  } catch {
    qrVerifyResult.value = { passed: false, error: '身份核验服务响应超时，请稍后重试' }
  } finally {
    loggingIn.value = false
  }
}

const resetQrVerify = () => { qrVerifyResult.value = null }

const startFaceVerify = () => {
  if (faceVerifying.value || faceVerified.value) return
  faceVerifying.value = true
  faceProgress.value = 0
  let failTriggered = false
  const interval = setInterval(() => {
    faceProgress.value += 8
    if (faceProgress.value >= 60 && !failTriggered && Math.random() < 0.3) {
      failTriggered = true
      clearInterval(interval)
      faceVerifying.value = false
      faceVerifyResult.value = { passed: false, error: '人脸核验未通过，相似度不足。请确保光线充足、面部正对摄像头' }
      faceProgress.value = 0
      return
    }
    if (faceProgress.value >= 100) {
      clearInterval(interval)
      faceVerifying.value = false
      faceVerified.value = true
      faceVerifyResult.value = { passed: true, livenessPassed: true, similarity: '98.5%', time: now(), verifyId: genVerifyId() }
      setTimeout(async () => {
        const res = await userStore.login('13800138000', 'personal')
        if (res.success) startTransition('face', 'personal')
      }, 1200)
    }
  }, 150)
}

const resetFaceVerify = () => {
  faceVerifyResult.value = null
  faceVerified.value = false
  faceProgress.value = 0
}

const verifyLicense = async () => {
  if (!agreed.value) { licenseVerifyResult.value = null; return }
  if (!licenseCode.value) {
    licenseVerifyResult.value = { passed: false, error: '请输入统一社会信用代码' }
    return
  }
  if (!licensePassword.value) {
    licenseVerifyResult.value = { passed: false, error: '请输入营业执照密码' }
    return
  }
  licenseVerifying.value = true
  try {
    await new Promise(r => setTimeout(r, 2000))
    if (licenseCode.value.length < 10) {
      licenseVerifyResult.value = { passed: false, error: '营业执照信息核验失败，请检查统一社会信用代码是否正确' }
      return
    }
    licenseVerifyResult.value = {
      passed: true,
      companyName: '广东XX科技有限公司',
      creditCode: licenseCode.value,
      licenseStatus: '正常',
      time: now()
    }
    const res = await userStore.login('enterprise', 'enterprise')
    if (res.success) {
      setTimeout(() => startTransition('license', 'enterprise'), 1200)
    }
  } catch {
    licenseVerifyResult.value = { passed: false, error: '身份核验服务响应超时，请稍后重试' }
  } finally {
    licenseVerifying.value = false
  }
}

const resetLicenseVerify = () => { licenseVerifyResult.value = null }

const quickLogin = async () => {
  if (!agreed.value) { loginError.value = '请先阅读并同意服务协议'; return }
  if (!testUser.value) { loginError.value = '请选择测试用户'; return }
  loggingIn.value = true
  loginError.value = ''
  try {
    const phone = testUser.value === 'personal' ? '13800138000' :
                  testUser.value === 'enterprise' ? '13900139000' : '13700137000'
    const res = await userStore.login(phone, testUser.value)
    if (res.success) {
      startTransition(testUser.value === 'enterprise' ? 'license' : 'code', testUser.value)
    } else {
      loginError.value = res.message || '登录失败，请重试'
    }
  } catch {
    loginError.value = '身份核验服务响应超时，请稍后重试'
  } finally {
    loggingIn.value = false
  }
}

const goToAdmin = () => { router.push('/admin/login') }
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.transition-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.transition-icon {
  margin-bottom: 16px;
}

.transition-card h2 {
  font-size: 22px;
  color: #333;
  margin: 0 0 24px;
}

.transition-result {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  color: #909399;
  font-size: 14px;
}

.result-value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.transition-services {
  background: #f0f9eb;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
}

.services-title {
  font-size: 14px;
  color: #67c23a;
  font-weight: 600;
  margin: 0 0 10px;
}

.services-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 20px;
  color: #333;
  margin: 16px 0 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-tabs {
  margin-bottom: 24px;
}

.qr-login, .face-login, .license-login {
  text-align: center;
  padding: 20px 0;
}

.qr-code-display {
  padding: 30px;
  background: #f5f7fa;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 16px;
}

.qr-placeholder-code {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  color: white;
  font-weight: 600;
  border-radius: 8px;
}

.qr-tip {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.auth-desc {
  text-align: left;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.auth-desc p {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  margin: 6px 0;
}

.test-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 12px;
}

.face-camera {
  width: 180px;
  height: 180px;
  border: 2px dashed #1e5cb8;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.face-camera:hover {
  background: #f0f7ff;
}

.face-camera.verifying {
  border-color: #e6a23c;
  animation: pulse 1.5s infinite;
}

.face-camera.success {
  border-color: #67c23a;
  background: #f0f9eb;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.face-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.face-inner p {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
}

.license-icon {
  margin-bottom: 20px;
}

.quick-login {
  border-top: 1px solid #eee;
  padding-top: 24px;
  margin-top: 24px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 12px;
}

.login-footer .el-checkbox {
  font-size: 12px;
}

.verify-result-panel {
  padding: 24px 16px;
  border-radius: 12px;
  margin-top: 8px;
}

.verify-pass {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.verify-fail {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.verify-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.verify-status-text {
  font-size: 18px;
  font-weight: 600;
}

.verify-pass .verify-status-text {
  color: #67c23a;
}

.verify-fail .verify-status-text {
  color: #f56c6c;
}

.verify-details {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f2f6fc;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #909399;
  font-size: 13px;
}

.detail-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.pass-text {
  color: #67c23a;
}

.verify-error-msg {
  color: #f56c6c;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px;
  background: white;
  border-radius: 8px;
  text-align: left;
}
</style>
