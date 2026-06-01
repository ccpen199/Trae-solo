<template>
  <div class="exception-list">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">异常处理</h1>
        <p class="page-subtitle">管理行李异常和查询单</p>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建异常
      </el-button>
    </div>

    <div class="card">
      <el-form :inline="true" :model="queryForm" class="mb-4">
        <el-form-item label="行李牌">
          <el-input v-model="queryForm.baggage_tag" placeholder="请输入行李牌" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="queryForm.exception_type" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="type in exceptionTypes" :key="type.type" :label="type.name" :value="type.type" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="status in statuses" :key="status.type" :label="status.name" :value="status.type" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="inquiry_no" label="查询单号" width="160">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="goToDetail(row.inquiry_no)">
              {{ row.inquiry_no }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="exception_name" label="异常类型" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.exception_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="baggage_tag" label="行李牌" width="130" />
        <el-table-column prop="passenger_name" label="旅客" width="90" />
        <el-table-column prop="flight_no" label="航班" width="90" />
        <el-table-column prop="photo_count" label="照片" width="70" align="center" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="report_time" label="上报时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.report_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="goToDetail(row.inquiry_no)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-4 justify-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="showCreateDialog" title="新建异常" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="行李牌" required>
          <el-input v-model="createForm.baggage_tag" placeholder="请输入行李牌" />
        </el-form-item>
        <el-form-item label="异常类型" required>
          <el-select v-model="createForm.exception_type" placeholder="请选择" style="width: 100%;">
            <el-option v-for="type in exceptionTypes" :key="type.type" :label="type.name" :value="type.type" />
          </el-select>
        </el-form-item>
        <el-form-item label="上报时间" required>
          <el-date-picker
            v-model="createForm.report_time"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="详细描述" />
        </el-form-item>
        <el-form-item label="上报人">
          <el-input v-model="createForm.reporter" placeholder="上报人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exceptionApi } from '../api'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const exceptionTypes = ref([])
const statuses = ref([])
const showCreateDialog = ref(false)

const queryForm = reactive({
  baggage_tag: '',
  exception_type: '',
  status: ''
})

const createForm = reactive({
  baggage_tag: '',
  exception_type: '',
  report_time: '',
  description: '',
  reporter: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

async function loadData() {
  loading.value = true
  try {
    const data = await exceptionApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...queryForm
    })
    tableData.value = data.list
    pagination.total = data.total
  } catch (err) {
    ElMessage.error('加载失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadTypes() {
  try {
    const [types, statusList] = await Promise.all([
      exceptionApi.getTypes(),
      exceptionApi.getStatuses()
    ])
    exceptionTypes.value = types
    statuses.value = statusList
  } catch (err) {
    console.error(err)
  }
}

async function submitCreate() {
  if (!createForm.baggage_tag || !createForm.exception_type || !createForm.report_time) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    const result = await exceptionApi.create(createForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    loadData()
    router.push(`/admin/exceptions/${result.inquiry_no}`)
  } catch (err) {
    if (err.response?.status === 404) {
      ElMessage.error('未找到该行李牌')
    } else {
      ElMessage.error('创建失败')
    }
    console.error(err)
  } finally {
    submitting.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.baggage_tag = ''
  queryForm.exception_type = ''
  queryForm.status = ''
  pagination.page = 1
  loadData()
}

function handleSizeChange(val) {
  pagination.pageSize = val
  pagination.page = 1
  loadData()
}

function handleCurrentChange(val) {
  pagination.page = val
  loadData()
}

function goToDetail(inquiryNo) {
  router.push(`/admin/exceptions/${inquiryNo}`)
}

function getStatusType(status) {
  const map = {
    open: 'danger',
    in_progress: 'warning',
    resolved: 'success',
    closed: 'info'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    open: '处理中',
    in_progress: '调查中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function formatTime(time) {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

onMounted(() => {
  loadData()
  loadTypes()
  createForm.report_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
})
</script>

<style scoped>
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.justify-end {
  display: flex;
  justify-content: flex-end;
}
</style>
