<template>
  <div class="policy-list-page">
    <div class="page-header">
      <div class="container">
        <h2>政策解读</h2>
        <p>及时了解最新政策法规，享受政策红利</p>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="content-layout">
        <div class="main-col">
          <div class="filter-section card p-24 mb-24">
            <el-form :inline="true" :model="filterForm" @submit.prevent>
              <el-form-item label="搜索">
                <el-input
                  v-model="filterForm.keyword"
                  placeholder="输入关键词搜索政策"
                  clearable
                  style="width: 320px"
                  @keyup.enter="fetchList"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="政策类型">
                <el-select v-model="filterForm.policy_type" placeholder="全部类型" clearable style="width: 160px">
                  <el-option label="政策文件" value="政策文件" />
                  <el-option label="政策解读" value="政策解读" />
                  <el-option label="通知公告" value="通知公告" />
                  <el-option label="办事指南" value="办事指南" />
                </el-select>
              </el-form-item>
              <el-form-item label="发布部门">
                <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 160px">
                  <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="fetchList">
                  <el-icon><Search /></el-icon>查询
                </el-button>
                <el-button @click="resetFilter">
                  <el-icon><Refresh /></el-icon>重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="policy-list card p-24">
            <div v-for="item in list" :key="item.id" class="policy-item" @click="goToDetail(item.id)">
              <div class="policy-type-tag" :class="{ hot: item.is_hot }">
                {{ item.policy_type || '政策' }}
              </div>
              <div class="policy-content flex-1">
                <h3 class="policy-title">{{ item.title }}</h3>
                <p class="policy-summary">{{ item.summary || item.content }}</p>
                <div class="policy-meta flex items-center gap-20">
                  <span><el-icon><OfficeBuilding /></el-icon> {{ item.publish_department || '四川省人民政府' }}</span>
                  <span><el-icon><Calendar /></el-icon> {{ formatDate(item.publish_time) }}</span>
                  <span><el-icon><View /></el-icon> {{ item.view_count || 0 }} 阅读</span>
                </div>
              </div>
              <div class="policy-action">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            
            <el-empty v-if="list.length === 0 && !loading" description="暂无政策信息" />
          </div>
          
          <div class="pagination-wrapper mt-24 flex justify-center">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="pagination.total"
              layout="total, prev, pager, next, jumper"
              @size-change="fetchList"
              @current-change="fetchList"
            />
          </div>
        </div>
        
        <aside class="side-col">
          <div class="side-card card p-20 mb-24">
            <h3 class="side-title mb-16">
              <el-icon><StarFilled /></el-icon>
              热门政策
            </h3>
            <div class="hot-list">
              <div v-for="(item, index) in hotList" :key="item.id" class="hot-item" @click="goToDetail(item.id)">
                <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
                <span class="hot-title">{{ item.title }}</span>
              </div>
            </div>
          </div>
          
          <div class="side-card card p-20 mb-24">
            <h3 class="side-title mb-16">
              <el-icon><TrendCharts /></el-icon>
              政策分类
            </h3>
            <div class="category-list">
              <div v-for="cat in categories" :key="cat.name" class="category-item" @click="filterByCategory(cat.name)">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }}</span>
              </div>
            </div>
          </div>
          
          <div class="side-card card p-20">
            <h3 class="side-title mb-16">
              <el-icon><Bell /></el-icon>
              政策订阅
            </h3>
            <p class="subscribe-desc mb-16">订阅相关政策，第一时间获取更新通知</p>
            <el-button type="primary" block @click="handleSubscribe">
              <el-icon><BellFilled /></el-icon>立即订阅
            </el-button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { policyApi, departmentApi } from '@/api'
import { ElMessage } from 'element-plus'
import { StarFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

const list = ref([])
const hotList = ref([])
const departments = ref([])
const loading = ref(false)

const categories = ref([
  { name: '政策文件', count: 128 },
  { name: '政策解读', count: 86 },
  { name: '通知公告', count: 64 },
  { name: '办事指南', count: 42 },
  { name: '常见问题', count: 38 }
])

const filterForm = reactive({
  keyword: '',
  policy_type: '',
  department_id: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await policyApi.list({
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      list.value = res.data?.list || res.data || []
      pagination.total = res.data?.total || res.data?.length || 0
    }
  } catch (e) {
    ElMessage.error('加载政策列表失败')
  } finally {
    loading.value = false
  }
}

const fetchHotList = async () => {
  try {
    const res = await policyApi.list({ pageSize: 8, sort: 'hot' })
    if (res.code === 200) {
      hotList.value = res.data?.list || res.data || []
    }
  } catch (e) {
    console.error('加载热门政策失败:', e)
  }
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list({ pageSize: 100 })
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {
    console.error('加载部门列表失败:', e)
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.policy_type = ''
  filterForm.department_id = null
  pagination.page = 1
  fetchList()
}

const filterByCategory = (type) => {
  filterForm.policy_type = type
  pagination.page = 1
  fetchList()
}

const goToDetail = (id) => {
  router.push(`/policies/${id}`)
}

const handleSubscribe = () => {
  ElMessage.success('订阅成功，我们将及时推送最新政策信息')
}

onMounted(() => {
  fetchList()
  fetchHotList()
  fetchDepartments()
})
</script>

<style lang="scss" scoped>
.policy-list-page {
  .page-header {
    h2 {
      font-size: 28px;
      margin: 0 0 8px;
    }
    
    p {
      margin: 0;
      opacity: 0.9;
    }
  }
}

.content-layout {
  display: flex;
  gap: 24px;
  
  .main-col {
    flex: 1;
    min-width: 0;
  }
  
  .side-col {
    width: 320px;
    flex-shrink: 0;
  }
}

.policy-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    .policy-title {
      color: #1e88e5;
    }
  }
  
  .policy-type-tag {
    padding: 4px 10px;
    background: #e3f2fd;
    color: #1e88e5;
    border-radius: 4px;
    font-size: 12px;
    flex-shrink: 0;
    
    &.hot {
      background: #ffebee;
      color: #f44336;
    }
  }
  
  .policy-content {
    .policy-title {
      font-size: 17px;
      font-weight: 600;
      margin: 0 0 8px;
      color: #303133;
      transition: color 0.3s;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .policy-summary {
      font-size: 14px;
      color: #606266;
      margin: 0 0 12px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .policy-meta {
      font-size: 13px;
      color: #909399;
      
      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
  
  .policy-action {
    color: #c0c4cc;
    flex-shrink: 0;
  }
}

.side-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.hot-list {
  .hot-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f2f5;
    cursor: pointer;
    transition: all 0.3s;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      .hot-title {
        color: #1e88e5;
      }
    }
    
    .hot-rank {
      width: 20px;
      height: 20px;
      background: #e4e7ed;
      color: #909399;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      
      &.top {
        background: #1e88e5;
        color: #fff;
      }
    }
    
    .hot-title {
      font-size: 13px;
      color: #606266;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.3s;
    }
  }
}

.category-list {
  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 4px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      background: #f5f7fa;
      
      .cat-name {
        color: #1e88e5;
      }
    }
    
    .cat-name {
      font-size: 14px;
      color: #606266;
      transition: color 0.3s;
    }
    
    .cat-count {
      font-size: 12px;
      color: #909399;
      background: #f0f2f5;
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
}

.subscribe-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.pagination-wrapper {
  padding-top: 16px;
}
</style>
