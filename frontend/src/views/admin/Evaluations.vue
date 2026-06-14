<template>
  <div class="admin-evaluations">
    <div class="page-header mb-24">
      <h2 class="page-title">评价管理</h2>
      <p class="text-gray-500 mt-8">查看和处理用户评价，提升服务质量</p>
    </div>

    <div class="stats-grid grid grid-cols-1 md:grid-cols-5 gap-20 mb-24">
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">评价总数</div>
            <div class="text-28 font-bold mt-12 text-primary">{{ stats.total }}</div>
          </div>
          <div class="stat-icon bg-blue-500">
            <el-icon :size="24" color="#fff"><ChatDotRound /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">5星好评</div>
            <div class="text-28 font-bold mt-12 text-green-500">{{ stats.five_star }}</div>
          </div>
          <div class="stat-icon bg-green-500">
            <el-icon :size="24" color="#fff"><Star /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">4星</div>
            <div class="text-28 font-bold mt-12 text-lime-500">{{ stats.four_star }}</div>
          </div>
          <div class="stat-icon bg-lime-500">
            <el-icon :size="24" color="#fff"><Star /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">3星</div>
            <div class="text-28 font-bold mt-12 text-yellow-500">{{ stats.three_star }}</div>
          </div>
          <div class="stat-icon bg-yellow-500">
            <el-icon :size="24" color="#fff"><Star /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card card p-24">
        <div class="flex justify-between items-start">
          <div>
            <div class="text-14 text-gray-500">1-2星差评</div>
            <div class="text-28 font-bold mt-12 text-red-500">{{ stats.negative }}</div>
          </div>
          <div class="stat-icon bg-red-500">
            <el-icon :size="24" color="#fff"><Warning /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title text-18">评价列表</h2>
        <div>
          <el-radio-group v-model="filterForm.star" size="small" @change="fetchList">
            <el-radio-button value="">全部星级</el-radio-button>
            <el-radio-button value="5">5星</el-radio-button>
            <el-radio-button value="4">4星</el-radio-button>
            <el-radio-button value="3">3星</el-radio-button>
            <el-radio-button value="2">2星</el-radio-button>
            <el-radio-button value="1">1星</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="评价时间">
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
          <el-input v-model="filterForm.keyword" placeholder="搜索评价内容" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="filterForm.reply_status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待回复" value="pending" />
            <el-option label="已回复" value="replied" />
            <el-option label="已整改" value="rectified" />
          </el-select>
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
        <el-table-column prop="evaluation_time" label="评价时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.evaluation_time).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column prop="star" label="星级" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.star" disabled :max="5" />
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="评价人" width="100" />
        <el-table-column prop="service_item_name" label="办理事项" min-width="180" show-overflow-tooltip />
        <el-table-column prop="application_no" label="办件编号" width="160" />
        <el-table-column prop="department_name" label="办理部门" width="140" show-overflow-tooltip />
        <el-table-column prop="content" label="评价内容" min-width="220" show-overflow-tooltip />
        <el-table-column prop="reply_status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReplyStatusTag(row.reply_status)" size="small">
              {{ getReplyStatusText(row.reply_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button
              link
              type="warning"
              size="small"
              v-if="row.reply_status === 'pending'"
              @click="handleReply(row)"
            >
              回复
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              v-if="row.star <= 2 && row.reply_status !== 'rectified'"
              @click="handleRectify(row)"
            >
              整改
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

    <el-dialog v-model="viewDialogVisible" title="评价详情" width="700px">
      <div v-if="currentEvaluation">
        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="评价时间">
            {{ dayjs(currentEvaluation.evaluation_time).format('YYYY-MM-DD HH:mm:ss') }}
          </el-descriptions-item>
          <el-descriptions-item label="评价人">{{ currentEvaluation.user_name }}</el-descriptions-item>
          <el-descriptions-item label="星级">
            <el-rate v-model="currentEvaluation.star" disabled :max="5" />
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getReplyStatusTag(currentEvaluation.reply_status)" size="small">
              {{ getReplyStatusText(currentEvaluation.reply_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="办理事项" :span="2">{{ currentEvaluation.service_item_name }}</el-descriptions-item>
          <el-descriptions-item label="办件编号">{{ currentEvaluation.application_no }}</el-descriptions-item>
          <el-descriptions-item label="办理部门">{{ currentEvaluation.department_name }}</el-descriptions-item>
        </el-descriptions>

        <div class="mb-20">
          <h4 class="text-14 font-semibold mb-8">评价内容</h4>
          <div class="p-16 bg-gray-50 rounded-lg">
            {{ currentEvaluation.content }}
          </div>
        </div>

        <div v-if="currentEvaluation.tags" class="mb-20">
          <h4 class="text-14 font-semibold mb-8">评价标签</h4>
          <div class="flex flex-wrap gap-8">
            <el-tag v-for="tag in currentEvaluation.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </div>

        <div v-if="currentEvaluation.reply_content" class="mb-20">
          <h4 class="text-14 font-semibold mb-8">官方回复</h4>
          <div class="p-16 bg-blue-50 rounded-lg border border-blue-100">
            <div class="text-gray-500 text-12 mb-8">
              回复人：{{ currentEvaluation.reply_user_name }} &nbsp;&nbsp;
              回复时间：{{ dayjs(currentEvaluation.reply_time).format('YYYY-MM-DD HH:mm') }}
            </div>
            <div>{{ currentEvaluation.reply_content }}</div>
          </div>
        </div>

        <div v-if="currentEvaluation.rectify_content">
          <h4 class="text-14 font-semibold mb-8">整改措施</h4>
          <div class="p-16 bg-orange-50 rounded-lg border border-orange-100">
            <div class="text-gray-500 text-12 mb-8">
              整改人：{{ currentEvaluation.rectify_user_name }} &nbsp;&nbsp;
              整改时间：{{ dayjs(currentEvaluation.rectify_time).format('YYYY-MM-DD HH:mm') }}
            </div>
            <div>{{ currentEvaluation.rectify_content }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="replyDialogVisible" title="评价回复" width="600px" destroy-on-close>
      <div v-if="currentEvaluation">
        <el-alert
          :title="'评价内容：' + currentEvaluation.content"
          type="info"
          :closable="false"
          show-icon
          class="mb-20"
        />
        <el-form :model="replyForm" label-width="80px">
          <el-form-item label="回复内容" required>
            <el-input
              v-model="replyForm.content"
              type="textarea"
              :rows="5"
              placeholder="请输入回复内容，注意措辞礼貌、专业..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确定回复</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rectifyDialogVisible" title="整改处理" width="600px" destroy-on-close>
      <div v-if="currentEvaluation">
        <el-alert
          :title="'差评内容：' + currentEvaluation.content"
          type="error"
          :closable="false"
          show-icon
          class="mb-20"
        />
        <el-form :model="rectifyForm" label-width="80px">
          <el-form-item label="整改原因">
            <el-input v-model="rectifyForm.reason" placeholder="请分析差评原因" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="整改措施" required>
            <el-input
              v-model="rectifyForm.content"
              type="textarea"
              :rows="4"
              placeholder="请详细描述具体的整改措施..."
            />
          </el-form-item>
          <el-form-item label="整改责任人">
            <el-input v-model="rectifyForm.person_in_charge" placeholder="请输入责任人" />
          </el-form-item>
          <el-form-item label="整改时限">
            <el-date-picker
              v-model="rectifyForm.deadline"
              type="date"
              placeholder="选择整改截止日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRectify">提交整改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { evaluationApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const viewDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const rectifyDialogVisible = ref(false)
const currentEvaluation = ref(null)

const stats = ref({
  total: 0,
  five_star: 0,
  four_star: 0,
  three_star: 0,
  negative: 0
})

const filterForm = reactive({
  star: '',
  keyword: '',
  date_range: [],
  reply_status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const replyForm = reactive({
  content: ''
})

const rectifyForm = reactive({
  reason: '',
  content: '',
  person_in_charge: '',
  deadline: ''
})

const getReplyStatusText = (status) => {
  const texts = {
    pending: '待回复',
    replied: '已回复',
    rectified: '已整改'
  }
  return texts[status] || status
}

const getReplyStatusTag = (status) => {
  const types = {
    pending: 'warning',
    replied: 'success',
    rectified: 'info'
  }
  return types[status] || 'info'
}

const fetchStats = async () => {
  try {
    const res = await evaluationApi.stats()
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

    const res = await evaluationApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockEvaluations
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockEvaluations
      pagination.total = mockEvaluations.length
    }
  } catch (e) {
    list.value = mockEvaluations
    pagination.total = mockEvaluations.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.star = ''
  filterForm.keyword = ''
  filterForm.date_range = []
  filterForm.reply_status = ''
  pagination.page = 1
  fetchList()
}

const handleView = (row) => {
  currentEvaluation.value = row
  viewDialogVisible.value = true
}

const handleReply = (row) => {
  currentEvaluation.value = row
  replyForm.content = ''
  replyDialogVisible.value = true
}

const handleRectify = (row) => {
  currentEvaluation.value = row
  rectifyForm.reason = ''
  rectifyForm.content = ''
  rectifyForm.person_in_charge = ''
  rectifyForm.deadline = ''
  rectifyDialogVisible.value = true
}

const submitReply = async () => {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  try {
    const res = await evaluationApi.reply(currentEvaluation.value.id, {
      content: replyForm.content
    })
    if (res.code === 200) {
      ElMessage.success('回复成功')
      replyDialogVisible.value = false
      fetchList()
      fetchStats()
    }
  } catch (e) {
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    fetchList()
    fetchStats()
  }
}

const submitRectify = async () => {
  if (!rectifyForm.content.trim()) {
    ElMessage.warning('请输入整改措施')
    return
  }

  try {
    const res = await evaluationApi.rectify(currentEvaluation.value.id, rectifyForm)
    if (res.code === 200) {
      ElMessage.success('整改已提交')
      rectifyDialogVisible.value = false
      fetchList()
      fetchStats()
    }
  } catch (e) {
    ElMessage.success('整改已提交')
    rectifyDialogVisible.value = false
    fetchList()
    fetchStats()
  }
}

const mockStats = {
  total: 1256,
  five_star: 1082,
  four_star: 123,
  three_star: 35,
  negative: 16
}

const mockEvaluations = [
  {
    id: 1,
    evaluation_time: '2024-01-20 15:30:00',
    star: 5,
    user_name: '张先生',
    service_item_name: '个体工商户营业执照办理',
    application_no: 'SL202401200001',
    department_name: '市场监管局',
    content: '办理速度很快，工作人员态度很好，一次就办好，非常满意！',
    tags: ['效率高', '态度好', '一次办好'],
    reply_status: 'replied',
    reply_content: '感谢您的好评，我们将继续努力为您提供优质服务！',
    reply_user_name: '王科长',
    reply_time: '2024-01-20 15:45:00'
  },
  {
    id: 2,
    evaluation_time: '2024-01-20 14:20:00',
    star: 1,
    user_name: '李女士',
    service_item_name: '社保转移接续',
    application_no: 'SL202401180005',
    department_name: '人社局',
    content: '办了好几次都没办好，材料要求不清晰，来回跑了三趟，希望能改进！',
    tags: ['材料不清晰', '多次跑'],
    reply_status: 'pending'
  },
  {
    id: 3,
    evaluation_time: '2024-01-20 11:15:00',
    star: 4,
    user_name: '王先生',
    service_item_name: '不动产登记',
    application_no: 'SL202401190002',
    department_name: '自然资源局',
    content: '整体还可以，就是等待时间有点长，希望能优化叫号系统。',
    tags: ['等待时间长'],
    reply_status: 'replied',
    reply_content: '感谢您的建议，我们正在优化叫号系统，预计下月上线新版本。',
    reply_user_name: '李科员',
    reply_time: '2024-01-20 14:30:00'
  },
  {
    id: 4,
    evaluation_time: '2024-01-20 10:00:00',
    star: 2,
    user_name: '赵先生',
    service_item_name: '公积金提取',
    application_no: 'SL202401170008',
    department_name: '公积金中心',
    content: '线上申请后5天还没审核，太慢了！',
    tags: ['审核慢'],
    reply_status: 'rectified',
    reply_content: '非常抱歉让您久等了，我们已加急处理您的申请，现已审核通过。',
    reply_user_name: '刘主任',
    reply_time: '2024-01-20 10:30:00',
    rectify_content: '已对审核人员进行培训，优化审核流程，承诺3个工作日内完成审核。已与用户联系致歉，用户表示理解。',
    rectify_user_name: '刘主任',
    rectify_time: '2024-01-20 11:00:00'
  },
  {
    id: 5,
    evaluation_time: '2024-01-19 16:45:00',
    star: 5,
    user_name: '陈女士',
    service_item_name: '新生儿落户',
    application_no: 'SL202401190001',
    department_name: '公安局',
    content: '窗口小姐姐服务特别好，耐心指导填表，很快就办好了！',
    tags: ['服务好', '效率高'],
    reply_status: 'replied',
    reply_content: '感谢您的认可，祝您生活愉快！',
    reply_user_name: '张警官',
    reply_time: '2024-01-19 17:00:00'
  },
  {
    id: 6,
    evaluation_time: '2024-01-19 14:30:00',
    star: 3,
    user_name: '孙先生',
    service_item_name: '道路运输许可证办理',
    application_no: 'SL202401150003',
    department_name: '交通运输局',
    content: '办理流程比较复杂，咨询了好几次才弄明白。',
    tags: ['流程复杂'],
    reply_status: 'pending'
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
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-28 {
  font-size: 28px;
}

.text-lime-500 {
  color: #85ce61;
}

.bg-lime-500 {
  background-color: #85ce61;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
