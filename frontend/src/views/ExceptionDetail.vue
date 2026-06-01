<template>
  <div class="exception-detail" v-if="data">
    <div class="page-header">
      <h1 class="page-title">异常详情</h1>
      <p class="page-subtitle">查询单号：{{ data.exception.inquiry_no }}</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-semibold">{{ data.exception.exception_name }}</h3>
              <div class="text-gray-500 mt-1">
                {{ data.exception.inquiry_no }} · {{ formatTime(data.exception.report_time) }}
              </div>
            </div>
            <el-tag :type="getStatusType(data.exception.status)" size="large">
              {{ getStatusText(data.exception.status) }}
            </el-tag>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <div class="text-sm text-gray-500 mb-1">异常描述</div>
            <div>{{ data.exception.description || '暂无详细描述' }}</div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="bg-gray-50 p-3 rounded">
              <div class="text-xs text-gray-500">行李牌</div>
              <div class="font-semibold">{{ data.exception.baggage_tag }}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <div class="text-xs text-gray-500">旅客姓名</div>
              <div class="font-semibold">{{ data.exception.passenger_name }}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <div class="text-xs text-gray-500">航班号</div>
              <div class="font-semibold">{{ data.exception.flight_no }}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <div class="text-xs text-gray-500">航线</div>
              <div class="font-semibold">{{ data.exception.departure }} → {{ data.exception.destination }}</div>
            </div>
          </div>

          <el-divider>照片证据</el-divider>
          
          <div class="mb-4">
            <el-upload
              action="#"
              :auto-upload="false"
              multiple
              :limit="10"
              :on-change="handleFileChange"
              accept="image/*"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传照片
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持 jpg/png/gif 格式，单张不超过 10MB，最多 10 张
                </div>
              </template>
            </el-upload>

            <div v-if="pendingFiles.length > 0" class="mt-3">
              <el-tag v-for="(file, idx) in pendingFiles" :key="idx" class="mr-2 mb-2">
                {{ file.name }} ({{ formatSize(file.size) }})
              </el-tag>
              <div>
                <el-button type="primary" size="small" @click="uploadPhotos" :loading="uploading">
                  确认上传
                </el-button>
                <el-button size="small" @click="pendingFiles = []">取消</el-button>
              </div>
            </div>
          </div>

          <div v-if="data.photos.length > 0" class="photo-gallery">
            <div v-for="photo in data.photos" :key="photo.id" class="photo-item" @click="previewPhoto(photo)">
              <img :src="photo.file_path" :alt="photo.file_name" />
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 30px 20px;">
            <div class="empty-text">暂无照片证据</div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4 flex items-center justify-between">
            <span>处理进度</span>
            <el-button type="primary" size="small" @click="showProgressDialog = true">
              <el-icon><Plus /></el-icon>
              添加进度
            </el-button>
          </h3>

          <div v-if="data.progress.length > 0" class="progress-list">
            <div 
              v-for="item in data.progress" 
              :key="item.id" 
              :class="['progress-item', item.status]"
            >
              <div class="flex justify-between items-start">
                <div class="progress-status">{{ getProgressStatus(item.status) }}</div>
                <div class="text-sm text-gray-500">{{ formatTime(item.created_at) }}</div>
              </div>
              <div class="progress-remark">{{ item.remark || '无备注' }}</div>
              <div class="progress-meta">
                操作人：{{ item.operator || '系统' }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 30px 20px;">
            <div class="empty-text">暂无处理进度</div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">状态变更</h3>
          <el-form :model="statusForm" label-width="80px">
            <el-form-item label="当前状态">
              <el-tag :type="getStatusType(data.exception.status)" size="large">
                {{ getStatusText(data.exception.status) }}
              </el-tag>
            </el-form-item>
            <el-form-item label="更新状态">
              <el-select v-model="statusForm.status" style="width: 100%;">
                <el-option v-for="s in statuses" :key="s.type" :label="s.name" :value="s.type" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="statusForm.remark" type="textarea" :rows="2" placeholder="变更说明" />
            </el-form-item>
            <el-form-item label="操作人">
              <el-input v-model="statusForm.operator" placeholder="操作人姓名" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateStatus" :loading="updatingStatus" style="width: 100%;">
                确认更新
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="data.compensation.length > 0" class="card mt-4">
          <h3 class="text-lg font-semibold mb-4">赔付记录</h3>
          <div v-for="comp in data.compensation" :key="comp.id" class="bg-gray-50 p-3 rounded-lg mb-2">
            <div class="flex justify-between">
              <span class="text-xl font-bold text-yellow-600">¥{{ comp.amount }}</span>
              <el-tag :type="getCompStatusType(comp.approval_status)" size="small">
                {{ getCompStatus(comp.approval_status) }}
              </el-tag>
            </div>
            <div class="text-sm text-gray-500 mt-1">责任方：{{ comp.responsible_party }}</div>
            <div v-if="comp.compensation_standard" class="text-sm text-gray-500">
              赔付标准：{{ comp.compensation_standard }}
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <h3 class="text-lg font-semibold mb-4">快捷操作</h3>
          <div class="space-y-2">
            <el-button type="success" style="width: 100%;" @click="goToBaggage">
              <el-icon><Suitcase /></el-icon>
              查看行李详情
            </el-button>
            <el-button type="warning" style="width: 100%;" @click="showCompensationDialog = true" :disabled="data.compensation.length > 0">
              <el-icon><Money /></el-icon>
              {{ data.compensation.length > 0 ? '已有赔付记录' : '申请赔付' }}
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showProgressDialog" title="添加处理进度" width="500px">
      <el-form :model="progressForm" label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="progressForm.status" style="width: 100%;">
            <el-option v-for="s in statuses" :key="s.type" :label="s.name" :value="s.type" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度说明" required>
          <el-input v-model="progressForm.remark" type="textarea" :rows="3" placeholder="请输入进度说明" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="progressForm.operator" placeholder="操作人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProgressDialog = false">取消</el-button>
        <el-button type="primary" @click="addProgress" :loading="submittingProgress">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCompensationDialog" title="申请赔付" width="500px">
      <el-form :model="compensationForm" label-width="100px">
        <el-form-item label="责任方" required>
          <el-select v-model="compensationForm.responsible_party" style="width: 100%;">
            <el-option v-for="p in responsibleParties" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="赔付标准">
          <el-select v-model="compensationForm.compensation_standard" style="width: 100%;">
            <el-option v-for="s in standards" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="赔付金额" required>
          <el-input-number v-model="compensationForm.amount" :min="0" :step="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="compensationForm.applicant" placeholder="申请人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="compensationForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompensationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCompensation" :loading="submittingCompensation">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPreview" title="照片预览" width="800px">
      <img v-if="previewUrl" :src="previewUrl" style="width: 100%;" />
    </el-dialog>
  </div>

  <div v-else class="empty-state">
    <el-icon class="empty-icon"><Loading /></el-icon>
    <div class="empty-text">加载中...</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exceptionApi, uploadApi, compensationApi } from '../api'

const route = useRoute()
const router = useRouter()

const data = ref(null)
const statuses = ref([])
const responsibleParties = ref([])
const standards = ref([])

const showProgressDialog = ref(false)
const showCompensationDialog = ref(false)
const showPreview = ref(false)
const previewUrl = ref('')

const uploading = ref(false)
const updatingStatus = ref(false)
const submittingProgress = ref(false)
const submittingCompensation = ref(false)

const pendingFiles = ref([])

const statusForm = reactive({
  status: '',
  remark: '',
  operator: ''
})

const progressForm = reactive({
  status: '',
  remark: '',
  operator: ''
})

const compensationForm = reactive({
  responsible_party: '',
  compensation_standard: '',
  amount: 0,
  applicant: '',
  remark: ''
})

async function loadData() {
  try {
    data.value = await exceptionApi.getByInquiryNo(route.params.inquiryNo)
    statusForm.status = data.value.exception.status
  } catch (err) {
    ElMessage.error('加载失败')
    console.error(err)
  }
}

async function loadMeta() {
  try {
    const [statusList, parties, stds] = await Promise.all([
      exceptionApi.getStatuses(),
      compensationApi.getResponsibleParties(),
      compensationApi.getStandards()
    ])
    statuses.value = statusList
    responsibleParties.value = parties
    standards.value = stds
  } catch (err) {
    console.error(err)
  }
}

function handleFileChange(file) {
  pendingFiles.value.push(file.raw)
}

async function uploadPhotos() {
  if (pendingFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  try {
    await uploadApi.uploadPhotos(route.params.inquiryNo, pendingFiles.value)
    ElMessage.success('上传成功')
    pendingFiles.value = []
    loadData()
  } catch (err) {
    ElMessage.error('上传失败')
    console.error(err)
  } finally {
    uploading.value = false
  }
}

async function updateStatus() {
  if (!statusForm.status) {
    ElMessage.warning('请选择状态')
    return
  }

  updatingStatus.value = true
  try {
    await exceptionApi.updateStatus(route.params.inquiryNo, {
      status: statusForm.status,
      remark: statusForm.remark,
      operator: statusForm.operator
    })
    ElMessage.success('状态更新成功')
    statusForm.remark = ''
    statusForm.operator = ''
    loadData()
  } catch (err) {
    ElMessage.error('更新失败')
    console.error(err)
  } finally {
    updatingStatus.value = false
  }
}

async function addProgress() {
  if (!progressForm.remark) {
    ElMessage.warning('请输入进度说明')
    return
  }

  submittingProgress.value = true
  try {
    await exceptionApi.addProgress(route.params.inquiryNo, {
      status: progressForm.status || data.value.exception.status,
      remark: progressForm.remark,
      operator: progressForm.operator
    })
    ElMessage.success('进度已添加')
    showProgressDialog.value = false
    progressForm.remark = ''
    progressForm.operator = ''
    loadData()
  } catch (err) {
    ElMessage.error('添加失败')
    console.error(err)
  } finally {
    submittingProgress.value = false
  }
}

async function submitCompensation() {
  if (!compensationForm.responsible_party || !compensationForm.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submittingCompensation.value = true
  try {
    await compensationApi.create({
      inquiry_no: route.params.inquiryNo,
      ...compensationForm
    })
    ElMessage.success('赔付申请已提交')
    showCompensationDialog.value = false
    loadData()
  } catch (err) {
    if (err.response?.status === 409) {
      ElMessage.error('该异常已有赔付记录')
    } else {
      ElMessage.error('提交失败')
    }
    console.error(err)
  } finally {
    submittingCompensation.value = false
  }
}

function previewPhoto(photo) {
  previewUrl.value = photo.file_path
  showPreview.value = true
}

function goToBaggage() {
  if (data.value?.exception.baggage_tag) {
    router.push(`/admin/baggage/${data.value.exception.baggage_tag}`)
  }
}

function formatSize(size) {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB'
  return (size / 1024 / 1024).toFixed(1) + 'MB'
}

function getStatusType(status) {
  const map = {
    open: 'danger',
    in_progress: 'warning',
    resolved: 'success',
    closed: 'info'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    open: '处理中',
    in_progress: '调查中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function getProgressStatus(status) {
  const map = {
    open: '处理中',
    in_progress: '调查中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function getCompStatus(status) {
  const map = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    paid: '已支付'
  }
  return map[status] || status
}

function getCompStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    paid: 'success'
  }
  return map[status] || 'info'
}

function formatTime(time) {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

onMounted(() => {
  loadData()
  loadMeta()
})
</script>

<style scoped>
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.gap-4 {
  gap: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-1 {
  margin-top: 4px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-2 {
  margin-right: 8px;
}

.mb-2 {
  margin-bottom: 8px;
}

.space-y-2 > * + * {
  margin-top: 8px;
}

.text-xl {
  font-size: 20px;
}

.text-lg {
  font-size: 18px;
}

.text-sm {
  font-size: 14px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #909399;
}

.text-yellow-600 {
  color: #d48806;
}

.font-semibold {
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.bg-gray-50 {
  background-color: #f5f7fa;
}

.p-3 {
  padding: 12px;
}

.p-4 {
  padding: 16px;
}

.rounded {
  border-radius: 4px;
}

.rounded-lg {
  border-radius: 8px;
}

@media (min-width: 768px) {
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
