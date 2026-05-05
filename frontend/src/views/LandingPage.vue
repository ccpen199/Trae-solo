<template>
  <div class="landing-container">
    <div class="landing-content">
      <div class="logo-section">
        <div class="logo-icon">
          <el-icon :size="48"><CreditCard /></el-icon>
        </div>
        <h1 class="app-title">省呗</h1>
        <p class="app-subtitle">您的信用生活好伙伴</p>
      </div>

      <div class="loading-section" v-if="isLoading">
        <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>

      <div class="result-section" v-else-if="showResult">
        <div class="result-icon" :class="resultStatus">
          <el-icon :size="64">
            <CircleCheck v-if="resultStatus === 'success'" />
            <CircleClose v-else-if="resultStatus === 'error'" />
            <InfoFilled v-else />
          </el-icon>
        </div>
        <h2 class="result-title">{{ resultTitle }}</h2>
        <p class="result-message">{{ resultMessage }}</p>
        
        <div class="result-actions" v-if="showActions">
          <el-button 
            v-if="downloadUrl" 
            type="primary" 
            size="large" 
            @click="goToDownload"
            class="download-btn"
          >
            <el-icon><Download /></el-icon>
            {{ downloadButtonText }}
          </el-button>
          <el-button 
            v-else 
            type="warning" 
            size="large" 
            @click="goBack"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>

      <div class="error-section" v-else-if="hasError">
        <el-alert
          :title="errorTitle"
          :type="errorType"
          :description="errorMessage"
          show-icon
          :closable="false"
        />
        <el-button 
          type="primary" 
          style="margin-top: 20px;"
          @click="retry"
        >
          <el-icon><Refresh /></el-icon>
          重新尝试
        </el-button>
      </div>
    </div>

    <div class="landing-footer">
      <p>© 2026 渠道撞库联登系统 | 版本 1.0.0</p>
      <p class="footer-desc">
        <span v-if="debugInfo">
          渠道号: {{ debugInfo.channelCode || '-' }} | 
          手机号MD5: {{ debugInfo.phoneMd5 ? (debugInfo.phoneMd5.substring(0, 8) + '...') : '-' }}
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { collisionApi } from '@/utils/api'

const route = useRoute()

const isLoading = ref(true)
const loadingMessage = ref('正在处理您的请求...')
const showResult = ref(false)
const hasError = ref(false)
const showActions = ref(false)

const resultStatus = ref('info')
const resultTitle = ref('')
const resultMessage = ref('')
const downloadUrl = ref('')
const downloadButtonText = ref('立即下载')

const errorTitle = ref('')
const errorType = ref('error')
const errorMessage = ref('')

const debugInfo = reactive({
  channelCode: '',
  phoneMd5: ''
})

const processResult = async (data) => {
  if (!data) {
    showError('处理失败', '系统未返回有效数据')
    return
  }

  const { accessResult, collisionResult, registerResult, isOldUser, downloadUrl: url } = data

  loadingMessage.value = '处理完成'
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  isLoading.value = false
  showResult.value = true
  showActions.value = true

  if (collisionResult) {
    if (collisionResult.result === 'NEW_USER') {
      resultStatus.value = 'success'
      resultTitle.value = '欢迎新用户'
      resultMessage.value = `恭喜您成为新用户！${registerResult?.message || collisionResult.message}`
      downloadUrl.value = url || ''
      downloadButtonText.value = '立即下载注册'
    } else if (collisionResult.result === 'OLD_USER') {
      resultStatus.value = 'info'
      resultTitle.value = '欢迎回来'
      resultMessage.value = '检测到您已是老用户，即将跳转到下载页面'
      downloadUrl.value = url || ''
      downloadButtonText.value = '立即下载'
    } else if (collisionResult.result === 'REJECT') {
      resultStatus.value = 'error'
      resultTitle.value = '暂时无法为您服务'
      resultMessage.value = collisionResult.message || '抱歉，您暂时无法通过校验'
      showActions.value = false
    }
  } else if (accessResult && accessResult.result === 'REJECT') {
    resultStatus.value = 'error'
    resultTitle.value = '准入校验未通过'
    resultMessage.value = accessResult.message || '抱歉，您暂时无法准入'
    showActions.value = false
  } else {
    resultStatus.value = 'info'
    resultTitle.value = '处理完成'
    resultMessage.value = '您的请求已处理完成'
    downloadUrl.value = url || ''
  }

  if (downloadUrl.value) {
    setTimeout(() => {
      goToDownload()
    }, 2000)
  }
}

const showError = (title, message) => {
  isLoading.value = false
  hasError.value = true
  errorTitle.value = title
  errorMessage.value = message
  errorType.value = 'error'
}

const goToDownload = () => {
  if (downloadUrl.value) {
    window.location.href = downloadUrl.value
  }
}

const goBack = () => {
  window.history.back()
}

const retry = () => {
  window.location.reload()
}

onMounted(async () => {
  const query = route.query
  
  const phoneMd5 = query.phoneMd5 || query.phone_md5 || query.md5 || ''
  const channelCode = query.channelCode || query.channel_code || query.channel || ''
  const productId = query.productId || query.product_id || query.product || ''
  const sign = query.sign || query.signature || ''

  debugInfo.channelCode = channelCode
  debugInfo.phoneMd5 = phoneMd5

  if (!phoneMd5) {
    showError('参数错误', '缺少必要的用户标识信息，请从正确的广告入口进入')
    return
  }

  if (!channelCode) {
    showError('参数错误', '缺少渠道信息，请从正确的广告入口进入')
    return
  }

  try {
    loadingMessage.value = '正在进行准入校验...'
    
    const params = {
      phoneMd5,
      channelCode
    }
    
    if (productId) {
      params.productId = productId
    }

    const result = await collisionApi.fullProcess(params)
    
    if (result.code === 200) {
      await processResult(result.data)
    } else {
      showError('处理失败', result.message || '请求处理失败，请稍后重试')
    }
  } catch (error) {
    console.error('Landing page error:', error)
    showError(
      '网络异常', 
      error.message || '网络连接失败，请检查网络后重试'
    )
  }
})
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.landing-content {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.logo-section {
  margin-bottom: 40px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #fff;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px;
}

.app-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.loading-section {
  padding: 40px 20px;
}

.loading-icon {
  color: #409EFF;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
}

.result-section {
  padding: 20px 0;
}

.result-icon {
  margin-bottom: 20px;
}

.result-icon.success {
  color: #67C23A;
}

.result-icon.error {
  color: #F56C6C;
}

.result-icon.info {
  color: #409EFF;
}

.result-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.result-message {
  font-size: 15px;
  color: #606266;
  margin: 0 0 30px;
  line-height: 1.6;
}

.result-actions {
  margin-top: 20px;
}

.download-btn {
  min-width: 160px;
}

.error-section {
  text-align: left;
}

.landing-footer {
  margin-top: 30px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.landing-footer p {
  margin: 5px 0;
}

.footer-desc {
  opacity: 0.6;
}

@media (max-width: 480px) {
  .landing-content {
    padding: 30px 20px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .result-title {
    font-size: 20px;
  }
}
</style>
