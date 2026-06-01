<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">隐患管理</h2>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待处理" value="pending" />
            <el-option label="整改中" value="rectifying" />
            <el-option label="待复查" value="rechecking" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadHazards">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="hazards" border stripe>
      <el-table-column prop="unit_name" label="责任单位" min-width="150" />
      <el-table-column prop="hazard_type" label="隐患类型" width="120" />
      <el-table-column prop="description" label="隐患描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="inspection_date" label="发现日期" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="openRectifyDialog(row)">
            指派整改
          </el-button>
          <el-button v-if="row.status === 'rectifying'" size="small" type="success" @click="openUploadDialog(row)">
            上传材料
          </el-button>
          <el-button size="small" @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="rectifyDialogVisible" title="指派整改" width="600px">
      <el-form :model="rectifyForm" label-width="100px">
        <el-form-item label="隐患描述">
          <span>{{ currentHazard?.description }}</span>
        </el-form-item>
        <el-form-item label="整改责任人" required>
          <el-select v-model="rectifyForm.responsible_person" placeholder="请选择整改责任人" style="width: 100%" filterable allow-create>
            <el-option v-for="person in responsiblePersons" :key="person" :label="person" :value="person" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改期限" required>
          <el-date-picker v-model="rectifyForm.deadline" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="整改措施">
          <el-input v-model="rectifyForm.measures" type="textarea" :rows="3" placeholder="请输入整改措施" />
        </el-form-item>
        <el-form-item label="需要附件">
          <el-switch v-model="rectifyForm.attachment_required" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRectification" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传整改材料" width="600px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="隐患描述">
          <span>{{ currentHazard?.description }}</span>
        </el-form-item>
        <el-form-item label="整改说明">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入整改完成说明" />
        </el-form-item>
        <el-form-item label="整改照片">
          <el-upload
            class="upload-demo"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="uploadForm.files"
            multiple>
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="整改完成日期">
          <el-date-picker v-model="uploadForm.completion_date" type="date" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="隐患详情" width="600px">
      <el-descriptions :column="1" border v-if="currentHazard">
        <el-descriptions-item label="责任单位">{{ currentHazard.unit_name }}</el-descriptions-item>
        <el-descriptions-item label="隐患类型">{{ currentHazard.hazard_type }}</el-descriptions-item>
        <el-descriptions-item label="隐患描述">{{ currentHazard.description }}</el-descriptions-item>
        <el-descriptions-item label="发现日期">{{ currentHazard.inspection_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentHazard.status)" size="small">
            {{ getStatusText(currentHazard.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentHazard.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const hazards = ref([])
const rectifyDialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentHazard = ref(null)
const submitting = ref(false)
const uploading = ref(false)
const responsiblePersons = ref(['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'])

const searchForm = reactive({
  status: ''
})

const rectifyForm = reactive({
  responsible_person: '',
  deadline: '',
  measures: '',
  attachment_required: false
})

const uploadForm = reactive({
  description: '',
  files: [],
  completion_date: ''
})

const handleFileChange = (file, fileList) => {
  uploadForm.files = fileList
}

const handleFileRemove = (file, fileList) => {
  uploadForm.files = fileList
}

const openUploadDialog = (row) => {
  currentHazard.value = row
  uploadForm.description = ''
  uploadForm.files = []
  uploadForm.completion_date = new Date().toISOString().split('T')[0]
  uploadDialogVisible.value = true
}

const submitUpload = async () => {
  if (!uploadForm.description) {
    ElMessage.warning('请填写整改说明')
    return
  }
  
  uploading.value = true
  try {
    ElMessage.success('整改材料上传成功，已进入待复查状态')
    await api.updateHazardStatus(currentHazard.value.id, 'rechecking')
    uploadDialogVisible.value = false
    loadHazards()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    uploading.value = false
  }
}

const viewDetail = (row) => {
  currentHazard.value = row
  detailDialogVisible.value = true
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    rectifying: 'primary',
    rechecking: 'info',
    closed: 'success',
    recheck_failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    rectifying: '整改中',
    rechecking: '待复查',
    closed: '已关闭',
    recheck_failed: '复查未通过'
  }
  return map[status] || status
}

const loadHazards = async () => {
  const params = {}
  if (searchForm.status) params.status = searchForm.status
  hazards.value = await api.getHazards(params)
}

const resetSearch = () => {
  searchForm.status = ''
  loadHazards()
}

const openRectifyDialog = (row) => {
  currentHazard.value = row
  rectifyForm.responsible_person = ''
  rectifyForm.deadline = ''
  rectifyForm.measures = ''
  rectifyForm.attachment_required = false
  rectifyDialogVisible.value = true
}

const submitRectification = async () => {
  if (!rectifyForm.responsible_person || !rectifyForm.deadline) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  submitting.value = true
  try {
    await api.createRectification({
      hazard_id: currentHazard.value.id,
      unit_id: currentHazard.value.unit_id,
      ...rectifyForm
    })
    ElMessage.success('整改指派成功')
    rectifyDialogVisible.value = false
    loadHazards()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadHazards()
})
</script>
