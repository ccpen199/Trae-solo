<template>
  <div class="home-page">
    <div class="container">
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">专业品牌数据平台</h1>
          <p class="hero-subtitle">汇聚全球品牌信息，多维数据分析，智能榜单排名</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="goBrands">
              <el-icon><Search /></el-icon>探索品牌库
            </el-button>
            <el-button size="large" @click="goRankings">
              <el-icon><Trophy /></el-icon>查看榜单
            </el-button>
          </div>
        </div>
      </section>

      <section class="stats-section" v-loading="loading">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6">
            <div class="stat-card primary">
              <div class="stat-value">{{ stats.brandCount || 0 }}</div>
              <div class="stat-label">收录品牌</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card success">
              <div class="stat-value">{{ stats.rankingCount || 0 }}</div>
              <div class="stat-label">榜单分类</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card warning">
              <div class="stat-value">{{ stats.knowledgeCount || 0 }}</div>
              <div class="stat-label">知识文章</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card danger">
              <div class="stat-value">{{ stats.dataSourceCount || 0 }}</div>
              <div class="stat-label">数据来源</div>
            </div>
          </el-col>
        </el-row>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon color="#409eff"><Coffee /></el-icon>
            热门品牌
          </h2>
          <el-button text type="primary" @click="goBrands">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <el-row :gutter="20" v-loading="brandsLoading">
          <el-col :xs="12" :sm="8" :md="6" v-for="brand in hotBrands" :key="brand.id">
            <div class="brand-card" @click="goBrandDetail(brand.id)">
              <div class="brand-header">
                <img :src="brand.logo" :alt="brand.name" class="brand-logo" />
                <span :class="['badge-level', `badge-level-${brand.level}`]">{{ brand.level }}级</span>
              </div>
              <h3 class="brand-name">{{ brand.name }}</h3>
              <p class="brand-desc">{{ brand.industry }} · {{ brand.country }}</p>
              <div class="brand-stats">
                <span class="stat-item">
                  <el-icon><Star /></el-icon>{{ brand.score?.toFixed(1) || '0.0' }}
                </span>
                <span class="stat-item">
                  <el-icon><View /></el-icon>{{ brand.viewCount || 0 }}
                </span>
              </div>
            </div>
          </el-col>
        </el-row>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon color="#67c23a"><Trophy /></el-icon>
            热门榜单
          </h2>
          <el-button text type="primary" @click="goRankings">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <el-row :gutter="20" v-loading="rankingsLoading">
          <el-col :xs="24" :sm="12" :md="8" v-for="category in rankingCategories" :key="category.id">
            <div class="ranking-card card" @click="goRankingDetail(category.id)">
              <div class="ranking-card-header">
                <div class="ranking-icon" :style="{ background: category.color }">
                  <el-icon :size="24"><DataLine /></el-icon>
                </div>
                <div class="ranking-card-title">
                  <h3 class="ranking-name">{{ category.name }}</h3>
                  <span class="ranking-badge">{{ category.brandCount || 0 }} 个品牌</span>
                </div>
              </div>
              <div class="ranking-list">
                <div class="ranking-item" v-for="(brand, idx) in category.topBrands" :key="brand.id">
                  <span class="ranking-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
                  <img :src="brand.logo" :alt="brand.name" class="ranking-brand-logo" @error="handleLogoError" />
                  <span class="ranking-brand-name">{{ brand.name }}</span>
                  <span class="ranking-score">{{ parseFloat(brand.score).toFixed(1) || '0.0' }}分</span>
                </div>
              </div>
              <div class="ranking-footer">
                <span class="ranking-update">更新于 {{ formatDate(category.updatedAt) }}</span>
                <el-button type="primary" link size="small">
                  查看排名 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon color="#e6a23c"><Document /></el-icon>
            最新知识
          </h2>
          <el-button text type="primary" @click="goKnowledge">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <el-row :gutter="20" v-loading="knowledgeLoading">
          <el-col :xs="24" :sm="12" :md="8" v-for="item in latestKnowledge" :key="item.id">
            <div class="knowledge-card card">
              <div class="knowledge-header">
                <el-tag size="small" type="primary">{{ item.category }}</el-tag>
                <span class="knowledge-level" v-if="item.level">
                  <el-icon><Connection /></el-icon>{{ item.level }}
                </span>
              </div>
              <h3 class="knowledge-title" @click="goKnowledgeDetail(item.id)">{{ item.title }}</h3>
              <p class="knowledge-summary">{{ item.summary || item.content?.substring(0, 60) }}...</p>
              <div class="knowledge-meta" v-if="item.tags">
                <el-tag size="small" type="info" v-for="tag in item.tags.split(',').slice(0, 2)" :key="tag">
                  {{ tag.trim() }}
                </el-tag>
              </div>
              <div class="knowledge-actions">
                <div class="action-left">
                  <span class="knowledge-author">
                    <el-icon><User /></el-icon>{{ item.author || '品牌智库' }}
                  </span>
                </div>
                <div class="action-right">
                  <el-button type="primary" link size="small" @click="toggleFavorite(item)">
                    <el-icon><StarFilled v-if="item.isFavorite" /><Star v-else /></el-icon>
                    {{ item.favoriteCount || 0 }}
                  </el-button>
                  <el-button type="primary" link size="small" @click="shareKnowledge(item)">
                    <el-icon><Share /></el-icon>
                    分享
                  </el-button>
                </div>
              </div>
              <div class="knowledge-alert" v-if="item.hasAlert">
                <el-icon color="#f56c6c"><Warning /></el-icon>
                <span>内容有更新，请查看最新版本</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon color="#909399"><DataAnalysis /></el-icon>
            数据来源
          </h2>
        </div>
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" v-for="source in dataSources" :key="source.id">
            <div class="datasource-card card" @click="goDataSource(source.route)">
              <div class="datasource-icon" :style="{ color: source.color }">
                <el-icon :size="32"><component :is="source.icon" /></el-icon>
              </div>
              <h4 class="datasource-name">{{ source.name }}</h4>
              <p class="datasource-desc">{{ source.description }}</p>
              <div class="datasource-action">
                <el-button type="primary" link size="small">
                  进入 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, Trophy, Coffee, ArrowRight, Star, StarFilled, View, DataLine,
  Document, User, Connection, Share, Warning, DataAnalysis,
  Wallet, Brush, Film, VideoPlay
} from '@element-plus/icons-vue'
import { brandAPI, rankingAPI, knowledgeAPI, statsAPI, collectionAPI } from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(true)
const brandsLoading = ref(true)
const rankingsLoading = ref(true)
const knowledgeLoading = ref(true)

const stats = ref({})
const hotBrands = ref([])
const rankingCategories = ref([])
const latestKnowledge = ref([])

const dataSources = ref([
  {
    id: 1,
    name: '数据溯源看板',
    icon: markRaw(DataAnalysis),
    color: '#409eff',
    description: '查看每条数据的来源与采集时间',
    route: '/admin/traceability'
  },
  {
    id: 2,
    name: '专家评审协同',
    icon: markRaw(Document),
    color: '#67c23a',
    description: '人工修正榜单权重与评分',
    route: '/admin/expert-reviews'
  },
  {
    id: 3,
    name: '研究报告生成',
    icon: markRaw(DataLine),
    color: '#e6a23c',
    description: '生成行业TOP10分析报告',
    route: '/admin/reports'
  },
  {
    id: 4,
    name: '知识更新预警',
    icon: markRaw(Warning),
    color: '#f56c6c',
    description: '政策变动触发专题修订',
    route: '/admin/alerts'
  }
])

async function loadStats() {
  try {
    const res = await statsAPI.getStats()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadHotBrands() {
  try {
    const res = await brandAPI.getList({ pageSize: 8, sortBy: 'score' })
    hotBrands.value = (res.data?.data || []).map(b => ({
      ...b,
      score: b.overall_score || b.score,
      country: b.region || b.country || '中国',
      logo: b.logo_url
    }))
  } catch (e) {
    console.error(e)
  } finally {
    brandsLoading.value = false
  }
}

async function loadRankingCategories() {
  try {
    const res = await rankingAPI.getCategories({ pageSize: 8 })
    const cats = res.data?.data || []
    const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#667eea', '#764ba2', '#f093fb']
    
    rankingCategories.value = await Promise.all(cats.map(async (cat, idx) => {
      let topBrands = []
      try {
        const rankRes = await rankingAPI.getRankings(cat.id, { pageSize: 3 })
        topBrands = (rankRes.data?.data || []).map(r => ({
          id: r.brand_id || r.id,
          name: r.brand_name || r.name,
          score: Number(r.final_score || r.overall_score || 0),
          logo: r.logo_url || r.logo
        }))
      } catch (e) {
        console.error('Failed to load rankings for category', cat.id, e)
      }
      
      return {
        ...cat,
        color: colors[idx % 8],
        brandCount: cat.brand_count || cat.brands_count || 0,
        updatedAt: cat.last_calculated_at || cat.updated_at,
        topBrands
      }
    }))
  } catch (e) {
    console.error(e)
  } finally {
    rankingsLoading.value = false
  }
}

async function loadLatestKnowledge() {
  try {
    const res = await knowledgeAPI.getList({ pageSize: 6, sortBy: 'createdAt' })
    latestKnowledge.value = (res.data?.data || []).map((item, idx) => ({
      ...item,
      level: ['基础概念', '进阶知识', '深度研究'][idx % 3],
      favoriteCount: Math.floor(Math.random() * 50) + 10,
      isFavorite: false,
      hasAlert: idx === 0
    }))
  } catch (e) {
    console.error(e)
  } finally {
    knowledgeLoading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('MM-DD')
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="12" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

function toggleFavorite(item) {
  item.isFavorite = !item.isFavorite
  item.favoriteCount += item.isFavorite ? 1 : -1
  ElMessage.success(item.isFavorite ? '已收藏' : '已取消收藏')
}

function shareKnowledge(item) {
  if (navigator.share) {
    navigator.share({ title: item.title, text: item.summary })
  } else {
    ElMessage.success('分享链接已复制')
  }
}

function goBrands() {
  router.push('/brands')
}

function goRankings() {
  router.push('/rankings')
}

function goKnowledge() {
  router.push('/knowledge')
}

function goBrandDetail(id) {
  router.push(`/brands/${id}`)
}

function goRankingDetail(id) {
  router.push(`/rankings/${id}`)
}

function goKnowledgeDetail(id) {
  router.push(`/knowledge/${id}`)
}

function goDataSource(route) {
  router.push(route)
}

onMounted(() => {
  loadStats()
  loadHotBrands()
  loadRankingCategories()
  loadLatestKnowledge()
})
</script>

<style scoped>
.home-page {
  padding-bottom: 40px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 60px 40px;
  margin-bottom: 32px;
  color: #fff;
}

.hero-content {
  text-align: center;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.hero-actions .el-button {
  padding: 20px 32px;
  font-size: 16px;
}

.hero-actions .el-button--primary {
  background: #fff;
  color: #667eea;
  border: none;
}

.hero-actions .el-button--primary:hover {
  background: #f5f7fa !important;
  color: #667eea !important;
}

.hero-actions .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-actions .el-button:not(.el-button--primary):hover {
  background: rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
}

.stats-section {
  margin-bottom: 32px;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0;
}

.brand-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.brand-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.brand-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f7fa;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 4px;
}

.brand-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.brand-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.brand-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.ranking-card {
  cursor: pointer;
}

.ranking-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.ranking-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.ranking-card-title {
  flex: 1;
}

.ranking-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 4px;
}

.ranking-badge {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.ranking-list {
  margin-bottom: 16px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #f5f7fa;
  color: #909399;
}

.ranking-rank.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  color: #fff;
}

.ranking-rank.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: #fff;
}

.ranking-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
}

.ranking-brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
  background: #f5f7fa;
}

.ranking-brand-name {
  flex: 1;
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-score {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.ranking-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.ranking-update {
  font-size: 12px;
  color: #909399;
}

.knowledge-card {
  cursor: pointer;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.knowledge-level {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #67c23a;
}

.knowledge-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
  cursor: pointer;
}

.knowledge-title:hover {
  color: #409eff;
}

.knowledge-summary {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.knowledge-meta {
  margin-bottom: 12px;
}

.knowledge-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.knowledge-author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.action-right {
  display: flex;
  gap: 8px;
}

.knowledge-alert {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #f56c6c;
}

.datasource-card {
  text-align: center;
  cursor: pointer;
}

.datasource-card:hover {
  transform: translateY(-4px);
}

.datasource-icon {
  margin-bottom: 12px;
}

.datasource-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 6px;
}

.datasource-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.datasource-action {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 20px;
  }
  
  .hero-title {
    font-size: 28px;
  }
  
  .hero-subtitle {
    font-size: 14px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .hero-actions .el-button {
    padding: 14px 20px;
    font-size: 14px;
  }
  
  .ranking-item {
    gap: 6px;
  }
  
  .ranking-brand-name {
    font-size: 12px;
  }
}
</style>
