<template>
  <div class="mobile-container theme-gba">
    <div class="theme-header gba-header">
      <div class="header-content">
        <div class="flex-between">
          <el-icon :size="24" @click="goBack"><ArrowLeft /></el-icon>
          <span class="header-title">粤港澳大湾区专窗</span>
          <el-icon :size="24"><OfficeBuilding /></el-icon>
        </div>
        <p class="header-desc">跨境服务 · 湾区通办</p>
      </div>
    </div>

    <div class="theme-content">
      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>热门跨境服务</h3>
        </div>
        <div class="service-grid">
          <div class="service-item" v-for="item in crossBorderServices" :key="item.name" @click="handleService(item)">
            <div class="service-icon" :style="{ background: item.color }">
              <el-icon><Document /></el-icon>
            </div>
            <span class="service-name">{{ item.name }}</span>
            <span class="service-tag" v-if="item.hot">热门</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>港澳居民服务</h3>
        </div>
        <div class="service-list">
          <div class="service-list-item" v-for="item in hkmoServices" :key="item.name" @click="handleService(item)">
            <div class="service-info">
              <span class="service-name">{{ item.name }}</span>
              <span class="service-desc">{{ item.desc }}</span>
            </div>
            <el-icon><Document /></el-icon>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>湾区政策直达</h3>
        </div>
        <div class="policy-list">
          <div class="policy-item" v-for="(policy, index) in policies" :key="index" @click="viewPolicy(policy)">
            <el-tag type="success" size="small" style="margin-right: 8px;">{{ policy.tag }}</el-tag>
            <span class="policy-title">{{ policy.title }}</span>
            <span class="policy-date">{{ policy.date }}</span>
          </div>
        </div>
        <el-button type="text" style="width: 100%; margin-top: 12px;">查看更多政策 ></el-button>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>办事进度查询</h3>
        </div>
        <div class="progress-query">
          <el-input v-model="queryNo" placeholder="请输入业务受理编号" style="flex: 1; margin-right: 12px;">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="queryProgress">查询</el-button>
        </div>
      </div>

      <div class="section-card" v-if="myApplications.length > 0">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>我的办件</h3>
        </div>
        <div class="application-list">
          <div class="application-item" v-for="app in myApplications" :key="app.id" @click="viewApplication(app)">
            <div class="app-header">
              <span class="app-title">{{ app.title }}</span>
              <el-tag :type="getStatusType(app.status)">{{ getStatusText(app.status) }}</el-tag>
            </div>
            <p class="app-no">受理编号：{{ app.no }}</p>
            <p class="app-time">提交时间：{{ app.time }}</p>
          </div>
        </div>
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
import { ArrowLeft, OfficeBuilding, Document } from '@element-plus/icons-vue'

const router = useRouter()
const queryNo = ref('')

const crossBorderServices = [
  { name: '港澳通行证办理', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', hot: true },
  { name: '跨境医保结算', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', hot: true },
  { name: '港澳子弟入学', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', hot: false },
  { name: '跨境执业资格', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', hot: false },
  { name: '企业跨境办税', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', hot: false },
  { name: '不动产查询', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', hot: false },
  { name: '车辆入境申报', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', hot: false },
  { name: '更多服务', color: 'linear-gradient(135deg, #ccc 0%, #999 100%)', hot: false }
]

const hkmoServices = [
  { name: '港澳居民居住证', desc: '在内地居住、工作、生活必备证件' },
  { name: '港澳居民社保参保', desc: '享受内地社保福利待遇' },
  { name: '港澳人士公积金', desc: '住房公积金缴存提取' },
  { name: '跨境远程医疗', desc: '线上问诊、处方流转' }
]

const policies = [
  { title: '关于进一步便利港澳居民在粤发展的若干措施', tag: '最新', date: '2024-01-15' },
  { title: '粤港澳大湾区个人所得税优惠政策', tag: '税收', date: '2024-01-10' },
  { title: '跨境理财通业务试点实施细则', tag: '金融', date: '2024-01-05' }
]

const myApplications = [
  { id: 1, title: '港澳通行证续签', no: 'GBA202401001234', status: 'processing', time: '2024-01-15 10:30' }
]

const goBack = () => {
  router.back()
}

const handleService = (item) => {
  ElMessage.info(`进入服务：${item.name}`)
}

const viewPolicy = (policy) => {
  ElMessage.info(`查看政策：${policy.title}`)
}

const queryProgress = () => {
  if (!queryNo.value) {
    ElMessage.warning('请输入业务受理编号')
    return
  }
  ElMessage.success('查询成功')
}

const viewApplication = (app) => {
  ElMessage.info(`查看办件详情：${app.no}`)
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
.gba-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.section-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.title-bar {
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  margin-right: 8px;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
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
  position: relative;
}

.service-icon {
  width: 44px;
  height: 44px;
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
  position: absolute;
  top: 0;
  right: 8px;
  font-size: 10px;
  background: #f56c6c;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

.service-info {
  flex: 1;
}

.service-info .service-name {
  font-size: 14px;
  display: block;
  margin-bottom: 4px;
}

.service-desc {
  font-size: 12px;
  color: #999;
}

.policy-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.policy-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

.policy-title {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.policy-date {
  font-size: 12px;
  color: #999;
}

.progress-query {
  display: flex;
  align-items: center;
}

.application-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-item {
  padding: 12px;
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
  font-size: 14px;
  font-weight: 500;
}

.app-no,
.app-time {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}
</style>
