<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBanners, getProjects } from '@/api/project'

const router = useRouter()

const loading = ref(true)
const error = ref(false)
const banners = ref<any[]>([])
const projects = ref<any[]>([])

const fetchBanners = async () => {
  try {
    const res = await getBanners()
    banners.value = res.data || []
  } catch (err) {
    console.error('Get banners error:', err)
  }
}

const fetchProjects = async () => {
  try {
    const res = await getProjects({ status: 'funding', page: 1, pageSize: 10 })
    projects.value = res.data?.list || []
  } catch (err) {
    console.error('Get projects error:', err)
  }
}

const initData = async () => {
  loading.value = true
  error.value = false
  try {
    await Promise.all([fetchBanners(), fetchProjects()])
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const goToProject = (id: number) => {
  router.push(`/project/${id}`)
}

const goToLogin = () => {
  router.push('/login')
}

const formatRate = (rate: number) => {
  return rate ? rate.toFixed(1) : '0.0'
}

const formatAmount = (amount: number) => {
  if (!amount) return '0'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(0) + '万'
  }
  return amount.toFixed(0)
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="home-page">
    <van-nav-bar title="积木盒子" fixed placeholder>
      <template #right>
        <van-icon name="user-o" size="20" @click="goToLogin" />
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="loading" @refresh="initData">
      <div v-if="error" class="error-container">
        <van-empty description="加载失败" />
        <van-button type="primary" @click="initData">重试</van-button>
      </div>

      <template v-else>
        <div v-if="banners.length > 0" class="banner-section">
          <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="#1989fa">
            <van-swipe-item v-for="banner in banners" :key="banner.id">
              <img :src="banner.image" :alt="banner.title" class="banner-image" />
            </van-swipe-item>
          </van-swipe>
        </div>

        <div class="guide-section">
          <div class="guide-title">新手指南</div>
          <div class="guide-grid">
            <div class="guide-item">
              <van-icon name="newspaper-o" size="28" color="#1989fa" />
              <span>安全保障</span>
            </div>
            <div class="guide-item">
              <van-icon name="balance-o" size="28" color="#ff976a" />
              <span>收益计算</span>
            </div>
            <div class="guide-item">
              <van-icon name="orders-o" size="28" color="#07c160" />
              <span>投资流程</span>
            </div>
            <div class="guide-item">
              <van-icon name="service-o" size="28" color="#ff4d4f" />
              <span>帮助中心</span>
            </div>
          </div>
        </div>

        <div class="project-section">
          <div class="section-header">
            <span class="section-title">推荐项目</span>
            <span class="section-more">更多 ></span>
          </div>

          <div v-if="projects.length === 0" class="empty-projects">
            <van-empty description="暂无项目" />
          </div>

          <div v-else class="project-list">
            <div
              v-for="project in projects"
              :key="project.id"
              class="project-card"
              @click="goToProject(project.id)"
            >
              <div class="project-header">
                <span class="project-title">{{ project.title }}</span>
                <van-tag type="primary">可投</van-tag>
              </div>
              <div class="project-body">
                <div class="rate-item">
                  <span class="rate-value">{{ formatRate(project.interest_rate) }}<span class="rate-unit">%</span></span>
                  <span class="rate-label">预期年化</span>
                </div>
                <div class="info-item">
                  <span class="info-value">{{ project.term }}{{ project.term_unit === 'month' ? '个月' : '天' }}</span>
                  <span class="info-label">项目期限</span>
                </div>
                <div class="info-item">
                  <span class="info-value">{{ formatAmount(project.remaining_amount) }}</span>
                  <span class="info-label">剩余金额</span>
                </div>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-inner"
                  :style="{ width: `${((project.amount - project.remaining_amount) / project.amount * 100) || 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.banner-section {
  padding: 12px 16px;
}

.banner-swipe {
  border-radius: 8px;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.guide-section {
  background: white;
  margin: 0 16px 12px;
  border-radius: 8px;
  padding: 16px;
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.guide-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.project-section {
  background: white;
  margin: 0 16px;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-more {
  font-size: 12px;
  color: #999;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:active {
  background: #f9f9f9;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.project-body {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rate-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.rate-value {
  font-size: 24px;
  font-weight: 700;
  color: #ff4d4f;
}

.rate-unit {
  font-size: 14px;
}

.rate-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #1989fa, #57a3f3);
  border-radius: 3px;
  transition: width 0.3s;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 16px;
}

.empty-projects {
  padding: 40px 0;
}
</style>
