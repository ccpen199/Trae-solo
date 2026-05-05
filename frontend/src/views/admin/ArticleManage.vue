<template>
  <div class="article-manage">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="搜索标题/内容" 
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select 
            v-model="filterForm.categoryId" 
            placeholder="全部分类" 
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.categoryName" 
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="loadArticles">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card" style="margin-top: 20px;">
      <el-table 
        :data="articles" 
        v-loading="loading" 
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="authorNickname" label="作者" width="100" />
        <el-table-column prop="categoryName" label="大类" width="100" />
        <el-table-column prop="subCategoryName" label="小类" width="100" />
        <el-table-column prop="viewCount" label="浏览" width="80" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.isTop" type="danger" size="small" effect="light">置顶</el-tag>
            <el-tag v-if="scope.row.isLocked" type="warning" size="small" effect="light">锁定</el-tag>
            <el-tag v-else type="success" size="small" effect="light">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              size="small"
              @click="viewArticle(scope.row)"
            >
              查看
            </el-button>
            <el-button 
              type="warning" 
              link 
              size="small"
              @click="toggleTop(scope.row)"
            >
              {{ scope.row.isTop ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button 
              :type="scope.row.isLocked ? 'success' : 'warning'" 
              link 
              size="small"
              @click="toggleLock(scope.row)"
            >
              {{ scope.row.isLocked ? '解锁' : '锁定' }}
            </el-button>
            <el-button 
              type="danger" 
              link 
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadArticles"
          @current-change="loadArticles"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getAdminArticles, lockArticle, topArticle, deleteAdminArticle } from '@/api/article'
import { getPublicCategories } from '@/api/category'

const router = useRouter()

const loading = ref(false)
const articles = ref([])
const categories = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filterForm = reactive({
  keyword: '',
  categoryId: null
})

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadCategories = async () => {
  try {
    const res = await getPublicCategories()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      current: currentPage.value,
      size: pageSize.value
    }
    if (filterForm.keyword) params.keyword = filterForm.keyword
    if (filterForm.categoryId) params.categoryId = filterForm.categoryId
    
    const res = await getAdminArticles(params)
    articles.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.categoryId = null
  currentPage.value = 1
  loadArticles()
}

const viewArticle = (row) => {
  router.push(`/articles/${row.id}`)
}

const toggleTop = async (row) => {
  try {
    await topArticle(row.id, !row.isTop)
    row.isTop = !row.isTop
    ElMessage.success(row.isTop ? '置顶成功' : '取消置顶成功')
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const toggleLock = async (row) => {
  try {
    await lockArticle(row.id, !row.isLocked)
    row.isLocked = !row.isLocked
    ElMessage.success(row.isLocked ? '锁定成功' : '解锁成功')
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇帖子吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteAdminArticle(row.id)
    ElMessage.success('删除成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadCategories()
  loadArticles()
})
</script>

<style scoped>
.article-manage {
  padding: 0;
}

.filter-card, .table-card {
  border-radius: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
