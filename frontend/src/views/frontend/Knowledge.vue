<template>
  <div class="knowledge-page">
    <div class="container">
      <div class="page-header">
        <h1>知识专题</h1>
        <p>深度解读品牌知识，洞察行业发展趋势</p>
      </div>

      <div class="filter-bar" v-loading="categoriesLoading">
        <div class="filter-item">
          <span class="filter-label">分类：</span>
          <div class="tag-cloud">
            <span
              :class="['tag-item', { active: !selectedCategory }]"
              @click="selectCategory('')"
            >全部</span>
            <span
              v-for="cat in categories"
              :key="cat"
              :class="['tag-item', { active: selectedCategory === cat }]"
              @click="selectCategory(cat)"
            >{{ cat }}</span>
          </div>
        </div>
      </div>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索知识文章..."
          clearable
          class="search-input"
          @keyup.enter="loadKnowledge"
          @clear="loadKnowledge"
        >
          <template #prepend>
            <el-button @click="loadKnowledge">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <div class="results-bar">
        <span class="results-count">共 {{ total }} 篇文章</span>
        <el-select v-model="sortBy" @change="loadKnowledge">
          <el-option label="最新发布" value="createdAt" />
          <el-option label="最多浏览" value="viewCount" />
          <el-option label="最多点赞" value="likeCount" />
        </el-select>
      </div>

      <el-row :gutter="20" v-loading="loading">
        <el-col :xs="12" :sm="8" :md="6" v-for="item in knowledgeList" :key="item.id">
          <div class="knowledge-card card" @click="goDetail(item.id)">
            <div class="card-cover" v-if="item.coverImage">
              <img :src="item.coverImage" :alt="item.title" />
            </div>
            <div class="card-content">
              <div class="card-tags">
                <el-tag size="small" type="primary">{{ item.category }}</el-tag>
                <el-tag size="small" v-if="item.isFeatured" type="warning">精选</el-tag>
              </div>
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-summary">{{ item.summary || item.content?.replace(/<[^>]*>/g, '').substring(0, 80) }}...</p>
              <div class="card-footer">
                <div class="author-info">
                  <el-avatar :size="24">
                    {{ item.author?.charAt(0) || 'A' }}
                  </el-avatar>
                  <span class="author-name">{{ item.author || '品牌智库' }}</span>
                </div>
                <div class="card-meta">
                  <span><el-icon><View /></el-icon>{{ item.viewCount || 0 }}</span>
                  <span><el-icon><Star /></el-icon>{{ item.likeCount || 0 }}</span>
                </div>
              </div>
              <div class="card-date">{{ formatDate(item.createdAt) }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="empty-state" v-if="!loading && knowledgeList.length === 0">
        <el-empty description="暂无相关知识文章" />
      </div>

      <el-pagination
        v-if="total > pageSize"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, View, Star } from '@element-plus/icons-vue'
import { knowledgeAPI } from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const categoriesLoading = ref(false)

const searchKeyword = ref('')
const sortBy = ref('createdAt')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const selectedCategory = ref('')

const categories = ref([])
const knowledgeList = ref([])

async function loadCategories() {
  categoriesLoading.value = true
  try {
    const res = await knowledgeAPI.getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    categoriesLoading.value = false
  }
}

async function loadKnowledge() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      keyword: searchKeyword.value,
      category: selectedCategory.value
    }
    const res = await knowledgeAPI.getList(params)
    knowledgeList.value = res.data?.data || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function selectCategory(cat) {
  selectedCategory.value = cat
  currentPage.value = 1
  loadKnowledge()
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function goDetail(id) {
  router.push(`/knowledge/${id}`)
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadKnowledge()
}

function handlePageChange(page) {
  currentPage.value = page
  loadKnowledge()
}

onMounted(() => {
  loadCategories()
  loadKnowledge()
})
</script>

<style scoped>
.knowledge-page {
  padding-bottom: 40px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  max-width: 500px;
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

.knowledge-card {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.card-cover {
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.knowledge-card:hover .card-cover img {
  transform: scale(1.05);
}

.card-content {
  padding: 16px;
}

.card-tags {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

.card-summary {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  color: #606266;
}

.card-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.card-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-date {
  font-size: 12px;
  color: #c0c4cc;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 768px) {
  .card-cover {
    height: 120px;
  }
  
  .search-input {
    max-width: 100%;
  }
}
</style>
