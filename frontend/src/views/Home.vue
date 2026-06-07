<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <div>
          <h2 style="font-size: 20px; margin-bottom: 4px;">粤省事</h2>
          <p style="font-size: 13px; opacity: 0.9;">广东省一体化移动政务服务平台</p>
        </div>
        <div style="text-align: right;">
          <el-icon :size="28" style="cursor: pointer;" @click="goToProfile">
            <UserFilled />
          </el-icon>
          <p style="font-size: 12px; margin-top: 4px;">{{ userStore.isLoggedIn ? userStore.user?.name : '个人中心' }}</p>
        </div>
      </div>
      
      <div class="search-bar" style="margin-top: 16px;" @click="goToServices">
        <el-icon><Search /></el-icon>
        <span style="margin-left: 8px; color: #999;">搜索服务、政策、办事指南</span>
      </div>
    </div>

    <div style="padding: 16px;">
      <div class="gov-card" style="padding: 16px; margin-bottom: 16px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h3 style="color: #333;">高频服务 · 指尖办</h3>
          <el-button type="text" size="small" @click="goToServices">全部服务 ></el-button>
        </div>
        <div class="service-grid">
          <div 
            v-for="service in hotServices" 
            :key="service.id" 
            class="service-item"
            @click="handleServiceClick(service)"
          >
            <div class="service-icon" :style="{ background: getServiceColor(service.category) }">
              <el-icon><Document /></el-icon>
            </div>
            <span class="service-name">{{ service.name }}</span>
            <span class="service-tag" v-if="service.tag">{{ service.tag }}</span>
          </div>
        </div>
        <div class="quick-actions" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
          <div class="quick-action-item" @click="goToApplications">
            <el-icon :size="20" color="#1e5cb8"><Document /></el-icon>
            <span>我的办件</span>
            <el-tag v-if="pendingCount > 0" type="danger" size="small" style="margin-left: 4px;">{{ pendingCount }}</el-tag>
          </div>
          <div class="quick-action-item" @click="goToCertificates">
            <el-icon :size="20" color="#1e5cb8"><OfficeBuilding /></el-icon>
            <span>电子证照</span>
          </div>
          <div class="quick-action-item" @click="goToServices">
            <el-icon :size="20" color="#1e5cb8"><Search /></el-icon>
            <span>办事指南</span>
          </div>
        </div>
      </div>

      <div class="gov-card" style="padding: 16px; margin-bottom: 16px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h3 style="color: #333;">主题服务空间</h3>
        </div>
        <div class="theme-grid">
          <div class="theme-card" @click="goToTheme('gba')">
            <div class="theme-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <span class="theme-title">粤港澳大湾区</span>
              <span class="theme-desc">跨境通办</span>
            </div>
            <div class="theme-content">
              <div class="theme-service" v-for="item in gbaServices" :key="item">{{ item }}</div>
            </div>
          </div>
          <div class="theme-card" @click="goToTheme('elder')">
            <div class="theme-header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <span class="theme-title">老年人关爱</span>
              <span class="theme-desc">适老化服务</span>
            </div>
            <div class="theme-content">
              <div class="theme-service" v-for="item in elderServices" :key="item">{{ item }}</div>
            </div>
          </div>
          <div class="theme-card" @click="goToTheme('enterprise')">
            <div class="theme-header" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <span class="theme-title">助企纾困</span>
              <span class="theme-desc">政策直达</span>
            </div>
            <div class="theme-content">
              <div class="theme-service" v-for="item in enterpriseServices" :key="item">{{ item }}</div>
            </div>
          </div>
          <div class="theme-card" @click="goToWorkOrder">
            <div class="theme-header" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <span class="theme-title">12345诉求</span>
              <span class="theme-desc">有求必应</span>
            </div>
            <div class="theme-content">
              <div class="theme-service">提交诉求</div>
              <div class="theme-service">进度查询</div>
              <div class="theme-service">评价反馈</div>
            </div>
          </div>
        </div>
      </div>

      <div class="gov-card" style="padding: 16px; margin-bottom: 16px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h3 style="color: #333;">粤省事码 · 一码通行</h3>
          <el-tag type="primary" size="small">亮码办事</el-tag>
        </div>
        <div v-if="userStore.isLoggedIn" class="yuesheng-code-section">
          <div class="qr-code-display">
            <div class="qr-code-main">
              <div class="qr-icon-placeholder">粤省事码</div>
              <p class="code-number">{{ userStore.user?.yueshengCode || '4400********1234' }}</p>
            </div>
          </div>
          <div class="code-actions">
            <div class="code-action-item" @click="showFaceVerify">
              <el-icon :size="24" color="#1e5cb8"><UserFilled /></el-icon>
              <span>人脸验证</span>
            </div>
            <div class="code-action-item" @click="goToCertificates">
              <el-icon :size="24" color="#1e5cb8"><OfficeBuilding /></el-icon>
              <span>证照出示</span>
            </div>
            <div class="code-action-item" @click="goToLogin">
              <el-icon :size="24" color="#1e5cb8"><Document /></el-icon>
              <span>身份认证</span>
            </div>
          </div>
          <div class="workspace-preview" style="margin-top: 20px; padding: 16px; background: #f5f7fa; border-radius: 8px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 12px;">您可以使用以下政务能力：</p>
            <div class="workspace-items">
              <span class="workspace-tag">社保查询</span>
              <span class="workspace-tag">医保支付</span>
              <span class="workspace-tag">公积金提取</span>
              <span class="workspace-tag">交通出行</span>
              <span class="workspace-tag">公园门票</span>
              <span class="workspace-tag">图书馆借阅</span>
            </div>
          </div>
        </div>
        <div v-else class="login-prompt">
          <div class="prompt-icon">
            <el-icon :size="48" color="#ccc"><UserFilled /></el-icon>
          </div>
          <p style="color: #999; margin-bottom: 16px;">登录后使用粤省事码及更多政务服务</p>
          <div class="auth-methods">
            <el-button type="primary" @click="goToLogin('code')" style="flex: 1;">粤省事码登录</el-button>
            <el-button @click="goToLogin('face')" style="flex: 1;">人脸识别</el-button>
          </div>
          <el-button type="text" @click="goToLogin('license')" style="margin-top: 12px;">电子营业执照登录</el-button>
        </div>
      </div>

      <div class="gov-card" style="padding: 16px;">
        <div class="flex-between" style="margin-bottom: 16px;">
          <h3 style="color: #333;">通知公告</h3>
          <el-button type="text" size="small">更多 ></el-button>
        </div>
        <div v-for="(notice, index) in notices" :key="index" style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;" @click="viewNotice(notice)">
          <p style="font-size: 14px; color: #333; cursor: pointer;" class="notice-title">{{ notice.title }}</p>
          <p style="font-size: 12px; color: #999; margin-top: 4px;">{{ notice.date }}</p>
        </div>
      </div>
    </div>

    <BottomNav />

    <el-dialog v-model="faceVerifyDialog" title="人脸识别验证" width="90%">
      <div class="face-verify-content">
        <div class="face-camera-area">
          <div class="face-camera" @click="startFaceVerify">
            <el-icon :size="64" color="#1e5cb8"><UserFilled /></el-icon>
            <p>{{ faceVerified ? '验证成功' : faceVerifying ? '验证中...' : '点击开始验证' }}</p>
          </div>
          <el-progress 
            v-if="faceVerifying" 
            :percentage="faceProgress" 
            :show-text="false"
            style="margin-top: 20px;"
          />
        </div>
        <p style="text-align: center; color: #666; margin-top: 16px;">
          请将面部对准框内，保持光线充足
        </p>
      </div>
      <template #footer>
        <el-button @click="faceVerifyDialog = false">取消</el-button>
        <el-button type="primary" @click="faceVerifyDialog = false" v-if="faceVerified">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { serviceApi, applicationApi } from '@/api'
import { ElMessage } from 'element-plus'
import BottomNav from '@/components/BottomNav.vue'
import { 
  Search, UserFilled, OfficeBuilding, 
  ChatDotRound, Document
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const hotServices = ref([])
const pendingCount = ref(0)
const faceVerifyDialog = ref(false)
const faceVerifying = ref(false)
const faceVerified = ref(false)
const faceProgress = ref(0)

const gbaServices = ['港澳通行证', '跨境医保', '跨境办税', '更多服务']
const elderServices = ['养老认证', '高龄津贴', '预约挂号', '爱心通道']
const enterpriseServices = ['稳岗补贴', '税收优惠', '融资服务', '政策直达']

const notices = [
  { title: '关于优化政务服务"跨省通办"的通知', date: '2024-01-15' },
  { title: '广东省电子证照应用管理办法正式实施', date: '2024-01-10' },
  { title: '社保服务升级维护公告', date: '2024-01-08' }
]

onMounted(() => {
  loadHotServices()
  if (userStore.isLoggedIn) {
    loadPendingCount()
  }
})

const loadHotServices = async () => {
  try {
    const res = await serviceApi.getHotList()
    hotServices.value = res.slice(0, 8).map(s => ({
      ...s,
      tag: s.category === '社保' || s.category === '医保' ? '热门' : ''
    }))
  } catch (e) {
    hotServices.value = [
      { id: 1, name: '社保查询', category: '社保', tag: '热门' },
      { id: 2, name: '医保报销', category: '医保', tag: '热门' },
      { id: 3, name: '新生儿入户', category: '户政', tag: '' },
      { id: 4, name: '不动产登记', category: '不动产', tag: '' },
      { id: 5, name: '公积金查询', category: '公积金', tag: '' },
      { id: 6, name: '交通违法处理', category: '交通', tag: '' },
      { id: 7, name: '营业执照办理', category: '企业', tag: '' },
      { id: 8, name: '税务申报', category: '税务', tag: '' }
    ]
  }
}

const loadPendingCount = async () => {
  try {
    const res = await applicationApi.getMyList({ status: 'pending' })
    pendingCount.value = res.total || 0
  } catch (e) {
    pendingCount.value = 2
  }
}

const getServiceColor = (category) => {
  const colors = {
    '社保': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '医保': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '户政': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '不动产': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '公积金': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    '交通': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
  return colors[category] || 'linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%)'
}

const handleServiceClick = (service) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后办理业务')
    router.push('/login')
    return
  }
  router.push(`/apply/${service.id}`)
}

const goToService = (id) => {
  router.push(`/service/${id}`)
}

const goToServices = () => {
  router.push('/services')
}

const goToLogin = (type) => {
  router.push(type ? `/login?type=${type}` : '/login')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToTheme = (theme) => {
  router.push(`/themes/${theme}`)
}

const goToWorkOrder = () => {
  router.push('/workorder')
}

const goToApplications = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/applications')
}

const goToCertificates = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/certificates')
}

const viewNotice = (notice) => {
  ElMessage.info('查看公告：' + notice.title)
}

const showFaceVerify = () => {
  faceVerifyDialog.value = true
  faceVerified.value = false
  faceVerifying.value = false
  faceProgress.value = 0
}

const startFaceVerify = () => {
  if (faceVerifying.value || faceVerified.value) return
  faceVerifying.value = true
  faceProgress.value = 0
  
  const interval = setInterval(() => {
    faceProgress.value += 10
    if (faceProgress.value >= 100) {
      clearInterval(interval)
      faceVerifying.value = false
      faceVerified.value = true
      ElMessage.success('人脸验证通过')
    }
  }, 200)
}
</script>

<style scoped>
.search-bar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  color: white;
  cursor: pointer;
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
  cursor: pointer;
  padding: 8px 0;
  border-radius: 8px;
  transition: all 0.3s;
}

.service-item:hover {
  background: #f5f7fa;
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 8px;
}

.service-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.service-tag {
  font-size: 10px;
  background: #fef0f0;
  color: #f56c6c;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  justify-content: space-around;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.theme-card {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-header {
  padding: 12px;
  color: white;
}

.theme-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.theme-desc {
  font-size: 12px;
  opacity: 0.9;
}

.theme-content {
  padding: 12px;
}

.theme-service {
  font-size: 12px;
  color: #666;
  padding: 4px 0;
}

.yuesheng-code-section {
  text-align: center;
}

.qr-code-display {
  margin-bottom: 20px;
}

.qr-code-main {
  display: inline-block;
  background: white;
  border: 2px solid #1e5cb8;
  border-radius: 12px;
  padding: 24px;
}

.code-number {
  font-size: 14px;
  color: #666;
  letter-spacing: 2px;
  margin-top: 12px;
}

.code-actions {
  display: flex;
  justify-content: space-around;
  padding: 0 20px;
}

.code-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

.code-action-item:hover {
  color: #1e5cb8;
}

.workspace-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.workspace-tag {
  font-size: 12px;
  background: white;
  color: #1e5cb8;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #1e5cb8;
}

.login-prompt {
  text-align: center;
  padding: 20px;
}

.prompt-icon {
  margin-bottom: 16px;
}

.auth-methods {
  display: flex;
  gap: 12px;
}

.qr-code {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: inline-block;
}

.qr-placeholder {
  width: 160px;
  height: 160px;
  border: 2px dashed #1e5cb8;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-icon-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
}

.notice-title:hover {
  color: #1e5cb8;
}

.face-verify-content {
  padding: 20px 0;
}

.face-camera-area {
  text-align: center;
}

.face-camera {
  width: 200px;
  height: 200px;
  border: 3px solid #1e5cb8;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.face-camera:hover {
  background: #f0f7ff;
}
</style>
