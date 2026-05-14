<template>
  <div class="bar-list-page">
    <div class="container">
      <div class="page-header">
        <h1>产品吧</h1>
        <router-link to="/bars/create" v-if="userStore.isLoggedIn">
          <el-button type="primary">创建产品吧</el-button>
        </router-link>
      </div>
      
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索产品吧"
          style="width: 300px;"
          clearable
          @keyup.enter="loadBars"
        >
          <template #append>
            <el-button :icon="Search" @click="loadBars" />
          </template>
        </el-input>
        
        <el-select v-model="sort" placeholder="排序" @change="loadBars" style="width: 150px;">
          <el-option label="最新创建" value="newest" />
          <el-option label="最热门" value="hot" />
          <el-option label="成员最多" value="members" />
        </el-select>
        
        <el-select v-model="category" placeholder="分类" clearable @change="loadBars" style="width: 150px;">
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>
      </div>
      
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="4" animated />
      </div>
      
      <div v-else-if="bars.length === 0" class="page-empty">
        <el-empty description="暂无产品吧">
          <router-link to="/bars/create">
            <el-button type="primary">创建第一个产品吧</el-button>
          </router-link>
        </el-empty>
      </div>
      
      <div v-else class="bar-grid">
        <div
          v-for="bar in bars"
          :key="bar.id"
          class="bar-card"
          @click="goToBar(bar.id)"
        >
          <div class="bar-cover">
            <img :src="bar.cover_image || bar.product_cover || defaultCover" :alt="bar.name" />
            <div v-if="bar.product_name" class="bar-product-tag">
              {{ bar.product_name }}
            </div>
          </div>
          <div class="bar-info">
            <h3 class="bar-name">{{ bar.name }}</h3>
            <p class="bar-desc">{{ bar.description || '暂无描述' }}</p>
            <div class="bar-meta">
              <span class="owner">
                <el-avatar :size="20" :src="bar.owner_avatar">
                  {{ (bar.owner_nickname || 'U').charAt(0) }}
                </el-avatar>
                {{ bar.owner_nickname }}
              </span>
              <div class="stats">
                <span><el-icon><User /></el-icon> {{ bar.member_count || 0 }}</span>
                <span><el-icon><Document /></el-icon> {{ bar.post_count || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="loadBars"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, User, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const bars = ref([])
const categories = ref([])
const keyword = ref('')
const sort = ref('newest')
const category = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

const defaultCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect fill="%23f0f2f5" width="200" height="160"/%3E%3Ctext fill="%23909399" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E产品吧%3C/text%3E%3C/svg%3E'

async function loadCategories() {
  try {
    const res = await api.get('/product-bars/categories')
    if (res.success) {
      categories.value = res.data || []
    }
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

async function loadBars() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: sort.value
    }
    
    if (keyword.value) {
      params.keyword = keyword.value
    }
    if (category.value) {
      params.category = category.value
    }
    
    const res = await api.get('/product-bars', { params })
    if (res.success) {
      bars.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载产品吧失败:', e)
  } finally {
    loading.value = false
  }
}

function goToBar(id) {
  router.push(`/bars/${id}`)
}

onMounted(() => {
  const query = route.query
  if (query.sort) sort.value = query.sort
  if (query.category) category.value = query.category
  if (query.keyword) keyword.value = query.keyword
  
  loadCategories()
  loadBars()
})
</script>

<style scoped>
.bar-list-page {
  padding: 30px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.bar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.bar-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
}

.bar-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.bar-cover {
  height: 160px;
  overflow: hidden;
  position: relative;
  background: #f5f7fa;
}

.bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-product-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-info {
  padding: 16px;
}

.bar-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.owner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
