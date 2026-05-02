<template>
  <div class="orders-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>主单列表</span>
          <el-button type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            新建流水线单
          </el-button>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable @change="handleSearch">
              <el-option label="待代码提交" value="pending_code" />
              <el-option label="待触发流水线" value="pending_trigger" />
              <el-option label="待构建测试" value="pending_build" />
              <el-option label="待部署" value="pending_deploy" />
              <el-option label="待监控回滚" value="pending_monitor" />
              <el-option label="已完成" value="completed" />
              <el-option label="失败" value="failed" />
              <el-option label="已回滚" value="rolled_back" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="order_no" label="主单号" width="180">
          <template #default="scope">
            <el-button type="primary" link @click="viewDetail(scope.row.id)">
              {{ scope.row.order_no }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="pipeline_name" label="流水线" width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="130">
          <template #default="scope">
            <el-tag :class="`status-tag-${scope.row.status}`" size="small">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="当前责任人" width="120" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="viewDetail(scope.row.id)">详情</el-button>
            <el-button 
              v-if="scope.row.available_actions.length > 0" 
              type="success" 
              link 
              size="small"
              @click="handleAction(scope.row)"
            >
              操作
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 操作对话框 -->
    <el-dialog v-model="actionDialogVisible" title="执行操作" width="500px">
      <el-form v-if="currentOrder" :model="actionForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :class="`status-tag-${currentOrder.status}`" size="large">
            {{ currentOrder.status_text }}
          </el-tag>
        </el-form-item>
        <el-form-item label="可用动作">
          <el-radio-group v-model="actionForm.action">
            <el-radio 
              v-for="action in currentOrder.available_actions" 
              :key="action" 
              :value="action"
            >
              {{ getActionText(action) }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="actionForm.resultData.buildSuccess" v-if="actionForm.action === 'start_build' || actionForm.action === 'retry_build'">
            <el-radio :value="true">构建成功</el-radio>
            <el-radio :value="false">构建失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注/意见">
          <el-input 
            v-model="actionForm.comment" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注或审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrders, executeOrderAction } from '@/utils/api'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const actionDialogVisible = ref(false)
const actionLoading = ref(false)
const currentOrder = ref(null)

const searchForm = reactive({
  status: route.query.status || ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const actionForm = reactive({
  action: '',
  resultData: { buildSuccess: true },
  comment: ''
})

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const actionTextMap = {
  submit_code: '提交代码',
  trigger_pipeline: '触发流水线',
  start_build: '开始构建',
  retry_build: '重试构建',
  approve_deploy: '审批部署',
  start_deploy: '开始部署',
  approve_pass: '审批通过',
  reject: '驳回',
  supplement: '补充资料',
  reassign: '转派',
  rollback: '回滚',
  retry: '重试'
}

const getActionText = (action) => {
  return actionTextMap[action] || action
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    
    const res = await getOrders(params)
    if (res.success) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (e) {
    console.error('获取数据失败', e)
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
  pagination.page = 1
  fetchData()
}

const goToCreate = () => {
  router.push('/orders/create')
}

const viewDetail = (id) => {
  router.push(`/orders/${id}`)
}

const handleAction = (row) => {
  currentOrder.value = row
  actionForm.action = row.available_actions[0] || ''
  actionForm.comment = ''
  actionForm.resultData = { buildSuccess: true }
  actionDialogVisible.value = true
}

const submitAction = async () => {
  if (!actionForm.action) {
    ElMessage.warning('请选择要执行的动作')
    return
  }

  actionLoading.value = true
  try {
    const res = await executeOrderAction(
      currentOrder.value.id,
      actionForm.action,
      actionForm.resultData,
      actionForm.comment
    )
    if (res.success) {
      ElMessage.success('操作成功')
      actionDialogVisible.value = false
      fetchData()
    }
  } catch (e) {
    console.error('操作失败', e)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.orders-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
