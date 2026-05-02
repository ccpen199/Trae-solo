<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>主单台账</span>
          <el-button type="primary" @click="$router.push('/orders/create')">
            <el-icon><Plus /></el-icon>
            新建日志采集
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="待日志采集" value="pending_collect" />
            <el-option label="待解析索引" value="pending_parse" />
            <el-option label="待查询分析" value="pending_query" />
            <el-option label="待告警" value="pending_alert" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="主单号/标题" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="order_no" label="主单号" width="200" fixed />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :class="['status-tag', row.status]">
              {{ row.statusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="assignee_name" label="责任人" width="100" />
        <el-table-column prop="expected_finish_time" label="期望完成时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.expected_finish_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
            <el-button 
              v-if="row.status === 'pending_collect'" 
              type="success" 
              link 
              @click="handleSubmitCollect(row)"
            >
              提交采集
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
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="submitDialogVisible" title="提交采集" width="500px">
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="处理意见">
          <el-input
            v-model="submitForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmSubmitCollect">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, submitCollect } from '@/api/orders'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const submitDialogVisible = ref(false)
const currentOrderId = ref(null)

const searchForm = reactive({
  status: '',
  keyword: ''
})

const submitForm = reactive({
  comment: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const priorityLabels = {
  low: '低',
  normal: '中',
  high: '高',
  urgent: '紧急'
}

const priorityTypes = {
  low: 'info',
  normal: '',
  high: 'warning',
  urgent: 'danger'
}

const getPriorityLabel = (priority) => priorityLabels[priority] || '中'
const getPriorityType = (priority) => priorityTypes[priority] || ''

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword

    const res = await getOrders(params)
    tableData.value = res.data
    pagination.total = res.total
  } catch (error) {
    console.error('获取主单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.keyword = ''
  pagination.page = 1
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

const viewDetail = (id) => {
  router.push(`/orders/${id}`)
}

const handleSubmitCollect = (row) => {
  currentOrderId.value = row.id
  submitForm.comment = ''
  submitDialogVisible.value = true
}

const confirmSubmitCollect = async () => {
  submitting.value = true
  try {
    await submitCollect(currentOrderId.value, {
      comment: submitForm.comment
    })
    ElMessage.success('提交成功')
    submitDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('提交采集失败:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (route.query.status) {
    searchForm.status = route.query.status
  }
  fetchData()
})

watch(() => route.query.status, (newStatus) => {
  if (newStatus) {
    searchForm.status = newStatus
    fetchData()
  }
})
</script>

<style scoped>
.order-list {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
