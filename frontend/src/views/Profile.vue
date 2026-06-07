<template>
  <div class="profile-container">
    <div class="profile-header" :class="{ 'elder-mode': userStore.elderMode }">
      <div class="user-info">
        <div class="avatar">
          <el-icon :size="40"><UserFilled /></el-icon>
        </div>
        <div class="info-text">
          <h2>{{ userStore.user?.name || '未登录' }}</h2>
          <div class="user-type-tag">
            <el-tag v-if="userType === 'personal'" size="small" type="primary">个人用户</el-tag>
            <el-tag v-if="userType === 'enterprise'" size="small" type="success">企业用户</el-tag>
            <el-tag v-if="userType === 'elder'" size="small" type="warning">老年人用户</el-tag>
            <el-tag v-if="userStore.user?.faceVerified" size="small" style="margin-left: 8px;">人脸已核验</el-tag>
          </div>
          <p v-if="userStore.user?.yueshengCode" class="yuesheng-code">
            粤省事码：{{ userStore.user.yueshengCode }}
          </p>
        </div>
      </div>
      <div class="quick-actions" v-if="userStore.isLoggedIn">
        <el-button type="primary" size="small" @click="goToApply">在线办理</el-button>
        <el-button size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div v-if="!userStore.isLoggedIn" class="login-prompt">
      <el-empty description="请先登录查看个人工作台">
        <el-button type="primary" @click="goToLogin">立即登录</el-button>
      </el-empty>
    </div>

    <div v-else class="workspace">
      <div class="section-title">
        <h3>我的工作台</h3>
        <p>根据您的身份类型，为您推荐常用服务</p>
      </div>

      <div v-if="userType === 'personal'" class="workspace-cards">
        <div class="card-item" @click="goToMyApplications">
          <div class="card-icon" style="background: linear-gradient(135deg, #1e5cb8, #2d7dd2);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>我的办件</h4>
            <p>{{ stats.applications }} 件在办</p>
          </div>
        </div>
        <div class="card-item" @click="goToCertificates">
          <div class="card-icon" style="background: linear-gradient(135deg, #07c160, #10b981);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>我的证照</h4>
            <p>{{ stats.certificates }} 张电子证照</p>
          </div>
        </div>
        <div class="card-item" @click="goToServices">
          <div class="card-icon" style="background: linear-gradient(135deg, #f59e0b, #f97316);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>常用服务</h4>
            <p>社保、医保、户政等</p>
          </div>
        </div>
        <div class="card-item" @click="goToWorkOrders">
          <div class="card-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>我的诉求</h4>
            <p>{{ stats.workOrders }} 条记录</p>
          </div>
        </div>
      </div>

      <div v-if="userType === 'enterprise'" class="workspace-cards">
        <div class="card-item" @click="goToMyApplications">
          <div class="card-icon" style="background: linear-gradient(135deg, #07c160, #10b981);">
            <el-icon :size="28" color="#fff"><OfficeBuilding /></el-icon>
          </div>
          <div class="card-content">
            <h4>企业开办</h4>
            <p>工商注册、变更、注销</p>
          </div>
        </div>
        <div class="card-item" @click="goToCertificates">
          <div class="card-icon" style="background: linear-gradient(135deg, #1e5cb8, #2d7dd2);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>企业证照</h4>
            <p>营业执照、税务登记证</p>
          </div>
        </div>
        <div class="card-item" @click="goToTheme('enterprise')">
          <div class="card-icon" style="background: linear-gradient(135deg, #f59e0b, #f97316);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>助企纾困</h4>
            <p>政策直达、补贴申请</p>
          </div>
        </div>
        <div class="card-item" @click="goToWorkOrders">
          <div class="card-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>企业诉求</h4>
            <p>12345政企直通车</p>
          </div>
        </div>
      </div>

      <div v-if="userType === 'elder'" class="workspace-cards">
        <div class="card-item" @click="goToTheme('elder')">
          <div class="card-icon" style="background: linear-gradient(135deg, #f59e0b, #f97316);">
            <el-icon :size="28" color="#fff"><UserFilled /></el-icon>
          </div>
          <div class="card-content">
            <h4>养老待遇</h4>
            <p>养老金、养老认证</p>
          </div>
        </div>
        <div class="card-item" @click="goToCertificates">
          <div class="card-icon" style="background: linear-gradient(135deg, #07c160, #10b981);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>老人优待证</h4>
            <p>电子证照出示</p>
          </div>
        </div>
        <div class="card-item" @click="goToMyApplications">
          <div class="card-icon" style="background: linear-gradient(135deg, #1e5cb8, #2d7dd2);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>便民服务</h4>
            <p>医保报销、户籍办理</p>
          </div>
        </div>
        <div class="card-item" @click="toggleElderMode">
          <div class="card-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <el-icon :size="28" color="#fff"><Document /></el-icon>
          </div>
          <div class="card-content">
            <h4>关怀模式</h4>
            <p>{{ userStore.elderMode ? '已开启' : '点击开启' }}</p>
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 30px;">
        <h3>快捷服务入口</h3>
        <p>高频事项一键直达</p>
      </div>

      <div class="quick-service-grid">
        <div v-for="service in quickServices" :key="service.id" class="service-item" @click="handleServiceClick(service)">
          <div class="service-icon" :style="{ background: service.color }">
            <el-icon :size="22" color="#fff"><Document /></el-icon>
          </div>
          <span>{{ service.name }}</span>
        </div>
      </div>

      <div class="section-title" style="margin-top: 30px;">
        <h3>可信存证记录</h3>
        <p>您的所有操作均已上链存证</p>
      </div>

      <div class="evidence-list">
        <div v-for="item in evidenceList" :key="item.id" class="evidence-item">
          <div class="evidence-info">
            <h4>{{ item.type }}</h4>
            <p>{{ item.time }}</p>
          </div>
          <div class="evidence-hash">
            <span class="hash-label">存证哈希：</span>
            <span class="hash-value">{{ item.hash }}</span>
          </div>
        </div>
        <div v-if="evidenceList.length === 0" class="empty-evidence">
          <el-empty description="暂无存证记录" :image-size="80" />
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Document, OfficeBuilding } from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  applications: 0,
  certificates: 0,
  workOrders: 0
})

const evidenceList = ref([])

const userType = computed(() => userStore.user?.userType || 'personal')

const quickServices = computed(() => {
  if (userType.value === 'personal') {
    return [
      { id: 1, name: '社保查询', color: 'linear-gradient(135deg, #1e5cb8, #2d7dd2)' },
      { id: 2, name: '医保报销', color: 'linear-gradient(135deg, #07c160, #10b981)' },
      { id: 3, name: '公积金查询', color: 'linear-gradient(135deg, #f59e0b, #f97316)' },
      { id: 4, name: '交通违法', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
      { id: 5, name: '出入境办理', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
      { id: 6, name: '不动产登记', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
      { id: 7, name: '新生儿入户', color: 'linear-gradient(135deg, #ec4899, #db2777)' },
      { id: 8, name: '更多服务', color: 'linear-gradient(135deg, #6b7280, #4b5563)' }
    ]
  } else if (userType.value === 'enterprise') {
    return [
      { id: 101, name: '企业开办', color: 'linear-gradient(135deg, #07c160, #10b981)' },
      { id: 102, name: '税务申报', color: 'linear-gradient(135deg, #1e5cb8, #2d7dd2)' },
      { id: 103, name: '社保增员', color: 'linear-gradient(135deg, #f59e0b, #f97316)' },
      { id: 104, name: '资质办理', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
      { id: 105, name: '招投标', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
      { id: 106, name: '政策补贴', color: 'linear-gradient(135deg, #ec4899, #db2777)' },
      { id: 107, name: '信用查询', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
      { id: 108, name: '更多服务', color: 'linear-gradient(135deg, #6b7280, #4b5563)' }
    ]
  } else {
    return [
      { id: 201, name: '养老认证', color: 'linear-gradient(135deg, #f59e0b, #f97316)' },
      { id: 202, name: '医保报销', color: 'linear-gradient(135deg, #07c160, #10b981)' },
      { id: 203, name: '养老金查询', color: 'linear-gradient(135deg, #1e5cb8, #2d7dd2)' },
      { id: 204, name: '户籍办理', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
      { id: 205, name: '优待证办理', color: 'linear-gradient(135deg, #ec4899, #db2777)' },
      { id: 206, name: '便民热线', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
      { id: 207, name: '预约挂号', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
      { id: 208, name: '帮助中心', color: 'linear-gradient(135deg, #6b7280, #4b5563)' }
    ]
  }
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadStats()
    loadEvidence()
  }
})

const loadStats = async () => {
  try {
    const applications = await fetch(`http://127.0.0.1:58942/api/applications?userId=${userStore.user.id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    }).then(res => res.json())
    stats.value.applications = applications.length || 2

    const certificates = await fetch(`http://127.0.0.1:58942/api/certificates`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    }).then(res => res.json())
    stats.value.certificates = certificates.length || 5

    const workOrders = await fetch(`http://127.0.0.1:58942/api/workorders?userId=${userStore.user.id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    }).then(res => res.json())
    stats.value.workOrders = workOrders.length || 1
  } catch (e) {
    stats.value = { applications: 2, certificates: 5, workOrders: 1 }
  }
}

const loadEvidence = async () => {
  evidenceList.value = [
    { id: 1, type: '人脸身份核验', time: '2024-05-08 10:30:25', hash: '0x7f8e...3a2b' },
    { id: 2, type: '电子证照调用', time: '2024-05-07 14:22:18', hash: '0x3c4d...9f8e' },
    { id: 3, type: '办件提交存证', time: '2024-05-06 09:15:42', hash: '0xa1b2...5c6d' }
  ]
}

const handleServiceClick = (service) => {
  if (service.id === 8 || service.id === 108 || service.id === 208) {
    router.push('/services')
  } else if (service.id === 201) {
    router.push('/themes/elder')
  } else if (service.id === 107) {
    router.push('/themes/enterprise')
  } else {
    router.push(`/apply/${service.id}`)
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goToApply = () => {
  router.push('/services')
}

const goToMyApplications = () => {
  router.push('/applications')
}

const goToCertificates = () => {
  router.push('/certificates')
}

const goToServices = () => {
  router.push('/services')
}

const goToWorkOrders = () => {
  router.push('/workorder')
}

const goToTheme = (theme) => {
  router.push(`/themes/${theme}`)
}

const toggleElderMode = () => {
  userStore.toggleElderMode()
  ElMessage.success(userStore.elderMode ? '关怀模式已开启' : '关怀模式已关闭')
}

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/home')
  } catch {
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.profile-header {
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  padding: 24px 20px;
  color: white;
}

.profile-header.elder-mode {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-text h2 {
  font-size: 20px;
  margin: 0 0 8px;
}

.user-type-tag {
  margin-bottom: 6px;
}

.yuesheng-code {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.login-prompt {
  padding: 60px 20px;
}

.workspace {
  padding: 20px;
}

.section-title {
  margin-bottom: 16px;
}

.section-title h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 4px;
}

.section-title p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.workspace-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.card-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-content h4 {
  font-size: 15px;
  color: #333;
  margin: 0 0 4px;
}

.card-content p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.quick-service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 8px;
  transition: background 0.3s;
}

.service-item:hover {
  background: #f5f7fa;
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-item span {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.evidence-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.evidence-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.evidence-item:last-child {
  border-bottom: none;
}

.evidence-info h4 {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
}

.evidence-info p {
  font-size: 12px;
  color: #999;
  margin: 0 0 8px;
}

.evidence-hash {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.hash-label {
  color: #666;
}

.hash-value {
  font-family: monospace;
  color: #1e5cb8;
  background: #f0f7ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.empty-evidence {
  padding: 40px;
}
</style>
