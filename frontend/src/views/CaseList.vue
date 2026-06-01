<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">执法案件管理</h1>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已处罚" value="decision_made" />
            <el-option label="申诉中" value="appealed" />
            <el-option label="已复核" value="reviewed" />
            <el-option label="整改中" value="rectifying" />
            <el-option label="已结案" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="请选择类型" clearable>
            <el-option label="价格违法" value="price-violation" />
            <el-option label="服务违规" value="service-violation" />
            <el-option label="非法营运" value="illegal-operation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否申诉">
          <el-select v-model="filters.appealed" placeholder="请选择" clearable>
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="case_no" label="案件号" width="160" />
        <el-table-column prop="case_type" label="类型" width="120">
          <template #default="{ row }">
            {{ getTypeText(row.case_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="driver_name" label="涉事司机" width="100" />
        <el-table-column prop="platform_name" label="所属平台" min-width="120" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="initial_fine_amount" label="处罚金额(元)" width="130" align="right" />
        <el-table-column prop="is_appealed" label="是否申诉" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.is_appealed ? 'tag-warning' : 'tag-success'">
              {{ row.is_appealed ? '是' : '否' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              link
              @click="handlePenalty(row)"
            >
              处罚决定
            </el-button>
            <el-button
              v-if="row.status === 'decision_made' && !row.is_appealed"
              type="info"
              link
              @click="handleAppeal(row)"
            >
              申诉
            </el-button>
            <el-button
              v-if="row.status === 'appealed'"
              type="success"
              link
              @click="handleReview(row)"
            >
              复核
            </el-button>
            <el-button
              v-if="row.status === 'reviewed'"
              type="danger"
              link
              @click="handleRectify(row)"
            >
              整改
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="penaltyDialogVisible" title="处罚决定" width="600px">
      <el-form ref="penaltyFormRef" :model="penaltyForm" :rules="penaltyRules" label-width="120px">
        <el-form-item label="处罚类型" prop="penaltyType">
          <el-select v-model="penaltyForm.penaltyType" placeholder="请选择处罚类型" style="width: 100%">
            <el-option label="罚款" value="fine" />
            <el-option label="警告" value="warning" />
            <el-option label="暂停营运" value="suspend" />
            <el-option label="吊销执照" value="revoke" />
          </el-select>
        </el-form-item>
        <el-form-item label="处罚金额(元)" prop="amount">
          <el-input-number v-model="penaltyForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="扣分" prop="points">
          <el-input-number v-model="penaltyForm.points" :min="0" :max="12" style="width: 100%" />
        </el-form-item>
        <el-form-item label="处罚依据" prop="basis">
          <el-input v-model="penaltyForm.basis" type="textarea" :rows="3" placeholder="请输入处罚依据" />
        </el-form-item>
        <el-form-item label="处罚决定" prop="decision">
          <el-input v-model="penaltyForm.decision" type="textarea" :rows="4" placeholder="请输入处罚决定" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="penaltyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPenalty">确定处罚</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="appealDialogVisible" title="申诉处理" width="600px">
      <el-form ref="appealFormRef" :model="appealForm" :rules="appealRules" label-width="120px">
        <el-form-item label="申诉人">
          <el-input v-model="appealForm.appellant" placeholder="请输入申诉人" />
        </el-form-item>
        <el-form-item label="申诉理由" prop="reason">
          <el-input v-model="appealForm.reason" type="textarea" :rows="4" placeholder="请输入申诉理由" />
        </el-form-item>
        <el-form-item label="申诉时间">
          <el-date-picker v-model="appealForm.appealTime" type="datetime" placeholder="选择时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAppeal">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="复核处理" width="600px">
      <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="120px">
        <el-form-item label="复核结果" prop="result">
          <el-radio-group v-model="reviewForm.result">
            <el-radio value="maintain">维持原处罚</el-radio>
            <el-radio value="change">变更处罚</el-radio>
            <el-radio value="cancel">撤销处罚</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核说明" prop="remark">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="4" placeholder="请输入复核说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReview">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rectifyDialogVisible" title="整改要求" width="600px">
      <el-form ref="rectifyFormRef" :model="rectifyForm" :rules="rectifyRules" label-width="120px">
        <el-form-item label="整改内容" prop="content">
          <el-input v-model="rectifyForm.content" type="textarea" :rows="4" placeholder="请输入整改内容" />
        </el-form-item>
        <el-form-item label="整改期限" prop="deadline">
          <el-date-picker v-model="rectifyForm.deadline" type="date" placeholder="选择期限" style="width: 100%" />
        </el-form-item>
        <el-form-item label="要求说明" prop="requirement">
          <el-input v-model="rectifyForm.requirement" type="textarea" :rows="3" placeholder="请输入要求说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRectify">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const penaltyDialogVisible = ref(false)
const appealDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const rectifyDialogVisible = ref(false)
const penaltyFormRef = ref(null)
const appealFormRef = ref(null)
const reviewFormRef = ref(null)
const rectifyFormRef = ref(null)
const tableData = ref([])

const filters = reactive({
  status: '',
  type: '',
  appealed: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const penaltyForm = reactive({
  caseId: '',
  penaltyType: 'fine',
  amount: 0,
  points: 0,
  basis: '',
  decision: ''
})

const appealForm = reactive({
  caseId: '',
  appellant: '',
  reason: '',
  appealTime: ''
})

const reviewForm = reactive({
  caseId: '',
  result: 'maintain',
  remark: ''
})

const rectifyForm = reactive({
  caseId: '',
  content: '',
  deadline: '',
  requirement: ''
})

const penaltyRules = {
  penaltyType: [{ required: true, message: '请选择处罚类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入处罚金额', trigger: 'blur' }],
  basis: [{ required: true, message: '请输入处罚依据', trigger: 'blur' }],
  decision: [{ required: true, message: '请输入处罚决定', trigger: 'blur' }]
}

const appealRules = {
  reason: [{ required: true, message: '请输入申诉理由', trigger: 'blur' }]
}

const reviewRules = {
  result: [{ required: true, message: '请选择复核结果', trigger: 'change' }],
  remark: [{ required: true, message: '请输入复核说明', trigger: 'blur' }]
}

const rectifyRules = {
  content: [{ required: true, message: '请输入整改内容', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择整改期限', trigger: 'change' }]
}

const getStatusText = (status) => {
  const map = { pending: '待处理', decision_made: '已处罚', appealed: '申诉中', reviewed: '已复核', rectifying: '整改中', closed: '已结案' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'tag-warning', decision_made: 'tag-danger', appealed: 'tag-warning', reviewed: 'tag-info', rectifying: 'tag-info', closed: 'tag-success' }
  return map[status] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { 'price-violation': '价格违法', 'service-violation': '服务违规', 'illegal-operation': '非法营运', 'other': '其他' }
  return map[type] || type
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/cases', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
        type: filters.type || undefined,
        appealed: filters.appealed || undefined
      }
    })
    tableData.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.type = ''
  filters.appealed = ''
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  router.push(`/cases/${row.id}`)
}

const handlePenalty = (row) => {
  penaltyForm.caseId = row.id
  penaltyForm.penaltyType = 'fine'
  penaltyForm.amount = 0
  penaltyForm.points = 0
  penaltyForm.basis = ''
  penaltyForm.decision = ''
  penaltyDialogVisible.value = true
}

const submitPenalty = async () => {
  if (!penaltyFormRef.value) return
  const valid = await penaltyFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/cases/${penaltyForm.caseId}/penalty`, penaltyForm)
    ElMessage.success('处罚决定已作出')
    penaltyDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('处罚失败')
  } finally {
    submitting.value = false
  }
}

const handleAppeal = (row) => {
  appealForm.caseId = row.id
  appealForm.appellant = row.driver_name || ''
  appealForm.reason = ''
  appealForm.appealTime = ''
  appealDialogVisible.value = true
}

const submitAppeal = async () => {
  if (!appealFormRef.value) return
  const valid = await appealFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/cases/${appealForm.caseId}/appeal`, { appeal_content: appealForm.reason })
    ElMessage.success('申诉已受理')
    appealDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('申诉失败')
  } finally {
    submitting.value = false
  }
}

const handleReview = (row) => {
  reviewForm.caseId = row.id
  reviewForm.result = 'maintain'
  reviewForm.remark = ''
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (!reviewFormRef.value) return
  const valid = await reviewFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/cases/${reviewForm.caseId}/review`, { review_result: reviewForm.result, final_decision: reviewForm.result, final_fine_amount: 0, final_points_deducted: 0 })
    ElMessage.success('复核完成')
    reviewDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('复核失败')
  } finally {
    submitting.value = false
  }
}

const handleRectify = (row) => {
  rectifyForm.caseId = row.id
  rectifyForm.content = ''
  rectifyForm.deadline = ''
  rectifyForm.requirement = ''
  rectifyDialogVisible.value = true
}

const submitRectify = async () => {
  if (!rectifyFormRef.value) return
  const valid = await rectifyFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/cases/${rectifyForm.caseId}/rectify`, { rectification_requirements: rectifyForm.content })
    ElMessage.success('整改要求已发送')
    rectifyDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>
