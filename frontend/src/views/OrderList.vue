<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">订单抽查管理</h1>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="所属平台">
          <el-select v-model="filters.platformId" placeholder="请选择平台" clearable>
            <el-option v-for="p in platforms" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否已查">
          <el-select v-model="filters.checked" placeholder="请选择" clearable>
            <el-option label="已抽查" :value="true" />
            <el-option label="未抽查" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否异常">
          <el-select v-model="filters.abnormal" placeholder="请选择" clearable>
            <el-option label="异常" :value="true" />
            <el-option label="正常" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="订单号/车牌号/司机" clearable />
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
        <el-table-column prop="platform_order_no" label="平台订单号" min-width="180" />
        <el-table-column prop="platform_name" label="平台" min-width="120" />
        <el-table-column prop="driver_name" label="司机" width="100" />
        <el-table-column prop="plate_no" label="车牌号" width="120" />
        <el-table-column prop="pickup_address" label="上车地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="dropoff_address" label="下车地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="pickup_time" label="订单时间" width="180" />
        <el-table-column prop="actual_fare" label="金额(元)" width="100" align="right" />
        <el-table-column prop="anomaly_tags" label="异常标签" min-width="120">
          <template #default="{ row }">
            <el-tag
              v-for="tag in parseAnomalyTags(row.anomaly_tags)"
              :key="tag"
              type="danger"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ tag }}
            </el-tag>
            <span v-if="parseAnomalyTags(row.anomaly_tags).length === 0" class="tag-success">正常</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_checked" label="是否已查" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.is_checked ? 'tag-success' : 'tag-warning'">
              {{ row.is_checked ? '已抽查' : '未抽查' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="!row.is_checked"
              type="success"
              link
              @click="handleCheck(row)"
            >
              抽查
            </el-button>
            <el-button
              v-if="parseAnomalyTags(row.anomaly_tags).length > 0"
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

    <el-dialog v-model="checkDialogVisible" title="订单抽查" width="600px">
      <el-form :model="checkForm" label-width="100px">
        <el-form-item label="抽查结果">
          <el-radio-group v-model="checkForm.result">
            <el-radio value="normal">正常</el-radio>
            <el-radio value="abnormal">异常</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="checkForm.result === 'abnormal'" label="异常类型">
          <el-checkbox-group v-model="checkForm.abnormalTags">
            <el-checkbox label="价格异常">价格异常</el-checkbox>
            <el-checkbox label="绕路">绕路</el-checkbox>
            <el-checkbox label="拒载">拒载</el-checkbox>
            <el-checkbox label="态度恶劣">态度恶劣</el-checkbox>
            <el-checkbox label="其他">其他</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="抽查备注">
          <el-input v-model="checkForm.remark" type="textarea" :rows="4" placeholder="请输入抽查备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCheck">确定</el-button>
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
const checkDialogVisible = ref(false)
const workOrderDialogVisible = ref(false)
const workOrderFormRef = ref(null)
const tableData = ref([])
const platforms = ref([])

const filters = reactive({
  platformId: '',
  checked: '',
  abnormal: '',
  dateRange: [],
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const checkForm = reactive({
  orderId: '',
  result: 'normal',
  abnormalTags: [],
  remark: ''
})

const workOrderForm = reactive({
  orderId: '',
  title: '',
  type: '',
  priority: 'medium',
  assignee: '',
  description: ''
})

const workOrderRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  description: [{ required: true, message: '请输入工单描述', trigger: 'blur' }]
}

const fetchPlatforms = async () => {
  try {
    const data = await request.get('/platforms/all')
    platforms.value = data
  } catch (error) {
    ElMessage.error('获取平台列表失败')
  }
}

const parseAnomalyTags = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      platformId: filters.platformId,
      checked: filters.checked,
      abnormal: filters.abnormal,
      keyword: filters.keyword
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    const data = await request.get('/orders', { params })
    tableData.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.platformId = ''
  filters.checked = ''
  filters.abnormal = ''
  filters.dateRange = []
  filters.keyword = ''
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  router.push(`/orders/${row.id}`)
}

const handleCheck = (row) => {
  checkForm.orderId = row.id
  checkForm.result = 'normal'
  checkForm.abnormalTags = []
  checkForm.remark = ''
  checkDialogVisible.value = true
}

const submitCheck = async () => {
  submitting.value = true
  try {
    await request.post(`/orders/${checkForm.orderId}/check`, {
      check_result: checkForm.result,
      anomaly_tags: checkForm.abnormalTags,
      check_remark: checkForm.remark
    })
    ElMessage.success('抽查完成')
    checkDialogVisible.value = false
    fetchList()
  } catch (error) {
    ElMessage.error('抽查失败')
  } finally {
    submitting.value = false
  }
}

const handleCreateWorkOrder = (row) => {
  workOrderForm.orderId = row.id
  workOrderForm.title = `订单异常处理 - ${row.platform_order_no}`
  workOrderForm.type = ''
  workOrderForm.priority = 'medium'
  workOrderForm.assignee = ''
  workOrderForm.description = ''
  workOrderDialogVisible.value = true
}

const submitWorkOrder = async () => {
  if (!workOrderFormRef.value) return
  const valid = await workOrderFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await request.post(`/orders/${workOrderForm.orderId}/create-workorder`, {
      ...workOrderForm,
      source: 'order',
      sourceId: workOrderForm.orderId
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
  fetchPlatforms()
  fetchList()
})
</script>
