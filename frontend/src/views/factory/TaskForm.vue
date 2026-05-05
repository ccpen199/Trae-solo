<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑内训任务' : '新建A类内训任务' }}</span>
          <div>
            <el-button @click="handleBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
          </div>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" :disabled="isDisabled" />
        </el-form-item>

        <el-form-item label="任务类型">
          <el-tag :type="formData.task_type === 'A' ? 'primary' : 'success'">
            {{ formData.task_type === 'A' ? 'A类任务(主机厂下发)' : 'B类任务(经销商自建)' }}
          </el-tag>
        </el-form-item>

        <el-form-item label="发布范围" prop="scope">
          <el-radio-group v-model="formData.scope" :disabled="isDisabled">
            <el-radio label="全部经销商">全部经销商</el-radio>
            <el-radio label="指定经销商">指定经销商</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          label="选择经销商" 
          v-if="formData.scope === '指定经销商' && !isEdit"
          prop="dealer_ids"
        >
          <el-select 
            v-model="formData.dealer_ids" 
            multiple 
            placeholder="请选择经销商"
            style="width: 100%"
            :disabled="isDisabled"
          >
            <el-option 
              v-for="dealer in dealerList" 
              :key="dealer.id" 
              :label="`${dealer.name} (${dealer.code} - ${dealer.region})`" 
              :value="dealer.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="内训方式" prop="training_method">
          <el-select v-model="formData.training_method" placeholder="请选择内训方式" style="width: 100%" :disabled="isDisabled">
            <el-option label="线上培训" value="线上培训" />
            <el-option label="线下培训" value="线下培训" />
            <el-option label="混合培训" value="混合培训" />
          </el-select>
        </el-form-item>

        <el-form-item label="考核方式" prop="exam_method">
          <el-select v-model="formData.exam_method" placeholder="请选择考核方式" style="width: 100%" :disabled="isDisabled">
            <el-option label="笔试" value="笔试" />
            <el-option label="实操" value="实操" />
            <el-option label="综合考核" value="综合考核" />
          </el-select>
        </el-form-item>

        <el-form-item label="学时时长" prop="duration">
          <el-input-number v-model="formData.duration" :min="1" :max="1000" :disabled="isDisabled" />
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
            :disabled="isDisabled"
          />
        </el-form-item>

        <el-form-item label="任务内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入任务内容"
            :disabled="isDisabled"
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
            :disabled="isDisabled"
          >
            <el-button type="primary" :disabled="isDisabled">
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
          <el-button type="primary" @click="handleSave" :loading="saving" v-if="!isView">
            <el-icon><Save /></el-icon>
            保存
          </el-button>
          <el-button type="primary" @click="handleSaveAndPublish" :loading="saving" v-if="!isEdit && !isView">
            <el-icon><Promotion /></el-icon>
            保存并发布
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>

      <div v-if="isEdit && taskDetail" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ebeef5">
        <h4 style="margin-bottom: 15px; color: #303133">已发布经销商</h4>
        <el-table :data="taskDetail.assigned_dealers || []" size="small" style="max-width: 600px">
          <el-table-column prop="region" label="区域" width="100" />
          <el-table-column prop="name" label="经销商名称" min-width="150" />
          <el-table-column prop="code" label="经销商代码" width="120" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { tasksApi, dealersApi } from '@/api'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const saving = ref(false)
const dealerList = ref([])
const fileList = ref([])
const taskDetail = ref(null)
const dateRange = ref([])

const isEdit = computed(() => !!route.params.id)
const isView = computed(() => isEdit.value && taskDetail.value?.is_published === 1)
const isDisabled = computed(() => isView.value)

const formData = reactive({
  name: '',
  task_type: 'A',
  scope: '全部经销商',
  dealer_ids: [],
  training_method: '',
  exam_method: '',
  duration: 8,
  start_time: '',
  end_time: '',
  content: ''
})

const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  scope: [{ required: true, message: '请选择发布范围', trigger: 'change' }],
  training_method: [{ required: true, message: '请选择内训方式', trigger: 'change' }],
  exam_method: [{ required: true, message: '请选择考核方式', trigger: 'change' }],
  duration: [{ required: true, message: '请输入学时时长', trigger: 'blur' }],
  dealer_ids: [
    { 
      validator: (rule, value, callback) => {
        if (formData.scope === '指定经销商' && (!value || value.length === 0)) {
          callback(new Error('请选择经销商'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const loadDealers = async () => {
  try {
    const res = await dealersApi.getList({})
    if (res.data?.success) {
      dealerList.value = res.data.data
    }
  } catch (error) {
    console.error('加载经销商列表失败:', error)
  }
}

const loadTaskDetail = async () => {
  if (!isEdit.value) return
  
  try {
    const res = await tasksApi.getDetail(route.params.id)
    if (res.data?.success) {
      taskDetail.value = res.data.data
      const task = res.data.data
      
      formData.name = task.name
      formData.task_type = task.task_type
      formData.scope = task.scope
      formData.training_method = task.training_method
      formData.exam_method = task.exam_method
      formData.duration = task.duration
      formData.content = task.content || ''
      
      if (task.start_time && task.end_time) {
        dateRange.value = [task.start_time, task.end_time]
      }

      if (task.files && task.files.length > 0) {
        fileList.value = task.files.map(f => ({
          name: f.file_name,
          url: f.file_path,
          response: { data: { url: f.file_path } }
        }))
      }
    }
  } catch (error) {
    console.error('加载任务详情失败:', error)
    ElMessage.error('加载任务详情失败')
  }
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
        start_time: dateRange.value?.[0] || '',
        end_time: dateRange.value?.[1] || ''
      }

      let res
      if (isEdit.value) {
        res = await tasksApi.update(route.params.id, data)
      } else {
        res = await tasksApi.create(data)
      }

      if (res.data?.success) {
        ElMessage.success(isEdit.value ? '更新成功' : '保存成功')
        if (!isEdit.value) {
          router.push('/factory/tasks')
        }
      } else {
        ElMessage.error(res.data?.message || '操作失败')
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

    saving.value = true
    try {
      const data = {
        ...formData,
        start_time: dateRange.value?.[0] || '',
        end_time: dateRange.value?.[1] || ''
      }

      const createRes = await tasksApi.create(data)
      if (!createRes.data?.success) {
        ElMessage.error(createRes.data?.message || '创建任务失败')
        return
      }

      const taskId = createRes.data.data.id
      const publishData = {}
      if (formData.scope === '指定经销商') {
        publishData.dealer_ids = formData.dealer_ids
      }

      const publishRes = await tasksApi.publish(taskId, publishData)
      if (publishRes.data?.success) {
        ElMessage.success('保存并发布成功')
        router.push('/factory/tasks')
      } else {
        ElMessage.error(publishRes.data?.message || '发布失败')
      }
    } catch (error) {
      console.error('保存并发布失败:', error)
      ElMessage.error('保存并发布失败')
    } finally {
      saving.value = false
    }
  })
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDealers()
  if (isEdit.value) {
    loadTaskDetail()
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
