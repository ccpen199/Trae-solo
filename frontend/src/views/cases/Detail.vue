<template>
  <div class="case-detail-page">
    <el-card v-if="caseDetail" class="detail-card">
      <template #header>
        <div class="card-header">
          <div>
            <el-button type="info" size="small" @click="router.back()" style="margin-right: 12px;">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="case-title">{{ caseDetail.title }}</span>
            <el-tag :class="`status-tag-${caseDetail.status}`" effect="light" style="margin-left: 12px;">
              {{ statusText(caseDetail.status) }}
            </el-tag>
          </div>
          <div class="case-actions" v-if="userStore.isLawyer">
            <el-button type="primary" size="small" @click="router.push(`/cases/${caseId}/evidences`)">
              <el-icon><Picture /></el-icon>
              证据管理
            </el-button>
            <el-button type="success" size="small" @click="router.push(`/cases/${caseId}/documents`)">
              <el-icon><Document /></el-icon>
              文书管理
            </el-button>
            <el-button type="warning" size="small" @click="signHearing" v-if="caseDetail.status === 'active'">
              <el-icon><Edit /></el-icon>
              开庭签到
            </el-button>
            <el-button 
              v-if="userStore.isLeadLawyer && caseDetail.status === 'executing'" 
              type="danger" 
              size="small"
              @click="closeCase"
            >
              <el-icon><Check /></el-icon>
              结案
            </el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="案号">{{ caseDetail.case_number }}</el-descriptions-item>
            <el-descriptions-item label="案件类型">{{ caseTypeText(caseDetail.type) }}</el-descriptions-item>
            <el-descriptions-item label="受理法院">{{ caseDetail.court || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="案件金额">
              <span v-if="caseDetail.case_value">{{ caseDetail.case_value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' }) }}</span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="主办律师">{{ caseDetail.lead_lawyer_name || '未指派' }}</el-descriptions-item>
            <el-descriptions-item label="案件助理">{{ caseDetail.assistant_name || '未指派' }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ caseDetail.client_name || '未关联' }}</el-descriptions-item>
            <el-descriptions-item label="开庭日期">
              <span v-if="caseDetail.hearing_date">{{ formatDateTime(caseDetail.hearing_date) }}</span>
              <span v-else>未安排</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(caseDetail.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(caseDetail.updated_at) }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <div class="description-section">
            <h4>案件描述</h4>
            <p>{{ caseDetail.description || '暂无描述' }}</p>
          </div>
          
          <div class="financial-summary" v-if="userStore.isLawyer || userStore.isFinance">
            <el-divider />
            <h4>账务概览</h4>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="hover" class="stat-card income">
                  <div class="stat-label">已确认收入</div>
                  <div class="stat-value">{{ formatMoney(caseDetail.fee_amount) }}</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="stat-card expense">
                  <div class="stat-label">已确认支出</div>
                  <div class="stat-value">{{ formatMoney(caseDetail.cost_amount) }}</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="stat-card profit">
                  <div class="stat-label">预估利润</div>
                  <div class="stat-value">{{ formatMoney(caseDetail.profit_amount) }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="快捷操作" name="actions">
          <el-row :gutter="20">
            <el-col :span="6" v-for="action in quickActions" :key="action.path">
              <el-card shadow="hover" class="action-card" @click="router.push(action.path)">
                <el-icon :size="40" :color="action.color">{{ action.icon }}</el-icon>
                <div class="action-name">{{ action.name }}</div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { caseApi, accountingApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const caseId = computed(() => route.params.id)
const activeTab = ref('basic')
const caseDetail = ref(null)

const statusMap = {
  pending: '待处理',
  active: '办理中',
  hearing: '开庭中',
  executing: '执行中',
  closed: '已结案',
  archived: '已归档'
}

const caseTypeMap = {
  civil: '民事案件',
  criminal: '刑事案件',
  administrative: '行政案件',
  commercial: '商事案件'
}

const statusText = (status) => statusMap[status] || status
const caseTypeText = (type) => caseTypeMap[type] || type

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const formatMoney = (amount) => {
  if (amount == null) return '¥ 0.00'
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const quickActions = computed(() => {
  const actions = [
    { path: `/cases/${caseId.value}/evidences`, name: '证据管理', icon: 'Picture', color: '#409eff' },
    { path: `/cases/${caseId.value}/documents`, name: '文书管理', icon: 'Document', color: '#67c23a' },
    { path: `/cases/${caseId.value}/timeline`, name: '办案轨迹', icon: 'Clock', color: '#e6a23c' }
  ]
  
  if (userStore.isLawyer || userStore.isFinance) {
    actions.push({ path: `/cases/${caseId.value}/accounting`, name: '账务管理', icon: 'Money', color: '#f56c6c' })
  }
  
  return actions
})

const loadCaseDetail = async () => {
  try {
    caseDetail.value = await caseApi.getDetail(caseId.value)
  } catch (e) {
    console.error(e)
  }
}

const signHearing = async () => {
  try {
    await ElMessageBox.confirm('确定要进行开庭签到吗？', '开庭签到', {
      confirmButtonText: '确认签到',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await caseApi.signHearing(caseId.value)
    ElMessage.success('开庭签到成功')
    loadCaseDetail()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const closeCase = async () => {
  try {
    await ElMessageBox.confirm('确定要结案吗？结案后将计算最终利润并锁定案件。', '结案确认', {
      confirmButtonText: '确认结案',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await accountingApi.closeCase(caseId.value)
    ElMessage.success('案件已结案')
    loadCaseDetail()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  loadCaseDetail()
})
</script>

<style scoped>
.case-detail-page {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.case-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.case-actions {
  display: flex;
  gap: 8px;
}

.description-section {
  padding: 0 12px;
}

.description-section h4 {
  margin: 0 0 12px;
  color: #303133;
  font-size: 15px;
}

.description-section p {
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.stat-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card.income { border-left: 4px solid #67c23a; }
.stat-card.expense { border-left: 4px solid #f56c6c; }
.stat-card.profit { border-left: 4px solid #409eff; }

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.action-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  padding: 24px 12px;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.action-name {
  margin-top: 12px;
  font-size: 14px;
  color: #303133;
}
</style>
