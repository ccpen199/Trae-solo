<template>
  <div>
    <div class="page-header">
      <span class="page-title">绩效跟踪</span>
    </div>

    <el-card style="margin-bottom: 20px">
      <template #header>
        <span style="font-weight: 600">整体绩效概览</span>
      </template>
      <el-table :data="performanceData" border stripe>
        <el-table-column prop="project_unit" label="项目单位" />
        <el-table-column prop="purpose" label="用途" />
        <el-table-column prop="budget_source" label="预算来源" width="120" />
        <el-table-column prop="annual_quota" label="年度额度" width="130" :formatter="formatMoney" />
        <el-table-column prop="used_amount" label="已使用" width="130">
          <template #default="{ row }">
            <span style="color: #67c23a">¥{{ Number(row.used_amount).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="available_balance" label="可用余额" width="130">
          <template #default="{ row }">
            ¥{{ Number(row.available_balance).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="usage_rate" label="使用率" width="140">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.min(100, parseFloat(row.usage_rate))" 
              :stroke-width="12"
              :color="getProgressColor(parseFloat(row.usage_rate))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="application_count" label="申请数" width="90" />
        <el-table-column prop="paid_count" label="已支付" width="90" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row.project_id)">
              下钻
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="资金去向追溯" width="900px" top="5vh">
      <div v-if="detailData">
        <el-descriptions :column="2" border style="margin-bottom: 20px">
          <el-descriptions-item label="项目单位">{{ detailData.project?.project_unit }}</el-descriptions-item>
          <el-descriptions-item label="指标文号">{{ detailData.project?.indicator_no }}</el-descriptions-item>
          <el-descriptions-item label="年度额度">¥{{ Number(detailData.project?.annual_quota).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="可用余额">¥{{ Number(detailData.project?.available_balance).toLocaleString() }}</el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="6">
            <el-statistic title="总申请笔数" :value="detailData.summary?.total_applications" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已支付笔数" :value="detailData.summary?.paid_count" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="申请总金额" :precision="2" :value="detailData.summary?.total_amount" prefix="¥" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已支付金额" :precision="2" :value="detailData.summary?.paid_amount" prefix="¥" />
          </el-col>
        </el-row>

        <el-divider content-position="left">拨付明细</el-divider>
        <el-table :data="detailData.applications" size="small">
          <el-table-column prop="id" label="申请编号" width="90" />
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span style="color: #f56c6c">¥{{ Number(row.amount).toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="batch_no" label="支付批次" width="180" />
          <el-table-column prop="paid_at" label="支付时间" width="160" />
        </el-table>

        <el-divider content-position="left">审核轨迹</el-divider>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in detailData.audit_history"
            :key="index"
            :timestamp="record.created_at"
            :type="record.action === 'approve' ? 'success' : record.action === 'reject' ? 'danger' : 'warning'"
          >
            <div>
              <span style="font-weight: 600">申请 #{{ record.application_id }}</span>
              <el-tag size="small" style="margin-left: 8px">{{ getStageText(record.stage) }}</el-tag>
            </div>
            <div style="font-size: 12px; color: #909399">
              {{ record.auditor }} - {{ getAuditActionText(record.action) }}
            </div>
            <div v-if="record.opinion" style="font-size: 13px; margin-top: 4px">{{ record.opinion }}</div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { paymentApi } from '../api'

const performanceData = ref([])
const detailDialogVisible = ref(false)
const detailData = ref(null)

const formatMoney = (row) => {
  return '¥' + Number(row.annual_quota).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getProgressColor = (rate) => {
  if (rate >= 90) return '#f56c6c'
  if (rate >= 70) return '#e6a23c'
  return '#67c23a'
}

const getStatusType = (status) => {
  const types = { pending: 'info', correction: 'warning', approved: 'success', rejected: 'danger', paid: 'success' }
  return types[status] || 'info'
}
const getStatusText = (status) => {
  const texts = { pending: '待审核', correction: '待补正', approved: '已通过', rejected: '已拒绝', paid: '已支付' }
  return texts[status] || status
}
const getStageText = (stage) => {
  const texts = { business: '业务审核', finance: '财务审核', leader: '领导审批', completed: '已完成' }
  return texts[stage] || stage
}
const getAuditActionText = (action) => {
  const texts = { approve: '通过', reject: '拒绝', return: '退回补正' }
  return texts[action] || action
}

const loadPerformance = async () => {
  try {
    performanceData.value = await paymentApi.performance()
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const showDetail = async (projectId) => {
  try {
    detailData.value = await paymentApi.performanceDetail(projectId)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

onMounted(() => {
  loadPerformance()
})
</script>
