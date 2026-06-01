<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">风险评估</h2>
      <div>
        <el-button type="success" @click="batchAssess">
          <el-icon><Refresh /></el-icon>
          批量评估
        </el-button>
        <el-button type="primary" @click="openExportDialog">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filters.riskLevel" placeholder="风险等级" clearable style="width: 120px;" @change="loadData">
          <el-option label="低风险" value="low" />
          <el-option label="中风险" value="medium" />
          <el-option label="高风险" value="high" />
          <el-option label="极高风险" value="critical" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px;" @change="loadData">
          <el-option label="待处理" value="pending" />
          <el-option label="自动拦截" value="auto_blocked" />
          <el-option label="人工复核" value="manual_review" />
          <el-option label="继续观察" value="watching" />
          <el-option label="已关闭" value="closed" />
        </el-select>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="assessment_no" label="评估编号" width="150" />
        <el-table-column prop="customer_name" label="客户名称" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/customers/${row.customer_id}`)">{{ row.customer_name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="risk_score" label="风险分" width="100" align="center">
          <template #default="{ row }">
            <span :class="['risk-badge', `risk-${row.risk_level}`]">{{ row.risk_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="risk_level" label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskType(row.risk_level)" size="small">{{ getRiskLevelText(row.risk_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险标签" min-width="150">
          <template #default="{ row }">
            <span v-for="tag in parseTags(row.risk_tags)" :key="tag" class="tag-item">{{ tag }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="reviewer_name" label="复核人" width="100" />
        <el-table-column prop="assessment_time" label="评估时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/assessments/${row.id}`)">详情</el-button>
            <el-button type="primary" size="small" link @click="openTaskDialog(row)" v-if="row.status !== 'closed'">创建任务</el-button>
            <el-button type="primary" size="small" link @click="openReviewDialog(row)" v-if="canReview(row.status)">复核</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex-between mt-20">
        <span>共 {{ total }} 条记录</span>
        <el-pagination 
          :current-page="page" 
          :page-size="pageSize" 
          :total="total"
          @current-change="handlePageChange"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <el-dialog v-model="reviewDialogVisible" title="复核评估" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复核结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio value="auto_blocked">自动拦截</el-radio>
            <el-radio value="manual_review">人工复核</el-radio>
            <el-radio value="watching">继续观察</el-radio>
            <el-radio value="closed">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核结论">
          <el-input v-model="reviewForm.review_result" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.review_remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleReview">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量风险评估" width="500px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="评估模式">
          <el-radio-group v-model="batchForm.mode">
            <el-radio value="incremental">增量评估（更新分数变化≥10分的）</el-radio>
            <el-radio value="full">全量评估（更新所有客户）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <div v-if="batchResult" class="batch-result">
        <el-divider content-position="left">执行结果</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="处理总数">{{ batchResult.summary?.total || 0 }}</el-descriptions-item>
          <el-descriptions-item label="新增评估">{{ batchResult.summary?.created || 0 }}</el-descriptions-item>
          <el-descriptions-item label="更新评估">{{ batchResult.summary?.updated || 0 }}</el-descriptions-item>
          <el-descriptions-item label="跳过评估">{{ batchResult.summary?.skipped || 0 }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="batchDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="loading" @click="handleBatchAssess">
          {{ batchResult ? '重新执行' : '开始评估' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Download, Plus } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../api'

const router = useRouter()
const route = useRoute()
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const submitLoading = ref(false)
const reviewDialogVisible = ref(false)
const currentAssessment = ref(null)

const filters = reactive({
  riskLevel: '',
  status: ''
})

const reviewForm = reactive({
  status: 'manual_review',
  review_result: '',
  review_remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/assessments', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        riskLevel: filters.riskLevel,
        status: filters.status
      }
    })
    list.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.riskLevel = ''
  filters.status = ''
  page.value = 1
  loadData()
}

const handlePageChange = (p) => {
  page.value = p
  loadData()
}

const batchDialogVisible = ref(false)
const batchForm = reactive({
  mode: 'incremental'
})
const batchResult = ref(null)

const batchAssess = () => {
  batchForm.mode = 'incremental'
  batchResult.value = null
  batchDialogVisible.value = true
}

const handleBatchAssess = async () => {
  try {
    loading.value = true
    const res = await api.post('/assessments/batch-assess', batchForm)
    batchResult.value = res.data
    ElMessage.success(res.data.message)
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '批量评估失败')
  } finally {
    loading.value = false
  }
}

const openExportDialog = async () => {
  try {
    const res = await api.get('/statistics/export', {
      params: { type: 'assessments' },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `风险评估数据_${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const openTaskDialog = (row) => {
  router.push({ path: '/tasks', query: { customerId: row.customer_id, assessmentId: row.id, create: '1' } })
}

const canReview = (status) => {
  return ['pending', 'manual_review', 'watching'].includes(status)
}

const openReviewDialog = (row) => {
  currentAssessment.value = row
  reviewForm.status = row.status === 'pending' ? 'manual_review' : row.status
  reviewForm.review_result = ''
  reviewForm.review_remark = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  if (!currentAssessment.value) return
  submitLoading.value = true
  try {
    await api.post(`/assessments/${currentAssessment.value.id}/review`, reviewForm)
    ElMessage.success('复核完成')
    reviewDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const getRiskType = (level) => {
  const types = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }
  return types[level] || 'info'
}

const getRiskLevelText = (level) => {
  const texts = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' }
  return texts[level] || level
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    auto_blocked: 'danger',
    manual_review: 'primary',
    watching: 'info',
    closed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    auto_blocked: '自动拦截',
    manual_review: '人工复核',
    watching: '继续观察',
    closed: '已关闭'
  }
  return texts[status] || status
}

const parseTags = (tags) => {
  try {
    return JSON.parse(tags || '[]')
  } catch {
    return []
  }
}

onMounted(() => {
  loadData()
})
</script>
