<template>
  <div class="resources-page">
    <div class="container">
      <div class="page-header">
        <h1>资源中心</h1>
        <p class="subtitle">发现和分享优质资源</p>
      </div>

      <div class="filter-bar">
        <el-select
          v-model="selectedCategory"
          placeholder="全部分类"
          clearable
          @change="handleFilter"
          style="width: 150px"
        >
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
        
        <el-select
          v-model="sortBy"
          @change="handleFilter"
          style="width: 140px"
        >
          <el-option label="最新发布" value="newest" />
          <el-option label="最多浏览" value="hot" />
          <el-option label="最多收藏" value="most_liked" />
          <el-option label="最多评论" value="most_commented" />
        </el-select>
        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索资源..."
          prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
          style="width: 280px"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>

        <el-button
          v-if="userStore.isLoggedIn"
          type="primary"
          @click="showCreateDialog = true"
        >
          <el-icon><Plus /></el-icon>
          发布资源
        </el-button>
      </div>

      <div class="resources-grid" v-loading="loading">
        <div 
          v-for="resource in resources" 
          :key="resource.id"
          class="resource-card"
          @click="$router.push(`/resources/${resource.id}`)"
        >
          <div class="resource-cover" v-if="resource.coverImage">
            <img :src="resource.coverImage" alt="cover" />
          </div>
          <div class="resource-cover placeholder" v-else>
            <el-icon size="56"><Document /></el-icon>
          </div>
          <div class="resource-content">
            <h3 class="resource-title">{{ resource.title }}</h3>
            <p class="resource-desc">{{ resource.description || '暂无描述' }}</p>
            <div class="resource-footer">
              <div class="author">
                <el-avatar :size="24">
                  <img v-if="resource.author?.avatar" :src="resource.author.avatar" />
                  <el-icon v-else><User /></el-icon>
                </el-avatar>
                <span>{{ resource.author?.nickname || resource.author?.username }}</span>
              </div>
              <div class="stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  {{ resource.viewCount }}
                </span>
                <span class="stat-item">
                  <el-icon><Star /></el-icon>
                  {{ resource.favoriteCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <el-empty v-if="!loading && resources.length === 0" description="暂无资源" />
      </div>

      <div class="pagination-wrap" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[12, 24, 48]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleFilter"
          @current-change="handleFilter"
        />
      </div>
    </div>

    <el-dialog
      v-model="showCreateDialog"
      title="发布资源"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入资源标题" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select
            v-model="createForm.categoryId"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入资源描述"
          />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入资源内容（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { 
  getResources, 
  getCategories, 
  createResource 
} from '@/api'
import {
  Document,
  User,
  View,
  Star,
  Plus
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const createFormRef = ref(null)
const resources = ref([])
const categories = ref([])
const selectedCategory = ref(null)
const sortBy = ref('newest')
const searchKeyword = ref('')

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0
})

const createForm = reactive({
  title: '',
  categoryId: null,
  description: '',
  content: ''
})

const createRules = {
  title: [
    { required: true, message: '请输入资源标题', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

const fetchResources = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sort: sortBy.value
    }
    
    if (selectedCategory.value) {
      params.categoryId = selectedCategory.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const res = await getResources(params)
    resources.value = res.data?.resources || []
    pagination.total = res.data?.pagination?.total || 0
  } catch (e) {
    console.error('Fetch resources error:', e)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data?.categories || []
  } catch (e) {
    console.error('Fetch categories error:', e)
  }
}

const handleFilter = () => {
  fetchResources()
}

const handleSearch = () => {
  pagination.page = 1
  fetchResources()
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  creating.value = true
  try {
    await createResource(createForm)
    ElMessage.success('发布成功')
    showCreateDialog.value = false
    createForm.title = ''
    createForm.categoryId = null
    createForm.description = ''
    createForm.content = ''
    fetchResources()
  } catch (e) {
    console.error('Create resource error:', e)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  if (route.query.categoryId) {
    selectedCategory.value = route.query.categoryId
  }
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword
  }
  fetchCategories()
  fetchResources()
})
</script>

<style scoped>
.resources-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-header .subtitle {
  color: #666;
  font-size: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.filter-bar .el-button {
  margin-left: auto;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.resource-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.resource-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.resource-cover {
  height: 160px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.resource-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resource-cover.placeholder {
  color: #c0c4cc;
}

.resource-content {
  padding: 16px;
}

.resource-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
