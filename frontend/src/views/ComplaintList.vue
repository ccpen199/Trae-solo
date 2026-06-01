<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">投诉管理</h1>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="投诉类型">
          <el-select v-model="filters.type" placeholder="请选择类型" clearable>
            <el-option label="价格纠纷" value="price" />
            <el-option label="服务态度" value="service" />
            <el-option label="绕路" value="detour" />
            <el-option label="拒载" value="refuse" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="投诉编号/投诉人/手机号" clearable />
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
        <el-table-column prop="complaint_no" label="投诉编号" width="140" />
        <el-table-column prop="complainant_name" label="投诉人" width="100" />
        <el-table-column prop="complainant_phone" label="联系电话" width="120" />
        <el-table-column prop="complaint_type" label="投诉类型" width="100">
          <template #default="{ row }">
            {{ getTypeText(row.complaint_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="platform_order_no" label="关联订单" min-width="150" />
        <el-table-column prop="driver_name" label="涉事司机" width="100" />
        <el-table-column prop="platform_name" label="所属平台" min-width="120" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="complaint_time" label="投诉时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'processing'"
              type="success"
              link
              @click="handleProcess(row)"
            >
              处理
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'processing'"
              type="warning"
              link
              @click="handleCreateWorkOrder(row)"
            >
              创建工单
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

    <el-dialog v-model="processDialogVisible" title="处理投诉" width="600px">
      <el-form ref="processFormRef" :model="processForm" :rules="processRules" label-width="100px">
        <el-form-item label="处理人" prop="handler">
          <el-input v-model="processForm.handler" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="处理结果" prop="handle_result">
          <el-radio-group v-model="processForm.handle_result">
            <el-radio value="resolved">已解决</el-radio>
            <el-radio value="transferred">转工单</el-radio>
            <el-radio value="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明" prop="remark">
          <el-input v-model="processForm.remark" type="textarea" :rows="4" placeholder="请输入处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProcess">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="workOrderDialogVisible" title="创建工单" width="600px">
      <el-form ref="workOrderFormRef" :model="workOrderForm" :rules="workOrderRules" label-width="100px">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="workOrderForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="workOrderForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="价格异常" value="price-abnormal" />
            <el-option label="服务投诉" value="service-complaint" />
            <el-option label="违规营运" value="illegal-operation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="workOrderForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派给" prop="assignee">
          <el-input v-model="workOrderForm.assignee" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="工单描述" prop="description">
          <el-input v-model="workOrderForm.description" type="textarea" :rows="4" placeholder="请输入工单描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="workOrderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitWorkOrder">确定</el-button>
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
const processDialogVisible = ref(false)
const workOrderDialogVisible = ref(false)
const processFormRef = ref(null)
const workOrderFormRef = ref(null)
const tableData = ref([])

const filters = reactive({
  status: '',
  type: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const processForm = reactive({
  complaintId: '',
  handler: '',
  handle_result: 'resolved',
  remark: ''
})

const workOrderForm = reactive({
  complaintId: '',
  title: '',
  type: '',
  priority: 'medium',
  assignee: '',
  description: ''
})

const processRules = {
  handler: [{ required: true, message: '请输入处理人', trigger: 'blur' }],
  handle_result: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  remark: [{ required: true, message: '请输入处理说明', trigger: 'blur' }]
}

const workOrderRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  description: [{ required: true, message: '请输入工单描述', trigger: 'blur' }]
}

const getStatusText = (status) => {
  const map = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'tag-warning', processing: 'tag-info', resolved: 'tag-success', closed: 'tag-danger' }
  return map[status] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { price: '价格纠纷', service: '服务态度', detour: '绕路', refuse: '拒载', other: '其他' }
  return map[type] || type
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/complaints', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status,
        type: filters.type,
        keyword: filters.keyword
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
  filters.keyword = ''
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  router.push(`/complaints/${row.id}`)
}

const handleProcess = (row) => {
  processForm.complaintId = row.id
  processForm.handler = ''
  processForm.handle_result = 'resolved'
  processForm.remark = ''
  processDialogVisible.value = true
}

const submitProcess = async () => {
  if (!processFormRef.value) return
  const valid = await processFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/complaints/${processForm.complaintId}/handle`, {
      handler: processForm.handler,
      handle_result: processForm.handle_result,
      remark: processForm.remark
    })
    ElMessage.success('处理完成')
    processDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('处理失败')
  } finally {
    submitting.value = false
  }
}

const handleCreateWorkOrder = (row) => {
  workOrderForm.complaintId = row.id
  workOrderForm.title = `投诉处理 - ${row.complaint_no}`
  workOrderForm.type = ''
  workOrderForm.priority = 'medium'
  workOrderForm.assignee = ''
  workOrderForm.description = row.content || ''
  workOrderDialogVisible.value = true
}

const submitWorkOrder = async () => {
  if (!workOrderFormRef.value) return
  const valid = await workOrderFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/complaints/${workOrderForm.complaintId}/create-workorder`, {
      ...workOrderForm,
      source: 'complaint',
      sourceId: workOrderForm.complaintId
    })
    ElMessage.success('工单创建成功')
    workOrderDialogVisible.value = false
  } catch (error) {
    ElMessage.error('工单创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>
