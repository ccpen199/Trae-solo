<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const doctors = ref([])
const hospitals = ref([])
const symptoms = ref([])
const searchKeyword = ref('')

const fetchData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const [doctorsRes, hospitalsRes, symptomsRes] = await Promise.all([
      request.get('/doctors?limit=4'),
      request.get('/hospitals?limit=3'),
      request.get('/symptoms?limit=5')
    ])
    
    doctors.value = doctorsRes.data?.list || []
    hospitals.value = hospitalsRes.data?.list || []
    symptoms.value = symptomsRes.data?.list || []
  } catch (err) {
    console.error('Fetch data error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/doctors?keyword=${encodeURIComponent(searchKeyword.value)}`)
  }
}

const quickConsult = () => {
  router.push('/doctors')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <Layout>
    <div class="home-page">
      <div class="hero-section">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">专业宠物医疗服务平台</h1>
            <p class="hero-subtitle">在线问诊 · 预约就医 · 健康管理 · 社区交流</p>
            
            <div class="search-box">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索医生、医院、症状..."
                size="large"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #append>
                  <el-button type="primary" @click="handleSearch">搜索</el-button>
                </template>
              </el-input>
            </div>

            <div class="quick-actions">
              <el-button type="primary" size="large" @click="quickConsult" class="action-btn">
                <el-icon><VideoCamera /></el-icon>
                快速问诊
              </el-button>
              <el-button size="large" @click="$router.push('/hospitals')" class="action-btn">
                <el-icon><Location /></el-icon>
                快速就医
              </el-button>
              <el-button size="large" @click="$router.push('/doctors')" class="action-btn">
                <el-icon><User /></el-icon>
                找医生
              </el-button>
              <el-button size="large" @click="$router.push('/symptoms')" class="action-btn">
                <el-icon><Help /></el-icon>
                症状自查
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <el-skeleton v-if="loading" :rows="10" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchData">点击重试</el-button>
          </el-empty>
        </div>

        <template v-else>
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">推荐医生</h2>
              <el-button link @click="$router.push('/doctors')">查看全部 →</el-button>
            </div>
            <div class="doctor-grid">
              <div v-for="doctor in doctors" :key="doctor.id" class="doctor-card" @click="$router.push(`/doctors/${doctor.id}`)">
                <div class="doctor-avatar">
                  <el-avatar :size="64" :src="doctor.avatar">
                    {{ doctor.name?.charAt(0) || '医' }}
                  </el-avatar>
                </div>
                <div class="doctor-info">
                  <h3 class="doctor-name">{{ doctor.name }}</h3>
                  <p class="doctor-dept">{{ doctor.department }}</p>
                  <p class="doctor-hospital">{{ doctor.hospital_address }}</p>
                  <div class="doctor-stats">
                    <span class="stat">咨询 {{ doctor.consultation_count || 0 }}</span>
                    <span class="stat">回复率 {{ doctor.reply_rate || 0 }}%</span>
                  </div>
                  <div class="doctor-tags">
                    <el-tag size="small" type="info">{{ (doctor.specialties || '').split('、')[0] }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">合作医院</h2>
              <el-button link @click="$router.push('/hospitals')">查看全部 →</el-button>
            </div>
            <div class="hospital-list">
              <div v-for="hospital in hospitals" :key="hospital.id" class="hospital-card" @click="$router.push('/hospitals')">
                <div class="hospital-icon">🏥</div>
                <div class="hospital-info">
                  <h3 class="hospital-name">{{ hospital.name }}</h3>
                  <p class="hospital-address">{{ hospital.address }}</p>
                  <p class="hospital-hours">{{ hospital.business_hours }}</p>
                </div>
                <div class="hospital-rating">
                  <el-rate v-model="hospital.rating" disabled :show-score="false" />
                  <span class="rating-text">{{ hospital.rating }}分</span>
                </div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">常见症状</h2>
              <el-button link @click="$router.push('/symptoms')">查看全部 →</el-button>
            </div>
            <div class="symptom-tags">
              <el-tag 
                v-for="symptom in symptoms" 
                :key="symptom.id"
                size="large"
                class="symptom-tag"
                @click="$router.push('/symptoms')"
              >
                {{ symptom.name }}
              </el-tag>
            </div>
          </section>

          <section class="section community-preview">
            <div class="section-header">
              <h2 class="section-title">社区热帖</h2>
              <el-button link @click="$router.push('/community')">查看全部 →</el-button>
            </div>
            <el-empty description="欢迎访问社区浏览更多精彩内容" />
          </section>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 0 80px;
  color: white;
  text-align: center;
}

.hero-title {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.search-box {
  max-width: 600px;
  margin: 0 auto 30px;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.action-btn {
  min-width: 120px;
}

.section {
  padding: 40px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.doctor-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  gap: 16px;
}

.doctor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.doctor-info {
  flex: 1;
}

.doctor-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #303133;
}

.doctor-dept {
  color: #409eff;
  font-size: 14px;
  margin: 0 0 4px;
}

.doctor-hospital {
  color: #909399;
  font-size: 13px;
  margin: 0 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.doctor-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hospital-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hospital-card {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 20px;
}

.hospital-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.hospital-icon {
  font-size: 40px;
}

.hospital-info {
  flex: 1;
}

.hospital-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #303133;
}

.hospital-address {
  color: #606266;
  font-size: 14px;
  margin: 0 0 4px;
}

.hospital-hours {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.hospital-rating {
  text-align: right;
}

.rating-text {
  display: block;
  font-size: 14px;
  color: #f7ba2a;
  margin-top: 4px;
}

.symptom-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.symptom-tag {
  cursor: pointer;
  padding: 8px 20px;
  font-size: 14px;
}

.error-state {
  padding: 60px 0;
  text-align: center;
}

.community-preview {
  padding-bottom: 60px;
}
</style>
