<template>
  <div class="bills-list">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">提单放单</span>
        </div>
      </template>

      <el-table :data="bookings" stripe v-loading="loading">
        <el-table-column prop="mainNo" label="主单号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="goToDetail(row.id)">
              {{ row.mainNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="shipperName" label="货主" min-width="120" />
        <el-table-column prop="pol" label="装货港" width="100" />
        <el-table-column prop="pod" label="卸货港" width="100" />
        <el-table-column prop="containerCount" label="集装箱数" width="100" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsiblePerson" label="责任人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleRelease(row)">
              提单放单
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
      title="提单放单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="订舱单号">
          <el-input :value="currentBooking?.mainNo" disabled />
        </el-form-item>
        <el-form-item label="货主">
          <el-input :value="currentBooking?.shipperName" disabled />
        </el-form-item>
        <el-form-item label="提单号" prop="bolNo">
          <el-input
            v-model="form.bolNo"
            placeholder="请输入提单号"
          />
        </el-form-item>
        <el-form-item label="提单类型" prop="bolType">
          <el-select
            v-model="form.bolType"
            placeholder="请选择提单类型"
            style="width: 100%"
          >
            <el-option label="海运提单" value="SEA" />
            <el-option label="铁路提单" value="RAIL" />
            <el-option label="空运提单" value="AIR" />
          </el-select>
        </el-form-item>
        <el-form-item label="托运人" prop="shipper">
          <el-input
            v-model="form.shipper"
            placeholder="请输入托运人信息"
          />
        </el-form-item>
        <el-form-item label="收货人" prop="consignee">
          <el-input
            v-model="form.consignee"
            placeholder="请输入收货人信息"
          />
        </el-form-item>
        <el-form-item label="通知人" prop="notifier">
          <el-input
            v-model="form.notifier"
            placeholder="请输入通知人信息"
          />
        </el-form-item>
        <el-form-item label="处理意见" prop="comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入处理意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确认放单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { bookingsApi, billsApi } from '@/api'
import { STATUS_LABELS, STATUS_TYPES } from '@/utils/constants'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const bookings = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const currentBooking = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const form = reactive({
  bolNo: '',
  bolType: 'SEA',
  shipper: '',
  consignee: '',
  notifier: '',
  comment: '',
})

const rules = {
  bolNo: [{ required: true, message: '请输入提单号', trigger: 'blur' }],
  bolType: [{ required: true, message: '请选择提单类型', trigger: 'change' }],
  shipper: [{ required: true, message: '请输入托运人', trigger: 'blur' }],
  consignee: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  comment: [{ required: true, message: '请输入处理意见', trigger: 'blur' }],
}

const getStatusLabel = (status) => STATUS_LABELS[status] || status
const getStatusType = (status) => STATUS_TYPES[status] || 'info'

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const goToDetail = (id) => {
  router.push(`/bookings/${id}`)
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await bookingsApi.getList({
      status: 'PENDING_BOL_RELEASE',
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    if (result.success) {
      bookings.value = result.data?.list || []
      pagination.total = result.data?.total || 0
    }
  } catch (error) {
    console.error('Fetch bookings error:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleRelease = (row) => {
  currentBooking.value = row
  form.bolNo = ''
  form.bolType = 'SEA'
  form.shipper = row.shipperName || ''
  form.consignee = ''
  form.notifier = ''
  form.comment = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const result = await bookingsApi.releaseBol(currentBooking.value.id, {
          bolNo: form.bolNo,
          bolType: form.bolType,
          shipper: form.shipper,
          consignee: form.consignee,
          notifier: form.notifier,
          comment: form.comment,
        })
        if (result.success) {
          ElMessage.success('提单放单成功')
          dialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(result.message || '操作失败')
        }
      } catch (error) {
        console.error('Release BOL error:', error)
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
.bills-list {
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
</style>
