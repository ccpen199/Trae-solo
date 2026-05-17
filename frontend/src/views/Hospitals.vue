<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const loading = ref(true)
const error = ref('')
const hospitals = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const keyword = ref('')

const fetchHospitals = async () => {
  try {
    loading.value = true
    error.value = ''
    
    let url = `/hospitals?page=${page.value}&limit=${limit.value}`
    if (keyword.value) url += `&keyword=${encodeURIComponent(keyword.value)}`
    
    const res = await request.get(url)
    hospitals.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (err) {
    console.error('Fetch hospitals error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchHospitals()
}

const handlePageChange = (p) => {
  page.value = p
  fetchHospitals()
}

onMounted(() => {
  fetchHospitals()
})
</script>

<template>
  <Layout>
    <div class="hospitals-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">找医院</h1>
          <p class="page-desc">附近优质宠物医院，专业医疗服务保障</p>
        </div>

        <div class="filter-bar">
          <el-input
            v-model="keyword"
            placeholder="搜索医院名称、地址..."
            style="width: 300px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>

        <el-skeleton v-if="loading" :rows="6" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchHospitals">点击重试</el-button>
          </el-empty>
        </div>

        <div v-else-if="hospitals.length === 0" class="empty-state">
          <el-empty description="暂无符合条件的医院" />
        </div>

        <template v-else>
          <div class="hospital-list">
            <div v-for="hospital in hospitals" :key="hospital.id" class="hospital-card">
              <div class="hospital-icon">🏥</div>
              <div class="hospital-content">
                <h3 class="hospital-name">{{ hospital.name }}</h3>
                <p class="hospital-address">
                  <el-icon><Location /></el-icon>
                  {{ hospital.address }}
                </p>
                <p class="hospital-hours">
                  <el-icon><Clock /></el-icon>
                  营业时间：{{ hospital.business_hours || '暂无' }}
                </p>
                <p class="hospital-phone">
                  <el-icon><Phone /></el-icon>
                  {{ hospital.phone || '暂无电话' }}
                </p>
                <p class="hospital-desc">{{ hospital.description }}</p>
              </div>
              <div class="hospital-rating">
                <el-rate v-model="hospital.rating" disabled :show-score="false" />
                <span class="rating-score">{{ hospital.rating || 0 }} 分</span>
              </div>
            </div>
          </div>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="page"
              :page-size="limit"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.hospitals-page {
  min-height: 80vh;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.page-desc {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.hospital-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.hospital-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.hospital-icon {
  font-size: 48px;
  line-height: 1;
}

.hospital-content {
  flex: 1;
}

.hospital-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #303133;
}

.hospital-address,
.hospital-hours,
.hospital-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  margin: 0 0 8px;
}

.hospital-desc {
  color: #909399;
  font-size: 13px;
  margin: 12px 0 0;
  line-height: 1.5;
}

.hospital-rating {
  text-align: center;
  min-width: 100px;
}

.rating-score {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #f7ba2a;
  margin-top: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.error-state,
.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
