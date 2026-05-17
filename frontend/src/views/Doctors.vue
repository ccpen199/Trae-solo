<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const doctors = ref([])
const departments = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const keyword = ref('')
const selectedDept = ref('')

const fetchDoctors = async () => {
  try {
    loading.value = true
    error.value = ''
    
    let url = `/doctors?page=${page.value}&limit=${limit.value}`
    if (keyword.value) url += `&keyword=${encodeURIComponent(keyword.value)}`
    if (selectedDept.value) url += `&department=${encodeURIComponent(selectedDept.value)}`
    
    const res = await request.get(url)
    doctors.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (err) {
    console.error('Fetch doctors error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await request.get('/departments')
    departments.value = res.data || []
  } catch (err) {
    console.error('Fetch departments error:', err)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchDoctors()
}

const handleDeptChange = (dept) => {
  selectedDept.value = dept
  page.value = 1
  fetchDoctors()
}

const handlePageChange = (p) => {
  page.value = p
  fetchDoctors()
}

onMounted(() => {
  if (route.query.keyword) {
    keyword.value = route.query.keyword
  }
  fetchDepartments()
  fetchDoctors()
})
</script>

<template>
  <Layout>
    <div class="doctors-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">找医生</h1>
          <p class="page-desc">专业宠物医生在线问诊，守护您的爱宠健康</p>
        </div>

        <div class="filter-bar">
          <el-input
            v-model="keyword"
            placeholder="搜索医生姓名、擅长领域..."
            style="width: 300px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>

        <div class="dept-filter">
          <el-tag
            :type="!selectedDept ? 'primary' : 'info'"
            class="dept-tag"
            @click="handleDeptChange('')"
          >
            全部
          </el-tag>
          <el-tag
            v-for="dept in departments"
            :key="dept.id"
            :type="selectedDept === dept.name ? 'primary' : 'info'"
            class="dept-tag"
            @click="handleDeptChange(dept.name)"
          >
            {{ dept.name }}
          </el-tag>
        </div>

        <el-skeleton v-if="loading" :rows="8" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchDoctors">点击重试</el-button>
          </el-empty>
        </div>

        <div v-else-if="doctors.length === 0" class="empty-state">
          <el-empty description="暂无符合条件的医生" />
        </div>

        <template v-else>
          <div class="doctor-list">
            <div v-for="doctor in doctors" :key="doctor.id" class="doctor-card" @click="router.push(`/doctors/${doctor.id}`)">
              <div class="doctor-avatar">
                <el-avatar :size="80" :src="doctor.avatar">
                  {{ doctor.name?.charAt(0) || '医' }}
                </el-avatar>
              </div>
              <div class="doctor-content">
                <div class="doctor-header">
                  <h3 class="doctor-name">{{ doctor.name }}</h3>
                  <el-tag type="primary" size="small">{{ doctor.department }}</el-tag>
                </div>
                <p class="doctor-hospital">{{ doctor.hospital_address }}</p>
                <p class="doctor-specialties">擅长：{{ doctor.specialties }}</p>
                <p class="doctor-intro">{{ doctor.introduction }}</p>
                <div class="doctor-stats">
                  <span class="stat-item">
                    <el-icon><ChatDotRound /></el-icon>
                    咨询 {{ doctor.consultation_count || 0 }} 次
                  </span>
                  <span class="stat-item">
                    <el-icon><TrendCharts /></el-icon>
                    回复率 {{ doctor.reply_rate || 0 }}%
                  </span>
                  <span class="stat-item price">
                    图文咨询 ¥{{ doctor.price_image || 0 }}
                  </span>
                </div>
              </div>
              <div class="doctor-action">
                <el-button type="primary" size="large" @click.stop="router.push(`/doctors/${doctor.id}`)">
                  立即咨询
                </el-button>
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
.doctors-page {
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
  margin-bottom: 20px;
}

.dept-filter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.dept-tag {
  cursor: pointer;
  padding: 6px 16px;
}

.doctor-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.doctor-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.doctor-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.doctor-content {
  flex: 1;
}

.doctor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.doctor-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.doctor-hospital {
  color: #909399;
  font-size: 14px;
  margin: 0 0 8px;
}

.doctor-specialties {
  color: #606266;
  font-size: 14px;
  margin: 0 0 8px;
}

.doctor-intro {
  color: #909399;
  font-size: 13px;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doctor-stats {
  display: flex;
  gap: 24px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.stat-item.price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.doctor-action {
  display: flex;
  align-items: center;
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
