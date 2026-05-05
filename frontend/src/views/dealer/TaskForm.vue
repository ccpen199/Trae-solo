<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>新建B类内训任务</span>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-form-item label="任务类型">
          <el-tag type="success">B类任务(经销商自建)</el-tag>
          <div class="el-form-item__tip" style="margin-top: 8px; color: #909399">
            B类任务由经销商自主创建，保存发布后需提交主机厂审核
          </div>
        </el-form-item>

        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>

        <el-form-item label="内训方式" prop="training_method">
          <el-select v-model="formData.training_method" placeholder="请选择内训方式" style="width: 100%">
            <el-option label="线上培训" value="线上培训" />
            <el-option label="线下培训" value="线下培训" />
            <el-option label="混合培训" value="混合培训" />
          </el-select>
        </el-form-item>

        <el-form-item label="考核方式" prop="exam_method">
          <el-select v-model="formData.exam_method" placeholder="请选择考核方式" style="width: 100%">
            <el-option label="笔试" value="笔试" />
            <el-option label="实操" value="实操" />
            <el-option label="综合考核" value="综合考核" />
          </el-select>
        </el-form-item>

        <el-form-item label="学时时长" prop="duration">
          <el-input-number v-model="formData.duration" :min="1" :max="1000" />
          <span style="margin-left: 10px">小时</span>
        </el-form-item>

        <el-form-item label="起止时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="任务内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入任务内容"
          />
        </el-form-item>

        <el-form-item label="上传资料">
          <el-upload
            action="/api/upload/single"
            multiple
            :limit="10"
            :on-success="handleUploadSuccess"
            :on-remove="handleFileRemove"
            :file-list="fileList"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg、png、pdf、doc、xls 等格式，单个文件不超过 30MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">
            <el-icon><Save /></el-icon>
            保存
          </el-button>
          <el-button type="success" @click="handleSaveAndPublish" :loading="savingAndPublishing">
            <el-icon><Promotion /></el-icon>
            保存并发布
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        title="提示"
        type="info"
        :closable="false"
        style="margin-top: 30px"
      >
        <template #default>
          <ul style="margin: 0; padding-left: 20px">
            <li><strong>保存</strong>：仅保存为草稿，可继续编辑</li>
            <li><strong>保存并发布</strong>：发布任务并进入执行流程，同时提交主机厂待审核</li>
            <li>发布后需在「内训执行列表」中进行课程计划设置、报名设置和上传提交</li>
          </ul>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tasksApi } from '@/api'

const router = useRouter()

const formRef = ref(null)
const saving = ref(false)
const savingAndPublishing = ref(false)
const fileList = ref([])
const dateRange = ref([])

const formData = reactive({
  name: '',
  task_type: 'B',
  scope: '本经销商',
  training_method: '',
  exam_method: '',
  duration: 8,
  start_time: '',
  end_time: '',
  content: '',
  dealer_id: 1
})

const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  training_method: [{ required: true, message: '请选择内训方式', trigger: 'change' }],
  exam_method: [{ required: true, message: '请选择考核方式', trigger: 'change' }],
  duration: [{ required: true, message: '请输入学时时长', trigger: 'blur' }]
}

const handleUploadSuccess = (response, file) => {
  if (response?.success) {
    file.url = response.data.url
  }
}

const handleFileRemove = (file, fileList) => {
  console.log('文件移除:', file.name)
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data = {
        ...formData,
        start_time: dateRange.value?.[0] ? dateRange.value[0] : '',
        end_time: dateRange.value?.[1] ? dateRange.value[1] : ''
      }

      const res = await tasksApi.create(data)
      if (res.data?.success) {
        ElMessage.success('保存成功')
        router.push('/dealer/execution')
      } else {
        ElMessage.error(res.data?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存任务失败:', error)
      ElMessage.error('保存任务失败')
    } finally {
      saving.value = false
    }
  })
}

const handleSaveAndPublish = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await ElMessageBox.confirm(
        '确定要保存并发布吗？发布后任务将进入执行流程，并提交主机厂待审核。',
        '提示',
        {
          confirmButtonText: '确定发布',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      savingAndPublishing.value = true
      const data = {
        ...formData,
        start_time: dateRange.value?.[0] ? dateRange.value[0] : '',
        end_time: dateRange.value?.[1] ? dateRange.value[1] : ''
      }

      const createRes = await tasksApi.create(data)
      if (!createRes.data?.success) {
        ElMessage.error(createRes.data?.message || '创建任务失败')
        return
      }

      const taskId = createRes.data.data.id
      const publishRes = await tasksApi.publish(taskId, {})
      
      if (publishRes.data?.success) {
        ElMessage.success('保存并发布成功')
        router.push('/dealer/execution')
      } else {
        ElMessage.error(publishRes.data?.message || '发布失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('保存并发布失败:', error)
        ElMessage.error('保存并发布失败')
      }
    } finally {
      savingAndPublishing.value = false
    }
  })
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
