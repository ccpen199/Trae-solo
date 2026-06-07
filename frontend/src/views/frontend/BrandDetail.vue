<template>
  <div class="brand-detail-page">
    <div class="container">
      <el-breadcrumb separator="/" class="breadcrumb-nav">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/brands' }">品牌库</el-breadcrumb-item>
        <el-breadcrumb-item>{{ brand.name }}</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="card brand-header-card" v-loading="loading">
        <div class="brand-main">
          <img :src="brand.logo" :alt="brand.name" class="brand-logo-large" @error="handleLogoError" />
          <div class="brand-info">
            <div class="brand-title-row">
              <h1 class="brand-name">{{ brand.name }}</h1>
              <span :class="['badge-level', `badge-level-${brand.level}`]">{{ brand.level }}级品牌</span>
            </div>
            <p class="brand-name-en" v-if="brand.nameEn">{{ brand.nameEn }}</p>
            <div class="brand-meta">
              <span><el-icon><OfficeBuilding /></el-icon>{{ brand.industry }}</span>
              <span><el-icon><Location /></el-icon>{{ brand.country }}{{ brand.city ? ' · ' + brand.city : '' }}</span>
              <span v-if="brand.foundedYear"><el-icon><Calendar /></el-icon>{{ brand.foundedYear }}年创立</span>
            </div>
            <div class="brand-tags" v-if="brand.tags?.length">
              <el-tag v-for="tag in brand.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
            </div>
            <div class="brand-actions">
              <el-button type="primary" @click="showVoteDialog = true">
                <el-icon><CaretTop /></el-icon>投票
              </el-button>
              <el-button :type="isCollected ? 'success' : 'default'" @click="toggleCollect">
                <el-icon><StarFilled v-if="isCollected" /><Star v-else /></el-icon>
                {{ isCollected ? '已收藏' : '收藏' }}
              </el-button>
              <el-button @click="goCompare">
                <el-icon><DataAnalysis /></el-icon>加入对比
              </el-button>
              <el-button @click="shareBrand">
                <el-icon><Share /></el-icon>分享
              </el-button>
            </div>
          </div>
          <div class="brand-score-card">
            <div class="score-ring">
              <div class="score-value">{{ brand.score?.toFixed(1) || '0.0' }}</div>
              <div class="score-label">综合评分</div>
            </div>
            <div class="score-ranks">
              <div class="rank-item">
                <span class="rank-label">行业排名</span>
                <span class="rank-value">#{{ brand.industryRank || '-' }}</span>
              </div>
              <div class="rank-item">
                <span class="rank-label">全国排名</span>
                <span class="rank-value">#{{ brand.countryRank || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="brand-desc" v-if="brand.description">
          <h3>品牌简介</h3>
          <p>{{ brand.description }}</p>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="工商信息" name="business">
          <div class="card" v-loading="loading">
            <h3 class="tab-title">工商注册信息</h3>
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="公司名称">{{ brand.business?.companyName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="统一社会信用代码">{{ brand.business?.creditCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="法定代表人">{{ brand.business?.legalPerson || '-' }}</el-descriptions-item>
              <el-descriptions-item label="注册资本">{{ brand.business?.registeredCapital || '-' }}</el-descriptions-item>
              <el-descriptions-item label="成立日期">{{ brand.business?.establishDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="经营状态">{{ brand.business?.status || '-' }}</el-descriptions-item>
              <el-descriptions-item label="所属行业">{{ brand.business?.industry || '-' }}</el-descriptions-item>
              <el-descriptions-item label="注册地址">{{ brand.business?.address || '-' }}</el-descriptions-item>
              <el-descriptions-item label="经营范围" :span="2">{{ brand.business?.businessScope || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="网店数据" name="stores">
          <div class="card" v-loading="loading">
            <h3 class="tab-title">官方网店</h3>
            <el-row :gutter="20" v-if="brand.stores?.length">
              <el-col :xs="12" :sm="8" v-for="store in brand.stores" :key="store.id">
                <div class="store-card">
                  <div class="store-header">
                    <el-icon :size="24" color="#409eff"><Shop /></el-icon>
                    <span class="store-platform">{{ store.platform }}</span>
                  </div>
                  <h4 class="store-name">{{ store.name }}</h4>
                  <div class="store-stats">
                    <div class="store-stat">
                      <span class="stat-value">{{ store.followers || 0 }}</span>
                      <span class="stat-label">粉丝数</span>
                    </div>
                    <div class="store-stat">
                      <span class="stat-value">{{ store.goodRate || 0 }}%</span>
                      <span class="stat-label">好评率</span>
                    </div>
                  </div>
                  <el-button type="primary" link size="small" @click="openStore(store.url)">
                    访问店铺 <el-icon><Top /></el-icon>
                  </el-button>
                </div>
              </el-col>
            </el-row>
            <el-empty v-else description="暂无网店数据" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="舆情数据" name="sentiment">
          <div class="card" v-loading="loading">
            <h3 class="tab-title">舆论情感分析</h3>
            <el-row :gutter="20">
              <el-col :sm="8">
                <div class="sentiment-card positive">
                  <el-icon :size="32"><CircleCheck /></el-icon>
                  <div class="sentiment-value">{{ sentimentData.positive || 0 }}%</div>
                  <div class="sentiment-label">正面评价</div>
                </div>
              </el-col>
              <el-col :sm="8">
                <div class="sentiment-card neutral">
                  <el-icon :size="32"><Minus /></el-icon>
                  <div class="sentiment-value">{{ sentimentData.neutral || 0 }}%</div>
                  <div class="sentiment-label">中性评价</div>
                </div>
              </el-col>
              <el-col :sm="8">
                <div class="sentiment-card negative">
                  <el-icon :size="32"><CircleClose /></el-icon>
                  <div class="sentiment-value">{{ sentimentData.negative || 0 }}%</div>
                  <div class="sentiment-label">负面评价</div>
                </div>
              </el-col>
            </el-row>
            <h4 class="sub-title">近期评论关键词</h4>
            <div class="keyword-cloud">
              <span
                v-for="(kw, idx) in brand.keywords || []"
                :key="idx"
                class="keyword-tag"
                :style="{ fontSize: (12 + kw.count * 2) + 'px' }"
              >{{ kw.word }}</span>
            </div>
            <h4 class="sub-title">最新评论</h4>
            <div class="comment-list" v-if="brand.comments?.length">
              <div class="comment-item" v-for="comment in brand.comments.slice(0, 5)" :key="comment.id">
                <div class="comment-header">
                  <el-avatar :size="32">{{ comment.user?.charAt(0) || 'U' }}</el-avatar>
                  <div class="comment-info">
                    <span class="comment-user">{{ comment.user || '匿名用户' }}</span>
                    <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  <span :class="['sentiment-tag', `sentiment-${comment.sentiment}`]">
                    {{ comment.sentiment === 'positive' ? '正面' : comment.sentiment === 'negative' ? '负面' : '中性' }}
                  </span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据溯源" name="traceability">
          <div class="card" v-loading="traceabilityLoading">
            <h3 class="tab-title">数据采集溯源</h3>
            <p class="trace-desc">本页面所有数据均来自公开渠道，数据采集时间及来源如下：</p>
            <div v-if="traceabilityData.length">
              <div class="trace-item" v-for="(item, idx) in traceabilityData" :key="idx">
                <div class="trace-source">
                  <el-icon><Link /></el-icon>{{ item.source }}
                </div>
                <div class="trace-time">采集时间：{{ formatDateTime(item.collectedAt) }}</div>
                <div class="trace-data" v-if="item.data">{{ JSON.stringify(item.data, null, 2) }}</div>
              </div>
            </div>
            <el-empty v-else description="暂无溯源数据" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showVoteDialog" title="品牌评分" width="500px">
      <el-form v-if="voteForm.score" label-width="100px">
        <el-form-item label="品牌实力">
          <el-rate v-model="voteForm.scores.power" show-score />
        </el-form-item>
        <el-form-item label="产品质量">
          <el-rate v-model="voteForm.scores.quality" show-score />
        </el-form-item>
        <el-form-item label="创新能力">
          <el-rate v-model="voteForm.scores.innovation" show-score />
        </el-form-item>
        <el-form-item label="社会责任">
          <el-rate v-model="voteForm.scores.responsibility" show-score />
        </el-form-item>
        <el-form-item label="发展潜力">
          <el-rate v-model="voteForm.scores.potential" show-score />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVoteDialog = false">取消</el-button>
        <el-button type="primary" @click="submitVote" :loading="voting">提交评分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  OfficeBuilding, Location, Calendar, CaretTop, StarFilled, Star, DataAnalysis, Share,
  Shop, Top, CircleCheck, Minus, CircleClose, Link
} from '@element-plus/icons-vue'
import { brandAPI, collectionAPI } from '@/utils/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const brandId = route.params.id

const loading = ref(false)
const voting = ref(false)
const traceabilityLoading = ref(false)
const collecting = ref(false)

const brand = ref({})
const isCollected = ref(false)
const activeTab = ref('business')
const showVoteDialog = ref(false)
const sentimentData = ref({})
const traceabilityData = ref([])

const voteForm = reactive({
  score: true,
  scores: {
    power: 0,
    quality: 0,
    innovation: 0,
    responsibility: 0,
    potential: 0
  }
})

async function loadDetail() {
  loading.value = true
  try {
    const res = await brandAPI.getDetail(brandId)
    brand.value = res.data || {}
    sentimentData.value = res.data?.sentiment || {}
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function checkCollected() {
  try {
    const res = await collectionAPI.check({ brandId })
    isCollected.value = res.data?.collected || false
  } catch (e) {
    console.error(e)
  }
}

async function loadTraceability() {
  traceabilityLoading.value = true
  try {
    const res = await brandAPI.getTraceability(brandId)
    traceabilityData.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    traceabilityLoading.value = false
  }
}

async function toggleCollect() {
  collecting.value = true
  try {
    if (isCollected.value) {
      await collectionAPI.remove({ brandId })
      isCollected.value = false
      ElMessage.success('已取消收藏')
    } else {
      await collectionAPI.add({ type: 'brand', targetId: brandId })
      isCollected.value = true
      ElMessage.success('收藏成功')
    }
  } catch (e) {
    console.error(e)
  } finally {
    collecting.value = false
  }
}

async function submitVote() {
  const total = Object.values(voteForm.scores).reduce((sum, v) => sum + v, 0)
  if (total === 0) {
    ElMessage.warning('请至少进行一项评分')
    return
  }
  voting.value = true
  try {
    await brandAPI.vote(brandId, voteForm.scores)
    ElMessage.success('评分提交成功')
    showVoteDialog.value = false
    loadDetail()
  } catch (e) {
    console.error(e)
  } finally {
    voting.value = false
  }
}

function goCompare() {
  router.push({ path: '/rankings/compare', query: { brandIds: brandId } })
}

function shareBrand() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(`请手动复制链接: ${url}`)
  })
}

function openStore(url) {
  if (url) window.open(url, '_blank')
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

onMounted(() => {
  loadDetail()
  checkCollected()
  loadTraceability()
})
</script>

<style scoped>
.brand-detail-page {
  padding-bottom: 40px;
}

.brand-header-card {
  margin-bottom: 24px;
}

.brand-main {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.brand-logo-large {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  background: #f0f2f5;
  flex-shrink: 0;
}

.brand-info {
  flex: 1;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  color: #1f2f3d;
  margin: 0;
}

.brand-name-en {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.brand-meta {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.brand-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.brand-tags {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.brand-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.brand-score-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
  text-align: center;
  flex-shrink: 0;
  width: 200px;
}

.score-ring {
  margin-bottom: 16px;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.score-ranks {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.rank-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-label {
  font-size: 12px;
  opacity: 0.8;
}

.rank-value {
  font-size: 18px;
  font-weight: 600;
}

.brand-desc h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 8px;
}

.brand-desc p {
  color: #606266;
  line-height: 1.8;
}

.detail-tabs {
  margin-top: 24px;
}

.tab-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 20px;
}

.sub-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 24px 0 16px;
}

.store-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.store-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.store-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.store-platform {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.store-name {
  font-size: 15px;
  font-weight: 500;
  color: #1f2f3d;
  margin-bottom: 12px;
}

.store-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.store-stat {
  display: flex;
  flex-direction: column;
}

.store-stat .stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2f3d;
}

.store-stat .stat-label {
  font-size: 12px;
  color: #909399;
}

.sentiment-card {
  text-align: center;
  padding: 32px 20px;
  border-radius: 12px;
  transition: transform 0.3s;
}

.sentiment-card:hover {
  transform: translateY(-4px);
}

.sentiment-card.positive {
  background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
  color: #67c23a;
}

.sentiment-card.neutral {
  background: linear-gradient(135deg, #f4f4f5, #e9e9eb);
  color: #909399;
}

.sentiment-card.negative {
  background: linear-gradient(135deg, #fef0f0, #fde2e2);
  color: #f56c6c;
}

.sentiment-value {
  font-size: 36px;
  font-weight: 700;
  margin: 8px 0 4px;
}

.sentiment-label {
  font-size: 14px;
}

.sentiment-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.sentiment-tag.sentiment-positive {
  background: #f0f9eb;
  color: #67c23a;
}

.sentiment-tag.sentiment-negative {
  background: #fef0f0;
  color: #f56c6c;
}

.sentiment-tag.sentiment-neutral {
  background: #f4f4f5;
  color: #909399;
}

.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.keyword-tag {
  color: #409eff;
  cursor: pointer;
  transition: all 0.2s;
}

.keyword-tag:hover {
  color: #667eea;
  transform: scale(1.1);
}

.comment-list {
  margin-top: 16px;
}

.comment-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-info {
  flex: 1;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: #1f2f3d;
  display: block;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.trace-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .brand-main {
    flex-direction: column;
  }
  
  .brand-score-card {
    width: 100%;
  }
  
  .brand-meta {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .brand-name {
    font-size: 22px;
  }
  
  .brand-logo-large {
    width: 80px;
    height: 80px;
  }
}
</style>
