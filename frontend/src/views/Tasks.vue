<template>
  <div class="tasks">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>整改任务管理</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="task_no" label="任务编号" width="120" />
        <el-table-column prop="point_name" label="点位名称" />
        <el-table-column prop="alert_type" label="预警类型" />
        <el-table-column prop="responsible_unit" label="责任单位" />
        <el-table-column label="喷淋开启">
          <template #default="{ row }">
            <el-tag :type="row.sprinkler_activated ? 'success' : 'info'">
              {{ row.sprinkler_activated ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="停工措施">
          <template #default="{ row }">
            <el-tag :type="row.work_stopped ? 'warning' : 'info'">
              {{ row.work_stopped ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="review_result" label="复核结果">
          <template #default="{ row }">
            <span v-if="row.review_result === 'pass'">通过</span>
            <span v-else-if="row.review_result === 'fail'">不通过</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusLabelMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleProcess(row)" v-if="['pending', 'processing'].includes(row.status)">
              处理
            </el-button>
            <el-button link type="success" size="small" @click="handleReview(row)" v-if="row.status === 'processing'">
              复核
            </el-button>
            <el-button link type="info" size="small" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <el-dialog v-model="processVisible" title="处理整改任务" width="600px">
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="喷淋开启">
          <el-switch v-model="processForm.sprinkler_activated" />
        </el-form-item>
        <el-form-item label="停工措施">
          <el-switch v-model="processForm.work_stopped" />
        </el-form-item>
        <el-form-item label="整改措施">
          <el-input v-model="processForm.measures" type="textarea" :rows="4" placeholder="请描述整改措施" />
        </el-form-item>
        <el-form-item label="现场照片">
          <el-upload
            action=""
            :http-request="handleUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button type="primary">上传照片</el-button>
          </el-upload>
          <div v-if="processForm.photo_url" class="preview">
            <img :src="processForm.photo_url" style="max-width: 200px; max-height: 150px; margin-top: 10px;" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" title="复核整改任务" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复核结果">
          <el-radio-group v-model="reviewForm.review_result">
            <el-radio label="pass">通过</el-radio>
            <el-radio label="fail">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核意见">
          <el-input v-model="reviewForm.review_remark" type="textarea" :rows="3" placeholder="请填写复核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="任务详情" width="600px">
      <el-descriptions :column="1" border v-if="currentTask">
        <el-descriptions-item label="任务编号">{{ currentTask.task_no }}</el-descriptions-item>
        <el-descriptions-item label="点位名称">{{ currentTask.point_name }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ currentTask.alert_type }}</el-descriptions-item>
        <el-descriptions-item label="预警描述">{{ currentTask.alert_description }}</el-descriptions-item>
        <el-descriptions-item label="责任单位">{{ currentTask.responsible_unit }}</el-descriptions-item>
        <el-descriptions-item label="喷淋开启">{{ currentTask.sprinkler_activated ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="停工措施">{{ currentTask.work_stopped ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="整改措施">{{ currentTask.measures || '-' }}</el-descriptions-item>
        <el-descriptions-item label="现场照片">
          <img v-if="currentTask.photo_url" :src="currentTask.photo_url" style="max-width: 200px; max-height: 150px;" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="复核结果">{{ currentTask.review_result === 'pass' ? '通过' : currentTask.review_result === 'fail' ? '不通过' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="复核意见">{{ currentTask.review_remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabelMap[currentTask.status] }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTask.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { tasksApi } from '../api'

const loading = ref(false)
const tableData = ref([])
const processVisible = ref(false)
const reviewVisible = ref(false)
const detailVisible = ref(false)
const currentTaskId = ref(null)
const currentTask = ref(null)

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  rejected: 'danger'
}

const statusLabelMap = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  rejected: '已驳回'
}

const queryForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const processForm = reactive({
  sprinkler_activated: false,
  work_stopped: false,
  measures: '',
  photo_url: ''
})

const reviewForm = reactive({
  review_result: 'pass',
  review_remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await tasksApi.list({
      ...queryForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.data
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryForm.status = ''
  pagination.page = 1
  loadData()
}

const handleProcess = (row) => {
  currentTaskId.value = row.id
  Object.assign(processForm, {
    sprinkler_activated: !!row.sprinkler_activated,
    work_stopped: !!row.work_stopped,
    measures: row.measures || '',
    photo_url: row.photo_url || ''
  })
  processVisible.value = true
}

const handleUpload = async (options) => {
  const res = await tasksApi.upload(currentTaskId.value, options.file)
  processForm.photo_url = res.data.photo_url
  ElMessage.success('上传成功')
}

const submitProcess = async () => {
  await tasksApi.update(currentTaskId.value, processForm)
  ElMessage.success('提交成功')
  processVisible.value = false
  loadData()
}

const handleReview = (row) => {
  currentTaskId.value = row.id
  reviewForm.review_result = 'pass'
  reviewForm.review_remark = ''
  reviewVisible.value = true
}

const submitReview = async () => {
  await tasksApi.review(currentTaskId.value, reviewForm)
  ElMessage.success('复核完成')
  reviewVisible.value = false
  loadData()
}

const handleView = async (row) => {
  const res = await tasksApi.get(row.id)
  currentTask.value = res.data
  detailVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.tasks {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form {
  margin-bottom: 20px;
}

.preview {
  margin-top: 10px;
}
</style>
