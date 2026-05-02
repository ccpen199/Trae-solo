<template>
  <div class="case-list-page">
    <div class="page-header">
      <h2 class="page-title">案件列表</h2>
      <el-button 
        v-if="userStore.isLawyer" 
        type="primary" 
        @click="router.push('/cases/create')"
      >
        <el-icon><Plus /></el-icon>
        新建案件
      </el-button>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="案件状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadCases">
            <el-option label="待处理" value="pending" />
            <el-option label="办理中" value="active" />
            <el-option label="开庭中" value="hearing" />
            <el-option label="执行中" value="executing" />
            <el-option label="已结案" value="closed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="案件类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable @change="loadCases">
            <el-option label="民事案件" value="civil" />
            <el-option label="刑事案件" value="criminal" />
            <el-option label="行政案件" value="administrative" />
            <el-option label="商事案件" value="commercial" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <div class="case-cards">
      <div v-if="loading" class="loading-wrapper">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      
      <el-empty v-else-if="cases.length === 0" description="暂无案件" />
      
      <el-card 
        v-else 
        v-for="item in cases" 
        :key="item.id"
        class="case-card"
        shadow="hover"
        @click="goToDetail(item.id)"
      >
        <template #header>
          <div class="card-header">
            <div class="case-title">{{ item.title }}</div>
            <el-tag :class="`status-tag-${item.status}`" effect="light">
              {{ statusText(item.status) }}
            </el-tag>
          </div>
        </template>
        
        <div class="case-info">
          <div class="info-row">
            <span class="label">案号：</span>
            <span class="value">{{ item.case_number }}</span>
          </div>
          <div class="info-row">
            <span class="label">法院：</span>
            <span class="value">{{ item.court || '未填写' }}</span>
          </div>
          <div class="info-row" v-if="item.lead_lawyer_name">
            <span class="label">主办律师：</span>
            <span class="value">{{ item.lead_lawyer_name }}</span>
          </div>
          <div class="info-row" v-if="item.hearing_date">
            <span class="label">开庭日期：</span>
            <span class="value">{{ formatDate(item.hearing_date) }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
        
        <div class="card-footer" v-if="userStore.isLawyer">
          <div class="action-buttons" @click.stop>
            <el-button size="small" @click="openEvidence(item)">
              <el-icon><Picture /></el-icon>
              证据
            </el-button>
            <el-button size="small" @click="openDocuments(item)">
              <el-icon><Document /></el-icon>
              文书
            </el-button>
            <el-button size="small" type="warning" @click="signHearing(item)" v-if="item.status === 'active'">
              <el-icon><Edit /></el-icon>
              签到
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { caseApi, caseApi as evidenceApi } from '../../api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const cases = ref([])

const filters = reactive({
  status: '',
  type: ''
})

const statusMap = {
  pending: '待处理',
  active: '办理中',
  hearing: '开庭中',
  executing: '执行中',
  closed: '已结案',
  archived: '已归档'
}

const statusText = (status) => statusMap[status] || status

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const loadCases = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.type) params.type = filters.type
    
    cases.value = await caseApi.getList(params)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.type = ''
  loadCases()
}

const goToDetail = (id) => {
  router.push(`/cases/${id}`)
}

const openEvidence = (item) => {
  router.push(`/cases/${item.id}/evidences`)
}

const openDocuments = (item) => {
  router.push(`/cases/${item.id}/documents`)
}

const signHearing = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要为案件「${item.title}」进行开庭签到吗？`, '开庭签到', {
      confirmButtonText: '确认签到',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await caseApi.signHearing(item.id)
    ElMessage.success('开庭签到成功')
    loadCases()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  loadCases()
})
</script>

<style scoped>
.case-list-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.case-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.case-card {
  cursor: pointer;
  transition: all 0.3s;
}

.case-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.case-title {
  font-weight: 600;
  color: #303133;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  padding: 4px 0;
  font-size: 13px;
}

.info-row .label {
  color: #909399;
  min-width: 80px;
}

.info-row .value {
  color: #606266;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .case-cards {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
