<template>
  <div class="booking-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="主单号">
          <el-input
            v-model="searchForm.mainNo"
            placeholder="请输入主单号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option
              v-for="(label, key) in STATUS_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="货主">
          <el-input
            v-model="searchForm.shipperName"
            placeholder="请输入货主名称"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">订舱单列表</span>
          <el-button type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            新建订舱单
          </el-button>
        </div>
      </template>

      <el-table
        :data="tableData"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="mainNo" label="主单号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="goToDetail(row.id)">
              {{ row.mainNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="shipperName" label="货主" min-width="120" />
        <el-table-column prop="pol" label="装货港" min-width="80" />
        <el-table-column prop="pod" label="卸货港" min-width="80" />
        <el-table-column prop="containerCount" label="集装箱数" width="100" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsiblePerson" label="责任人" min-width="100" />
        <el-table-column prop="expectedCompleteTime" label="期望完成时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.expectedCompleteTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">
              查看
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleAction(row)"
              :disabled="!canAction(row)"
            >
              处理
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
        @size-change="handleFetchData"
        @current-change="handleFetchData"
      />
    </el-card>

    <el-dialog
      v-model="actionDialogVisible"
      title="处理订舱单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="actionFormRef"
        :model="actionForm"
        :rules="actionRules"
        label-width="100px"
      >
        <el-form-item label="处理动作">
          <el-select
            v-model="actionForm.action"
            placeholder="请选择处理动作"
            style="width: 100%"
          >
            <el-option
              v-for="action in availableActions"
              :key="action.value"
              :label="action.label"
              :value="action.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理意见">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见"
          />
        </el-form-item>
        <el-form-item
          v-if="actionForm.action === 'ASSIGN_CONTAINER'"
          label="箱号"
          prop="containerNo"
        >
          <el-input
            v-model="actionForm.containerNo"
            placeholder="请输入箱号（如：MSKU1234567）"
          />
          <div class="form-tip">
            箱号格式：4个字母（公司代码）+ 6个数字 + 1个校验位
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleSubmitAction">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { bookingsApi, containerApi } from '@/api'
import { STATUS_LABELS, STATUS_TYPES, STATUS_TRANSITIONS, BOOKING_STATUSES } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const actionDialogVisible = ref(false)
const actionLoading = ref(false)
const actionFormRef = ref(null)
const currentBooking = ref(null)

const searchForm = reactive({
  mainNo: '',
  status: '',
  shipperName: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const actionForm = reactive({
  action: '',
  comment: '',
  containerNo: '',
})

const actionRules = {
  action: [{ required: true, message: '请选择处理动作', trigger: 'change' }],
  containerNo: [
    { required: true, message: '请输入箱号', trigger: 'blur' },
    {
      pattern: /^[A-Z]{4}\d{7}$/,
      message: '箱号格式应为4个字母+7个数字',
      trigger: 'blur',
    },
  ],
}

const availableActions = computed(() => {
  if (!currentBooking.value) return []
  const status = currentBooking.value.status?.toUpperCase()
  const transitions = STATUS_TRANSITIONS[status] || []
  return transitions
    .filter(t => t.allowed)
    .map(t => ({
      label: t.label,
      value: t.action,
    }))
})

const getStatusLabel = (status) => {
  if (!status) return '未知'
  const upperStatus = status.toUpperCase()
  return STATUS_LABELS[upperStatus] || status
}

const getStatusType = (status) => {
  if (!status) return 'info'
  const upperStatus = status.toUpperCase()
  return STATUS_TYPES[upperStatus] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const canAction = (row) => {
  const status = row.status?.toUpperCase()
  const transitions = STATUS_TRANSITIONS[status] || []
  return transitions.some(t => t.allowed)
}

const handleSearch = () => {
  pagination.page = 1
  handleFetchData()
}

const handleReset = () => {
  searchForm.mainNo = ''
  searchForm.status = ''
  searchForm.shipperName = ''
  handleSearch()
}

const handleFetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const result = await bookingsApi.getList(params)
    if (result.success) {
      tableData.value = result.data?.list || []
      pagination.total = result.data?.total || 0
    }
  } catch (error) {
    console.error('Fetch bookings error:', error)
    ElMessage.error('获取订舱单列表失败')
  } finally {
    loading.value = false
  }
}

const goToCreate = () => {
  router.push('/bookings/create')
}

const goToDetail = (id) => {
  router.push(`/bookings/${id}`)
}

const handleAction = (row) => {
  currentBooking.value = row
  actionForm.action = ''
  actionForm.comment = ''
  actionForm.containerNo = ''
  actionDialogVisible.value = true
}

const handleSubmitAction = async () => {
  if (!actionFormRef.value) return

  await actionFormRef.value.validate(async (valid) => {
    if (valid) {
      actionLoading.value = true
      try {
        let result
        const { action, comment, containerNo } = actionForm
        const bookingId = currentBooking.value.id

        if (action === 'SUBMIT_BOOKING') {
          result = await bookingsApi.submit(bookingId, { comment })
        } else if (action === 'APPROVE_BOOKING') {
          result = await bookingsApi.approve(bookingId, { comment })
        } else if (action === 'REJECT_BOOKING') {
          result = await bookingsApi.reject(bookingId, { comment })
        } else if (action === 'ASSIGN_CONTAINER') {
          result = await containerApi.assign(bookingId, {
            containerNo,
            comment,
          })
        } else if (action === 'PORT_ENTRY') {
          result = await bookingsApi.portEntry(bookingId, { comment })
        } else if (action === 'LOADING') {
          result = await bookingsApi.loading(bookingId, { comment })
        } else if (action === 'RELEASE_BOL') {
          result = await bookingsApi.releaseBol(bookingId, { comment })
        }

        if (result?.success) {
          ElMessage.success('操作成功')
          actionDialogVisible.value = false
          handleFetchData()
        } else {
          ElMessage.error(result?.message || '操作失败')
        }
      } catch (error) {
        console.error('Submit action error:', error)
        ElMessage.error(error.message || '操作失败')
      } finally {
        actionLoading.value = false
      }
    }
  })
}

onMounted(() => {
  handleFetchData()
})
</script>

<style scoped>
.booking-list {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
