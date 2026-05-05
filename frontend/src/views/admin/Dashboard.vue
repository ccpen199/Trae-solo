<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalArticles || 0 }}</div>
              <div class="stat-label">帖子总数</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
              <el-icon :size="32"><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalViews || 0 }}</div>
              <div class="stat-label">总访问量</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
              <el-icon :size="32"><View /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ categories.length }}</div>
              <div class="stat-label">分类数量</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
              <el-icon :size="32"><Collection /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ recentArticles.length }}</div>
              <div class="stat-label">最近帖子</div>
            </div>
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>最近帖子</span>
              <el-button type="primary" link @click="$router.push('/admin/articles')">
                查看全部
              </el-button>
            </div>
          </template>
          
          <el-table :data="recentArticles" v-loading="loading" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="authorNickname" label="作者" width="100" />
            <el-table-column prop="categoryName" label="分类" width="100" />
            <el-table-column prop="viewCount" label="浏览" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.isLocked" type="warning" size="small">已锁定</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="发布时间" width="160">
              <template #default="scope">
                {{ formatTime(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-if="recentArticles.length === 0" description="暂无帖子" />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="list-card">
          <template #header>
            <span>分类列表</span>
          </template>
          
          <el-table :data="categories" v-loading="loading" stripe>
            <el-table-column prop="categoryName" label="分类名称" />
            <el-table-column label="子分类数量" width="100" align="center">
              <template #default="scope">
                <el-tag type="info" size="small">
                  {{ scope.row.subCategories?.length || 0 }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { getStatistics, getRecentArticles } from '@/api/article'
import { getPublicCategories } from '@/api/category'

const loading = ref(false)
const statistics = ref({})
const recentArticles = ref([])
const categories = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    const [statsRes, articlesRes, categoriesRes] = await Promise.all([
      getStatistics(),
      getRecentArticles(10),
      getPublicCategories()
    ])
    statistics.value = statsRes.data
    recentArticles.value = articlesRes.data
    categories.value = categoriesRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.list-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
