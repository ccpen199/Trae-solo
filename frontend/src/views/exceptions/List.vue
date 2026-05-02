<template>
  <div class="exceptions-list">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">异常处理</span>
          <div class="toolbar-actions">
            <el-radio-group v-model="filterStatus" size="small" @change="handleFilterChange">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="PENDING">待处理</el-radio-button>
              <el-radio-button value="HANDLING">处理中</el-radio-button>
              <el-radio-button value="RESOLVED">已解决</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="exceptions" stripe v-loading="loading">
        <el-table-column prop="exceptionNo" label="异常编号" min-width="160">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.exceptionNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="异常类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getExceptionTypeTag(row.type)">
              {{ getExceptionTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="relatedNo" label="关联单号" width="160" />
        <el-table-column prop="description" label="异常描述" min-width="250">
          <template #default="{ row }">
            <el-tooltip :content="row.description" placement="top-start">
              <span>{{ row.description }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getExceptionStatusTag(row.status)">
              {{ getExceptionStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.level)">
              {{ getPriorityLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handlerName" label="处理人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleHandle(row)"
              v-if="row.status === 'PENDING'"
            >
              处理
            </el-button>
            <el-button
              type="success"
              link
              @click="handleResolve(row)"
              v-if="row.status === 'HANDLING'"
            >
              解决
            </el-button>
            <el-button type="primary" link @click="handleView(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="异常编号">
          {{ currentException?.exceptionNo }}
        </el-descriptions-item>
        <el-descriptions-item label="异常类型">
          {{ getExceptionTypeLabel(currentException?.type) }}
        </el-descriptions-item>
        <el-descriptions-item label="关联单号">
          {{ currentException?.relatedNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="异常描述">
          {{ currentException?.description }}
        </el-descriptions-item>
        <el-descriptions-item label="原始轨迹">
          <el-input
            type="textarea"
            :rows="3"
            :value="currentException?.originalTraces"
            disabled
          />
        </el-descriptions-item>
      </el-descriptions>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="action-form"
      >
        <el-form-item label="处理意见" prop="comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button
          v-if="dialogAction !== 'VIEW'"
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { exceptionApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const exceptions = ref([])
const filterStatus = ref('all')
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const currentException = ref(null)
const dialogAction = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const form = reactive({
  comment: '',
})

const rules = {
  comment: [{ required: true, message: '请输入处理意见', trigger: 'blur' }],
}

const dialogTitle = computed(() => {
  if (dialogAction.value === 'VIEW') return '查看异常详情'
  if (dialogAction.value === 'HANDLE') return '处理异常'
  if (dialogAction.value === 'RESOLVE') return '解决异常'
  return '异常详情'
})

const exceptionTypes = {
  LOCATION_DRIFT: { label: '定位漂移', type: 'danger' },
  ROUTE_DEVIATION: { label: '路线偏离', type: 'warning' },
  DRIVER_REJECT: { label: '司机拒接', type: 'danger' },
  ARRIVAL_UNCONFIRMED: { label: '到达未确认', type: 'warning' },
  MAP_CALLBACK_DELAY: { label: '地图回调延迟', type: 'info' },
  OTHER: { label: '其他异常', type: 'info' },
}

const exceptionStatuses = {
  PENDING: { label: '待处理', type: 'danger' },
  HANDLING: { label: '处理中', type: 'warning' },
  RESOLVED: { label: '已解决', type: 'success' },
}

const priorityLevels = {
  HIGH: { label: '高', type: 'danger' },
  MEDIUM: { label: '中', type: 'warning' },
  LOW: { label: '低', type: 'info' },
}

const getExceptionTypeLabel = (type) => exceptionTypes[type]?.label || type || '未知'
const getExceptionTypeTag = (type) => exceptionTypes[type]?.type || 'info'
const getExceptionStatusLabel = (status) => exceptionStatuses[status]?.label || status || '未知'
const getExceptionStatusTag = (status) => exceptionStatuses[status]?.type || 'info'
const getPriorityLabel = (level) => priorityLevels[level]?.label || level || '未知'
const getPriorityTag = (level) => priorityLevels[level]?.type || 'info'

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (filterStatus.value !== 'all') {
      params.status = filterStatus.value
    }

    const result = await exceptionApi.getList(params)
    if (result.success) {
      exceptions.value = result.data?.list || []
      pagination.total = result.data?.total || 0
    }
  } catch (error) {
    console.error('Fetch exceptions error:', error)
    ElMessage.error('获取异常列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchData()
}

const openDialog = (row, action) => {
  currentException.value = row
  dialogAction.value = action
  form.comment = ''
  dialogVisible.value = true
}

const handleHandle = (row) => {
  openDialog(row, 'HANDLE')
}

const handleResolve = (row) => {
  openDialog(row, 'RESOLVE')
}

const handleView = (row) => {
  openDialog(row, 'VIEW')
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let result
        if (dialogAction.value === 'HANDLE') {
          result = await exceptionApi.handle(currentException.value.id, {
            comment: form.comment,
          })
        } else if (dialogAction.value === 'RESOLVE') {
          result = await exceptionApi.resolve(currentException.value.id, {
            comment: form.comment,
          })
        }

        if (result?.success) {
          ElMessage.success('操作成功')
          dialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(result?.message || '操作失败')
        }
      } catch (error) {
        console.error('Submit action error:', error)
        ElMessage.error('操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.exceptions-list {
  padding: 0;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.action-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
