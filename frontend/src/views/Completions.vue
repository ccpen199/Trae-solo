<template>
  <div class="page-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">结题审计</h1>
        <p class="page-subtitle">管理项目结题与审计材料</p>
      </div>
      <el-button type="primary" @click="openDialog" v-if="canSubmit">
        <el-icon><Plus /></el-icon>
        结题登记
      </el-button>
    </div>

    <div class="card">
      <el-table :data="completions" border stripe>
        <el-table-column prop="project_no" label="项目编号" width="120" />
        <el-table-column prop="project_name" label="项目名称" min-width="200" />
        <el-table-column prop="principal" label="负责人" width="100" />
        <el-table-column prop="completion_date" label="结题日期" width="120" />
        <el-table-column prop="remaining_funds" label="剩余资金" width="130">
          <template #default="{ row }">
            <span :style="{ color: row.remaining_funds > 0 ? '#e6a23c' : '#67c23a' }">
              ¥{{ formatMoney(row.remaining_funds) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="materials" label="材料说明" min-width="150" />
        <el-table-column label="附件" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewAttachments(row)">查看附件</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="audit_opinion" label="审计意见" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" type="primary" v-if="row.status === 'pending' && canApprove" @click="approve(row)">
                审核
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="结题登记" width="650px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属项目">
          <el-select v-model="form.project_id" style="width: 100%;">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="结题日期">
          <el-date-picker v-model="form.completion_date" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="剩余资金">
          <el-input-number v-model="form.remaining_funds" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="材料说明">
          <el-input v-model="form.materials" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="上传附件">
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            multiple
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div style="color: #909399; font-size: 12px; margin-top: 8px;">
                支持 PDF、Word、Excel、图片等格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="审计意见">
          <el-input v-model="form.audit_opinion" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已退回" value="rejected" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCompletion">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="attachDialogVisible" title="查看附件" width="600px">
      <el-table :data="currentAttachments" border stripe>
        <el-table-column prop="file_name" label="文件名" />
        <el-table-column prop="file_size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" width="100" />
        <el-table-column prop="created_at" label="上传时间" width="160" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="downloadFile(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty description="暂无附件" v-if="currentAttachments.length === 0" />
      <template #footer>
        <el-button @click="attachDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="结题审核" width="500px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="审计意见">
          <el-input v-model="approveForm.audit_opinion" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="approveForm.status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">退回</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getCompletions, createCompletion, getProjects, approveCompletion, uploadFile, getAttachments } from '../api'
import { Plus } from '@element-plus/icons-vue'
import { useUser } from '../store/user'

const { canApprove, canSubmit, currentUser, userName } = useUser()

const completions = ref([])
const projects = ref([])
const dialogVisible = ref(false)
const approveDialogVisible = ref(false)
const attachDialogVisible = ref(false)
const currentCompletion = ref(null)
const currentAttachments = ref([])
const fileList = ref([])
const tempFiles = ref([])

const form = ref({
  project_id: null,
  completion_date: '',
  remaining_funds: 0,
  materials: '',
  audit_opinion: '',
  status: 'pending'
})

const approveForm = ref({
  audit_opinion: '',
  status: 'approved'
})

watch(currentUser, () => {
  loadData()
}, { immediate: false })

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

const handleFileChange = (file) => {
  tempFiles.value.push(file.raw)
}

const handleFileRemove = (file) => {
  const index = tempFiles.value.indexOf(file.raw)
  if (index > -1) {
    tempFiles.value.splice(index, 1)
  }
}

const uploadAttachments = async (completionId) => {
  for (const file of tempFiles.value) {
    try {
      await uploadFile(file, {
        business_type: 'completion',
        business_id: completionId,
        uploader: userName.value
      })
    } catch (error) {
      console.error('文件上传失败:', error)
    }
  }
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审核', approved: '已通过', rejected: '已退回' }
  return map[status] || status
}

const loadData = async () => {
  try {
    const [res, projRes] = await Promise.all([
      getCompletions(),
      getProjects()
    ])
    completions.value = res.data
    projects.value = projRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const openDialog = () => {
  form.value = {
    project_id: projects.value[0]?.id,
    completion_date: '',
    remaining_funds: 0,
    materials: '',
    audit_opinion: '',
    status: 'pending'
  }
  fileList.value = []
  tempFiles.value = []
  dialogVisible.value = true
}

const submitCompletion = async () => {
  try {
    const res = await createCompletion(form.value)
    if (tempFiles.value.length > 0) {
      await uploadAttachments(res.data.id)
    }
    ElMessage.success('提交成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '提交失败')
  }
}

const approve = (row) => {
  currentCompletion.value = row
  approveForm.value = { audit_opinion: row.audit_opinion || '', status: 'approved' }
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  try {
    await approveCompletion(currentCompletion.value.id, approveForm.value)
    ElMessage.success('审核完成')
    approveDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('审核失败')
  }
}

const viewAttachments = async (row) => {
  currentCompletion.value = row
  try {
    const res = await getAttachments({
      business_type: 'completion',
      business_id: row.id
    })
    currentAttachments.value = res.data
  } catch (error) {
    currentAttachments.value = []
  }
  attachDialogVisible.value = true
}

const downloadFile = (row) => {
  window.open(row.url, '_blank')
}

onMounted(() => {
  loadData()
})
</script>
