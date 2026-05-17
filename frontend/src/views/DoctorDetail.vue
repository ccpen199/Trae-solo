<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const doctor = ref(null)
const consultType = ref('image')
const consultQuestion = ref('')
const submitting = ref(false)

const fetchDoctor = async () => {
  try {
    loading.value = true
    error.value = ''
    const res = await request.get(`/doctors/${route.params.id}`)
    doctor.value = res.data
  } catch (err) {
    console.error('Fetch doctor error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handleConsult = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!consultQuestion.value.trim()) {
    ElMessage.warning('请描述您的问题')
    return
  }

  try {
    submitting.value = true
    const res = await request.post(`/doctors/${route.params.id}/consultation`, {
      type: consultType.value,
      question: consultQuestion.value
    })
    
    await ElMessageBox.alert(
      '问诊请求已提交，医生会尽快回复您！',
      '提交成功',
      { type: 'success' }
    )
    
    consultQuestion.value = ''
    router.push(`/consultations/${res.data.id}`)
  } catch (err) {
    console.error('Submit consultation error:', err)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchDoctor()
})
</script>

<template>
  <Layout>
    <div class="doctor-detail-page">
      <div class="container">
        <el-skeleton v-if="loading" :rows="15" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchDoctor">点击重试</el-button>
          </el-empty>
        </div>

        <template v-else-if="doctor">
          <div class="doctor-profile">
            <div class="profile-left">
              <el-avatar :size="100" :src="doctor.avatar">
                {{ doctor.name?.charAt(0) || '医' }}
              </el-avatar>
            </div>
            <div class="profile-info">
              <div class="info-header">
                <h1 class="doctor-name">{{ doctor.name }}</h1>
                <el-tag type="primary" size="large">{{ doctor.department }}</el-tag>
              </div>
              <p class="doctor-hospital">
                <el-icon><OfficeBuilding /></el-icon>
                {{ doctor.hospital_address }}
              </p>
              <p class="doctor-specialties">
                <span class="label">擅长：</span>
                {{ doctor.specialties }}
              </p>
              <p class="doctor-intro">{{ doctor.introduction }}</p>
              
              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-value">{{ doctor.consultation_count || 0 }}</span>
                  <span class="stat-label">咨询次数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ doctor.reply_rate || 0 }}%</span>
                  <span class="stat-label">回复率</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ doctor.rating || 5 }}</span>
                  <span class="stat-label">评分</span>
                </div>
              </div>
            </div>
          </div>

          <div class="consult-section">
            <h2 class="section-title">发起咨询</h2>
            
            <div class="consult-types">
              <div 
                v-for="type in [
                  { key: 'image', label: '图文咨询', price: doctor.price_image, icon: 'Picture' },
                  { key: 'phone', label: '电话咨询', price: doctor.price_phone, icon: 'Phone' },
                  { key: 'video', label: '视频咨询', price: doctor.price_video, icon: 'VideoCamera' }
                ]"
                :key="type.key"
                class="type-card"
                :class="{ active: consultType === type.key }"
                @click="consultType = type.key"
              >
                <el-icon :size="28"><component :is="type.icon" /></el-icon>
                <span class="type-label">{{ type.label }}</span>
                <span class="type-price">¥{{ type.price || 0 }}</span>
              </div>
            </div>

            <div class="question-input">
              <label>描述您的问题</label>
              <el-input
                v-model="consultQuestion"
                type="textarea"
                :rows="5"
                placeholder="请详细描述宠物的症状、持续时间等信息，以便医生更好地诊断..."
              />
            </div>

            <el-button 
              type="primary" 
              size="large" 
              :loading="submitting"
              @click="handleConsult"
              class="submit-btn"
            >
              提交咨询
            </el-button>
          </div>

          <div class="reviews-section">
            <h2 class="section-title">用户评价</h2>
            <div v-if="!doctor.reviews?.length" class="empty-reviews">
              <el-empty description="暂无评价" />
            </div>
            <div v-else class="review-list">
              <div v-for="review in doctor.reviews" :key="review.id" class="review-item">
                <div class="review-header">
                  <el-avatar :src="review.avatar">
                    {{ review.nickname?.charAt(0) || '用' }}
                  </el-avatar>
                  <div class="review-info">
                    <span class="reviewer-name">{{ review.nickname }}</span>
                    <el-rate v-model="review.rating" disabled :show-score="false" size="small" />
                  </div>
                </div>
                <p class="review-content">{{ review.review }}</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.doctor-detail-page {
  min-height: 80vh;
}

.doctor-profile {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 40px;
  margin-bottom: 30px;
}

.profile-info {
  flex: 1;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.doctor-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.doctor-hospital {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 15px;
  margin: 0 0 12px;
}

.doctor-specialties {
  color: #606266;
  font-size: 15px;
  margin: 0 0 12px;
}

.doctor-specialties .label {
  color: #909399;
}

.doctor-intro {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 24px;
}

.stats-row {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.consult-section,
.reviews-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px;
}

.consult-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.type-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.type-card:hover {
  border-color: #409eff;
}

.type-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.type-card .el-icon {
  color: #409eff;
  margin-bottom: 12px;
}

.type-label {
  display: block;
  font-size: 15px;
  color: #303133;
  margin-bottom: 8px;
}

.type-price {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.question-input {
  margin-bottom: 24px;
}

.question-input label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.submit-btn {
  min-width: 200px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.review-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reviewer-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.review-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 0 52px;
}

.empty-reviews {
  padding: 40px 0;
}

.error-state {
  padding: 60px 0;
  text-align: center;
}
</style>
