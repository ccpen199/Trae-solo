<template>
  <div class="exceptions-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常队列</span>
          <div>
            <el-select v-model="filterStatus" placeholder="全部状态" clearable @change="fetchExceptions" style="width: 150px; margin-right: 10px">
              <el-option label="待处理" value="pending" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已升级" value="escalated" />
              <el-option label="已关闭" value="closed" />
            </el-select>
            <el-button type="primary" @click="fetchExceptions">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="exceptionList" v-loading="loading" style="width: 100%">
        <el-table-column prop="queue_id" label="队列ID" width="180" />
        <el-table-column prop="exception_type" label="异常类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getExceptionTypeTag(row.exception_type)">{{ getExceptionTypeName(row.exception_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="main_order_no" label="关联主单" width="180">
          <template #default="{ row }">
            <el-link v-if="row.main_order_no" type="primary" @click="goToOrder(row.main_order_no)">
              {{ row.main_order_no }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="retry_count" label="重试次数" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'" 
              type="primary" 
              link 
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
            <el-button v-else type="info" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchExceptions"
        @current-change="fetchExceptions"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="handleDialog.visible" title="处理异常" width="600px">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 20px">
        <el-descriptions-item label="队列ID">{{ handleDialog.exception?.queue_id }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">{{ getExceptionTypeName(handleDialog.exception?.exception_type) }}</el-descriptions-item>
        <el-descriptions-item label="关联主单">{{ handleDialog.exception?.main_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ getStatusName(handleDialog.exception?.status) }}</el-descriptions-item>
        <el-descriptions-item label="原始数据" :span="2">
          <el-input
            type="textarea"
            :rows="3"
            :model-value="formatOriginalData(handleDialog.exception?.original_data)"
            disabled
          ></el-input>
        </el-descriptions-item>
      </el-descriptions>
      <el-form label-width="100px">
        <el-form-item label="处理方式">
          <el-radio-group v-model="handleDialog.action">
            <el-radio value="resolve">解决</el-radio>
            <el-radio value="escalate">升级</el-radio>
            <el-radio value="close">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input 
            v-model="handleDialog.handle_result" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入处理结果"
          ></el-input>
        </el-form-item>
        <el-form-item label="补偿数据" v-if="handleDialog.action === 'resolve'">
          <el-input 
            v-model="handleDialog.compensation_data" 
            type="textarea" 
            :rows="2" 
            placeholder="补偿数据（JSON格式）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="actionLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { exceptionApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const exceptionList = ref([])
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const handleDialog = reactive({
  visible: false,
  exception: null,
  action: 'resolve',
  handle_result: '',
  compensation_data: ''
})

const exceptionTypeMap = {
  drift: { name: '定位漂移', tag: 'danger' },
  route_deviation: { name: '路线偏离', tag: 'danger' },
  abnormal_stop: { name: '异常停留', tag: 'warning' },
  driver_refuse: { name: '司机拒接', tag: 'danger' },
  arrival_unconfirmed: { name: '到达未确认', tag: 'warning' },
  map_callback_delay: { name: '地图回调延迟', tag: 'info' }
}

const statusMap = {
  pending: { name: '待处理', tag: 'warning' },
  resolved: { name: '已解决', tag: 'success' },
  escalated: { name: '已升级', tag: 'danger' },
  closed: { name: '已关闭', tag: 'info' },
  handled: { name: '已处理', tag: 'info' }
}

function getExceptionTypeName(type) {
  return exceptionTypeMap[type]?.name || type
}

function getExceptionTypeTag(type) {
  return exceptionTypeMap[type]?.tag || 'info'
}

function getStatusName(status) {
  return statusMap[status]?.name || status
}

function getStatusTag(status) {
  return statusMap[status]?.tag || 'info'
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function formatOriginalData(data) {
  if (!data) return ''
  try {
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

async function fetchExceptions() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (filterStatus.value) {
      params.status = filterStatus.value
    }

    const result = await exceptionApi.list(params)
    exceptionList.value = result.data
    pagination.total = result.pagination.total
  } catch (error) {
    console.error('获取异常队列失败:', error)
  } finally {
    loading.value = false
  }
}

function openHandleDialog(exception) {
  handleDialog.exception = exception
  handleDialog.action = 'resolve'
  handleDialog.handle_result = ''
  handleDialog.compensation_data = ''
  handleDialog.visible = true
}

function viewDetail(exception) {
  console.log('查看异常详情:', exception)
  ElMessage.info('详情功能开发中')
}

async function submitHandle() {
  if (!handleDialog.exception) return
  
  actionLoading.value = true
  try {
    const data = {
      action: handleDialog.action,
      handle_result: handleDialog.handle_result
    }
    
    if (handleDialog.compensation_data) {
      try {
        data.compensation_data = JSON.parse(handleDialog.compensation_data)
      } catch {
        data.compensation_data = { raw: handleDialog.compensation_data }
      }
    }

    await exceptionApi.handle(handleDialog.exception.queue_id, data)
    ElMessage.success('处理成功')
    handleDialog.visible = false
    fetchExceptions()
  } catch (error) {
    console.error('处理失败:', error)
  } finally {
    actionLoading.value = false
  }
}

function goToOrder(mainOrderNo) {
  router.push(`/orders/${mainOrderNo}`)
}

onMounted(() => {
  fetchExceptions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
