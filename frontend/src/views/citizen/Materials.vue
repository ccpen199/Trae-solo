<template>
  <div class="citizen-materials">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>我的材料库</h2>
          <el-button type="primary" @click="showUploadDialog = true">
            <el-icon><Upload /></el-icon>
            上传材料
          </el-button>
        </div>
      </template>

      <el-table :data="materials" v-loading="loading">
        <el-table-column prop="type_name" label="材料类型" />
        <el-table-column prop="file_name" label="文件名" />
        <el-table-column prop="source_service_name" label="来源事项" />
        <el-table-column prop="effective_date" label="生效日期" />
        <el-table-column prop="expiry_date" label="有效期至">
          <template #default="{ row }">
            <span :class="{ expired: isExpired(row) }">
              {{ row.expiry_date || '长期有效' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="downloadMaterial(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showUploadDialog" title="上传材料" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="材料类型" required>
          <el-select v-model="uploadForm.material_type_id" placeholder="请选择材料类型" style="width: 100%">
            <el-option
              v-for="type in materialTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文件" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 pdf/jpg/jpeg/png 格式</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="生效日期">
          <el-date-picker
            v-model="uploadForm.effective_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker
            v-model="uploadForm.expiry_date"
            type="date"
            placeholder="选择日期（不填则长期有效）"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="submitUpload">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import api from '@/api'

const loading = ref(false)
const materials = ref([])
const materialTypes = ref([])
const showUploadDialog = ref(false)
const uploadRef = ref(null)
const uploadForm = ref({
  material_type_id: '',
  effective_date: new Date().toISOString().split('T')[0],
  expiry_date: ''
})
const selectedFile = ref(null)

const getCurrentApplicant = () => {
  const saved = localStorage.getItem('currentApplicant')
  return saved ? JSON.parse(saved) : null
}

const loadMaterials = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) return
  
  loading.value = true
  try {
    const res = await api.getApplicantMaterials(applicant.id)
    materials.value = res.data
  } catch (err) {
    ElMessage.error('加载失败：' + err.message)
  } finally {
    loading.value = false
  }
}

const loadMaterialTypes = async () => {
  try {
    const res = await api.getMaterialTypes()
    materialTypes.value = res.data
  } catch (err) {
    ElMessage.error('加载材料类型失败')
  }
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const submitUpload = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) {
    ElMessage.warning('请先确认身份')
    return
  }

  if (!uploadForm.value.material_type_id || !selectedFile.value) {
    ElMessage.warning('请选择材料类型和文件')
    return
  }

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('applicant_id', applicant.id)
  formData.append('material_type_id', uploadForm.value.material_type_id)
  formData.append('effective_date', uploadForm.value.effective_date)
  if (uploadForm.value.expiry_date) {
    formData.append('expiry_date', uploadForm.value.expiry_date)
  }

  try {
    await api.uploadMaterial(formData)
    ElMessage.success('上传成功')
    showUploadDialog.value = false
    loadMaterials()
  } catch (err) {
    ElMessage.error('上传失败：' + err.message)
  }
}

const downloadMaterial = (row) => {
  api.downloadMaterial(row.id)
}

const isExpired = (row) => {
  if (!row.expiry_date) return false
  return new Date(row.expiry_date) < new Date()
}

const getStatusType = (row) => {
  if (isExpired(row)) return 'danger'
  if (row.status === 'valid') return 'success'
  return 'info'
}

const getStatusText = (row) => {
  if (isExpired(row)) return '已过期'
  if (row.status === 'valid') return '有效'
  return row.status
}

onMounted(() => {
  loadMaterialTypes()
  loadMaterials()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}

.expired {
  color: #f56c6c;
}
</style>
