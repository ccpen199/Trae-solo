<template>
  <div class="scenario-list-page">
    <div class="page-header">
      <div class="container">
        <h2>一件事服务</h2>
        <p>集成多项关联事项，一次提交，并联办理</p>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="filter-section card p-24 mb-24">
        <el-form :inline="true" :model="filterForm" @submit.prevent>
          <el-form-item label="搜索">
            <el-input
              v-model="filterForm.keyword"
              placeholder="输入场景名称搜索"
              clearable
              style="width: 280px"
              @keyup.enter="fetchList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="主题分类">
            <el-select v-model="filterForm.category" placeholder="全部主题" clearable style="width: 160px">
              <el-option label="企业开办" value="企业开办" />
              <el-option label="证件办理" value="证件办理" />
              <el-option label="社会保障" value="社会保障" />
              <el-option label="住房服务" value="住房服务" />
              <el-option label="医疗卫生" value="医疗卫生" />
              <el-option label="教育服务" value="教育服务" />
              <el-option label="交通出行" value="交通出行" />
              <el-option label="就业创业" value="就业创业" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务对象">
            <el-select v-model="filterForm.target" placeholder="全部对象" clearable style="width: 160px">
              <el-option label="自然人" value="自然人" />
              <el-option label="企业法人" value="企业法人" />
              <el-option label="其他组织" value="其他组织" />
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
      
      <div class="scenario-grid">
        <div v-for="item in list" :key="item.id" class="scenario-card card" @click="goToDetail(item.id)">
          <div class="card-header" :style="{ background: getCardBgColor(item.id) }">
            <div class="scenario-icon">{{ item.icon || '📋' }}</div>
            <div v-if="item.is_hot" class="hot-badge">
              <el-icon><StarFilled /></el-icon>热门
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title">{{ item.scenario_name }}</h3>
            <p class="card-desc">{{ item.description }}</p>
            <div class="card-tags mb-16">
              <el-tag size="small" type="warning">{{ item.category || '综合服务' }}</el-tag>
              <el-tag size="small" type="info">包含 {{ item.item_count || 3 }} 个事项</el-tag>
              <el-tag size="small" type="success">最多跑一次</el-tag>
            </div>
            <div class="card-stats">
              <div class="stat">
                <span class="stat-num">{{ item.apply_count || 0 }}</span>
                <span class="stat-label">已办理</span>
              </div>
              <div class="stat">
                <span class="stat-num">{{ item.commitment_time || '5' }}</span>
                <span class="stat-label">工作日</span>
              </div>
              <div class="stat">
                <span class="stat-num">{{ item.satisfaction || '98%' }}</span>
                <span class="stat-label">满意度</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <el-button type="primary" @click.stop="goToDetail(item.id)">立即办理</el-button>
          </div>
        </div>
        
        <el-empty v-if="list.length === 0 && !loading" description="暂无场景服务" />
      </div>
      
      <div class="pagination-wrapper mt-24 flex justify-center">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48]"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { scenarioApi } from '@/api'
import { ElMessage } from 'element-plus'
import { StarFilled } from '@element-plus/icons-vue'

const router = useRouter()

const list = ref([])
const loading = ref(false)

const filterForm = reactive({
  keyword: '',
  category: '',
  target: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

const getCardBgColor = (id) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  ]
  return colors[id % colors.length]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await scenarioApi.list({
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      list.value = res.data?.list || res.data || []
      pagination.total = res.data?.total || res.data?.length || 0
    }
  } catch (e) {
    ElMessage.error('加载场景服务列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.category = ''
  filterForm.target = ''
  pagination.page = 1
  fetchList()
}

const goToDetail = (id) => {
  router.push(`/scenarios/${id}`)
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.scenario-list-page {
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

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.scenario-card {
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .card-header {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    .scenario-icon {
      font-size: 48px;
    }
    
    .hot-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      backdrop-filter: blur(10px);
    }
  }
  
  .card-body {
    padding: 20px;
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
      color: #303133;
    }
    
    .card-desc {
      font-size: 13px;
      color: #909399;
      margin: 0 0 16px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-stats {
      display: flex;
      justify-content: space-around;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
      
      .stat {
        text-align: center;
        
        .stat-num {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #1e88e5;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
  
  .card-footer {
    padding: 12px 20px;
    background: #f5f7fa;
    text-align: center;
  }
}

.pagination-wrapper {
  padding-top: 16px;
}
</style>
