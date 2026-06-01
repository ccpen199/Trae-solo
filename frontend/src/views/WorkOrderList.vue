<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">核查工单管理</h1>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="待派单" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="请选择类型" clearable>
            <el-option label="价格异常" value="price-abnormal" />
            <el-option label="服务投诉" value="service-complaint" />
            <el-option label="违规营运" value="illegal-operation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="请选择优先级" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" placeholder="请选择来源" clearable>
            <el-option label="订单抽查" value="order_check" />
            <el-option label="投诉" value="complaint" />
            <el-option label="手动创建" value="manual" />
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
        <el-table-column prop="work_order_no" label="工单号" width="160" />
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            {{ getSourceText(row.source) }}
          </template>
        </el-table-column>
        <el-table-column prop="work_order_type" label="类型" width="120">
          <template #default="{ row }">
            {{ getTypeText(row.work_order_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <span :class="getPriorityClass(row.priority)">{{ getPriorityText(row.priority) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="assign_to" label="指派给" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              @click="handleAssign(row)"
            >
              派单
            </el-button>
            <el-button
              v-if="row.status === 'processing' || row.status === 'completed'"
              type="warning"
              link
              @click="handleVerify(row)"
            >
              核查
            </el-button>
            <el-button
              v-if="row.status !== 'closed'"
              type="danger"
              link
              @click="handleCreateCase(row)"
            >
              创建案件
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

    <el-dialog v-model="assignDialogVisible" title="工单派单" width="500px">
      <el-form ref="assignFormRef" :model="assignForm" :rules="assignRules" label-width="100px">
        <el-form-item label="指派给" prop="assignee">
          <el-input v-model="assignForm.assignee" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="处理要求" prop="requirement">
          <el-input v-model="assignForm.requirement" type="textarea" :rows="4" placeholder="请输入处理要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyDialogVisible" title="工单核查" width="600px">
      <el-form ref="verifyFormRef" :model="verifyForm" :rules="verifyRules" label-width="100px">
        <el-form-item label="核查结果" prop="result">
          <el-radio-group v-model="verifyForm.result">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="abnormal">异常需立案</el-radio>
            <el-radio value="completed">核查完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="核查说明" prop="remark">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="4" placeholder="请输入核查说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVerify">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="caseDialogVisible" title="创建案件" width="600px">
      <el-form ref="caseFormRef" :model="caseForm" :rules="caseRules" label-width="100px">
        <el-form-item label="案件标题" prop="title">
          <el-input v-model="caseForm.title" placeholder="请输入案件标题" />
        </el-form-item>
        <el-form-item label="案件类型" prop="type">
          <el-select v-model="caseForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="价格违法" value="price-violation" />
            <el-option label="服务违规" value="service-violation" />
            <el-option label="非法营运" value="illegal-operation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="案情描述" prop="description">
          <el-input v-model="caseForm.description" type="textarea" :rows="4" placeholder="请输入案情描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="caseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCase">确定立案</el-button>
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
const assignDialogVisible = ref(false)
const verifyDialogVisible = ref(false)
const caseDialogVisible = ref(false)
const assignFormRef = ref(null)
const verifyFormRef = ref(null)
const caseFormRef = ref(null)
const tableData = ref([])

const filters = reactive({
  status: '',
  type: '',
  priority: '',
  source: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const assignForm = reactive({
  workOrderId: '',
  assignee: '',
  requirement: ''
})

const verifyForm = reactive({
  workOrderId: '',
  result: 'normal',
  remark: ''
})

const caseForm = reactive({
  workOrderId: '',
  title: '',
  type: '',
  description: ''
})

const assignRules = {
  assignee: [{ required: true, message: '请输入处理人', trigger: 'blur' }],
  requirement: [{ required: true, message: '请输入处理要求', trigger: 'blur' }]
}

const verifyRules = {
  result: [{ required: true, message: '请选择核查结果', trigger: 'change' }],
  remark: [{ required: true, message: '请输入核查说明', trigger: 'blur' }]
}

const caseRules = {
  title: [{ required: true, message: '请输入案件标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择案件类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入案情描述', trigger: 'blur' }]
}

const getStatusText = (status) => {
  const map = { pending: '待派单', processing: '处理中', completed: '已完成', closed: '已关闭' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'tag-warning', processing: 'tag-info', completed: 'tag-success', closed: 'tag-danger' }
  return map[status] || 'tag-info'
}

const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

const getPriorityClass = (priority) => {
  const map = { high: 'tag-danger', medium: 'tag-warning', low: 'tag-info' }
  return map[priority] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { 'price-abnormal': '价格异常', 'service-complaint': '服务投诉', 'illegal-operation': '违规营运', 'other': '其他' }
  return map[type] || type
}

const getSourceText = (source) => {
  const map = { order_check: '订单抽查', complaint: '投诉', manual: '手动创建' }
  return map[source] || source
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/work-orders', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        source: filters.source || undefined
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
  filters.priority = ''
  filters.source = ''
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  router.push(`/work-orders/${row.id}`)
}

const handleAssign = (row) => {
  assignForm.workOrderId = row.id
  assignForm.assignee = ''
  assignForm.requirement = ''
  assignDialogVisible.value = true
}

const submitAssign = async () => {
  if (!assignFormRef.value) return
  const valid = await assignFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/work-orders/${assignForm.workOrderId}/assign`, { assign_to: assignForm.assignee })
    ElMessage.success('派单成功')
    assignDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('派单失败')
  } finally {
    submitting.value = false
  }
}

const handleVerify = (row) => {
  verifyForm.workOrderId = row.id
  verifyForm.result = 'normal'
  verifyForm.remark = ''
  verifyDialogVisible.value = true
}

const submitVerify = async () => {
  if (!verifyFormRef.value) return
  const valid = await verifyFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/work-orders/${verifyForm.workOrderId}/verify`, { verify_result: verifyForm.result, verify_evidence: null })
    ElMessage.success('核查完成')
    verifyDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('核查失败')
  } finally {
    submitting.value = false
  }
}

const handleCreateCase = (row) => {
  caseForm.workOrderId = row.id
  caseForm.title = row.title
  caseForm.type = ''
  caseForm.description = row.description || ''
  caseDialogVisible.value = true
}

const submitCase = async () => {
  if (!caseFormRef.value) return
  const valid = await caseFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/work-orders/${caseForm.workOrderId}/create-case`, {
      title: caseForm.title,
      case_type: caseForm.type,
      description: caseForm.description
    })
    ElMessage.success('案件创建成功')
    caseDialogVisible.value = false
  } catch (error) {
    ElMessage.error('案件创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>
