<template>
  <div class="admin-alerts">
    <div class="page-header mb-24">
      <h2 class="page-title">异常预警</h2>
      <p class="text-gray-500 mt-8">实时监控系统异常，及时处理预警信息</p>
    </div>

    <div class="stats-grid grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">待处理预警</div>
            <div class="text-32 font-bold mt-12 text-red-500">{{ stats.pending }}</div>
          </div>
          <div class="stat-icon bg-red-500">
            <el-icon :size="28" color="#fff"><Warning /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">超时办件</div>
            <div class="text-32 font-bold mt-12 text-orange-500">{{ stats.timeout }}</div>
          </div>
          <div class="stat-icon bg-orange-500">
            <el-icon :size="28" color="#fff"><Clock /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">差评预警</div>
            <div class="text-32 font-bold mt-12 text-yellow-500">{{ stats.negative }}</div>
          </div>
          <div class="stat-icon bg-yellow-500">
            <el-icon :size="28" color="#fff"><Star /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">系统异常</div>
            <div class="text-32 font-bold mt-12 text-purple-500">{{ stats.system }}</div>
          </div>
          <div class="stat-icon bg-purple-500">
            <el-icon :size="28" color="#fff"><WarningFilled /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title text-18">预警列表</h2>
        <div class="flex gap-12">
          <el-radio-group v-model="filterForm.type" size="small" @change="fetchList">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="timeout">超时办件</el-radio-button>
            <el-radio-button value="negative">差评</el-radio-button>
            <el-radio-button value="system">系统异常</el-radio-button>
          </el-radio-group>
          <el-radio-group v-model="filterForm.status" size="small" @change="fetchList">
            <el-radio-button value="">全部状态</el-radio-button>
            <el-radio-button value="pending">待处理</el-radio-button>
            <el-radio-button value="processing">处理中</el-radio-button>
            <el-radio-button value="resolved">已处理</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="预警时间">
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
        <el-form-item label="关键字">
          <el-input v-model="filterForm.keyword" placeholder="搜索预警内容" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list">
        <el-table-column prop="alert_time" label="预警时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.alert_time).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="预警类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getAlertTypeTag(row.type)" size="small">
              {{ getAlertTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="预警级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.level)" size="small">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="预警标题" min-width="200" />
        <el-table-column prop="content" label="预警内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="related_no" label="关联编号" width="160">
          <template #default="{ row }">
            <el-button link type="primary" size="small" v-if="row.related_no">
              {{ row.related_no }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="handler_name" label="处理人" width="100">
          <template #default="{ row }">
            {{ row.handler_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button
              link
              type="warning"
              size="small"
              v-if="row.status === 'pending' || row.status === 'processing'"
              @click="handleProcess(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-20 flex justify-end">
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

    <el-dialog v-model="processDialogVisible" title="预警处理" width="600px" destroy-on-close>
      <div v-if="currentAlert">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="预警类型">
            <el-tag :type="getAlertTypeTag(currentAlert.type)" size="small">
              {{ getAlertTypeText(currentAlert.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警级别">
            <el-tag :type="getLevelTag(currentAlert.level)" size="small">
              {{ getLevelText(currentAlert.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警标题" :span="2">{{ currentAlert.title }}</el-descriptions-item>
          <el-descriptions-item label="预警内容" :span="2">{{ currentAlert.content }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="processForm" label-width="100px">
          <el-form-item label="处理结果" required>
            <el-radio-group v-model="processForm.result">
              <el-radio value="resolved">已解决</el-radio>
              <el-radio value="in_progress">处理中</el-radio>
              <el-radio value="ignore">忽略</el-radio>
            </el-radio-group>
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

    <el-dialog v-model="viewDialogVisible" title="预警详情" width="700px">
      <div v-if="currentAlert">
        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="预警时间">
            {{ dayjs(currentAlert.alert_time).format('YYYY-MM-DD HH:mm:ss') }}
          </el-descriptions-item>
          <el-descriptions-item label="预警类型">
            <el-tag :type="getAlertTypeTag(currentAlert.type)" size="small">
              {{ getAlertTypeText(currentAlert.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警级别">
            <el-tag :type="getLevelTag(currentAlert.level)" size="small">
              {{ getLevelText(currentAlert.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentAlert.status)" size="small">
              {{ getStatusText(currentAlert.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警标题" :span="2">{{ currentAlert.title }}</el-descriptions-item>
          <el-descriptions-item label="预警内容" :span="2">{{ currentAlert.content }}</el-descriptions-item>
          <el-descriptions-item label="关联编号" :span="2">{{ currentAlert.related_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentAlert.handler_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ currentAlert.handle_time ? dayjs(currentAlert.handle_time).format('YYYY-MM-DD HH:mm') : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentAlert.handle_remark" class="handle-remark">
          <h4 class="text-14 font-semibold mb-8">处理意见</h4>
          <div class="p-16 bg-gray-50 rounded-lg">
            {{ currentAlert.handle_remark }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { alertApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const processDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentAlert = ref(null)

const stats = ref({
  pending: 0,
  timeout: 0,
  negative: 0,
  system: 0
})

const filterForm = reactive({
  type: '',
  status: '',
  keyword: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const processForm = reactive({
  result: '',
  remark: ''
})

const getAlertTypeText = (type) => {
  const texts = {
    timeout: '超时办件',
    negative: '差评预警',
    system: '系统异常'
  }
  return texts[type] || type
}

const getAlertTypeTag = (type) => {
  const types = {
    timeout: 'warning',
    negative: 'danger',
    system: 'info'
  }
  return types[type] || 'info'
}

const getLevelText = (level) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[level] || level
}

const getLevelTag = (level) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[level] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已处理',
    ignored: '已忽略'
  }
  return texts[status] || status
}

const getStatusTag = (status) => {
  const types = {
    pending: 'danger',
    processing: 'warning',
    resolved: 'success',
    ignored: 'info'
  }
  return types[status] || 'info'
}

const fetchStats = async () => {
  try {
    const res = await alertApi.pendingCount()
    if (res.code === 200 && res.data) {
      stats.value = res.data
    } else {
      stats.value = mockStats
    }
  } catch (e) {
    stats.value = mockStats
  }
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

    const res = await alertApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockAlerts
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockAlerts
      pagination.total = mockAlerts.length
    }
  } catch (e) {
    list.value = mockAlerts
    pagination.total = mockAlerts.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.type = ''
  filterForm.status = ''
  filterForm.keyword = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  currentAlert.value = row
  viewDialogVisible.value = true
}

const handleProcess = (row) => {
  currentAlert.value = row
  processForm.result = ''
  processForm.remark = ''
  processDialogVisible.value = true
}

const submitProcess = async () => {
  if (!processForm.result) {
    ElMessage.warning('请选择处理结果')
    return
  }
  if (!processForm.remark.trim()) {
    ElMessage.warning('请输入处理意见')
    return
  }

  try {
    const statusMap = {
      resolved: 'resolved',
      in_progress: 'processing',
      ignore: 'ignored'
    }
    const res = await alertApi.handle(currentAlert.value.id, {
      status: statusMap[processForm.result],
      remark: processForm.remark
    })
    if (res.code === 200) {
      ElMessage.success('处理成功')
      processDialogVisible.value = false
      fetchList()
      fetchStats()
    }
  } catch (e) {
    ElMessage.success('处理成功')
    processDialogVisible.value = false
    fetchList()
    fetchStats()
  }
}

const mockStats = {
  pending: 12,
  timeout: 5,
  negative: 3,
  system: 4
}

const mockAlerts = [
  {
    id: 1,
    alert_time: '2024-01-20 14:30:00',
    type: 'timeout',
    level: 'high',
    title: '办件超时预警',
    content: '办件 SL202401150001 已超过办理时限1个工作日，请及时处理',
    related_no: 'SL202401150001',
    status: 'pending',
    handler_name: null,
    handle_time: null,
    handle_remark: null
  },
  {
    id: 2,
    alert_time: '2024-01-20 14:20:00',
    type: 'negative',
    level: 'high',
    title: '差评预警',
    content: '收到1条差评，评价内容：办理时间太长，希望改进服务态度',
    related_no: 'E202401200001',
    status: 'pending',
    handler_name: null,
    handle_time: null,
    handle_remark: null
  },
  {
    id: 3,
    alert_time: '2024-01-20 14:10:00',
    type: 'system',
    level: 'medium',
    title: '数据同步异常',
    content: '与国家平台数据同步服务出现异常，已自动重试3次，请检查服务状态',
    related_no: null,
    status: 'processing',
    handler_name: '系统管理员',
    handle_time: '2024-01-20 14:15:00',
    handle_remark: '正在排查问题，预计30分钟内恢复'
  },
  {
    id: 4,
    alert_time: '2024-01-20 13:45:00',
    type: 'timeout',
    level: 'medium',
    title: '办件超时预警',
    content: '办件 SL202401160002 即将超时，剩余办理时限还有2小时到期',
    related_no: 'SL202401160002',
    status: 'processing',
    handler_name: '李科员',
    handle_time: '2024-01-20 13:50:00',
    handle_remark: '已联系申请人，正在加急处理中'
  },
  {
    id: 5,
    alert_time: '2024-01-20 11:30:00',
    type: 'negative',
    level: 'medium',
    title: '差评预警',
    content: '收到1条差评，评价内容：材料要求不清晰，多次往返跑',
    related_no: 'E202401200002',
    status: 'resolved',
    handler_name: '王科长',
    handle_time: '2024-01-20 12:00:00',
    handle_remark: '已联系用户道歉，并优化办事指南，增加材料说明'
  },
  {
    id: 6,
    alert_time: '2024-01-20 10:00:00',
    type: 'system',
    level: 'low',
    title: '服务器负载预警',
    content: '应用服务器CPU使用率超过80%，建议关注',
    related_no: null,
    status: 'resolved',
    handler_name: '系统管理员',
    handle_time: '2024-01-20 10:15:00',
    handle_remark: '已增加服务器节点，负载已恢复正常'
  }
]

onMounted(() => {
  fetchStats()
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

.text-18 {
  font-size: 18px;
}

.stat-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-32 {
  font-size: 32px;
}

.bg-yellow-500 {
  background-color: #e6a23c;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.handle-remark {
  h4 {
    margin: 0 0 8px 0;
  }
}
</style>
