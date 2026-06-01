<template>
  <div>
    <div class="page-header">
      <span class="page-title">新建拨付申请</span>
    </div>

    <el-card>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <div class="form-section">
          <div class="form-section-title">基本信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择项目" prop="project_id">
                <el-select v-model="form.project_id" style="width: 100%" @change="onProjectChange">
                  <el-option 
                    v-for="p in projects" 
                    :key="p.id" 
                    :label="`${p.indicator_no} - ${p.project_unit}`"
                    :value="p.id"
                  >
                    <span>{{ p.indicator_no }} - {{ p.project_unit }}</span>
                    <span style="float: right; color: #909399; font-size: 12px">
                      余额: ¥{{ Number(p.available_balance).toLocaleString() }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="申请人" prop="applicant">
                <el-input v-model="form.applicant" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="申请金额" prop="amount">
                <el-input-number 
                  v-model="form.amount" 
                  :min="0" 
                  :max="selectedProject?.available_balance || 99999999"
                  :precision="2" 
                  style="width: 100%" 
                />
                <div v-if="selectedProject" style="font-size: 12px; color: #909399; margin-top: 4px">
                  可拨余额: ¥{{ Number(selectedProject.available_balance).toLocaleString() }}
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="请款说明" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="form-section-title">
            附件材料
            <span style="font-size: 12px; color: #909399; font-weight: normal">
              （必须上传：合同、验收单、发票、请款说明）
            </span>
          </div>
          
          <el-row :gutter="20">
            <el-col :span="12" v-for="type in attachmentTypes" :key="type.value">
              <div style="margin-bottom: 16px">
                <div style="margin-bottom: 8px; font-weight: 500">
                  {{ type.label }}
                  <span style="color: #f56c6c">*</span>
                </div>
                <el-upload
                  :auto-upload="false"
                  :on-change="(file) => handleFileChange(file, type.value)"
                  :on-remove="() => handleFileRemove(type.value)"
                  :limit="1"
                  :file-list="getFileList(type.value)"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                >
                  <el-button type="primary" size="small">上传文件</el-button>
                  <template #tip>
                    <div style="font-size: 12px; color: #909399">
                      支持 PDF、Word、图片格式
                    </div>
                  </template>
                </el-upload>
              </div>
            </el-col>
          </el-row>
        </div>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交申请
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { projectsApi, applicationsApi } from '../api'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const projects = ref([])
const uploadedFiles = ref({})

const attachmentTypes = [
  { label: '合同', value: 'contract' },
  { label: '验收单', value: 'acceptance' },
  { label: '发票', value: 'invoice' },
  { label: '请款说明', value: 'request' }
]

const form = ref({
  project_id: null,
  applicant: '',
  amount: 0,
  description: ''
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  applicant: [{ required: true, message: '请输入申请人', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入申请金额', trigger: 'blur' }]
}

const selectedProject = computed(() => {
  if (!form.value.project_id) return null
  return projects.value.find(p => p.id === form.value.project_id)
})

const onProjectChange = () => {
  form.value.amount = 0
}

const getFileList = (type) => {
  return uploadedFiles.value[type] ? [uploadedFiles.value[type]] : []
}

const handleFileChange = (file, type) => {
  uploadedFiles.value[type] = file.raw
}

const handleFileRemove = (type) => {
  delete uploadedFiles.value[type]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.amount > selectedProject.value.available_balance) {
        ElMessage.error('申请金额超过可拨余额')
        return
      }

      submitting.value = true
      try {
        const formData = new FormData()
        formData.append('project_id', form.value.project_id)
        formData.append('applicant', form.value.applicant)
        formData.append('amount', form.value.amount)
        formData.append('description', form.value.description)
        
        const types = []
        Object.keys(uploadedFiles.value).forEach(type => {
          formData.append('attachments', uploadedFiles.value[type])
          types.push(type)
        })
        formData.append('attachmentTypes', JSON.stringify(types))

        const result = await applicationsApi.create(formData)
        
        if (result.status === 'correction') {
          ElMessage.warning(result.message)
        } else {
          ElMessage.success(result.message)
        }
        
        router.push('/applications')
      } catch (error) {
        ElMessage.error(error.error || '提交失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const loadProjects = async () => {
  try {
    projects.value = await projectsApi.list()
  } catch (error) {
    ElMessage.error('加载项目列表失败')
  }
}

onMounted(() => {
  loadProjects()
})
</script>
