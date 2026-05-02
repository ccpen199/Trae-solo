<template>
  <div class="container-assign">
    <el-card>
      <template #header>
        <div class="card-toolbar">
          <span class="card-title">箱号分配</span>
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
        <el-table-column prop="containerType" label="箱型" width="100" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleAssign(row)">
              分配箱号
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
      title="分配箱号"
      width="600px"
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
        <el-form-item label="集装箱数">
          <el-input :value="currentBooking?.containerCount" disabled />
        </el-form-item>
        <el-form-item label="箱型">
          <el-input :value="currentBooking?.containerType" disabled />
        </el-form-item>
        <el-form-item label="箱号" prop="containerNo">
          <el-input
            v-model="form.containerNo"
            placeholder="请输入箱号（如：MSKU1234567）"
          />
          <div class="form-tip">
            箱号格式：4个字母（公司代码）+ 6个数字 + 1个校验位
          </div>
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
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { bookingsApi, containerApi } from '@/api'
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
  containerNo: '',
  comment: '',
})

const rules = {
  containerNo: [
    { required: true, message: '请输入箱号', trigger: 'blur' },
    {
      pattern: /^[A-Z]{4}\d{7}$/,
      message: '箱号格式应为4个字母+7个数字',
      trigger: 'blur',
    },
  ],
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
      status: 'PENDING_CONTAINER',
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

const handleAssign = (row) => {
  currentBooking.value = row
  form.containerNo = ''
  form.comment = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const result = await containerApi.assign(currentBooking.value.id, {
          containerNo: form.containerNo,
          comment: form.comment,
        })
        if (result.success) {
          ElMessage.success('箱号分配成功')
          dialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(result.message || '分配失败')
        }
      } catch (error) {
        console.error('Assign container error:', error)
        ElMessage.error('分配失败')
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
.container-assign {
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
