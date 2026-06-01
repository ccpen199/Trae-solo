<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">案件详情</h1>
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div v-loading="loading">
      <div class="detail-section chart-container">
        <div class="detail-section-title">案件信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">案件号：</span>
              <span class="detail-value">{{ caseInfo.case_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">案件类型：</span>
              <span class="detail-value">{{ getTypeText(caseInfo.case_type) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">案件状态：</span>
              <span class="detail-value">
                <span :class="getStatusClass(caseInfo.status)">{{ getStatusText(caseInfo.status) }}</span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">涉事司机：</span>
              <span class="detail-value">
                <el-button v-if="caseInfo.driver_id" type="primary" link @click="viewDriver">{{ caseInfo.driver_name }}</el-button>
                <span v-else>-</span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">所属平台：</span>
              <span class="detail-value">{{ caseInfo.platform_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">处罚金额：</span>
              <span class="detail-value">{{ caseInfo.initial_fine_amount || 0 }} 元</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">是否申诉：</span>
              <span class="detail-value">
                <span :class="caseInfo.is_appealed ? 'tag-warning' : 'tag-success'">
                  {{ caseInfo.is_appealed ? '是' : '否' }}
                </span>
              </span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">创建时间：</span>
              <span class="detail-value">{{ caseInfo.created_at }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">结案时间：</span>
              <span class="detail-value">{{ caseInfo.rectification_time || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <div class="detail-item" style="margin-top: 12px">
          <span class="detail-label">案件标题：</span>
          <span class="detail-value">{{ caseInfo.title }}</span>
        </div>
        <div class="detail-item" style="margin-top: 12px">
          <span class="detail-label">案情描述：</span>
          <span class="detail-value">{{ caseInfo.violation_details }}</span>
        </div>
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">证据列表</div>
        <el-row :gutter="16">
          <el-col :span="6" v-for="(evidence, index) in evidences" :key="index">
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden">
              <div style="height: 120px; background: #f3f4f6; display: flex; align-items: center; justify-content: center">
                <el-icon v-if="evidence.type === 'image'" style="font-size: 48px; color: #9ca3af"><Picture /></el-icon>
                <el-icon v-else-if="evidence.type === 'video'" style="font-size: 48px; color: #9ca3af"><VideoCamera /></el-icon>
                <el-icon v-else style="font-size: 48px; color: #9ca3af"><Document /></el-icon>
              </div>
              <div style="padding: 8px; text-align: center">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px">{{ evidence.name }}</div>
                <el-button type="primary" link size="small" @click="viewEvidence(evidence)">查看</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
        <el-empty v-if="evidences.length === 0" description="暂无证据" />
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">处罚决定</div>
        <div v-if="penaltyDecision">
          <div class="detail-item">
            <span class="detail-label">处罚类型：</span>
            <span class="detail-value">{{ getPenaltyTypeText(penaltyDecision.penalty_type) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">处罚金额：</span>
            <span class="detail-value">{{ penaltyDecision.amount }} 元</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">扣分：</span>
            <span class="detail-value">{{ penaltyDecision.points }} 分</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">处罚依据：</span>
            <span class="detail-value">{{ penaltyDecision.basis }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">处罚决定：</span>
            <span class="detail-value">{{ penaltyDecision.decision }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">处罚日期：</span>
            <span class="detail-value">{{ penaltyDecision.decision_date }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无处罚决定" />
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">申诉记录</div>
            <el-timeline v-if="appealRecords.length > 0">
              <el-timeline-item
                v-for="(record, index) in appealRecords"
                :key="index"
                :timestamp="record.time"
                type="warning"
              >
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600">申诉</h4>
                <p style="margin: 0; color: #6b7280">申诉人：{{ record.appellant }}</p>
                <p style="margin: 4px 0 0 0; color: #6b7280">申诉理由：{{ record.reason }}</p>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无申诉记录" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-section chart-container">
            <div class="detail-section-title">复核结果</div>
            <div v-if="reviewResult">
              <div class="detail-item">
                <span class="detail-label">复核结果：</span>
                <span class="detail-value">{{ getReviewResultText(reviewResult.result) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">复核说明：</span>
                <span class="detail-value">{{ reviewResult.remark }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">复核日期：</span>
                <span class="detail-value">{{ reviewResult.review_date }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无复核结果" />
          </div>
        </el-col>
      </el-row>

      <div class="detail-section chart-container">
        <div class="detail-section-title">整改要求</div>
        <div v-if="rectification">
          <div class="detail-item">
            <span class="detail-label">整改内容：</span>
            <span class="detail-value">{{ rectification.content }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">整改期限：</span>
            <span class="detail-value">{{ rectification.deadline }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">要求说明：</span>
            <span class="detail-value">{{ rectification.requirement }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">整改状态：</span>
            <span class="detail-value">
              <span :class="rectification.completed ? 'tag-success' : 'tag-warning'">
                {{ rectification.completed ? '已完成' : '待整改' }}
              </span>
            </span>
          </div>
        </div>
        <el-empty v-else description="暂无整改要求" />
      </div>

      <div class="detail-section chart-container">
        <div class="detail-section-title">关联处罚</div>
        <el-table :data="relatedPenalties" border stripe>
          <el-table-column prop="penalty_no" label="处罚编号" width="160" />
          <el-table-column prop="penalty_type" label="类型" width="120">
            <template #default="{ row }">
              {{ getPenaltyTypeText(row.penalty_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="penalty_amount" label="金额(元)" width="120" align="right" />
          <el-table-column prop="points_deducted" label="扣分" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <span :class="row.status === 'paid' ? 'tag-success' : 'tag-warning'">
                {{ row.status === 'paid' ? '已缴款' : '待缴款' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="penalty_time" label="处罚时间" width="180" />
        </el-table>
        <el-empty v-if="relatedPenalties.length === 0" description="暂无关联处罚" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Picture, VideoCamera, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const caseInfo = ref({})
const evidences = ref([])
const penaltyDecision = ref(null)
const appealRecords = ref([])
const reviewResult = ref(null)
const rectification = ref(null)
const relatedPenalties = ref([])

const getStatusText = (status) => {
  const map = { pending: '待处理', decision_made: '已处罚', appealed: '申诉中', reviewed: '已复核', rectifying: '整改中', closed: '已结案' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'tag-warning', decision_made: 'tag-danger', appealed: 'tag-warning', reviewed: 'tag-info', rectifying: 'tag-warning', closed: 'tag-success' }
  return map[status] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { 'price-violation': '价格违法', 'service-violation': '服务违规', 'illegal-operation': '非法营运', 'other': '其他' }
  return map[type] || type
}

const getPenaltyTypeText = (type) => {
  const map = { fine: '罚款', warning: '警告', suspend: '暂停营运', revoke: '吊销执照' }
  return map[type] || type
}

const getReviewResultText = (result) => {
  const map = { maintain: '维持原处罚', change: '变更处罚', cancel: '撤销处罚' }
  return map[result] || result
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await request.get(`/cases/${id}`)
    caseInfo.value = data
    try {
      const urls = data.evidence_urls ? JSON.parse(data.evidence_urls) : []
      evidences.value = Array.isArray(urls) ? urls.map((url, i) => ({ type: 'image', name: `证据${i + 1}`, url })) : []
    } catch { evidences.value = [] }
    penaltyDecision.value = data.initial_decision ? { penalty_type: data.initial_decision, amount: data.initial_fine_amount, points: data.initial_points_deducted, basis: '', decision: data.initial_decision, decision_date: data.decision_time } : null
    appealRecords.value = data.is_appealed ? [{ time: data.appeal_time, appellant: data.driver_name, reason: data.appeal_content }] : []
    reviewResult.value = data.review_result ? { result: data.review_result, remark: data.final_decision, review_date: data.review_time } : null
    rectification.value = data.rectification_requirements ? { content: data.rectification_requirements, deadline: '', requirement: data.rectification_requirements, completed: !!data.rectification_result } : null
    relatedPenalties.value = data.penalties || []
  } catch (error) {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const viewDriver = () => {
  if (caseInfo.value?.driver_id) {
    router.push(`/drivers/${caseInfo.value.driver_id}`)
  }
}

const viewEvidence = (evidence) => {
  ElMessage.info('查看证据：' + evidence.name)
}

onMounted(() => {
  fetchDetail()
})
</script>
