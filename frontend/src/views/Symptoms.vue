<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const loading = ref(true)
const error = ref('')
const symptoms = ref([])
const selectedSymptom = ref(null)

const fetchSymptoms = async () => {
  try {
    loading.value = true
    error.value = ''
    const res = await request.get('/symptoms')
    symptoms.value = res.data?.list || []
  } catch (err) {
    console.error('Fetch symptoms error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const selectSymptom = (symptom) => {
  selectedSymptom.value = selectedSymptom.value?.id === symptom.id ? null : symptom
}

onMounted(() => {
  fetchSymptoms()
})
</script>

<template>
  <Layout>
    <div class="symptoms-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">症状自查</h1>
          <p class="page-desc">了解常见症状，快速初步判断，建议及时就医确诊</p>
        </div>

        <div class="warning-box">
          <el-icon size="24" color="#e6a23c"><Warning /></el-icon>
          <span>温馨提示：自查结果仅供参考，宠物身体不适请及时就医，避免延误病情</span>
        </div>

        <el-skeleton v-if="loading" :rows="6" animated />
        
        <div v-else-if="error" class="error-state">
          <el-empty description="加载失败">
            <el-button type="primary" @click="fetchSymptoms">点击重试</el-button>
          </el-empty>
        </div>

        <template v-else>
          <div class="symptoms-grid">
            <div 
              v-for="symptom in symptoms" 
              :key="symptom.id" 
              class="symptom-card"
              :class="{ active: selectedSymptom?.id === symptom.id }"
              @click="selectSymptom(symptom)"
            >
              <div class="symptom-title">
                <span class="symptom-icon">💊</span>
                <h3>{{ symptom.name }}</h3>
              </div>
              <p class="symptom-desc">{{ symptom.description }}</p>
              
              <div v-if="selectedSymptom?.id === symptom.id" class="symptom-detail">
                <div class="detail-section">
                  <h4>可能的疾病</h4>
                  <p>{{ symptom.possible_diseases || '暂无信息' }}</p>
                </div>
                <div class="detail-section">
                  <h4>建议措施</h4>
                  <p>{{ symptom.advice || '请及时就医确诊' }}</p>
                </div>
                <div class="detail-section">
                  <h4>适用宠物</h4>
                  <p>{{ symptom.species || '通用' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="action-section">
            <el-button type="primary" size="large" @click="$router.push('/doctors')">
              <el-icon><User /></el-icon>
              立即咨询医生
            </el-button>
            <el-button size="large" @click="$router.push('/hospitals')">
              <el-icon><OfficeBuilding /></el-icon>
              查找附近医院
            </el-button>
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.symptoms-page {
  min-height: 80vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
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

.warning-box {
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  color: #e6a23c;
  font-size: 14px;
}

.symptoms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.symptom-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.symptom-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
}

.symptom-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.2);
}

.symptom-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.symptom-icon {
  font-size: 24px;
}

.symptom-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.symptom-desc {
  color: #606266;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.symptom-detail {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #d9ecff;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.detail-section p {
  color: #606266;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

.error-state {
  padding: 60px 0;
  text-align: center;
}
</style>
