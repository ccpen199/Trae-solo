<template>
  <div class="collections-page">
    <div class="container">
      <div class="page-header">
        <h1>我的收藏</h1>
        <p>管理您收藏的品牌、知识和榜单</p>
      </div>

      <el-tabs v-model="activeTab" class="collections-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="品牌收藏" name="brand">
          <div class="card" v-loading="loading">
            <div class="results-bar">
              <span class="results-count">共 {{ brandTotal }} 个收藏品牌</span>
              <el-button type="danger" text @click="clearAll('brand')" v-if="brands.length > 0">
                <el-icon><Delete /></el-icon>清空全部
              </el-button>
            </div>
            <el-row :gutter="20" v-if="brands.length > 0">
              <el-col :xs="12" :sm="8" :md="6" v-for="item in brands" :key="item.targetId || item.brand?.id">
                <div class="collection-card">
                  <div class="brand-item" @click="goBrandDetail(item.targetId || item.brand?.id)">
                    <img :src="item.brand?.logo" :alt="item.brand?.name" class="brand-logo" @error="handleLogoError" />
                    <div class="brand-info">
                      <h4 class="brand-name">{{ item.brand?.name }}</h4>
                      <p class="brand-desc">{{ item.brand?.industry }} · {{ item.brand?.country }}</p>
                      <div class="brand-stats">
                        <span><el-icon><StarFilled /></el-icon>{{ item.brand?.score?.toFixed(1) || '0.0' }}</span>
                        <span :class="['badge-level', `badge-level-${item.brand?.level}`]">{{ item.brand?.level }}级</span>
                      </div>
                    </div>
                  </div>
                  <div class="collection-actions">
                    <span class="collect-time">{{ formatDate(item.createdAt) }}</span>
                    <el-button type="danger" text size="small" @click="removeItem('brand', item.targetId || item.brand?.id)">
                      <el-icon><Close /></el-icon>取消收藏
                    </el-button>
                  </div>
                </div>
              </el-col>
            </el-row>
            <div class="empty-state" v-else>
              <el-empty description="暂无收藏的品牌">
                <el-button type="primary" @click="goBrands">去发现品牌</el-button>
              </el-empty>
            </div>
            <el-pagination
              v-if="brandTotal > pageSize"
              class="pagination"
              v-model:current-page="brandPage"
              v-model:page-size="pageSize"
              :total="brandTotal"
              :page-sizes="[12, 24, 48]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="handleBrandPageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="知识收藏" name="knowledge">
          <div class="card" v-loading="loading">
            <div class="results-bar">
              <span class="results-count">共 {{ knowledgeTotal }} 篇收藏文章</span>
              <el-button type="danger" text @click="clearAll('knowledge')" v-if="knowledgeList.length > 0">
                <el-icon><Delete /></el-icon>清空全部
              </el-button>
            </div>
            <el-row :gutter="20" v-if="knowledgeList.length > 0">
              <el-col :xs="12" :sm="8" :md="6" v-for="item in knowledgeList" :key="item.targetId || item.knowledge?.id">
                <div class="collection-card">
                  <div class="knowledge-item" @click="goKnowledgeDetail(item.targetId || item.knowledge?.id)">
                    <h4 class="knowledge-title">{{ item.knowledge?.title }}</h4>
                    <div class="knowledge-tags">
                      <el-tag size="small" type="primary">{{ item.knowledge?.category }}</el-tag>
                    </div>
                    <p class="knowledge-summary">{{ item.knowledge?.summary?.substring(0, 60) || '点击查看详情' }}...</p>
                    <div class="knowledge-meta">
                      <span><el-icon><View /></el-icon>{{ item.knowledge?.viewCount || 0 }}</span>
                      <span><el-icon><Star /></el-icon>{{ item.knowledge?.likeCount || 0 }}</span>
                    </div>
                  </div>
                  <div class="collection-actions">
                    <span class="collect-time">{{ formatDate(item.createdAt) }}</span>
                    <el-button type="danger" text size="small" @click="removeItem('knowledge', item.targetId || item.knowledge?.id)">
                      <el-icon><Close /></el-icon>取消收藏
                    </el-button>
                  </div>
                </div>
              </el-col>
            </el-row>
            <div class="empty-state" v-else>
              <el-empty description="暂无收藏的知识">
                <el-button type="primary" @click="goKnowledge">去浏览知识</el-button>
              </el-empty>
            </div>
            <el-pagination
              v-if="knowledgeTotal > pageSize"
              class="pagination"
              v-model:current-page="knowledgePage"
              v-model:page-size="pageSize"
              :total="knowledgeTotal"
              :page-sizes="[12, 24, 48]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="handleKnowledgePageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="榜单收藏" name="ranking">
          <div class="card" v-loading="loading">
            <div class="results-bar">
              <span class="results-count">共 {{ rankingTotal }} 个收藏榜单</span>
              <el-button type="danger" text @click="clearAll('ranking')" v-if="rankings.length > 0">
                <el-icon><Delete /></el-icon>清空全部
              </el-button>
            </div>
            <el-row :gutter="20" v-if="rankings.length > 0">
              <el-col :xs="12" :sm="8" :md="6" v-for="item in rankings" :key="item.targetId || item.ranking?.id">
                <div class="collection-card">
                  <div class="ranking-item" @click="goRankingDetail(item.targetId || item.ranking?.id)">
                    <div class="ranking-icon">
                      <el-icon :size="24"><Trophy /></el-icon>
                    </div>
                    <h4 class="ranking-name">{{ item.ranking?.name }}</h4>
                    <p class="ranking-desc">{{ item.ranking?.description || '专业榜单排名' }}</p>
                    <div class="ranking-meta">
                      <span><el-icon><Trophy /></el-icon>{{ item.ranking?.brandCount || 0 }} 品牌</span>
                    </div>
                  </div>
                  <div class="collection-actions">
                    <span class="collect-time">{{ formatDate(item.createdAt) }}</span>
                    <el-button type="danger" text size="small" @click="removeItem('ranking', item.targetId || item.ranking?.id)">
                      <el-icon><Close /></el-icon>取消收藏
                    </el-button>
                  </div>
                </div>
              </el-col>
            </el-row>
            <div class="empty-state" v-else>
              <el-empty description="暂无收藏的榜单">
                <el-button type="primary" @click="goRankings">去查看榜单</el-button>
              </el-empty>
            </div>
            <el-pagination
              v-if="rankingTotal > pageSize"
              class="pagination"
              v-model:current-page="rankingPage"
              v-model:page-size="pageSize"
              :total="rankingTotal"
              :page-sizes="[12, 24, 48]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="handleRankingPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete, Close, StarFilled, Star, View, Trophy
} from '@element-plus/icons-vue'
import { collectionAPI } from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const activeTab = ref('brand')
const pageSize = ref(12)

const brands = ref([])
const knowledgeList = ref([])
const rankings = ref([])

const brandPage = ref(1)
const knowledgePage = ref(1)
const rankingPage = ref(1)

const brandTotal = ref(0)
const knowledgeTotal = ref(0)
const rankingTotal = ref(0)

async function loadCollections(type, page) {
  loading.value = true
  try {
    const params = {
      type,
      page,
      pageSize: pageSize.value
    }
    const res = await collectionAPI.getList(params)
    const data = res.data?.data || []
    const total = res.data?.total || 0
    
    if (type === 'brand') {
      brands.value = data
      brandTotal.value = total
    } else if (type === 'knowledge') {
      knowledgeList.value = data
      knowledgeTotal.value = total
    } else if (type === 'ranking') {
      rankings.value = data
      rankingTotal.value = total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleTabChange(tab) {
  if (tab === 'brand' && brands.value.length === 0) {
    loadCollections('brand', brandPage.value)
  } else if (tab === 'knowledge' && knowledgeList.value.length === 0) {
    loadCollections('knowledge', knowledgePage.value)
  } else if (tab === 'ranking' && rankings.value.length === 0) {
    loadCollections('ranking', rankingPage.value)
  }
}

async function removeItem(type, id) {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await collectionAPI.remove({ type, targetId: id })
    ElMessage.success('已取消收藏')
    
    if (type === 'brand') {
      loadCollections('brand', brandPage.value)
    } else if (type === 'knowledge') {
      loadCollections('knowledge', knowledgePage.value)
    } else if (type === 'ranking') {
      loadCollections('ranking', rankingPage.value)
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function clearAll(type) {
  try {
    await ElMessageBox.confirm('确定要清空所有收藏吗？此操作不可恢复。', '提示', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    const list = type === 'brand' ? brands.value : type === 'knowledge' ? knowledgeList.value : rankings.value
    for (const item of list) {
      const id = item.targetId || (item.brand?.id || item.knowledge?.id || item.ranking?.id)
      await collectionAPI.remove({ type, targetId: id })
    }
    
    ElMessage.success('已清空收藏')
    
    if (type === 'brand') {
      brands.value = []
      brandTotal.value = 0
    } else if (type === 'knowledge') {
      knowledgeList.value = []
      knowledgeTotal.value = 0
    } else if (type === 'ranking') {
      rankings.value = []
      rankingTotal.value = 0
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

function goBrandDetail(id) {
  router.push(`/brands/${id}`)
}

function goKnowledgeDetail(id) {
  router.push(`/knowledge/${id}`)
}

function goRankingDetail(id) {
  router.push(`/rankings/${id}`)
}

function goBrands() {
  router.push('/brands')
}

function goKnowledge() {
  router.push('/knowledge')
}

function goRankings() {
  router.push('/rankings')
}

function handleSizeChange(size) {
  pageSize.value = size
  if (activeTab.value === 'brand') {
    brandPage.value = 1
    loadCollections('brand', 1)
  } else if (activeTab.value === 'knowledge') {
    knowledgePage.value = 1
    loadCollections('knowledge', 1)
  } else {
    rankingPage.value = 1
    loadCollections('ranking', 1)
  }
}

function handleBrandPageChange(page) {
  brandPage.value = page
  loadCollections('brand', page)
}

function handleKnowledgePageChange(page) {
  knowledgePage.value = page
  loadCollections('knowledge', page)
}

function handleRankingPageChange(page) {
  rankingPage.value = page
  loadCollections('ranking', page)
}

onMounted(() => {
  loadCollections('brand', 1)
})
</script>

<style scoped>
.collections-page {
  padding-bottom: 40px;
}

.collections-tabs {
  margin-top: 24px;
}

.results-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-count {
  color: #606266;
  font-size: 14px;
}

.collection-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 20px);
}

.collection-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #dcdfe6;
}

.brand-item,
.knowledge-item,
.ranking-item {
  cursor: pointer;
  flex: 1;
}

.brand-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.brand-item .brand-logo {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px;
}

.brand-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.knowledge-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.knowledge-tags {
  margin-bottom: 8px;
}

.knowledge-summary {
  font-size: 13px;
  color: #606266;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.knowledge-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.knowledge-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ranking-item {
  margin-bottom: 12px;
}

.ranking-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 12px;
}

.ranking-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 6px;
}

.ranking-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px;
  line-height: 1.4;
}

.ranking-meta {
  font-size: 12px;
  color: #606266;
  margin-bottom: 12px;
}

.ranking-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collection-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.collect-time {
  font-size: 12px;
  color: #c0c4cc;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.empty-state {
  padding: 40px 0;
}

@media (max-width: 768px) {
  .brand-item {
    flex-direction: column;
  }
  
  .brand-item .brand-logo {
    width: 48px;
    height: 48px;
  }
}
</style>
