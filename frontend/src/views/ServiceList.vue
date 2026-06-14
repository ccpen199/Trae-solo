<template>
  <div class="service-list-page">
    <div class="page-header">
      <div class="container">
        <h2>服务事项</h2>
        <p>为您提供便捷的政务服务事项查询与办理</p>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="filter-section card p-24 mb-24">
        <el-form :inline="true" :model="filterForm" @submit.prevent>
          <el-form-item label="搜索">
            <el-input
              v-model="filterForm.keyword"
              placeholder="输入事项名称搜索"
              clearable
              style="width: 280px"
              @keyup.enter="fetchList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 180px">
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务类型">
            <el-select v-model="filterForm.service_type" placeholder="全部类型" clearable style="width: 160px">
              <el-option label="行政许可" value="行政许可" />
              <el-option label="公共服务" value="公共服务" />
              <el-option label="行政确认" value="行政确认" />
              <el-option label="行政给付" value="行政给付" />
              <el-option label="其他权力" value="其他权力" />
            </el-select>
          </el-form-item>
          <el-form-item label="办理层级">
            <el-select v-model="filterForm.handle_level" placeholder="全部层级" clearable style="width: 160px">
              <el-option label="省级" value="省级" />
              <el-option label="市级" value="市级" />
              <el-option label="县级" value="县级" />
              <el-option label="乡镇级" value="乡镇级" />
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
      
      <div class="list-section card p-24">
        <div class="list-header mb-16 flex justify-between items-center">
          <div class="flex items-center gap-24">
            <span class="text-gray">共 <span class="text-primary font-bold">{{ pagination.total }}</span> 条记录</span>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="list">
                <el-icon><List /></el-icon>列表
              </el-radio-button>
              <el-radio-button value="grid">
                <el-icon><Grid /></el-icon>卡片
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="flex items-center gap-12">
            <span class="text-gray text-sm">排序：</span>
            <el-radio-group v-model="filterForm.sort" size="small" @change="fetchList">
              <el-radio-button value="default">默认</el-radio-button>
              <el-radio-button value="hot">热门</el-radio-button>
              <el-radio-button value="new">最新</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        
        <div v-if="viewMode === 'list'" class="service-list-view">
          <div v-for="item in list" :key="item.id" class="service-item" @click="goToDetail(item.id)">
            <div class="service-icon">
              <el-icon size="28" :color="getIconColor(item.id)"><Service /></el-icon>
            </div>
            <div class="service-info">
              <div class="service-title-row">
                <h4 class="service-title">{{ item.item_name }}</h4>
                <el-tag size="small" type="primary">{{ item.service_type }}</el-tag>
                <el-tag v-if="item.is_online" size="small" type="success">可在线办理</el-tag>
                <el-tag v-if="item.is_hot" size="small" type="danger">热门</el-tag>
              </div>
              <div class="service-meta">
                <span><el-icon><OfficeBuilding /></el-icon> {{ item.department_name || '暂无' }}</span>
                <span><el-icon><Place /></el-icon> {{ item.handle_place || '暂无' }}</span>
                <span><el-icon><Clock /></el-icon> 承诺时限：{{ item.commitment_time || '暂无' }}个工作日</span>
              </div>
            </div>
            <div class="service-action">
              <el-button type="primary" @click.stop="goToDetail(item.id)">查看详情</el-button>
              <el-button v-if="item.is_online" type="success" @click.stop="goToApply(item.id)">
                <el-icon><EditPen /></el-icon>在线办理
              </el-button>
            </div>
          </div>
          
          <el-empty v-if="list.length === 0" description="暂无服务事项" />
        </div>
        
        <div v-else class="service-grid-view">
          <div v-for="item in list" :key="item.id" class="service-card" @click="goToDetail(item.id)">
            <div class="card-header">
              <div class="service-icon-lg">
                <el-icon size="36" :color="getIconColor(item.id)"><Service /></el-icon>
              </div>
              <el-tag v-if="item.is_hot" size="small" type="danger" class="hot-tag">热门</el-tag>
            </div>
            <div class="card-body">
              <h4 class="card-title">{{ item.item_name }}</h4>
              <p class="card-dept"><el-icon><OfficeBuilding /></el-icon> {{ item.department_name || '暂无' }}</p>
              <div class="card-tags">
                <el-tag size="small" type="primary">{{ item.service_type }}</el-tag>
                <el-tag v-if="item.is_online" size="small" type="success">在线办理</el-tag>
              </div>
            </div>
            <div class="card-footer">
              <span class="time-info"><el-icon><Clock /></el-icon> {{ item.commitment_time || '暂无' }}工作日</span>
              <el-button type="primary" size="small" @click.stop="goToDetail(item.id)">查看</el-button>
            </div>
          </div>
          
          <el-empty v-if="list.length === 0" description="暂无服务事项" />
        </div>
        
        <div class="pagination-wrapper mt-24 flex justify-center">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { serviceItemApi, departmentApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const list = ref([])
const departments = ref([])
const viewMode = ref('list')

const filterForm = reactive({
  keyword: route.query.keyword || '',
  department_id: null,
  service_type: '',
  handle_level: '',
  sort: 'default'
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getIconColor = (id) => {
  const colors = ['#1e88e5', '#43a047', '#fb8c00', '#e53935', '#8e24aa', '#00897b', '#3949ab']
  return colors[id % colors.length]
}

const fetchList = async () => {
  try {
    const res = await serviceItemApi.list({
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      list.value = res.data?.list || res.data || []
      pagination.total = res.data?.total || res.data?.length || 0
    }
  } catch (e) {
    ElMessage.error('加载服务事项列表失败')
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
  filterForm.department_id = null
  filterForm.service_type = ''
  filterForm.handle_level = ''
  filterForm.sort = 'default'
  pagination.page = 1
  fetchList()
}

const goToDetail = (id) => {
  router.push(`/services/${id}`)
}

const goToApply = (id) => {
  router.push(`/apply/${id}`)
}

onMounted(() => {
  fetchList()
  fetchDepartments()
})
</script>

<style lang="scss" scoped>
.service-list-page {
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

.service-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f5f7fa;
  }
  
  .service-icon {
    width: 56px;
    height: 56px;
    background: #f5f7fa;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .service-info {
    flex: 1;
    min-width: 0;
    
    .service-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      
      .service-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: #303133;
      }
    }
    
    .service-meta {
      display: flex;
      gap: 24px;
      color: #909399;
      font-size: 13px;
      
      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
  
  .service-action {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
}

.service-grid-view {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  .service-card {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
    
    .card-header {
      position: relative;
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
      display: flex;
      justify-content: center;
      
      .service-icon-lg {
        width: 64px;
        height: 64px;
        background: #fff;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .hot-tag {
        position: absolute;
        top: 12px;
        right: 12px;
      }
    }
    
    .card-body {
      padding: 16px;
      
      .card-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 8px;
        color: #303133;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .card-dept {
        font-size: 13px;
        color: #909399;
        margin: 0 0 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .card-tags {
        display: flex;
        gap: 6px;
      }
    }
    
    .card-footer {
      padding: 12px 16px;
      border-top: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .time-info {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
