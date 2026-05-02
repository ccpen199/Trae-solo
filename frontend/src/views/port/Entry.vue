<template>
  <div class="port-entry">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">港口进场</span>
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
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="handleAction(row, 'PASS')">
              通过
            </el-button>
            <el-button type="danger" link @click="handleAction(row, 'REJECT')">
              驳回
            </el-button>
            <el-button type="warning" link @click="handleAction(row, 'SUPPLEMENT')">
              补充资料
            </el-button>
            <el-button type="primary" link @click="handleAction(row, 'REASSIGN')">
              转派
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
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="订舱单号">
          <el-input :value="currentBooking?.mainNo" disabled />
        </el-form-item>
        <el-form-item label="货主">
          <el-input :value="currentBooking?.shipperName" disabled />
        </el-form-item>
        <el-form-item v-if="currentAction === 'REASSIGN'" label="新责任人" prop="newOwner">
          <el-input
            v-model="form.newOwner"
            placeholder="请输入新责任人"
          />
        </el-form-item>
        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          :type="currentAction === 'PASS' ? 'success' : currentAction === 'REJECT' ? 'danger' : 'primary'"
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
import { useRouter } from 'vue-router'
import { bookingsApi } from '@/api'
import { STATUS_LABELS, STATUS_TYPES } from '@/utils/constants'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const bookings = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const currentBooking = ref(null)
const currentAction = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const form = reactive({
  comment: '',
  newOwner: '',
})

const rules = {
  comment: [{ required: true, message: '请输入审批意见', trigger: 'blur' }],
  newOwner: [{ required: true, message: '请输入新责任人', trigger: 'blur' }],
}

const dialogTitle = computed(() => {
  const titles = {
    PASS: '港口进场 - 通过',
    REJECT: '港口进场 - 驳回',
    SUPPLEMENT: '港口进场 - 补充资料',
    REASSIGN: '港口进场 - 转派',
  }
  return titles[currentAction.value] || '港口进场处理'
})

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
      status: 'PENDING_PORT_ENTRY',
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

const handleAction = (row, action) => {
  currentBooking.value = row
  currentAction.value = action
  form.comment = ''
  form.newOwner = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let result
        const { comment, newOwner } = form
        const id = currentBooking.value.id

        if (currentAction.value === 'PASS') {
          result = await bookingsApi.portEntry(id, { comment, action: 'PASS' })
        } else if (currentAction.value === 'REJECT') {
          result = await bookingsApi.portEntry(id, { comment, action: 'REJECT' })
        } else if (currentAction.value === 'SUPPLEMENT') {
          result = await bookingsApi.portEntry(id, { comment, action: 'SUPPLEMENT' })
        } else if (currentAction.value === 'REASSIGN') {
          result = await bookingsApi.portEntry(id, { comment, action: 'REASSIGN', newOwner })
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
.port-entry {
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
