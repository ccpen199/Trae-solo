<template>
  <div class="knowledge-detail-page">
    <div class="container">
      <el-breadcrumb separator="/" class="breadcrumb-nav">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/knowledge' }">知识专题</el-breadcrumb-item>
        <el-breadcrumb-item>{{ knowledge.title }}</el-breadcrumb-item>
      </el-breadcrumb>

      <el-row :gutter="20">
        <el-col :lg="16">
          <div class="card article-card" v-loading="loading">
            <div class="article-header">
              <div class="article-tags">
                <el-tag size="small" type="primary">{{ knowledge.category }}</el-tag>
                <el-tag size="small" v-if="knowledge.isFeatured" type="warning">精选</el-tag>
              </div>
              <h1 class="article-title">{{ knowledge.title }}</h1>
              <div class="article-meta">
                <div class="author-info">
                  <el-avatar :size="36">
                    {{ knowledge.author?.charAt(0) || 'A' }}
                  </el-avatar>
                  <div>
                    <span class="author-name">{{ knowledge.author || '品牌智库' }}</span>
                    <span class="publish-date">{{ formatDateTime(knowledge.createdAt) }}</span>
                  </div>
                </div>
                <div class="article-stats">
                  <span><el-icon><View /></el-icon>{{ knowledge.viewCount || 0 }} 阅读</span>
                  <span><el-icon><StarFilled v-if="isLiked" /><Star v-else /></el-icon>{{ knowledge.likeCount || 0 }} 点赞</span>
                </div>
              </div>
            </div>
            <div class="article-cover" v-if="knowledge.coverImage">
              <img :src="knowledge.coverImage" :alt="knowledge.title" />
            </div>
            <div class="article-content" v-html="knowledge.content"></div>
            <div class="article-actions">
              <el-button
                :type="isLiked ? 'success' : 'default'"
                size="large"
                @click="toggleLike"
                :loading="liking"
              >
                <el-icon><StarFilled v-if="isLiked" /><Star v-else /></el-icon>
                {{ isLiked ? '已点赞' : '点赞' }} ({{ knowledge.likeCount || 0 }})
              </el-button>
              <el-button
                :type="isCollected ? 'warning' : 'default'"
                size="large"
                @click="toggleCollect"
                :loading="collecting"
              >
                <el-icon><CollectionTag v-if="isCollected" /><Collection v-else /></el-icon>
                {{ isCollected ? '已收藏' : '收藏' }}
              </el-button>
              <el-button size="large" @click="shareArticle">
                <el-icon><Share /></el-icon>分享
              </el-button>
            </div>
          </div>

          <div class="card" v-if="relatedKnowledge.length > 0">
            <h3 class="section-title">
              <el-icon color="#409eff"><Link /></el-icon>
              相关推荐
            </h3>
            <el-row :gutter="20">
              <el-col :xs="12" :md="6" v-for="item in relatedKnowledge" :key="item.id">
                <div class="related-card" @click="goRelated(item.id)">
                  <h4 class="related-title">{{ item.title }}</h4>
                  <div class="related-meta">
                    <span>{{ item.category }}</span>
                    <span><el-icon><View /></el-icon>{{ item.viewCount || 0 }}</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-col>

        <el-col :lg="8">
          <div class="card">
            <h3 class="section-title">
              <el-icon color="#67c23a"><Connection /></el-icon>
              实体关系图
            </h3>
            <div ref="graphChartRef" class="graph-container" v-loading="graphLoading"></div>
            <div class="graph-legend" v-if="graphData.nodes?.length">
              <div class="legend-title">图例说明</div>
              <div class="legend-list">
                <div class="legend-item">
                  <span class="legend-dot brand"></span>
                  <span>品牌</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot concept"></span>
                  <span>概念</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot person"></span>
                  <span>人物</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot event"></span>
                  <span>事件</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">
              <el-icon color="#e6a23c"><PriceTag /></el-icon>
              本文标签
            </h3>
            <div class="tag-cloud" v-if="knowledge.tags?.length">
              <span class="tag-item" v-for="tag in knowledge.tags" :key="tag">{{ tag }}</span>
            </div>
            <el-empty v-else description="暂无标签" :image-size="60" />
          </div>

          <div class="card">
            <h3 class="section-title">
              <el-icon color="#f56c6c"><Reading /></el-icon>
              目录导航
            </h3>
            <div class="toc-list">
              <div
                v-for="(toc, idx) in tableOfContents"
                :key="idx"
                class="toc-item"
                :class="{ 'toc-level-2': toc.level === 2, 'toc-level-3': toc.level === 3 }"
              >
                {{ toc.text }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  View, StarFilled, Star, CollectionTag, Collection, Share,
  Link, Connection, PriceTag, Reading
} from '@element-plus/icons-vue'
import { knowledgeAPI, collectionAPI } from '@/utils/api'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const knowledgeId = route.params.id

const loading = ref(false)
const liking = ref(false)
const collecting = ref(false)
const graphLoading = ref(false)

const knowledge = ref({})
const relatedKnowledge = ref([])
const graphData = ref({ nodes: [], links: [] })
const isLiked = ref(false)
const isCollected = ref(false)

const graphChartRef = ref(null)
let graphChart = null

const tableOfContents = computed(() => {
  const content = knowledge.value.content || ''
  const headings = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/g) || []
  return headings.map(h => {
    const level = parseInt(h.charAt(2))
    const text = h.replace(/<[^>]*>/g, '').trim()
    return { level, text }
  })
})

async function loadDetail() {
  loading.value = true
  try {
    const res = await knowledgeAPI.getDetail(knowledgeId)
    knowledge.value = res.data || {}
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadRelated() {
  try {
    const res = await knowledgeAPI.getList({
      category: knowledge.value.category,
      pageSize: 4,
      excludeId: knowledgeId
    })
    relatedKnowledge.value = res.data?.data || []
  } catch (e) {
    console.error(e)
  }
}

async function loadGraph() {
  graphLoading.value = true
  try {
    const res = await knowledgeAPI.getGraph(knowledgeId)
    graphData.value = res.data || { nodes: [], links: [] }
    nextTick(() => {
      initGraphChart()
    })
  } catch (e) {
    console.error(e)
  } finally {
    graphLoading.value = false
  }
}

async function checkLiked() {
  try {
    const liked = localStorage.getItem(`liked_${knowledgeId}`)
    isLiked.value = liked === 'true'
  } catch (e) {
    console.error(e)
  }
}

async function checkCollected() {
  try {
    const res = await collectionAPI.check({ knowledgeId })
    isCollected.value = res.data?.collected || false
  } catch (e) {
    console.error(e)
  }
}

function initGraphChart() {
  if (!graphChartRef.value) return
  if (graphChart) graphChart.dispose()
  
  graphChart = echarts.init(graphChartRef.value)
  
  const nodeColors = {
    brand: '#409eff',
    concept: '#67c23a',
    person: '#e6a23c',
    event: '#f56c6c'
  }
  
  const nodes = graphData.value.nodes?.map(node => ({
    id: node.id,
    name: node.name,
    symbolSize: Math.max(30, (node.value || 1) * 10),
    category: node.type || 'concept',
    itemStyle: { color: nodeColors[node.type] || nodeColors.concept },
    label: { show: true, fontSize: 12 }
  })) || []
  
  const links = graphData.value.links?.map(link => ({
    source: link.source,
    target: link.target,
    lineStyle: { color: '#dcdfe6', width: 1 }
  })) || []
  
  const categories = [
    { name: '品牌', itemStyle: { color: nodeColors.brand } },
    { name: '概念', itemStyle: { color: nodeColors.concept } },
    { name: '人物', itemStyle: { color: nodeColors.person } },
    { name: '事件', itemStyle: { color: nodeColors.event } }
  ]
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}'
    },
    legend: [{
      data: categories.map(c => c.name),
      bottom: 0,
      textStyle: { fontSize: 12 }
    }],
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: links,
      categories: categories,
      roam: true,
      label: {
        position: 'right',
        formatter: '{b}'
      },
      lineStyle: {
        color: 'source',
        curveness: 0.3
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 4 }
      },
      force: {
        repulsion: 400,
        edgeLength: 100,
        gravity: 0.1
      }
    }]
  }
  
  if (nodes.length === 0) {
    option.title = {
      text: '暂无关系图数据',
      left: 'center',
      top: 'center',
      textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
    }
    option.series = []
  }
  
  graphChart.setOption(option)
  
  graphChart.on('click', (params) => {
    if (params.dataType === 'node') {
      const node = graphData.value.nodes?.find(n => n.id === params.data.id)
      if (node?.type === 'brand' && node.brandId) {
        router.push(`/brands/${node.brandId}`)
      }
    }
  })
}

async function toggleLike() {
  liking.value = true
  try {
    if (isLiked.value) {
      ElMessage.info('您已经点赞过了')
    } else {
      await knowledgeAPI.like(knowledgeId)
      isLiked.value = true
      localStorage.setItem(`liked_${knowledgeId}`, 'true')
      knowledge.value.likeCount = (knowledge.value.likeCount || 0) + 1
      ElMessage.success('点赞成功')
    }
  } catch (e) {
    console.error(e)
  } finally {
    liking.value = false
  }
}

async function toggleCollect() {
  collecting.value = true
  try {
    if (isCollected.value) {
      await collectionAPI.remove({ knowledgeId })
      isCollected.value = false
      ElMessage.success('已取消收藏')
    } else {
      await collectionAPI.add({ type: 'knowledge', targetId: knowledgeId })
      isCollected.value = true
      ElMessage.success('收藏成功')
    }
  } catch (e) {
    console.error(e)
  } finally {
    collecting.value = false
  }
}

function shareArticle() {
  const shareData = {
    title: knowledge.value.title,
    text: knowledge.value.summary,
    url: window.location.href
  }
  
  if (navigator.share) {
    navigator.share(shareData).catch(() => {})
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    }).catch(() => {
      ElMessage.info(`请手动复制链接: ${window.location.href}`)
    })
  }
}

function goRelated(id) {
  router.push(`/knowledge/${id}`)
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadDetail()
  checkLiked()
  checkCollected()
  loadGraph()
  loadRelated()
  
  window.addEventListener('resize', () => {
    graphChart?.resize()
  })
})
</script>

<style scoped>
.knowledge-detail-page {
  padding-bottom: 40px;
}

.article-card {
  margin-bottom: 24px;
}

.article-header {
  margin-bottom: 24px;
}

.article-tags {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2f3d;
  margin: 0 0 20px;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  flex-wrap: wrap;
  gap: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-info > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2f3d;
}

.publish-date {
  font-size: 13px;
  color: #909399;
}

.article-stats {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}

.article-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-cover {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
}

.article-cover img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
}

.article-content {
  font-size: 16px;
  line-height: 1.9;
  color: #303133;
}

.article-content :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  margin: 32px 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
}

.article-content :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 12px;
}

.article-content :deep(p) {
  margin: 0 0 16px;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin: 0 0 16px 24px;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 12px 20px;
  background: #f0f9ff;
  margin: 16px 0;
  border-radius: 0 8px 8px 0;
  color: #606266;
}

.article-actions {
  display: flex;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #f0f2f5;
  margin-top: 32px;
  flex-wrap: wrap;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 20px;
}

.related-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.related-card:hover {
  background: #f0f9ff;
}

.related-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2f3d;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.related-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.related-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.graph-container {
  width: 100%;
  height: 350px;
  background: #fafafa;
  border-radius: 8px;
}

.graph-legend {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 12px;
}

.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.brand { background: #409eff; }
.legend-dot.concept { background: #67c23a; }
.legend-dot.person { background: #e6a23c; }
.legend-dot.event { background: #f56c6c; }

.toc-list {
  max-height: 400px;
  overflow-y: auto;
}

.toc-item {
  padding: 10px 12px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.toc-item:hover {
  background: #f0f9ff;
  color: #409eff;
}

.toc-item.toc-level-2 {
  font-weight: 500;
  padding-left: 12px;
}

.toc-item.toc-level-3 {
  padding-left: 28px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .article-title {
    font-size: 22px;
  }
  
  .article-content {
    font-size: 15px;
  }
  
  .article-actions {
    flex-direction: column;
  }
  
  .article-actions .el-button {
    width: 100%;
  }
}
</style>
