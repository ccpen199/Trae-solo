<template>
  <div class="mobile-container theme-elder" :class="{ 'elder-mode': elderMode }">
    <div class="theme-header elder-header">
      <div class="header-content">
        <div class="flex-between">
          <el-icon :size="24" @click="goBack"><ArrowLeft /></el-icon>
          <span class="header-title">老年人关爱模式</span>
          <el-switch v-model="elderMode" active-text="大字体" />
        </div>
        <p class="header-desc">适老化服务 · 便捷办事</p>
      </div>
    </div>

    <div class="theme-content">
      <div class="quick-access">
        <div class="quick-item" @click="handleQuick('appointment')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon :size="32"><UserFilled /></el-icon>
          </div>
          <span class="quick-text">预约挂号</span>
        </div>
        <div class="quick-item" @click="handleQuick('pension')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <span class="quick-text">养老认证</span>
        </div>
        <div class="quick-item" @click="handleQuick('allowance')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <span class="quick-text">高龄津贴</span>
        </div>
        <div class="quick-item" @click="handleQuick('hotline')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon :size="32"><OfficeBuilding /></el-icon>
          </div>
          <span class="quick-text">服务热线</span>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>高频服务</h3>
        </div>
        <div class="service-list">
          <div class="service-list-item large" v-for="item in services" :key="item.name" @click="handleService(item)">
            <div class="service-icon" :style="{ background: item.color }">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="service-info">
              <span class="service-name">{{ item.name }}</span>
              <span class="service-desc">{{ item.desc }}</span>
            </div>
            <el-button type="primary" size="large">办理</el-button>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>养老待遇资格认证</h3>
        </div>
        <div class="cert-card">
          <div class="cert-header">
            <span class="cert-title">城乡居民养老保险待遇领取资格认证</span>
            <el-tag type="success">已认证</el-tag>
          </div>
          <p class="cert-info">上次认证时间：2024-01-10</p>
          <p class="cert-info">下次认证截止：2024-07-10</p>
          <el-button type="primary" style="width: 100%; margin-top: 12px;" size="large" @click="startFaceCert">
            立即认证
          </el-button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>便民服务</h3>
        </div>
        <div class="convenient-grid">
          <div class="convenient-item" @click="handleConvenient('nearby')">
            <el-icon :size="28" color="#1e5cb8"><OfficeBuilding /></el-icon>
            <span>附近办事点</span>
          </div>
          <div class="convenient-item" @click="handleConvenient('agent')">
            <el-icon :size="28" color="#1e5cb8"><UserFilled /></el-icon>
            <span>代办服务</span>
          </div>
          <div class="convenient-item" @click="handleConvenient('voice')">
            <el-icon :size="28" color="#1e5cb8"><Document /></el-icon>
            <span>语音引导</span>
          </div>
          <div class="convenient-item" @click="handleConvenient('help')">
            <el-icon :size="28" color="#1e5cb8"><OfficeBuilding /></el-icon>
            <span>帮助中心</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>我的办件</h3>
          <el-button type="text" size="small" @click="goToApplications">全部</el-button>
        </div>
        <div class="application-list" v-if="myApplications.length > 0">
          <div class="application-item" v-for="app in myApplications" :key="app.id" @click="viewApplication(app)">
            <div class="app-header">
              <span class="app-title">{{ app.title }}</span>
              <el-tag :type="getStatusType(app.status)" size="large">{{ getStatusText(app.status) }}</el-tag>
            </div>
            <p class="app-no">受理编号：{{ app.no }}</p>
            <p class="app-time">提交时间：{{ app.time }}</p>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无办件记录</p>
        </div>
      </div>

      <div class="service-hotline">
        <p class="hotline-label">政务服务热线</p>
        <p class="hotline-number">12345</p>
        <p class="hotline-desc">24小时人工服务</p>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BottomNav from '@/components/BottomNav.vue'
import { ArrowLeft, UserFilled, Document, OfficeBuilding } from '@element-plus/icons-vue'

const router = useRouter()
const elderMode = ref(true)

const services = [
  { 
    name: '养老金待遇查询', 
    desc: '查询养老金发放明细', 
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    name: '医疗保险报销', 
    desc: '异地就医、门诊报销', 
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    name: '高龄津贴申请', 
    desc: '80周岁以上老人津贴', 
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  { 
    name: '老年优待证办理', 
    desc: '免费乘车、公园优待', 
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
]

const myApplications = [
  { id: 1, title: '高龄津贴申请', no: 'ELDER202401000123', status: 'completed', time: '2024-01-08 09:30' }
]

const goBack = () => {
  router.back()
}

const goToApplications = () => {
  router.push('/applications')
}

const handleQuick = (type) => {
  const map = {
    appointment: '预约挂号',
    pension: '养老认证',
    allowance: '高龄津贴',
    hotline: '服务热线'
  }
  ElMessage.info(`进入：${map[type]}`)
}

const handleService = (item) => {
  ElMessage.info(`进入服务：${item.name}`)
}

const handleConvenient = (type) => {
  const map = {
    nearby: '附近办事点',
    agent: '代办服务',
    voice: '语音引导',
    help: '帮助中心'
  }
  ElMessage.info(`进入：${map[type]}`)
}

const startFaceCert = () => {
  ElMessage.success('人脸识别认证已启动，请对准摄像头')
}

const viewApplication = (app) => {
  ElMessage.info(`查看办件：${app.no}`)
}

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'primary', completed: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待处理', processing: '办理中', completed: '已完成' }
  return map[status] || status
}
</script>

<style scoped>
.elder-header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.elder-mode {
  font-size: 18px;
}

.elder-mode .service-name,
.elder-mode .app-title {
  font-size: 18px !important;
}

.theme-header {
  padding: 20px 16px;
  color: white;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
}

.header-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 12px;
}

.theme-content {
  padding: 16px;
  margin-top: -12px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background: #f5f7fa;
  min-height: 100vh;
}

.quick-access {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.quick-item {
  background: white;
  border-radius: 12px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.quick-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 8px;
}

.quick-text {
  font-size: 13px;
  color: #333;
  text-align: center;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title > div {
  display: flex;
  align-items: center;
}

.title-bar {
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 2px;
  margin-right: 8px;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

.service-list-item.large {
  padding: 20px 16px;
}

.service-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
}

.service-info .service-name {
  font-size: 16px;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.service-info .service-desc {
  font-size: 13px;
  color: #999;
}

.cert-card {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cert-title {
  font-size: 15px;
  font-weight: 500;
}

.cert-info {
  font-size: 14px;
  color: #666;
  margin: 8px 0;
}

.convenient-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.convenient-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.application-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.app-title {
  font-size: 15px;
  font-weight: 500;
}

.app-no,
.app-time {
  font-size: 13px;
  color: #999;
  margin: 6px 0;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.service-hotline {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.hotline-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.hotline-number {
  font-size: 36px;
  font-weight: 700;
  color: #f5576c;
  margin-bottom: 4px;
}

.hotline-desc {
  font-size: 13px;
  color: #999;
}
</style>
