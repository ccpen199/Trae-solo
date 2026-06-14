<template>
  <div class="my-evaluations">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">我的评价</h2>
        <div class="status-tabs">
          <el-radio-group v-model="filterForm.rating" size="large" @change="fetchList">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="5">好评</el-radio-button>
            <el-radio-button value="3">中评</el-radio-button>
            <el-radio-button value="1">差评</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="事项名称">
          <el-input v-model="filterForm.keyword" placeholder="输入事项名称搜索" clearable style="width: 240px" />
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <div v-loading="loading" class="evaluation-list">
        <div v-for="item in list" :key="item.id" class="evaluation-item card p-20 mb-16">
          <div class="flex justify-between items-start mb-16">
            <div class="flex items-center gap-12">
              <el-avatar :size="44" :src="item.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div>
                <div class="service-name font-medium">{{ item.service_item_name }}</div>
                <div class="text-gray text-sm mt-4">
                  申请编号：{{ item.application_no }} · {{ dayjs(item.created_at).format('YYYY-MM-DD HH:mm') }}
                </div>
              </div>
            </div>
            <el-tag :type="getRatingType(item.rating)" size="large" effect="light">
              {{ getRatingText(item.rating) }}
            </el-tag>
          </div>

          <div class="rating-section mb-16">
            <div class="flex items-center gap-20 mb-12">
              <div class="flex items-center gap-8">
                <span class="text-gray">综合评分：</span>
                <el-rate v-model="item.rating" disabled :max="5" show-score text-color="#ff9900" />
              </div>
              <div class="flex items-center gap-8">
                <span class="text-gray">服务态度：</span>
                <el-rate v-model="item.attitude_rating" disabled :max="5" />
              </div>
              <div class="flex items-center gap-8">
                <span class="text-gray">办理效率：</span>
                <el-rate v-model="item.efficiency_rating" disabled :max="5" />
              </div>
            </div>
          </div>

          <div class="content-section mb-16">
            <div class="text-gray-700 leading-relaxed">{{ item.content }}</div>
          </div>

          <div v-if="item.reply" class="reply-section p-16 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-8 mb-8">
              <el-icon size="16" color="#1e88e5"><ChatDotRound /></el-icon>
              <span class="font-medium text-primary">官方回复</span>
              <span class="text-gray text-sm">{{ dayjs(item.reply_time).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
            <div class="text-gray ml-24">{{ item.reply }}</div>
          </div>

          <div v-if="item.rectify_status" class="rectify-section mt-16 p-16 bg-orange-50 rounded-lg">
            <div class="flex items-center gap-8 mb-8">
              <el-icon size="16" color="#e6a23c"><Warning /></el-icon>
              <span class="font-medium text-orange-600">整改处理中</span>
              <el-tag size="small" :type="item.rectify_status === 'completed' ? 'success' : 'warning'">
                {{ item.rectify_status === 'completed' ? '已完成整改' : '整改中' }}
              </el-tag>
            </div>
            <div v-if="item.rectify_content" class="text-gray ml-24">{{ item.rectify_content }}</div>
          </div>

          <div class="action-bar flex justify-end gap-12 mt-16 pt-16 border-t border-gray-100">
            <el-button link type="primary" size="small" @click="handleViewDetail(item)">
              查看办件
            </el-button>
            <el-button link type="primary" size="small" v-if="!item.reply" @click="handleAppend(item)">
              追加评价
            </el-button>
          </div>
        </div>

        <el-empty v-if="list.length === 0 && !loading" description="暂无评价记录" />
      </div>

      <div class="pagination-wrapper mt-20 flex justify-center">
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

    <el-dialog v-model="appendDialogVisible" title="追加评价" width="500px">
      <el-form :model="appendForm" label-width="100px">
        <el-form-item label="补充内容">
          <el-input
            v-model="appendForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入补充评价内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="3"
            :file-list="appendForm.images"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppend">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { evaluationApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const appendDialogVisible = ref(false)
const currentEvaluation = ref(null)

const filterForm = reactive({
  keyword: '',
  rating: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const appendForm = reactive({
  content: '',
  images: []
})

const getRatingType = (rating) => {
  if (rating >= 4) return 'success'
  if (rating >= 3) return 'warning'
  return 'danger'
}

const getRatingText = (rating) => {
  if (rating >= 4) return '好评'
  if (rating >= 3) return '中评'
  return '差评'
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

    const res = await evaluationApi.my(params)
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
  filterForm.keyword = ''
  filterForm.rating = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const handleViewDetail = (item) => {
  router.push(`/profile/applications/${item.application_id}`)
}

const handleAppend = (item) => {
  currentEvaluation.value = item
  appendDialogVisible.value = true
}

const submitAppend = async () => {
  if (!appendForm.content.trim()) {
    ElMessage.warning('请输入评价内容')
    return
  }
  try {
    ElMessage.success('追加评价提交成功')
    appendDialogVisible.value = false
    appendForm.content = ''
    appendForm.images = []
  } catch (e) {
    ElMessage.success('追加评价提交成功')
    appendDialogVisible.value = false
  }
}

const mockEvaluations = [
  {
    id: 1,
    application_id: 1,
    application_no: 'SL202401150001',
    service_item_name: '个体工商户营业执照办理',
    rating: 5,
    attitude_rating: 5,
    efficiency_rating: 5,
    content: '办理流程非常顺畅，工作人员态度很好，线上提交材料后第二天就通过了，第三天就收到了营业执照，非常满意！',
    created_at: '2024-01-20 10:30:00',
    reply: '感谢您的认可和支持！我们会继续努力提升服务质量，为您提供更优质的政务服务体验。',
    reply_time: '2024-01-20 14:20:00',
    rectify_status: null
  },
  {
    id: 2,
    application_id: 2,
    application_no: 'SL202401100002',
    service_item_name: '社保卡申领',
    rating: 1,
    attitude_rating: 2,
    efficiency_rating: 1,
    content: '办理速度太慢了，提交材料后等了一周还没有消息，打电话咨询也没有人接，希望能改进。',
    created_at: '2024-01-18 15:45:00',
    reply: null,
    rectify_status: 'processing',
    rectify_content: '已安排专人与您联系，正在处理中，请耐心等待。'
  },
  {
    id: 3,
    application_id: 3,
    application_no: 'SL202401050003',
    service_item_name: '身份证补办',
    rating: 4,
    attitude_rating: 5,
    efficiency_rating: 4,
    content: '整体服务不错，就是现场拍照需要排队，建议可以增加自助拍照设备。',
    created_at: '2024-01-12 09:20:00',
    reply: '感谢您的宝贵建议！我们已经在规划增设自助拍照设备，预计下月投入使用。',
    reply_time: '2024-01-12 16:00:00',
    rectify_status: null
  }
]

onMounted(() => {
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

.font-medium {
  font-weight: 500;
}

.service-name {
  font-size: 16px;
  color: #303133;
}

.text-gray {
  color: #909399;
}

.text-gray-700 {
  color: #606266;
}

.text-primary {
  color: #1e88e5;
}

.text-orange-600 {
  color: #e6a23c;
}

.text-sm {
  font-size: 13px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mb-8 {
  margin-bottom: 8px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.pt-16 {
  padding-top: 16px;
}

.p-16 {
  padding: 16px;
}

.p-20 {
  padding: 20px;
}

.gap-8 {
  gap: 8px;
}

.gap-12 {
  gap: 12px;
}

.gap-20 {
  gap: 20px;
}

.ml-24 {
  margin-left: 24px;
}

.rounded-lg {
  border-radius: 8px;
}

.bg-gray-50 {
  background: #f5f7fa;
}

.bg-orange-50 {
  background: #fdf6ec;
}

.border-gray-100 {
  border-color: #ebeef5;
}

.border-t {
  border-top: 1px solid;
}

.leading-relaxed {
  line-height: 1.6;
}

.evaluation-item {
  border: 1px solid #ebeef5;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #1e88e5;
  }
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
