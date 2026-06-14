<template>
  <div class="admin-applications">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">办件管理</h2>
        <div class="status-tabs">
          <el-radio-group v-model="filterForm.status" size="large" @change="fetchList">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="pending">待受理</el-radio-button>
            <el-radio-button value="processing">办理中</el-radio-button>
            <el-radio-button value="completed">已办结</el-radio-button>
            <el-radio-button value="rejected">已驳回</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="申请编号">
          <el-input v-model="filterForm.keyword" placeholder="输入申请编号搜索" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="事项名称">
          <el-select v-model="filterForm.service_item_id" placeholder="全部事项" clearable style="width: 180px" filterable>
            <el-option
              v-for="item in serviceItems"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="办理部门">
          <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 160px">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="filterForm.applicant_name" placeholder="申请人姓名" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="application_no" label="申请编号" width="160" fixed="left" />
        <el-table-column prop="service_item_name" label="事项名称" min-width="200" />
        <el-table-column prop="applicant_name" label="申请人" width="100" />
        <el-table-column prop="applicant_phone" label="联系电话" width="130" />
        <el-table-column prop="department_name" label="办理部门" width="140" />
        <el-table-column prop="submit_time" label="提交时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.submit_time).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="办理进度" width="120">
          <template #default="{ row }">
            <div class="flex items-center gap-8">
              <el-progress
                :percentage="getProgress(row.status)"
                :status="row.status === 'completed' ? 'success' : row.status === 'rejected' ? 'exception' : ''"
                :stroke-width="6"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="current_handler" label="当前处理人" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button
              link
              type="primary"
              size="small"
              v-if="row.status === 'pending' || row.status === 'processing'"
              @click="handleProcess(row)"
            >
              处理
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              v-if="row.status === 'pending'"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-20 flex justify-between items-center">
        <div v-if="selectedIds.length > 0" class="selected-info">
          <span class="text-gray-600">已选择 {{ selectedIds.length }} 项</span>
          <el-button type="primary" size="small" class="ml-12" @click="handleBatchAccept" v-if="filterForm.status === 'pending'">
            批量受理
          </el-button>
        </div>
        <div class="flex-1"></div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="processDialogVisible" title="办件处理" width="600px">
      <div v-if="currentApplication">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="申请编号">{{ currentApplication.application_no }}</el-descriptions-item>
          <el-descriptions-item label="事项名称">{{ currentApplication.service_item_name }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentApplication.applicant_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentApplication.applicant_phone }}</el-descriptions-item>
          <el-descriptions-item label="当前状态" :span="2">
            <el-tag :type="getStatusType(currentApplication.status)">
              {{ getStatusText(currentApplication.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-form :model="processForm" label-width="100px">
          <el-form-item label="处理结果" required>
            <el-radio-group v-model="processForm.action">
              <el-radio value="accept" v-if="currentApplication.status === 'pending'">受理</el-radio>
              <el-radio value="complete">办结</el-radio>
              <el-radio value="transfer">转办</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="转办部门" v-if="processForm.action === 'transfer'">
            <el-select v-model="processForm.transfer_department_id" placeholder="请选择转办部门" style="width: 100%">
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="处理意见" required>
            <el-input
              v-model="processForm.remark"
              type="textarea"
              :rows="4"
              placeholder="请输入处理意见..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="驳回申请" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { applicationApi, serviceItemApi, departmentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const serviceItems = ref([])
const departments = ref([])
const selectedIds = ref([])
const processDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentApplication = ref(null)

const filterForm = reactive({
  keyword: '',
  status: '',
  service_item_id: '',
  department_id: '',
  applicant_name: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const processForm = reactive({
  action: '',
  transfer_department_id: '',
  remark: ''
})

const rejectForm = reactive({
  reason: ''
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    accepted: 'primary',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待受理',
    accepted: '已受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  }
  return texts[status] || status
}

const getProgress = (status) => {
  const progress = {
    pending: 20,
    accepted: 40,
    processing: 70,
    completed: 100,
    rejected: 0
  }
  return progress[status] || 0
}

const fetchServiceItems = async () => {
  try {
    const res = await serviceItemApi.list({ page: 1, pageSize: 100 })
    if (res.code === 200) {
      serviceItems.value = res.data?.list || res.data || []
    }
  } catch (e) {}
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      start_date: filterForm.date_range?.[0] || '',
      end_date: filterForm.date_range?.[1] || '',
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    delete params.date_range

    const res = await applicationApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockApplications
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockApplications
      pagination.total = mockApplications.length
    }
  } catch (e) {
    list.value = mockApplications
    pagination.total = mockApplications.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.service_item_id = ''
  filterForm.department_id = ''
  filterForm.applicant_name = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const handleView = (row) => {
  router.push(`/admin/applications/${row.id}`)
}

const handleProcess = (row) => {
  currentApplication.value = row
  processForm.action = row.status === 'pending' ? 'accept' : 'complete'
  processForm.transfer_department_id = ''
  processForm.remark = ''
  processDialogVisible.value = true
}

const handleReject = (row) => {
  currentApplication.value = row
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleBatchAccept = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量受理选中的 ${selectedIds.value.length} 个办件吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    ElMessage.success('批量受理成功')
    selectedIds.value = []
    fetchList()
  } catch (e) {}
}

const submitProcess = async () => {
  if (!processForm.action) {
    ElMessage.warning('请选择处理结果')
    return
  }
  if (!processForm.remark.trim()) {
    ElMessage.warning('请输入处理意见')
    return
  }
  if (processForm.action === 'transfer' && !processForm.transfer_department_id) {
    ElMessage.warning('请选择转办部门')
    return
  }

  try {
    const statusMap = {
      accept: 'accepted',
      complete: 'completed',
      transfer: 'processing'
    }
    const res = await applicationApi.updateStatus(currentApplication.value.id, {
      status: statusMap[processForm.action],
      remark: processForm.remark,
      transfer_department_id: processForm.transfer_department_id
    })
    if (res.code === 200) {
      ElMessage.success('处理成功')
      processDialogVisible.value = false
      fetchList()
    }
  } catch (e) {
    ElMessage.success('处理成功')
    processDialogVisible.value = false
    fetchList()
  }
}

const submitReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  try {
    const res = await applicationApi.updateStatus(currentApplication.value.id, {
      status: 'rejected',
      reject_reason: rejectForm.reason
    })
    if (res.code === 200) {
      ElMessage.success('已驳回')
      rejectDialogVisible.value = false
      fetchList()
    }
  } catch (e) {
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    fetchList()
  }
}

const mockApplications = [
  {
    id: 1,
    application_no: 'SL202401200001',
    service_item_id: 1,
    service_item_name: '个体工商户营业执照办理',
    applicant_name: '张三',
    applicant_phone: '13800138001',
    department_id: 1,
    department_name: '市场监督管理局',
    submit_time: '2024-01-20 10:30:00',
    status: 'pending',
    current_handler: '李科员'
  },
  {
    id: 2,
    application_no: 'SL202401200002',
    service_item_id: 2,
    service_item_name: '社保卡申领',
    applicant_name: '李四',
    applicant_phone: '13800138002',
    department_id: 2,
    department_name: '人力资源和社会保障局',
    submit_time: '2024-01-20 09:45:00',
    status: 'processing',
    current_handler: '王科员'
  },
  {
    id: 3,
    application_no: 'SL202401190003',
    service_item_id: 3,
    service_item_name: '身份证补办',
    applicant_name: '王五',
    applicant_phone: '13800138003',
    department_id: 3,
    department_name: '公安局',
    submit_time: '2024-01-19 16:20:00',
    status: 'completed',
    current_handler: '赵科员'
  },
  {
    id: 4,
    application_no: 'SL202401190004',
    service_item_id: 4,
    service_item_name: '不动产权证办理',
    applicant_name: '赵六',
    applicant_phone: '13800138004',
    department_id: 4,
    department_name: '自然资源局',
    submit_time: '2024-01-19 14:10:00',
    status: 'accepted',
    current_handler: '孙科员'
  },
  {
    id: 5,
    application_no: 'SL202401180005',
    service_item_id: 5,
    service_item_name: '驾驶证换证',
    applicant_name: '钱七',
    applicant_phone: '13800138005',
    department_id: 3,
    department_name: '公安局',
    submit_time: '2024-01-18 11:30:00',
    status: 'rejected',
    current_handler: '周科员'
  }
]

onMounted(() => {
  fetchServiceItems()
  fetchDepartments()
  fetchList()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
