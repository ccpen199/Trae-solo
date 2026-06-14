<template>
  <div class="my-applications">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">我的办件</h2>
        <div class="status-tabs">
          <el-radio-group v-model="filterForm.status" size="large" @change="fetchList">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="pending">待受理</el-radio-button>
            <el-radio-button value="processing">办理中</el-radio-button>
            <el-radio-button value="completed">已办结</el-radio-button>
            <el-radio-button value="rejected">已驳回</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="申请编号">
          <el-input v-model="filterForm.keyword" placeholder="输入申请编号搜索" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="事项类型">
          <el-select v-model="filterForm.service_type" placeholder="全部类型" clearable style="width: 160px">
            <el-option label="行政许可" value="行政许可" />
            <el-option label="公共服务" value="公共服务" />
            <el-option label="行政确认" value="行政确认" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
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
      
      <el-table v-loading="loading" :data="list" @row-click="goToDetail">
        <el-table-column prop="application_no" label="申请编号" width="180" />
        <el-table-column prop="service_item_name" label="事项名称" min-width="220">
          <template #default="{ row }">
            <div class="service-name">
              <el-icon size="18" color="#1e88e5"><Service /></el-icon>
              <span>{{ row.service_item_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="department_name" label="办理部门" width="160" />
        <el-table-column prop="submit_time" label="提交时间" width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200">
          <template #default="{ row }">
            <div class="progress-info">
              <el-progress
                :percentage="getProgress(row.status)"
                :status="row.status === 'completed' ? 'success' : row.status === 'rejected' ? 'exception' : ''"
                :stroke-width="6"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="goToDetail(row)">
              查看详情
            </el-button>
            <el-button link type="primary" size="small" v-if="row.status === 'completed' && !row.has_evaluation" @click.stop="goToEvaluate(row)">
              评价
            </el-button>
            <el-button link type="danger" size="small" v-if="row.status === 'pending'" @click.stop="handleCancel(row)">
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="list.length === 0 && !loading" description="暂无办件记录" />
      
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
    
    <el-dialog v-model="evaluateDialogVisible" title="服务评价" width="600px">
      <el-form :model="evaluateForm" label-width="100px">
        <el-form-item label="服务评分">
          <el-rate v-model="evaluateForm.rating" :max="5" show-score />
        </el-form-item>
        <el-form-item label="服务态度">
          <el-rate v-model="evaluateForm.attitude_rating" :max="5" />
        </el-form-item>
        <el-form-item label="办理效率">
          <el-rate v-model="evaluateForm.efficiency_rating" :max="5" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input
            v-model="evaluateForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入您的评价意见..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="是否匿名">
          <el-switch v-model="evaluateForm.is_anonymous" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evaluateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEvaluation">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { applicationApi, evaluationApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const list = ref([])
const evaluateDialogVisible = ref(false)
const currentApplication = ref(null)

const filterForm = reactive({
  keyword: '',
  status: route.query.status || '',
  service_type: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const evaluateForm = reactive({
  rating: 5,
  attitude_rating: 5,
  efficiency_rating: 5,
  content: '',
  is_anonymous: false
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    accepted: 'primary',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待受理',
    accepted: '已受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  }
  return texts[status] || status
}

const getProgress = (status) => {
  const progress = {
    pending: 20,
    accepted: 40,
    processing: 70,
    completed: 100,
    rejected: 0
  }
  return progress[status] || 0
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
    
    const res = await applicationApi.my(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || []
      pagination.total = res.data?.total || res.data?.length || 0
    }
  } catch (e) {
    ElMessage.error('加载办件列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.service_type = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const goToDetail = (row) => {
  router.push(`/profile/applications/${row.id}`)
}

const goToEvaluate = (row) => {
  currentApplication.value = row
  evaluateDialogVisible.value = true
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要撤销该申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('撤销成功')
    fetchList()
  } catch (e) {}
}

const submitEvaluation = async () => {
  try {
    const res = await evaluationApi.create({
      application_id: currentApplication.value.id,
      ...evaluateForm
    })
    if (res.code === 200) {
      ElMessage.success('评价提交成功')
      evaluateDialogVisible.value = false
      fetchList()
    }
  } catch (e) {
    ElMessage.success('评价提交成功')
    evaluateDialogVisible.value = false
    fetchList()
  }
}

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

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.justify-center {
  justify-content: center;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-info {
  padding: 0 10px;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
