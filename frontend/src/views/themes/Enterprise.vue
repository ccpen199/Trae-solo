<template>
  <div class="mobile-container theme-enterprise">
    <div class="theme-header enterprise-header">
      <div class="header-content">
        <div class="flex-between">
          <el-icon :size="24" @click="goBack"><ArrowLeft /></el-icon>
          <span class="header-title">助企纾困政策直达</span>
          <el-icon :size="24"><OfficeBuilding /></el-icon>
        </div>
        <p class="header-desc">稳经济 · 促发展 · 惠企政策精准推送</p>
      </div>
    </div>

    <div class="theme-content">
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">128</span>
          <span class="stat-label">惠企政策</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">3,456</span>
          <span class="stat-label">受益企业</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">12.5亿</span>
          <span class="stat-label">兑现金额</span>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>政策直达快享</h3>
        </div>
        <div class="policy-actions">
          <div class="policy-action-item" @click="handlePolicyAction('subsidy')">
            <div class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon><Document /></el-icon>
            </div>
            <span class="action-text">稳岗补贴</span>
            <el-tag type="danger" size="small">热门</el-tag>
          </div>
          <div class="policy-action-item" @click="handlePolicyAction('tax')">
            <div class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon><Document /></el-icon>
            </div>
            <span class="action-text">税收优惠</span>
          </div>
          <div class="policy-action-item" @click="handlePolicyAction('finance')">
            <div class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <span class="action-text">融资服务</span>
          </div>
          <div class="policy-action-item" @click="handlePolicyAction('rent')">
            <div class="action-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon><Document /></el-icon>
            </div>
            <span class="action-text">租金减免</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>热门政策</h3>
          <el-button type="text" size="small">全部政策</el-button>
        </div>
        <div class="policy-list">
          <div class="policy-item" v-for="(policy, index) in hotPolicies" :key="index" @click="viewPolicy(policy)">
            <div class="policy-header">
              <el-tag :type="policy.tagType" size="small" style="margin-right: 8px;">{{ policy.tag }}</el-tag>
              <span class="policy-title">{{ policy.title }}</span>
            </div>
            <p class="policy-desc">{{ policy.desc }}</p>
            <div class="policy-footer">
              <span class="policy-dept">{{ policy.dept }}</span>
              <span class="policy-date">{{ policy.date }}</span>
            </div>
            <el-button type="primary" size="small" style="margin-top: 12px;" @click.stop="applyPolicy(policy)">
              立即申请
            </el-button>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>我的申请</h3>
          <el-button type="text" size="small" @click="goToApplications">全部</el-button>
        </div>
        <div class="application-list" v-if="myApplications.length > 0">
          <div class="application-item" v-for="app in myApplications" :key="app.id" @click="viewApplication(app)">
            <div class="app-header">
              <span class="app-title">{{ app.title }}</span>
              <el-tag :type="getStatusType(app.status)">{{ getStatusText(app.status) }}</el-tag>
            </div>
            <p class="app-amount" v-if="app.amount">预计补贴：{{ app.amount }}</p>
            <p class="app-time">申请时间：{{ app.time }}</p>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无申请记录</p>
          <el-button type="primary" style="margin-top: 12px;" @click="goToServices">去申请</el-button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>企业信息</h3>
        </div>
        <div class="enterprise-info">
          <div class="info-row">
            <span class="info-label">企业名称</span>
            <span class="info-value">广东省XX科技有限公司</span>
          </div>
          <div class="info-row">
            <span class="info-label">统一社会信用代码</span>
            <span class="info-value">91440000XXXXXXXXXX</span>
          </div>
          <div class="info-row">
            <span class="info-label">企业类型</span>
            <span class="info-value">高新技术企业</span>
          </div>
          <div class="info-row">
            <span class="info-label">认证状态</span>
            <el-tag type="success">已认证</el-tag>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">
          <span class="title-bar"></span>
          <h3>政策智能匹配</h3>
        </div>
        <div class="match-card">
          <p class="match-desc">基于您的企业信息，我们为您智能匹配以下政策：</p>
          <div class="match-result">
            <div class="match-item" v-for="(item, index) in matchedPolicies" :key="index">
              <div class="match-info">
                <span class="match-title">{{ item.title }}</span>
                <el-tag type="success" size="small">匹配度 {{ item.matchRate }}%</el-tag>
              </div>
              <el-button type="primary" size="small" link>查看</el-button>
            </div>
          </div>
          <el-button type="primary" style="width: 100%; margin-top: 16px;">
            开始智能匹配
          </el-button>
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

const hotPolicies = [
  {
    title: '关于实施失业保险稳岗返还政策的通知',
    tag: '最新',
    tagType: 'danger',
    desc: '对符合条件的参保企业，按企业及其职工上年度实际缴纳失业保险费的一定比例返还。',
    dept: '省人力资源社会保障厅',
    date: '2024-01-15'
  },
  {
    title: '广东省促进服务业领域困难行业恢复发展若干措施',
    tag: '重点',
    tagType: 'warning',
    desc: '针对餐饮、零售、旅游、公路水路铁路运输、民航等服务业行业纾困扶持。',
    dept: '省发展改革委',
    date: '2024-01-12'
  },
  {
    title: '关于进一步支持中小企业和个体工商户纾困发展的通知',
    tag: '普惠',
    tagType: 'success',
    desc: '从减税降费、融资支持、稳岗就业、扩大市场等方面支持中小企业发展。',
    dept: '省工业和信息化厅',
    date: '2024-01-10'
  }
]

const myApplications = [
  { id: 1, title: '失业保险稳岗返还申请', status: 'processing', amount: '12,500元', time: '2024-01-10 14:30' }
]

const matchedPolicies = [
  { title: '高新技术企业税收优惠', matchRate: 95 },
  { title: '研发费用加计扣除', matchRate: 88 },
  { title: '稳岗补贴申请', matchRate: 100 }
]

const goBack = () => {
  router.back()
}

const goToApplications = () => {
  router.push('/applications')
}

const goToServices = () => {
  router.push('/services')
}

const handlePolicyAction = (type) => {
  const map = {
    subsidy: '稳岗补贴',
    tax: '税收优惠',
    finance: '融资服务',
    rent: '租金减免'
  }
  ElMessage.info(`进入${map[type]}申请`)
}

const viewPolicy = (policy) => {
  ElMessage.info(`查看政策：${policy.title}`)
}

const applyPolicy = (policy) => {
  ElMessage.success(`开始申请：${policy.title}`)
}

const viewApplication = (app) => {
  ElMessage.info(`查看申请：${app.title}`)
}

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'primary', completed: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审核', processing: '审核中', completed: '已通过', rejected: '已驳回' }
  return map[status] || status
}
</script>

<style scoped>
.enterprise-header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.stats-bar {
  display: flex;
  justify-content: space-around;
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e5cb8;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
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
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 2px;
  margin-right: 8px;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.policy-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.policy-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 8px;
}

.action-text {
  font-size: 12px;
  color: #333;
}

.policy-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.policy-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.policy-item:hover {
  background: #f0f7ff;
}

.policy-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.policy-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.policy-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.policy-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
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
  font-size: 14px;
  font-weight: 500;
}

.app-amount {
  font-size: 13px;
  color: #f56c6c;
  margin: 6px 0;
}

.app-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.enterprise-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
}

.match-card {
  padding: 16px;
  background: #f0f7ff;
  border-radius: 8px;
}

.match-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.match-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.match-title {
  font-size: 14px;
  color: #333;
}
</style>
